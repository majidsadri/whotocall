import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Icon from 'react-native-vector-icons/Feather';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAuth } from '../context/AuthContext';
import ContactCard from '../components/ContactCard';
import RecordButton from '../components/RecordButton';
import ScreenWrapper from '../components/ScreenWrapper';
import IndustryModal from '../components/IndustryModal';
import { colors } from '../styles/colors';
import * as api from '../services/api';
import { Contact, SearchResult } from '../types';

const QUICK_TAGS_COUNT = 6;

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'company'>('recent');
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState<string | null>(null);
  const [industryName, setIndustryName] = useState<string | null>(null);

  // Deduplicate contacts by name (case-insensitive)
  const deduplicatedContacts = useMemo(() => {
    const seen = new Map<string, Contact>();
    allContacts.forEach(contact => {
      const key = (contact.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.set(key, contact);
      } else if (key && seen.has(key)) {
        // Keep the one with more data or more recent
        const existing = seen.get(key)!;
        const existingScore = (existing.tags?.length || 0) + (existing.company ? 1 : 0) + (existing.role ? 1 : 0);
        const newScore = (contact.tags?.length || 0) + (contact.company ? 1 : 0) + (contact.role ? 1 : 0);
        if (newScore > existingScore) {
          seen.set(key, contact);
        }
      }
    });
    return Array.from(seen.values());
  }, [allContacts]);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    const contacts = [...deduplicatedContacts];
    switch (sortBy) {
      case 'name':
        return contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'recent':
        return contacts.sort((a, b) => {
          const dateA = a.met_date || a.created_at || '';
          const dateB = b.met_date || b.created_at || '';
          return dateB.localeCompare(dateA);
        });
      case 'company':
        return contacts.sort((a, b) => (a.company || 'zzz').localeCompare(b.company || 'zzz'));
      default:
        return contacts;
    }
  }, [deduplicatedContacts, sortBy]);

  // Calculate tags from actual contacts (accurate counts)
  const calculatedTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    deduplicatedContacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });
    // Convert to array and sort by count
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [deduplicatedContacts]);

  const popularTags = useMemo(() => calculatedTags.slice(0, QUICK_TAGS_COUNT), [calculatedTags]);

  useEffect(() => {
    fetchContacts();
    fetchPreferences();
  }, [user]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const response = await api.getContacts({});
      setAllContacts(response.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const prefs = await api.getPreferences();
      if (prefs.industry) {
        setCurrentIndustry(prefs.industry);
        // Fetch industry name
        const industries = await api.getIndustries();
        const found = industries.industries?.find((i: any) => i.id === prefs.industry);
        if (found) {
          setIndustryName(found.name);
        }
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleIndustrySelect = async (industryId: string) => {
    setCurrentIndustry(industryId);
    // Get industry name
    try {
      const industries = await api.getIndustries();
      const found = industries.industries?.find((i: any) => i.id === industryId);
      if (found) {
        setIndustryName(found.name);
      }
    } catch (err) {
      console.error('Error getting industry name:', err);
    }
  };

  const toggleTag = (tag: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    if (hasSearched) {
      setHasSearched(false);
      setQuery('');
      setResults([]);
    }
  };

  const getFilteredContacts = (): Contact[] => {
    if (selectedTags.length === 0) return sortedContacts;
    return sortedContacts.filter(contact => {
      if (!contact.tags) return false;
      const contactTags = contact.tags.map(t => t.toLowerCase());
      return selectedTags.some(tag => contactTags.includes(tag.toLowerCase()));
    });
  };

  const filteredContacts = getFilteredContacts();

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
    setSelectedTags([]);

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
              setResults(searchResult.results.map((contact) => ({
                contact,
                score: 0,
                matchReason: '',
              })));
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

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setExplanation(null);
  };

  const clearTagFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTags([]);
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <ContactCard
      contact={item}
      expanded={expandedId === item.id}
      onPress={() => toggleExpanded(item.id)}
    />
  );

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <ContactCard
      contact={item.contact}
      score={item.score}
      matchReason={item.matchReason}
      expanded={expandedId === item.contact.id}
      onPress={() => toggleExpanded(item.contact.id)}
    />
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Find your contacts</Text>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Name, company, or tag..."
              placeholderTextColor={colors.gray[400]}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="x" size={18} color={colors.gray[400]} />
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

          {/* Voice Status */}
          {(isRecording || isTranscribing) && (
            <View style={styles.voiceStatus}>
              <View style={styles.voiceDot} />
              <Text style={styles.voiceText}>
                {isRecording ? 'Listening...' : 'Processing...'}
              </Text>
            </View>
          )}
        </View>

        {/* Sort & Count Row */}
        {!hasSearched && (
          <View style={styles.sortRow}>
            <Text style={styles.contactCount}>
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
            </Text>
            <View style={styles.sortButtons}>
              {[
                { key: 'recent', icon: 'clock' },
                { key: 'name', icon: 'type' },
                { key: 'company', icon: 'briefcase' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortBtn, sortBy === option.key && styles.sortBtnActive]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Icon
                    name={option.icon}
                    size={14}
                    color={sortBy === option.key ? colors.white : colors.gray[400]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Industry & Tags */}
        {!hasSearched && (
          <View style={styles.tagsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScroll}
            >
              {/* Industry Button */}
              <TouchableOpacity
                style={[styles.industryChip, currentIndustry && styles.industryChipActive]}
                onPress={() => setShowIndustryModal(true)}
              >
                <Icon
                  name="briefcase"
                  size={14}
                  color={currentIndustry ? colors.white : colors.gray[500]}
                />
                <Text style={[styles.industryText, currentIndustry && styles.industryTextActive]}>
                  {industryName || 'Select Field'}
                </Text>
                <Icon
                  name="chevron-down"
                  size={14}
                  color={currentIndustry ? colors.white : colors.gray[500]}
                />
              </TouchableOpacity>

              {selectedTags.length > 0 && (
                <TouchableOpacity style={styles.clearTagBtn} onPress={clearTagFilters}>
                  <Icon name="x" size={12} color={colors.gray[600]} />
                  <Text style={styles.clearTagText}>Clear</Text>
                </TouchableOpacity>
              )}
              {popularTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);
                const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                      {displayTag}
                    </Text>
                    <Text style={[styles.tagCount, isSelected && styles.tagCountSelected]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Search Results Header */}
        {hasSearched && (
          <View style={styles.resultsHeader}>
            <TouchableOpacity onPress={clearSearch} style={styles.backBtn}>
              <Icon name="arrow-left" size={18} color={colors.gray[500]} />
            </TouchableOpacity>
            <Text style={styles.resultsText}>
              {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}

        {/* AI Explanation */}
        {explanation && (
          <View style={styles.aiCard}>
            <Icon name="cpu" size={14} color={colors.gray[600]} />
            <Text style={styles.aiText}>{explanation}</Text>
          </View>
        )}

        {/* Error */}
        {(error || audioError) && (
          <Text style={styles.errorText}>{error || audioError}</Text>
        )}

        {/* Contact List */}
        {hasSearched ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.contact.id}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Icon name="search" size={32} color={colors.gray[300]} />
                  <Text style={styles.emptyTitle}>No results</Text>
                  <Text style={styles.emptySubtitle}>Try different keywords</Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContactItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="users" size={32} color={colors.gray[300]} />
                <Text style={styles.emptyTitle}>
                  {selectedTags.length > 0 ? 'No matches' : 'No contacts yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTags.length > 0 ? 'Try different tags' : 'Add contacts to get started'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => {
                  fetchContacts();
                  fetchPreferences();
                }}
                tintColor={colors.gray[500]}
              />
            }
          />
        )}
      </View>

      {/* Industry Modal */}
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
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchSection: {
    backgroundColor: colors.gray[800],
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[800],
    marginLeft: 10,
  },
  clearButton: {
    padding: 4,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
    marginHorizontal: 12,
  },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  voiceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red[400],
    marginRight: 8,
  },
  voiceText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contactCount: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  sortBtnActive: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[800],
  },
  tagsSection: {
    paddingBottom: 12,
  },
  tagsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  clearTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 16,
  },
  clearTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  industryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  industryChipActive: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[800],
  },
  industryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
  industryTextActive: {
    color: colors.white,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 16,
  },
  tagChipSelected: {
    backgroundColor: colors.gray[800],
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  tagTextSelected: {
    color: colors.white,
  },
  tagCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
  },
  tagCountSelected: {
    color: colors.gray[400],
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.gray[600],
    gap: 10,
  },
  aiText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    color: colors.red[500],
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.gray[400],
    marginTop: 4,
  },
});
