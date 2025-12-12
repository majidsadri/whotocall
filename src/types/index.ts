export interface Contact {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  linkedin_url?: string;
  card_image_url?: string;

  // Extracted tags
  location?: string;
  industry?: string;
  event_type?: string;
  met_date?: string;
  meeting_location?: string;
  tags: string[];

  // Context
  raw_context?: string;

  // Priority (0-100)
  priority?: number;

  // Enrichment data from Clearbit
  enrichment?: ContactEnrichment;

  created_at: string;
}

export interface ContactEnrichment {
  avatar?: string;
  bio?: string;
  linkedin_handle?: string;
  twitter_handle?: string;
  employment?: {
    title?: string;
    role?: string;
    seniority?: string;
  };
  company_info?: {
    name?: string;
    domain?: string;
    logo?: string;
    description?: string;
    location?: string;
    employees_range?: string;
    industry?: string;
    sector?: string;
    linkedin_handle?: string;
    twitter_handle?: string;
    tags?: string[];
  };
  enriched_at?: string;
}

export interface ExtractedTags {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  location?: string;
  industry?: string;
  event_type?: string;
  tags: string[];
}

export interface SearchResult {
  contact: Contact;
  score: number;
  matchReason: string;
}
