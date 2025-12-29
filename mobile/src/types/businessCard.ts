export type TemplateId = 'classic' | 'modern' | 'gradient';

export interface BusinessCard {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  linkedin_url?: string;
  avatar_url?: string;
  template_id: TemplateId;
  accent_color: string;
  share_slug: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessCardInput {
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
    name: 'Gradient',
    description: 'Purple to cyan gradient',
  },
];

export const DEFAULT_ACCENT_COLOR = '#7C3AED';
