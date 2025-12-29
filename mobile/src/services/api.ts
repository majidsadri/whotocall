import { Contact, ExtractedTags, SearchResult, BusinessCard, BusinessCardInput } from '../types';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BUSINESS_CARD_STORAGE_KEY = '@business_card';

// Configure base URL - Always use EC2 so Simulator and iPhone share the same database
const BASE_URL = 'http://18.215.164.114:8080';

// Get auth headers from Supabase session
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  return {};
}

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Helper for multipart form data requests
async function apiFormRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      ...authHeaders,
    },
    // Don't set Content-Type header - fetch will set it with boundary
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Contact APIs
export async function getContacts(filters?: {
  industry?: string;
  location?: string;
  limit?: number;
}): Promise<{ contacts: Contact[] }> {
  const params = new URLSearchParams();
  if (filters?.industry) params.append('industry', filters.industry);
  if (filters?.location) params.append('location', filters.location);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/contacts${query}`);
}

export async function createContact(contact: Partial<Contact>): Promise<{ success: boolean; contact: Contact }> {
  return apiRequest('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

export async function getContact(id: string): Promise<{ contact: Contact }> {
  return apiRequest(`/api/contacts/${id}`);
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<{ success: boolean; contact: Contact }> {
  return apiRequest(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteContact(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/contacts/${id}`, {
    method: 'DELETE',
  });
}

// Search APIs
export async function searchContacts(query: string): Promise<{
  results: SearchResult[];
  topScore: number;
  query: string;
}> {
  return apiRequest('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function voiceSearch(query: string, useAgent: boolean = true): Promise<{
  success: boolean;
  results: Contact[];
  explanation?: string;
  suggestedFollowUp?: string;
  source: 'agent' | 'simple';
}> {
  return apiRequest('/api/voice-search', {
    method: 'POST',
    body: JSON.stringify({ query, useAgent }),
  });
}

// OCR API - Business card text extraction
export async function extractCardText(imageUri: string): Promise<{ text: string }> {
  const formData = new FormData();

  // Create file object from URI
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  return apiFormRequest('/api/ocr', formData);
}

// Transcription API - Audio to text
export async function transcribeAudio(audioUri: string): Promise<{ text: string; success: boolean }> {
  const formData = new FormData();

  const filename = audioUri.split('/').pop() || 'recording.m4a';

  formData.append('audio', {
    uri: audioUri,
    name: filename,
    type: 'audio/m4a',
  } as any);

  return apiFormRequest('/api/transcribe', formData);
}

// Tag extraction API
export async function extractTags(context: string, cardText?: string): Promise<ExtractedTags> {
  return apiRequest('/api/extract', {
    method: 'POST',
    body: JSON.stringify({ context, cardText }),
  });
}

// Enrichment API
export async function enrichContact(params: {
  contactId?: string;
  email?: string;
  name?: string;
  company?: string;
}): Promise<{
  success: boolean;
  enrichment: Contact['enrichment'];
  linkedin_url?: string;
}> {
  return apiRequest('/api/enrich', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Get current user info
export async function getCurrentUser(): Promise<{ authenticated: boolean; user_id: string | null }> {
  return apiRequest('/api/me');
}

// Migrate contacts to current user's account
export async function migrateContacts(): Promise<{
  success: boolean;
  message: string;
  migrated: number;
  total_contacts: number;
}> {
  return apiRequest('/api/migrate-contacts', { method: 'POST' });
}

// User preferences API
export async function getPreferences(): Promise<{
  industry: string | null;
  custom_tags: string[];
  suggested_tags: string[];
}> {
  return apiRequest('/api/preferences');
}

export async function updatePreferences(preferences: {
  industry?: string;
  custom_tags?: string[];
}): Promise<{
  success: boolean;
  preferences: {
    industry: string | null;
    custom_tags: string[];
    suggested_tags: string[];
  };
}> {
  return apiRequest('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

// Tags API
export async function getAllTags(): Promise<{
  tags: Array<{
    tag: string;
    count: number;
    source: 'custom' | 'suggested' | 'contact' | 'default';
  }>;
}> {
  return apiRequest('/api/tags');
}

export async function addCustomTag(tag: string): Promise<{
  success: boolean;
  custom_tags: string[];
}> {
  return apiRequest('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ tag }),
  });
}

export async function deleteCustomTag(tagName: string): Promise<{
  success: boolean;
  custom_tags: string[];
}> {
  return apiRequest(`/api/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
}

// Industries API
export async function getIndustries(): Promise<{
  industries: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}> {
  return apiRequest('/api/industries');
}

// Web search API
export async function webSearch(params: {
  name: string;
  company?: string;
  location?: string;
  role?: string;
  context?: string;
  useAgent?: boolean;
}): Promise<{
  success: boolean;
  linkedinProfiles: Array<{
    url: string;
    name: string;
    title?: string;
    company?: string;
    confidence: 'high' | 'medium' | 'low';
    reason?: string;
  }>;
  webResults: Array<{
    title: string;
    link: string;
    snippet?: string;
    source?: string;
  }>;
  summary?: string;
  confidence?: 'high' | 'medium' | 'low';
  source: 'agent' | 'simple';
}> {
  return apiRequest('/api/websearch', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Business Card APIs
export async function getBusinessCard(): Promise<{ card: BusinessCard | null }> {
  try {
    // Try API first
    return await apiRequest('/api/business-card');
  } catch (error) {
    // Fallback to local storage
    console.log('API unavailable, using local storage for business card');
    const stored = await AsyncStorage.getItem(BUSINESS_CARD_STORAGE_KEY);
    if (stored) {
      return { card: JSON.parse(stored) };
    }
    return { card: null };
  }
}

export async function saveBusinessCard(card: BusinessCardInput): Promise<{
  success: boolean;
  card: BusinessCard;
}> {
  try {
    // Try API first
    return await apiRequest('/api/business-card', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  } catch (error) {
    // Fallback to local storage
    console.log('API unavailable, saving business card locally');
    const { data: { user } } = await supabase.auth.getUser();

    const savedCard: BusinessCard = {
      id: 'local-' + Date.now(),
      user_id: user?.id || 'anonymous',
      full_name: card.full_name,
      email: card.email,
      phone: card.phone,
      title: card.title,
      company: card.company,
      website: card.website,
      linkedin_url: card.linkedin_url,
      avatar_url: card.avatar_url,
      template_id: card.template_id,
      accent_color: card.accent_color,
      share_slug: user?.id || card.full_name.toLowerCase().replace(/\s+/g, '-'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(BUSINESS_CARD_STORAGE_KEY, JSON.stringify(savedCard));
    return { success: true, card: savedCard };
  }
}

export async function uploadCardAvatar(imageUri: string): Promise<{
  success: boolean;
  avatar_url: string;
}> {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    return await apiFormRequest('/api/business-card/avatar', formData);
  } catch (error) {
    // Fallback: use local URI (works for preview, but not for sharing)
    console.log('API unavailable, using local image URI');
    return { success: true, avatar_url: imageUri };
  }
}

export async function getVCard(): Promise<string> {
  try {
    const url = `${BASE_URL}/api/business-card/vcard`;
    const authHeaders = await getAuthHeaders();

    const response = await fetch(url, {
      headers: {
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate vCard');
    }

    return response.text();
  } catch (error) {
    // Generate vCard locally from stored card
    const stored = await AsyncStorage.getItem(BUSINESS_CARD_STORAGE_KEY);
    if (stored) {
      const card = JSON.parse(stored) as BusinessCard;
      return generateLocalVCard(card);
    }
    throw new Error('No card data available');
  }
}

// Generate vCard locally
function generateLocalVCard(card: BusinessCard): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.full_name}`,
    `N:${card.full_name.split(' ').reverse().join(';')};;;`,
  ];

  if (card.email) lines.push(`EMAIL:${card.email}`);
  if (card.phone) lines.push(`TEL:${card.phone}`);
  if (card.title) lines.push(`TITLE:${card.title}`);
  if (card.company) lines.push(`ORG:${card.company}`);
  if (card.website) lines.push(`URL:${card.website}`);
  if (card.linkedin_url) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin_url}`);

  lines.push('END:VCARD');
  return lines.join('\n');
}

export function getShareUrl(shareSlug: string): string {
  return `${BASE_URL}/card/${shareSlug}`;
}
