import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import {
  BusinessCard,
  BusinessCardInput,
  ScannedCardInput,
  BusinessCardsData,
  TemplateId,
  DEFAULT_ACCENT_COLOR,
} from '../types/businessCard';
import {
  getBusinessCard,
  saveBusinessCard,
  uploadCardAvatar,
  getVCard,
  getShareUrl,
  getBusinessCards as getBusinessCardsAPI,
  createBusinessCard as createBusinessCardAPI,
  updateBusinessCard as updateBusinessCardAPI,
  deleteBusinessCard as deleteBusinessCardAPI,
  setPrimaryBusinessCard as setPrimaryBusinessCardAPI,
  uploadScannedCardImage,
  syncBusinessCards,
  getCardsFromSupabase,
} from '../services/api';

const BUSINESS_CARDS_STORAGE_KEY = '@business_cards_v2';
const OLD_BUSINESS_CARD_KEY = '@business_card';

interface UseBusinessCardsReturn {
  // Card list state
  cards: BusinessCard[];
  primaryCard: BusinessCard | null;
  selectedCard: BusinessCard | null;
  selectedCardIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Selection
  selectCard: (cardId: string) => void;
  selectCardByIndex: (index: number) => void;

  // CRUD operations
  createDigitalCard: (input: BusinessCardInput) => Promise<BusinessCard | null>;
  createScannedCard: (input: ScannedCardInput) => Promise<BusinessCard | null>;
  updateCard: (cardId: string, input: Partial<BusinessCardInput>) => Promise<boolean>;
  deleteCard: (cardId: string) => Promise<boolean>;

  // Primary card management
  setPrimaryCard: (cardId: string) => Promise<boolean>;

  // Sharing
  getCardShareUrl: (cardId?: string) => string | null;
  generateVCard: (cardId?: string) => Promise<string | null>;

  // Avatar
  uploadAvatar: (imageUri: string) => Promise<string | null>;

  // Refresh
  refreshCards: () => Promise<void>;
}

// Generate unique ID
const generateId = (): string => {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate share slug from name
const generateShareSlug = (name: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const suffix = Math.random().toString(36).substr(2, 6);
  return `${slug}-${suffix}`;
};

// Get initial form data from user metadata
const getInitialCardData = (user: any): BusinessCardInput => ({
  card_type: 'digital',
  full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
  email: user?.email || '',
  phone: '',
  title: '',
  company: '',
  website: '',
  linkedin_url: '',
  avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
  template_id: 'gradient' as TemplateId,
  accent_color: DEFAULT_ACCENT_COLOR,
});

export function useBusinessCards(): UseBusinessCardsReturn {
  const { user } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const primaryCard = cards.find(c => c.is_primary) || cards[0] || null;
  const selectedCard = cards.find(c => c.id === selectedCardId) || primaryCard;
  const selectedCardIndex = selectedCard ? cards.findIndex(c => c.id === selectedCard.id) : 0;

  // Load cards from storage
  const loadCards = useCallback(async (): Promise<BusinessCard[]> => {
    try {
      // Try to load new format
      const stored = await AsyncStorage.getItem(BUSINESS_CARDS_STORAGE_KEY);
      if (stored) {
        const data: BusinessCardsData = JSON.parse(stored);
        return data.cards || [];
      }

      // Try to migrate from old format
      const oldCard = await AsyncStorage.getItem(OLD_BUSINESS_CARD_KEY);
      if (oldCard) {
        const card = JSON.parse(oldCard);
        const migratedCard: BusinessCard = {
          ...card,
          card_type: 'digital',
          is_primary: true,
          display_order: 0,
        };

        // Save migrated data
        await saveCardsToStorage([migratedCard]);

        // Remove old key
        await AsyncStorage.removeItem(OLD_BUSINESS_CARD_KEY);

        return [migratedCard];
      }

      return [];
    } catch (err) {
      console.error('Error loading cards:', err);
      return [];
    }
  }, []);

  // Save cards to storage
  const saveCardsToStorage = async (cardsToSave: BusinessCard[]): Promise<void> => {
    try {
      const data: BusinessCardsData = {
        cards: cardsToSave,
        version: 2,
      };
      await AsyncStorage.setItem(BUSINESS_CARDS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving cards:', err);
      throw err;
    }
  };

  // Fetch cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First try to get all cards from new multi-card API
        try {
          const { cards: apiCards } = await getBusinessCardsAPI();
          if (apiCards && apiCards.length > 0) {
            const formattedCards: BusinessCard[] = apiCards.map(c => ({
              ...c,
              card_type: c.card_type || 'digital',
              is_primary: c.is_primary ?? false,
              display_order: c.display_order ?? 0,
            }));

            setCards(formattedCards);
            await saveCardsToStorage(formattedCards);

            if (!selectedCardId && formattedCards.length > 0) {
              const primary = formattedCards.find(c => c.is_primary);
              setSelectedCardId(primary?.id || formattedCards[0].id);
            }
            return;
          }
        } catch (apiErr) {
          console.log('Multi-card API not available, trying Supabase');
        }

        // Try Supabase directly
        try {
          const supabaseCards = await getCardsFromSupabase();
          if (supabaseCards && supabaseCards.length > 0) {
            const formattedCards: BusinessCard[] = supabaseCards.map(c => ({
              ...c,
              card_type: c.card_type || 'digital',
              is_primary: c.is_primary ?? false,
              display_order: c.display_order ?? 0,
            }));

            setCards(formattedCards);
            await saveCardsToStorage(formattedCards);

            if (!selectedCardId && formattedCards.length > 0) {
              const primary = formattedCards.find(c => c.is_primary);
              setSelectedCardId(primary?.id || formattedCards[0].id);
            }
            return;
          }
        } catch (supaErr) {
          console.log('Supabase fetch not available, trying legacy API');
        }

        // Try legacy single-card API
        try {
          const { card: existingCard } = await getBusinessCard();
          if (existingCard) {
            const migratedCard: BusinessCard = {
              ...existingCard,
              card_type: existingCard.card_type || 'digital',
              is_primary: existingCard.is_primary ?? true,
              display_order: existingCard.display_order ?? 0,
            };

            const localCards = await loadCards();
            const existingLocalIndex = localCards.findIndex(c => c.id === migratedCard.id);

            let mergedCards: BusinessCard[];
            if (existingLocalIndex >= 0) {
              mergedCards = [...localCards];
              mergedCards[existingLocalIndex] = migratedCard;
            } else if (localCards.length === 0) {
              mergedCards = [migratedCard];
            } else {
              mergedCards = localCards;
            }

            setCards(mergedCards);
            await saveCardsToStorage(mergedCards);

            // Try to sync local cards to backend
            syncBusinessCards(mergedCards as any).catch(() => {});

            if (!selectedCardId && mergedCards.length > 0) {
              const primary = mergedCards.find(c => c.is_primary);
              setSelectedCardId(primary?.id || mergedCards[0].id);
            }
            return;
          }
        } catch (apiErr) {
          console.log('Legacy API not available, using local storage');
        }

        // Load from local storage
        const localCards = await loadCards();
        setCards(localCards);

        // Try to sync local cards to backend
        if (localCards.length > 0) {
          syncBusinessCards(localCards as any).catch(() => {});
        }

        if (!selectedCardId && localCards.length > 0) {
          const primary = localCards.find(c => c.is_primary);
          setSelectedCardId(primary?.id || localCards[0].id);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('Failed to load business cards');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  // Select card by ID
  const selectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
  }, []);

  // Select card by index
  const selectCardByIndex = useCallback((index: number) => {
    if (index >= 0 && index < cards.length) {
      setSelectedCardId(cards[index].id);
    }
  }, [cards]);

  // Create digital card
  const createDigitalCard = useCallback(async (input: BusinessCardInput): Promise<BusinessCard | null> => {
    if (!user) return null;

    try {
      setIsSaving(true);
      setError(null);

      const now = new Date().toISOString();
      const isFirst = cards.length === 0;

      const newCard: BusinessCard = {
        id: generateId(),
        user_id: user.id,
        card_type: 'digital',
        is_primary: isFirst,
        display_order: cards.length,
        full_name: input.full_name,
        email: input.email || '',
        phone: input.phone || '',
        title: input.title || '',
        company: input.company || '',
        website: input.website || '',
        linkedin_url: input.linkedin_url || '',
        avatar_url: input.avatar_url || '',
        template_id: input.template_id || 'gradient',
        accent_color: input.accent_color || DEFAULT_ACCENT_COLOR,
        share_slug: generateShareSlug(input.full_name),
        created_at: now,
        updated_at: now,
      };

      const updatedCards = [...cards, newCard];
      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Sync to backend/Supabase
      try {
        await createBusinessCardAPI(newCard as any);
      } catch (apiErr) {
        // Fallback: sync all cards to Supabase
        syncBusinessCards(updatedCards as any).catch(() => {
          // Try legacy API for digital cards
          saveBusinessCard(input).catch(() => {
            console.log('Sync failed, card saved locally only');
          });
        });
      }

      setSelectedCardId(newCard.id);
      return newCard;
    } catch (err) {
      console.error('Error creating card:', err);
      setError('Failed to create card');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, cards]);

  // Create scanned card
  const createScannedCard = useCallback(async (input: ScannedCardInput): Promise<BusinessCard | null> => {
    if (!user) return null;

    try {
      setIsSaving(true);
      setError(null);

      // Try to upload image to backend for storage and enhancement
      let finalImageUrl = input.scanned_image_url;
      try {
        const { image_url, enhanced_url } = await uploadScannedCardImage(input.scanned_image_url);
        finalImageUrl = enhanced_url || image_url;
      } catch (uploadErr) {
        console.log('Image upload failed, using local URI');
      }

      const now = new Date().toISOString();
      const isFirst = cards.length === 0;

      const newCard: BusinessCard = {
        id: generateId(),
        user_id: user.id,
        card_type: 'scanned',
        is_primary: isFirst,
        display_order: cards.length,
        full_name: input.card_label,
        email: '',
        phone: '',
        title: '',
        company: '',
        website: '',
        linkedin_url: '',
        avatar_url: '',
        template_id: 'classic',
        accent_color: DEFAULT_ACCENT_COLOR,
        share_slug: generateShareSlug(input.card_label),
        scanned_image_url: finalImageUrl,
        card_label: input.card_label,
        created_at: now,
        updated_at: now,
      };

      const updatedCards = [...cards, newCard];
      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Sync to backend/Supabase
      console.log('Creating scanned card, attempting sync...');
      try {
        await createBusinessCardAPI(newCard as any);
        console.log('Card created via API');
      } catch (apiErr) {
        console.log('API failed, trying Supabase sync...');
        // Fallback: sync all cards to Supabase
        try {
          const result = await syncBusinessCards(updatedCards as any);
          console.log('Supabase sync result:', result);
        } catch (syncErr) {
          console.error('Supabase sync failed:', syncErr);
        }
      }

      setSelectedCardId(newCard.id);
      return newCard;
    } catch (err) {
      console.error('Error creating scanned card:', err);
      setError('Failed to create card');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, cards]);

  // Update card
  const updateCard = useCallback(async (
    cardId: string,
    input: Partial<BusinessCardInput>
  ): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const cardIndex = cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        setError('Card not found');
        return false;
      }

      const updatedCard: BusinessCard = {
        ...cards[cardIndex],
        ...input,
        updated_at: new Date().toISOString(),
      };

      // Update share slug if name changed
      if (input.full_name && input.full_name !== cards[cardIndex].full_name) {
        updatedCard.share_slug = generateShareSlug(input.full_name);
      }

      const updatedCards = [...cards];
      updatedCards[cardIndex] = updatedCard;

      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Sync to Supabase
      try {
        await syncBusinessCards(updatedCards as any);
        console.log('Card update synced to Supabase');
      } catch (syncErr) {
        console.log('Supabase sync failed, card saved locally');
      }

      // Also try backend API (may not exist)
      try {
        await updateBusinessCardAPI(cardId, updatedCard as any);
      } catch (apiErr) {
        // Try legacy API for primary digital cards
        if (updatedCard.is_primary && updatedCard.card_type === 'digital') {
          try {
            await saveBusinessCard(input as BusinessCardInput);
          } catch (legacyErr) {
            // Silent fail - already synced to Supabase
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error updating card:', err);
      setError('Failed to update card');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [cards]);

  // Delete card
  const deleteCard = useCallback(async (cardId: string): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const cardIndex = cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        setError('Card not found');
        return false;
      }

      const deletedCard = cards[cardIndex];
      const updatedCards = cards.filter(c => c.id !== cardId);

      // If deleted card was primary, make first remaining card primary
      if (deletedCard.is_primary && updatedCards.length > 0) {
        updatedCards[0].is_primary = true;
      }

      // Re-order cards
      updatedCards.forEach((card, index) => {
        card.display_order = index;
      });

      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Try to delete from backend API
      try {
        await deleteBusinessCardAPI(cardId);
      } catch (apiErr) {
        console.log('API delete failed, card removed locally');
      }

      // Select another card if the deleted one was selected
      if (selectedCardId === cardId && updatedCards.length > 0) {
        const primary = updatedCards.find(c => c.is_primary);
        setSelectedCardId(primary?.id || updatedCards[0].id);
      } else if (updatedCards.length === 0) {
        setSelectedCardId(null);
      }

      return true;
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [cards, selectedCardId]);

  // Set primary card
  const setPrimaryCard = useCallback(async (cardId: string): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const cardIndex = cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        setError('Card not found');
        return false;
      }

      const updatedCards = cards.map(card => ({
        ...card,
        is_primary: card.id === cardId,
        updated_at: card.id === cardId ? new Date().toISOString() : card.updated_at,
      }));

      setCards(updatedCards);
      await saveCardsToStorage(updatedCards);

      // Try to update on backend API
      try {
        await setPrimaryBusinessCardAPI(cardId);
      } catch (apiErr) {
        console.log('API set primary failed, updated locally');
      }

      return true;
    } catch (err) {
      console.error('Error setting primary card:', err);
      setError('Failed to set primary card');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [cards]);

  // Get share URL for a card
  const getCardShareUrl = useCallback((cardId?: string): string | null => {
    const card = cardId ? cards.find(c => c.id === cardId) : selectedCard;
    if (card?.share_slug) {
      return getShareUrl(card.share_slug);
    }
    return null;
  }, [cards, selectedCard]);

  // Generate vCard
  const generateVCard = useCallback(async (cardId?: string): Promise<string | null> => {
    const card = cardId ? cards.find(c => c.id === cardId) : selectedCard;
    if (!card || card.card_type !== 'digital') return null;

    try {
      return await getVCard();
    } catch (err) {
      console.error('Error generating vCard:', err);
      setError('Failed to generate vCard');
      return null;
    }
  }, [cards, selectedCard]);

  // Upload avatar for selected card
  const uploadAvatar = useCallback(async (imageUri: string): Promise<string | null> => {
    try {
      const { avatar_url } = await uploadCardAvatar(imageUri);
      return avatar_url;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
      return null;
    }
  }, []);

  // Refresh cards from backend
  const refreshCards = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Always try to get fresh data from backend API
      try {
        const { cards: apiCards } = await getBusinessCardsAPI();
        if (apiCards && apiCards.length > 0) {
          const formattedCards: BusinessCard[] = apiCards.map(c => ({
            ...c,
            card_type: c.card_type || 'digital',
            is_primary: c.is_primary ?? false,
            display_order: c.display_order ?? 0,
          }));

          setCards(formattedCards);
          await saveCardsToStorage(formattedCards);

          if (!selectedCardId && formattedCards.length > 0) {
            const primary = formattedCards.find(c => c.is_primary);
            setSelectedCardId(primary?.id || formattedCards[0].id);
          }
          return;
        }
      } catch (apiErr) {
        console.log('Multi-card API not available during refresh, trying Supabase');
      }

      // Try Supabase directly
      try {
        const supabaseCards = await getCardsFromSupabase();
        if (supabaseCards && supabaseCards.length > 0) {
          const formattedCards: BusinessCard[] = supabaseCards.map(c => ({
            ...c,
            card_type: c.card_type || 'digital',
            is_primary: c.is_primary ?? false,
            display_order: c.display_order ?? 0,
          }));

          setCards(formattedCards);
          await saveCardsToStorage(formattedCards);

          if (!selectedCardId && formattedCards.length > 0) {
            const primary = formattedCards.find(c => c.is_primary);
            setSelectedCardId(primary?.id || formattedCards[0].id);
          }
          return;
        }
      } catch (supaErr) {
        console.log('Supabase fetch not available during refresh');
      }

      // Try legacy single-card API
      try {
        const { card: existingCard } = await getBusinessCard();
        if (existingCard) {
          const migratedCard: BusinessCard = {
            ...existingCard,
            card_type: existingCard.card_type || 'digital',
            is_primary: existingCard.is_primary ?? true,
            display_order: existingCard.display_order ?? 0,
          };

          setCards([migratedCard]);
          await saveCardsToStorage([migratedCard]);
          return;
        }
      } catch (apiErr) {
        console.log('Legacy API not available during refresh');
      }

      // Fallback to local storage
      const localCards = await loadCards();
      setCards(localCards);
    } catch (err) {
      console.error('Error refreshing cards:', err);
      setError('Failed to refresh cards');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadCards, selectedCardId]);

  return {
    cards,
    primaryCard,
    selectedCard,
    selectedCardIndex,
    isLoading,
    isSaving,
    error,
    selectCard,
    selectCardByIndex,
    createDigitalCard,
    createScannedCard,
    updateCard,
    deleteCard,
    setPrimaryCard,
    getCardShareUrl,
    generateVCard,
    uploadAvatar,
    refreshCards,
  };
}
