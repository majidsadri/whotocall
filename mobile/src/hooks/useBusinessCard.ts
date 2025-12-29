import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BusinessCard,
  BusinessCardInput,
  TemplateId,
  DEFAULT_ACCENT_COLOR,
} from '../types/businessCard';
import {
  getBusinessCard,
  saveBusinessCard,
  uploadCardAvatar,
  getVCard,
  getShareUrl,
} from '../services/api';

interface UseBusinessCardReturn {
  card: BusinessCard | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;

  // Form state
  formData: BusinessCardInput;
  setFormData: React.Dispatch<React.SetStateAction<BusinessCardInput>>;
  updateField: <K extends keyof BusinessCardInput>(key: K, value: BusinessCardInput[K]) => void;

  // Actions
  saveCard: () => Promise<boolean>;
  uploadAvatar: (imageUri: string) => Promise<string | null>;
  generateVCard: () => Promise<string | null>;
  getCardShareUrl: () => string | null;
  resetForm: () => void;
}

const getInitialFormData = (user: any): BusinessCardInput => ({
  full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
  email: user?.email || '',
  phone: '',
  title: '',
  company: '',
  website: '',
  linkedin_url: '',
  avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
  template_id: 'classic' as TemplateId,
  accent_color: DEFAULT_ACCENT_COLOR,
});

export function useBusinessCard(): UseBusinessCardReturn {
  const { user } = useAuth();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessCardInput>(() => getInitialFormData(user));
  const [originalData, setOriginalData] = useState<BusinessCardInput | null>(null);

  // Check if form has changes
  const hasChanges = originalData
    ? JSON.stringify(formData) !== JSON.stringify(originalData)
    : formData.full_name.trim().length > 0;

  // Fetch card on mount
  useEffect(() => {
    const fetchCard = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const { card: existingCard } = await getBusinessCard();

        if (existingCard) {
          setCard(existingCard);
          const cardData: BusinessCardInput = {
            full_name: existingCard.full_name,
            email: existingCard.email || '',
            phone: existingCard.phone || '',
            title: existingCard.title || '',
            company: existingCard.company || '',
            website: existingCard.website || '',
            linkedin_url: existingCard.linkedin_url || '',
            avatar_url: existingCard.avatar_url || '',
            template_id: existingCard.template_id,
            accent_color: existingCard.accent_color,
          };
          setFormData(cardData);
          setOriginalData(cardData);
        } else {
          // Pre-fill from user data
          const initialData = getInitialFormData(user);
          setFormData(initialData);
          setOriginalData(null);
        }
      } catch (err) {
        console.error('Error fetching business card:', err);
        setError('Failed to load business card');
        // Pre-fill from user data on error
        const initialData = getInitialFormData(user);
        setFormData(initialData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [user]);

  // Update form when user changes (for pre-fill)
  useEffect(() => {
    if (!card && user && !formData.full_name) {
      setFormData(getInitialFormData(user));
    }
  }, [user, card, formData.full_name]);

  const updateField = useCallback(<K extends keyof BusinessCardInput>(
    key: K,
    value: BusinessCardInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveCard = useCallback(async (): Promise<boolean> => {
    if (!formData.full_name.trim()) {
      setError('Name is required');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);
      const { card: savedCard } = await saveBusinessCard(formData);
      setCard(savedCard);

      const savedData: BusinessCardInput = {
        full_name: savedCard.full_name,
        email: savedCard.email || '',
        phone: savedCard.phone || '',
        title: savedCard.title || '',
        company: savedCard.company || '',
        website: savedCard.website || '',
        linkedin_url: savedCard.linkedin_url || '',
        avatar_url: savedCard.avatar_url || '',
        template_id: savedCard.template_id,
        accent_color: savedCard.accent_color,
      };
      setOriginalData(savedData);
      return true;
    } catch (err) {
      console.error('Error saving business card:', err);
      setError('Failed to save business card');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  const uploadAvatar = useCallback(async (imageUri: string): Promise<string | null> => {
    try {
      const { avatar_url } = await uploadCardAvatar(imageUri);
      setFormData(prev => ({ ...prev, avatar_url }));
      return avatar_url;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
      return null;
    }
  }, []);

  const generateVCard = useCallback(async (): Promise<string | null> => {
    if (!card) return null;

    try {
      return await getVCard();
    } catch (err) {
      console.error('Error generating vCard:', err);
      setError('Failed to generate vCard');
      return null;
    }
  }, [card]);

  const getCardShareUrl = useCallback((): string | null => {
    // If card is saved and has a share_slug, use that
    if (card?.share_slug) {
      return getShareUrl(card.share_slug);
    }
    // Generate a temporary share URL using user ID if card not saved yet
    if (user?.id) {
      return getShareUrl(user.id);
    }
    // Fallback: generate a placeholder URL with the name
    if (formData.full_name) {
      const slug = formData.full_name.toLowerCase().replace(/\s+/g, '-');
      return getShareUrl(slug);
    }
    return null;
  }, [card, user, formData.full_name]);

  const resetForm = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
    } else {
      setFormData(getInitialFormData(user));
    }
    setError(null);
  }, [originalData, user]);

  return {
    card,
    isLoading,
    isSaving,
    error,
    hasChanges,
    formData,
    setFormData,
    updateField,
    saveCard,
    uploadAvatar,
    generateVCard,
    getCardShareUrl,
    resetForm,
  };
}
