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

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Icon from 'react-native-vector-icons/Feather';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAuth } from '../context/AuthContext';
import ContactCard from '../components/ContactCard';
import RecordButton from '../components/RecordButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { commonStyles } from '../styles/common';
import * as api from '../services/api';
import { Contact, SearchResult } from '../types';

const QUICK_TAGS_COUNT = 8;

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
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'company'>('name');

  // Autocomplete state
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [suggestions, setSuggestions] = useState<{type: string; value: string; label: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sort contacts based on selected sort option
  const sortedContacts = useMemo(() => {
    const contacts = [...allContacts];
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
  }, [allContacts, sortBy]);

  // Popular tags (top tags by count)
  const popularTags = useMemo(() => {
    return allTags.slice(0, QUICK_TAGS_COUNT);
  }, [allTags]);

  // Filtered tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return allTags;
    const query = tagSearchQuery.toLowerCase();
    return allTags.filter(({ tag }) => tag.toLowerCase().includes(query));
  }, [allTags, tagSearchQuery]);

  useEffect(() => {
    fetchTags();
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    try {
      const response = await api.getContacts({});
      setAllContacts(response.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      const response = await api.getAllTags();
      setAllTags(response.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
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

  const updateSuggestions = (text: string) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lowerQuery = text.toLowerCase();
    const newSuggestions: {type: string; value: string; label: string}[] = [];
    const seen = new Set<string>();

    allTags.forEach(({ tag }) => {
      if (tag.toLowerCase().includes(lowerQuery) && !seen.has(tag.toLowerCase())) {
        seen.add(tag.toLowerCase());
        newSuggestions.push({ type: 'tag', value: tag, label: tag });
      }
    });

    allContacts.forEach((contact) => {
      if (contact.name && contact.name.toLowerCase().includes(lowerQuery)) {
        const key = `name:${contact.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({ type: 'name', value: contact.name, label: contact.name });
        }
      }
      if (contact.company && contact.company.toLowerCase().includes(lowerQuery)) {
        const key = `company:${contact.company.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          newSuggestions.push({ type: 'company', value: contact.company, label: contact.company });
        }
      }
    });

    setSuggestions(newSuggestions.slice(0, 6));
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let newTags: string[];
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    if (hasSearched) {
      setHasSearched(false);
      setQuery('');
      setResults([]);
    }
  };

  const getFilteredContacts = (): Contact[] => {
    if (selectedTags.length === 0) {
      return sortedContacts;
    }
    return sortedContacts.filter(contact => {
      if (!contact.tags) return false;
      const contactTags = contact.tags.map(t => t.toLowerCase());
      return selectedTags.some(tag => contactTags.includes(tag.toLowerCase()));
    });
  };

  const filteredContacts = getFilteredContacts();

  const toggleTagsExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTagsExpanded(!tagsExpanded);
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

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <ContactCard
      contact={item.contact}
      score={item.score}
      matchReason={item.matchReason}
      expanded={expandedId === item.contact.id}
      onPress={() => toggleExpanded(item.contact.id)}
    />
  );

  const renderContactItem = ({ item }: { item: Contact }) => (
    <ContactCard
      contact={item}
      expanded={expandedId === item.id}
      onPress={() => toggleExpanded(item.id)}
    />
  );

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setExplanation(null);
    setShowSuggestions(false);
  };

  const clearTagFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTags([]);
  };

  const renderEmpty = () => {
    if (isSearching) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.gray[800] }]}>
          <Icon name="search" size={32} color={colors.gray[500]} />
        </View>
        <Text style={styles.emptyTitle}>No results</Text>
        <Text style={styles.emptySubtitle}>Try different keywords</Text>
      </View>
    );
  };

  const renderTagChip = (tag: string, count: number, isQuickTag: boolean = false) => {
    const isSelected = selectedTags.includes(tag);
    return (
      <TouchableOpacity
        key={tag}
        style={[
          styles.tagChip,
          isSelected && styles.tagChipSelected,
          isQuickTag && styles.quickTagChip,
        ]}
        onPress={() => toggleTag(tag)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <Icon name="check" size={12} color={colors.white} style={styles.tagCheckIcon} />
        )}
        <Text
          style={[
            styles.tagText,
            isSelected && styles.tagTextSelected,
          ]}
          numberOfLines={1}
        >
          {tag}
        </Text>
        {count > 0 && (
          <View style={[styles.tagCountBadge, isSelected && styles.tagCountBadgeSelected]}>
            <Text style={[styles.tagCountText, isSelected && styles.tagCountTextSelected]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.pageTitle}>Network</Text>
            {selectedTags.length > 0 && (
              <Text style={styles.filteringSubtitle}>
                Filtering by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={styles.contactCountBadge}>
              <Icon name="users" size={14} color={colors.purple[400]} />
              <Text style={styles.contactCountText}>{allContacts.length}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={colors.gray[500]} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search contacts..."
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
              size={34}
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
                  <Icon
                    name={
                      suggestion.type === 'tag' ? 'tag' :
                      suggestion.type === 'name' ? 'user' : 'briefcase'
                    }
                    size={14}
                    color={colors.gray[400]}
                  />
                  <Text style={styles.suggestionText}>{suggestion.label}</Text>
                  <Text style={styles.suggestionType}>{suggestion.type}</Text>
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

        {/* Sort Options - Show when not searching */}
        {!hasSearched && allContacts.length > 0 && (
          <View style={styles.sortSection}>
            <Text style={styles.sortLabel}>Sort by</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'name', label: 'Name', icon: 'user' },
                { key: 'recent', label: 'Recent', icon: 'clock' },
                { key: 'company', label: 'Company', icon: 'briefcase' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy(option.key as 'name' | 'recent' | 'company')}
                >
                  <Icon
                    name={option.icon}
                    size={14}
                    color={sortBy === option.key ? colors.purple[400] : colors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.key && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tags Filter Section - Show when not searching */}
        {!hasSearched && allTags.length > 0 && (
          <View style={styles.tagsSection}>
            {/* Quick Tags Row - Always visible */}
            <View style={styles.quickTagsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickTagsScroll}
              >
                {/* All/Clear button */}
                {selectedTags.length > 0 ? (
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={clearTagFilters}
                  >
                    <Icon name="x" size={14} color={colors.purple[400]} />
                    <Text style={styles.clearAllText}>Clear</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.allTagIndicator}>
                    <Icon name="users" size={14} color={colors.purple[400]} />
                    <Text style={styles.allTagText}>All</Text>
                  </View>
                )}

                {/* Quick tags */}
                {popularTags.map(({ tag, count }) => renderTagChip(tag, count, true))}

                {/* More tags button */}
                {allTags.length > QUICK_TAGS_COUNT && (
                  <TouchableOpacity
                    style={styles.moreTagsButton}
                    onPress={toggleTagsExpanded}
                  >
                    <Icon
                      name={tagsExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.purple[400]}
                    />
                    <Text style={styles.moreTagsText}>
                      {tagsExpanded ? 'Less' : `+${allTags.length - QUICK_TAGS_COUNT}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Expanded Tags Panel */}
            {tagsExpanded && (
              <View style={styles.expandedTagsContainer}>
                {/* Tag Search */}
                <View style={styles.tagSearchContainer}>
                  <Icon name="search" size={16} color={colors.gray[500]} />
                  <TextInput
                    style={styles.tagSearchInput}
                    value={tagSearchQuery}
                    onChangeText={setTagSearchQuery}
                    placeholder="Search tags..."
                    placeholderTextColor={colors.gray[500]}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {tagSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setTagSearchQuery('')}>
                      <Icon name="x" size={16} color={colors.gray[400]} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Results count */}
                <View style={styles.tagSearchResults}>
                  <Text style={styles.tagSearchResultsText}>
                    {filteredTags.length === allTags.length
                      ? `${allTags.length} tags`
                      : `${filteredTags.length} of ${allTags.length} tags`}
                  </Text>
                  {selectedTags.length > 0 && (
                    <TouchableOpacity onPress={clearTagFilters}>
                      <Text style={styles.clearAllTagsText}>Clear {selectedTags.length} selected</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tags Grid */}
                <ScrollView
                  style={styles.expandedTagsScroll}
                  contentContainerStyle={styles.expandedTagsContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredTags.length > 0 ? (
                    <View style={styles.tagsGrid}>
                      {filteredTags.map(({ tag, count }) => {
                        const isSelected = selectedTags.includes(tag);
                        // Visual weight based on count
                        const maxCount = Math.max(...allTags.map(t => t.count), 1);
                        const weight = Math.min(count / maxCount, 1);
                        const isPopular = weight > 0.5;

                        return (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.tagChip,
                              isSelected && styles.tagChipSelected,
                              isPopular && !isSelected && styles.tagChipPopular,
                            ]}
                            onPress={() => toggleTag(tag)}
                            activeOpacity={0.7}
                          >
                            {isSelected && (
                              <Icon name="check" size={12} color={colors.white} style={styles.tagCheckIcon} />
                            )}
                            <Text
                              style={[
                                styles.tagText,
                                isSelected && styles.tagTextSelected,
                                isPopular && !isSelected && styles.tagTextPopular,
                              ]}
                              numberOfLines={1}
                            >
                              {tag}
                            </Text>
                            <View style={[
                              styles.tagCountBadge,
                              isSelected && styles.tagCountBadgeSelected,
                              isPopular && !isSelected && styles.tagCountBadgePopular,
                            ]}>
                              <Text style={[
                                styles.tagCountText,
                                isSelected && styles.tagCountTextSelected,
                              ]}>
                                {count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.noTagsFound}>
                      <Icon name="search" size={24} color={colors.gray[600]} />
                      <Text style={styles.noTagsFoundText}>No tags match "{tagSearchQuery}"</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Active Filters Summary */}
        {!hasSearched && selectedTags.length > 0 && (
          <View style={styles.filterSummary}>
            <View style={styles.filterSummaryLeft}>
              <Icon name="filter" size={14} color={colors.purple[400]} />
              <Text style={styles.filterSummaryText}>
                {filteredContacts.length} of {allContacts.length}
              </Text>
            </View>
            <TouchableOpacity onPress={clearTagFilters} style={styles.filterSummaryClear}>
              <Text style={styles.filterSummaryClearText}>Clear filters</Text>
              <Icon name="x" size={14} color={colors.purple[400]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Search Results Header */}
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

        {/* Contact List */}
        {hasSearched ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.contact.id}
            renderItem={renderSearchResult}
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
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContactItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Icon name="users" size={32} color={colors.purple[400]} />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedTags.length > 0 ? 'No matches' : 'No contacts yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTags.length > 0
                    ? 'Try selecting different tags'
                    : 'Add contacts to build your network'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingTags}
                onRefresh={() => {
                  fetchContacts();
                  fetchTags();
                }}
                tintColor={colors.purple[500]}
              />
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
  },
  filteringSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.purple[400],
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 16,
  },
  contactCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple[400],
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  clearButton: {
    padding: 6,
  },
  searchDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  autocompleteContainer: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  suggestionType: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 14,
    color: colors.gray[400],
    fontWeight: '500',
  },
  // Sort Section
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[500],
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
  },
  sortOptionTextActive: {
    color: colors.purple[400],
  },
  // Tags Section
  tagsSection: {
    paddingBottom: 8,
  },
  quickTagsContainer: {
    paddingLeft: 20,
  },
  quickTagsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 20,
    paddingVertical: 4,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple[400],
  },
  allTagIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  allTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple[400],
  },
  quickTagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moreTagsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple[400],
  },
  // Expanded Tags
  expandedTagsContainer: {
    marginTop: 12,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tagSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 10,
  },
  tagSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    padding: 0,
  },
  tagSearchResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tagSearchResultsText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  clearAllTagsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple[400],
  },
  expandedTagsScroll: {
    maxHeight: 220,
  },
  expandedTagsContent: {
    padding: 12,
  },
  noTagsFound: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  noTagsFoundText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagChipSelected: {
    backgroundColor: colors.purple[600],
    borderColor: colors.purple[500],
  },
  tagChipPopular: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  tagCheckIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[300],
    textTransform: 'capitalize',
  },
  tagTextSelected: {
    color: colors.white,
  },
  tagTextPopular: {
    color: colors.purple[300],
    fontWeight: '600',
  },
  tagCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 20,
    alignItems: 'center',
  },
  tagCountBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagCountBadgePopular: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  tagCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[400],
  },
  tagCountTextSelected: {
    color: colors.white,
  },
  // Filter Summary
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  filterSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple[300],
  },
  filterSummaryClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterSummaryClearText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple[400],
  },
  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.purple[500],
  },
  aiText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.purple[300],
    marginLeft: 10,
    lineHeight: 20,
  },
  errorCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
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
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.gray[500],
    textAlign: 'center',
  },
});
