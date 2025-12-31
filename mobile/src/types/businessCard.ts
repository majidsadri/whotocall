export type TemplateId = 'classic' | 'modern' | 'gradient';

// Card type discriminator: digital (created in-app) vs scanned (photographed)
export type CardType = 'digital' | 'scanned';

export interface BusinessCard {
  id: string;
  user_id: string;

  // Card type and ordering
  card_type: CardType;
  is_primary: boolean;
  display_order: number;

  // Common fields
  full_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  linkedin_url?: string;
  avatar_url?: string;

  // Digital card specific
  template_id: TemplateId;
  accent_color: string;
  share_slug: string;

  // Scanned card specific
  scanned_image_url?: string;
  card_label?: string;

  created_at: string;
  updated_at: string;
}

// Input for creating/updating digital cards
export interface BusinessCardInput {
  card_type?: CardType;
  full_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  linkedin_url?: string;
  avatar_url?: string;
  template_id?: TemplateId;
  accent_color?: string;
}

// Input for creating scanned cards
export interface ScannedCardInput {
  card_label: string;
  scanned_image_url: string;
}

// Multi-card storage format
export interface BusinessCardsData {
  cards: BusinessCard[];
  version: number;
}

export interface CardTemplate {
  id: TemplateId;
  name: string;
  description: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean centered layout',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Split layout with accent',
  },
  {
    id: 'gradient',
    name: 'Sage',
    description: 'Soft forest tones',
  },
];

export const DEFAULT_ACCENT_COLOR = '#28A35D';
