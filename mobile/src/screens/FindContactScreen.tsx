import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAuth } from '../context/AuthContext';
import ContactCard from '../components/ContactCard';
import RecordButton from '../components/RecordButton';
import ScreenWrapper from '../components/ScreenWrapper';
import IndustryModal from '../components/IndustryModal';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';
import * as api from '../services/api';
import { Contact, SearchResult } from '../types';

export default function FindContactScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allTags, setAllTags] = useState<{tag: string; count: number; source?: string}[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);

  // Autocomplete state
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [suggestions, setSuggestions] = useState<{type: string; value: string; label: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Industry selection state
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
    fetchContacts();
    fetchPreferences();
  }, [user]);

  const fetchContacts = async () => {
    try {
      const response = await api.getContacts({});
      setAllContacts(response.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      const prefs = await api.getPreferences();
      setCurrentIndustry(prefs.industry);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleIndustrySelect = (industryId: string) => {
    setCurrentIndustry(industryId);
    // Refresh tags after industry selection
    fetchTags();
  };

  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      // Use new tags API that includes custom, suggested, and contact-derived tags
      const response = await api.getAllTags();
      setAllTags(response.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      // Fallback to fetching from contacts if tags API fails
      try {
        const contactsResponse = await api.getContacts({});
        const contacts = contactsResponse.contacts || [];
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
          .map(([tag, count]) => ({ tag, count }));
        setAllTags(sortedTags);
      } catch (fallbackErr) {
        console.error('Error in fallback tags fetch:', fallbackErr);
      }
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Generate autocomplete suggestions based on query
  const updateSuggestions = (text: string) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lowerQuery = text.toLowerCase();
    const newSuggestions: {type: string; value: string; label: string}[] = [];
    const seen = new Set<string>();

    // Add matching tags
    allTags.forEach(({ tag }) => {
      if (tag.toLowerCase().includes(lowerQuery) && !seen.has(tag.toLowerCase())) {
        seen.add(tag.toLowerCase());
        newSuggestions.push({
          type: 'tag',
          value: tag,
          label: tag,
        });
      }
    });

    // Add matching contact names
    allContacts.forEach((contact) => {
      if (contact.name && contact.name.toLowerCase().includes(lowerQuery)) {
        const key = `name:${contact.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({
            type: 'name',
            value: contact.name,
            label: contact.name,
          });
        }
      }

      // Add matching companies
      if (contact.company && contact.company.toLowerCase().includes(lowerQuery)) {
        const key = `company:${contact.company.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({
            type: 'company',
            value: contact.company,
            label: contact.company,
          });
        }
      }

      // Add matching roles
      if (contact.role && contact.role.toLowerCase().includes(lowerQuery)) {
        const key = `role:${contact.role.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({
            type: 'role',
            value: contact.role,
            label: contact.role,
          });
        }
      }

      // Add matching industries
      if (contact.industry && contact.industry.toLowerCase().includes(lowerQuery)) {
        const key = `industry:${contact.industry.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({
            type: 'industry',
            value: contact.industry,
            label: contact.industry,
          });
        }
      }
    });

    // Limit to top 8 suggestions
    setSuggestions(newSuggestions.slice(0, 8));
    setShowSuggestions(newSuggestions.length > 0);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    updateSuggestions(text);
  };

  const selectSuggestion = (suggestion: {type: string; value: string; label: string}) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    handleSearch(suggestion.value);
  };

  const toggleTag = (tag: string) => {
    let newTags: string[];
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);

    if (newTags.length > 0) {
      const tagQuery = newTags.join(' ');
      setQuery(tagQuery);
      handleSearch(tagQuery);
    } else {
      clearSearch();
    }
  };

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: audioError,
  } = useAudioRecorder();

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

  const handleVoicePress = async () => {
    if (isRecording) {
      const path = await stopRecording();
      if (path) {
        setIsTranscribing(true);
        try {
          const transcribeResult = await api.transcribeAudio(path);
          if (transcribeResult.text) {
            setQuery(transcribeResult.text);
            setIsSearching(true);
            const searchResult = await api.voiceSearch(transcribeResult.text, true);

            if (searchResult.results) {
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

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderContact = ({ item }: { item: SearchResult }) => (
    <ContactCard
      contact={item.contact}
      score={item.score}
      matchReason={item.matchReason}
      expanded={expandedId === item.contact.id}
      onPress={() => toggleExpanded(item.contact.id)}
    />
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSelectedTags([]);
    setExplanation(null);
  };

  const renderEmpty = () => {
    if (isSearching) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="users" size={32} color={colors.purple[400]} />
          </View>
          <Text style={styles.emptyTitle}>Find Anyone</Text>
          <Text style={styles.emptySubtitle}>
            Search by name, company, or use tags below
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.gray[800] }]}>
          <Icon name="search" size={32} color={colors.gray[500]} />
        </View>
        <Text style={styles.emptyTitle}>No results</Text>
        <Text style={styles.emptySubtitle}>
          Try different keywords
        </Text>
      </View>
    );
  };

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 6);
  const hasMoreTags = allTags.length > 6;

  return (
    <ScreenWrapper>
      <View style={commonStyles.container}>
        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Find Contact</Text>
          <Text style={styles.pageSubtitle}>Search your network by name or tags</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={colors.gray[500]} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Name, company, tag..."
              placeholderTextColor={colors.gray[500]}
              returnKeyType="search"
              onSubmitEditing={() => {
                setShowSuggestions(false);
                handleSearch();
              }}
              onFocus={() => {
                if (query.length >= 2) updateSuggestions(query);
              }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="x" size={16} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
            <View style={styles.searchDivider} />
            <RecordButton
              isRecording={isRecording}
              isProcessing={isTranscribing}
              onPress={handleVoicePress}
              size={36}
            />
          </View>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.autocompleteContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <View style={styles.suggestionIcon}>
                    <Icon
                      name={
                        suggestion.type === 'tag' ? 'tag' :
                        suggestion.type === 'name' ? 'user' :
                        suggestion.type === 'company' ? 'briefcase' :
                        suggestion.type === 'role' ? 'award' :
                        'globe'
                      }
                      size={14}
                      color={
                        suggestion.type === 'tag' ? colors.purple[400] :
                        suggestion.type === 'name' ? colors.cyan[400] :
                        suggestion.type === 'company' ? colors.orange[400] :
                        suggestion.type === 'role' ? colors.green[400] :
                        colors.blue[400]
                      }
                    />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionText}>{suggestion.label}</Text>
                    <Text style={styles.suggestionType}>{suggestion.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Voice Status */}
        {(isRecording || isTranscribing) && (
          <View style={styles.voiceStatus}>
            <View style={styles.voiceDot} />
            <Text style={styles.voiceText}>
              {isRecording ? 'Listening...' : 'Processing...'}
            </Text>
          </View>
        )}

        {/* Tags - Only show when not searched */}
        {!hasSearched && (
          <View style={styles.filtersSection}>
            {isLoadingTags ? (
              <View style={styles.loadingTags}>
                <ActivityIndicator size="small" color={colors.purple[500]} />
                <Text style={styles.loadingText}>Loading tags...</Text>
              </View>
            ) : allTags.length > 0 ? (
              <View style={styles.tagsSection}>
                <View style={styles.tagsSectionHeader}>
                  <Text style={styles.sectionLabel}>Browse by Tag</Text>
                  <TouchableOpacity
                    style={styles.industryButton}
                    onPress={() => setShowIndustryModal(true)}
                  >
                    <Icon name="sliders" size={14} color={colors.cyan[400]} />
                    <Text style={styles.industryButtonText}>
                      {currentIndustry
                        ? currentIndustry.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
                        : 'Set Industry'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsGrid}>
                  {visibleTags.map(({ tag, count, source }) => {
                    const isSelected = selectedTags.includes(tag);
                    const isSuggested = source === 'suggested' || source === 'default';
                    const isCustom = source === 'custom';
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tagChip,
                          isSelected && styles.tagChipSelected,
                          isSuggested && !isSelected && styles.tagChipSuggested,
                          isCustom && !isSelected && styles.tagChipCustom,
                        ]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            isSelected && styles.tagTextSelected,
                          ]}
                        >
                          {tag}
                        </Text>
                        {count > 0 && (
                          <View style={[
                            styles.tagCountBadge,
                            isSelected && styles.tagCountBadgeSelected,
                          ]}>
                            <Text style={[
                              styles.tagCountText,
                              isSelected && styles.tagCountTextSelected,
                            ]}>
                              {count}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {hasMoreTags && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllTags(!showAllTags)}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllTags ? 'Show less' : `Show all ${allTags.length} tags`}
                    </Text>
                    <Icon
                      name={showAllTags ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.purple[400]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noTagsContainer}>
                <Icon name="tag" size={24} color={colors.gray[600]} />
                <Text style={styles.noTagsText}>No tags yet</Text>
                <Text style={styles.noTagsSubtext}>Add tags to contacts to see them here</Text>
              </View>
            )}
          </View>
        )}

        {/* Results Header */}
        {hasSearched && (
          <View style={styles.resultsHeader}>
            <TouchableOpacity onPress={clearSearch} style={styles.backButton}>
              <Icon name="arrow-left" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
            <Text style={styles.resultsTitle}>
              {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}

        {/* AI Explanation */}
        {explanation && (
          <View style={styles.aiCard}>
            <Icon name="cpu" size={14} color={colors.purple[400]} />
            <Text style={styles.aiText}>{explanation}</Text>
          </View>
        )}

        {/* Error */}
        {(error || audioError) && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error || audioError}</Text>
          </View>
        )}

        {/* Results List */}
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
              tintColor={colors.purple[500]}
            />
          }
        />
      </View>

      {/* Industry Selection Modal */}
      <IndustryModal
        visible={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        onSelect={handleIndustrySelect}
        currentIndustry={currentIndustry}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[700],
    marginHorizontal: 12,
  },
  autocompleteContainer: {
    marginTop: 8,
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[700],
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  suggestionType: {
    fontSize: 12,
    color: colors.gray[500],
    textTransform: 'capitalize',
    marginLeft: 8,
  },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  voiceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red[500],
    marginRight: 8,
  },
  voiceText: {
    fontSize: 13,
    color: colors.gray[400],
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingTags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
    marginLeft: 10,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tagCount: {
    fontSize: 13,
    color: colors.gray[500],
  },
  industryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.cyan[900] + '40',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cyan[700],
  },
  industryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cyan[400],
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[800],
    margin: 4,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  tagChipSelected: {
    backgroundColor: colors.purple[600],
    borderColor: colors.purple[500],
  },
  tagChipSuggested: {
    backgroundColor: colors.cyan[900] + '40',
    borderColor: colors.cyan[700],
    borderStyle: 'dashed',
  },
  tagChipCustom: {
    backgroundColor: colors.green[900] + '40',
    borderColor: colors.green[700],
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[300],
    textTransform: 'capitalize',
  },
  tagTextSelected: {
    color: colors.white,
  },
  tagCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.gray[700],
  },
  tagCountBadgeSelected: {
    backgroundColor: colors.purple[500],
  },
  tagCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
  },
  tagCountTextSelected: {
    color: colors.white,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple[400],
    marginRight: 6,
  },
  noTagsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noTagsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[400],
    marginTop: 12,
  },
  noTagsSubtext: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[400],
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 14,
    backgroundColor: colors.purple[900] + '40',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.purple[500],
  },
  aiText: {
    flex: 1,
    fontSize: 14,
    color: colors.purple[300],
    marginLeft: 10,
    lineHeight: 20,
  },
  errorCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    backgroundColor: colors.red[900] + '40',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: colors.red[400],
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.purple[900] + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
