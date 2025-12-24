import { Contact, ExtractedTags, SearchResult } from '../types';

// Configure base URL
// Development: localhost, Production: EC2 server
const BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'http://18.215.164.114:8080';

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
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
