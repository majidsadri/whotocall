import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ReachrLogo from '../components/ReachrLogo';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import ContactCard from '../components/ContactCard';
import RecordButton from '../components/RecordButton';
import TagBadge, { getTagVariant } from '../components/TagBadge';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';
import * as api from '../services/api';
import { Contact, SearchResult } from '../types';

export default function FindContactScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Fetch all tags from contacts on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      const response = await api.getContacts({});
      const contacts = response.contacts || [];

      // Extract unique tags from all contacts
      const tagSet = new Set<string>();
      contacts.forEach((contact: Contact) => {
        if (contact.tags) {
          contact.tags.forEach((tag: string) => tagSet.add(tag.toLowerCase()));
        }
      });

      // Get most common tags (limit to 12)
      const tagCounts: Record<string, number> = {};
      contacts.forEach((contact: Contact) => {
        if (contact.tags) {
          contact.tags.forEach((tag: string) => {
            const lowerTag = tag.toLowerCase();
            tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
          });
        }
      });

      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tag]) => tag);

      setAllTags(sortedTags);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Search with selected tags
  const searchWithTags = () => {
    if (selectedTags.length > 0) {
      const tagQuery = selectedTags.join(' ');
      setQuery(tagQuery);
      handleSearch(tagQuery);
    }
  };

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: audioError,
  } = useAudioRecorder();

  // Handle text search
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.searchContacts(q);
      setResults(response.results || []);
      setExplanation(null);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search contacts');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle voice search
  const handleVoicePress = async () => {
    if (isRecording) {
      const path = await stopRecording();
      if (path) {
        setIsTranscribing(true);
        try {
          // First transcribe
          const transcribeResult = await api.transcribeAudio(path);
          if (transcribeResult.text) {
            setQuery(transcribeResult.text);

            // Then do voice search with agent
            setIsSearching(true);
            const searchResult = await api.voiceSearch(transcribeResult.text, true);

            if (searchResult.results) {
              // Convert to SearchResult format
              const formattedResults: SearchResult[] = searchResult.results.map((contact) => ({
                contact,
                score: 0,
                matchReason: '',
              }));
              setResults(formattedResults);
            }

            if (searchResult.explanation) {
              setExplanation(searchResult.explanation);
            }
            setHasSearched(true);
          }
        } catch (err) {
          console.error('Voice search error:', err);
          setError('Failed to process voice search');
        } finally {
          setIsTranscribing(false);
          setIsSearching(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  // Handle suggestion tap
  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Toggle card expansion
  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Render contact item
  const renderContact = ({ item }: { item: SearchResult }) => (
    <ContactCard
      contact={item.contact}
      score={item.score}
      matchReason={item.matchReason}
      expanded={expandedId === item.contact.id}
      onPress={() => toggleExpanded(item.contact.id)}
    />
  );

  // Clear search and reset
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSelectedTags([]);
    setExplanation(null);
  };

  // Empty state
  const renderEmpty = () => {
    if (isSearching) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="search" size={36} color={colors.purple[400]} />
          </View>
          <Text style={styles.emptyTitle}>Search your network</Text>
          <Text style={styles.emptySubtitle}>
            Find contacts by name, company, industry, location, or tags
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.orange[100] }]}>
          <Icon name="user-x" size={36} color={colors.orange[500]} />
        </View>
        <Text style={styles.emptyTitle}>No matches found</Text>
        <Text style={styles.emptySubtitle}>
          Try different keywords or browse tags above
        </Text>
        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
          <Icon name="refresh-cw" size={16} color={colors.purple[600]} />
          <Text style={styles.clearSearchText}>Clear & Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ReachrLogo size="medium" variant="purple" />
          <Text style={styles.tagline}>Find your contacts</Text>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, industry, location, tags..."
              placeholderTextColor={colors.gray[400]}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Icon name="x" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchActions}>
            <RecordButton
              isRecording={isRecording}
              isProcessing={isTranscribing}
              onPress={handleVoicePress}
              size={44}
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                !query.trim() && styles.searchButtonDisabled,
              ]}
              onPress={() => handleSearch()}
              disabled={!query.trim() || isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Icon name="arrow-right" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice status indicator */}
        {(isRecording || isTranscribing) && (
          <View style={styles.voiceStatus}>
            <View style={[styles.statusBadge, isRecording && styles.recordingBadge]}>
              <Text style={styles.statusText}>
                {isRecording ? 'Recording...' : 'Transcribing...'}
              </Text>
            </View>
          </View>
        )}

        {/* Tags Section */}
        {!hasSearched && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsSectionHeader}>
              <View style={styles.tagsSectionTitleRow}>
                <Icon name="tag" size={16} color={colors.purple[500]} />
                <Text style={styles.tagsSectionTitle}>Browse by Tags</Text>
              </View>
              {selectedTags.length > 0 && (
                <TouchableOpacity style={styles.searchTagsButton} onPress={searchWithTags}>
                  <Text style={styles.searchTagsText}>Search ({selectedTags.length})</Text>
                  <Icon name="arrow-right" size={14} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {isLoadingTags ? (
              <ActivityIndicator size="small" color={colors.purple[500]} />
            ) : allTags.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScrollContent}
              >
                {allTags.map((tag, index) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tagButton,
                        isSelected && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[
                        styles.tagButtonText,
                        isSelected && styles.tagButtonTextSelected,
                      ]}>
                        {tag}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={12} color={colors.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.noTagsText}>No tags yet. Add contacts to see tags here.</Text>
            )}

            {/* Quick filters */}
            <View style={styles.quickFilters}>
              <Text style={styles.quickFiltersLabel}>Quick Search</Text>
              <View style={styles.quickFilterButtons}>
                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => handleSuggestion('startup')}
                >
                  <Icon name="zap" size={14} color={colors.orange[500]} />
                  <Text style={styles.quickFilterText}>Startups</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => handleSuggestion('technology')}
                >
                  <Icon name="cpu" size={14} color={colors.blue[500]} />
                  <Text style={styles.quickFilterText}>Tech</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => handleSuggestion('real estate')}
                >
                  <Icon name="home" size={14} color={colors.green[600]} />
                  <Text style={styles.quickFilterText}>Real Estate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => handleSuggestion('investor')}
                >
                  <Icon name="trending-up" size={14} color={colors.purple[500]} />
                  <Text style={styles.quickFilterText}>Investors</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* AI Explanation */}
        {explanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Icon name="cpu" size={14} color={colors.purple[500]} />
              <Text style={styles.explanationTitle}>AI Analysis</Text>
            </View>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        )}

        {/* Error */}
        {(error || audioError) && (
          <View style={[commonStyles.errorContainer, { marginHorizontal: 16 }]}>
            <Text style={commonStyles.errorText}>{error || audioError}</Text>
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.contact.id}
          renderItem={renderContact}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSearching}
              onRefresh={() => handleSearch()}
              colors={[colors.green[500]]}
              tintColor={colors.green[500]}
            />
          }
        />

        {/* Results footer */}
        {hasSearched && (
          <View style={styles.resultsFooter}>
            <TouchableOpacity style={styles.backToTagsButton} onPress={clearSearch}>
              <Icon name="arrow-left" size={16} color={colors.purple[600]} />
              <Text style={styles.backToTagsText}>Browse Tags</Text>
            </TouchableOpacity>
            {results.length > 0 && (
              <View style={styles.resultsCountBadge}>
                <Text style={styles.resultsCountText}>
                  {results.length} found
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagline: {
    fontSize: 16,
    color: colors.cyan[400],
    marginTop: 12,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: colors.text,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 10,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonDisabled: {
    backgroundColor: colors.gray[700],
    shadowOpacity: 0,
  },
  voiceStatus: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[800],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingBadge: {
    backgroundColor: colors.red[900],
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  // Tags Section
  tagsSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tagsSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  searchTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchTagsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple[400],
    textTransform: 'capitalize',
  },
  tagButtonTextSelected: {
    color: colors.white,
  },
  noTagsText: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // Quick Filters
  quickFilters: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  quickFiltersLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  explanationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.green[900],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.green[700],
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  explanationText: {
    fontSize: 14,
    color: colors.green[300],
    lineHeight: 22,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.purple[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  clearSearchText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple[400],
  },
  resultsFooter: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backToTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backToTagsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple[400],
  },
  resultsCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
