import fs from 'fs';
import path from 'path';
import type { Contact } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'contacts.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ contacts: [] }, null, 2));
  }
}

export function getContacts(): Contact[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.contacts || [];
  } catch (err) {
    console.error('Error reading contacts:', err);
    return [];
  }
}

export function saveContact(contact: Omit<Contact, 'id' | 'created_at'>): Contact {
  ensureDataDir();
  const contacts = getContacts();

  const newContact: Contact = {
    ...contact,
    id: generateId(),
    created_at: new Date().toISOString(),
    tags: contact.tags || [],
  };

  contacts.unshift(newContact); // Add to beginning

  fs.writeFileSync(DATA_FILE, JSON.stringify({ contacts }, null, 2));

  return newContact;
}

export function updateContact(id: string, updates: Partial<Contact>): Contact | null {
  ensureDataDir();
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.id === id);

  if (index === -1) return null;

  contacts[index] = { ...contacts[index], ...updates };
  fs.writeFileSync(DATA_FILE, JSON.stringify({ contacts }, null, 2));

  return contacts[index];
}

export interface SearchResultWithScore {
  contact: Contact;
  score: number;
  matchedFields: string[];
  matchReason: string;
}

export function searchContacts(query: string): SearchResultWithScore[] {
  const contacts = getContacts();
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Check for time-based filters
  let timeFilter: Date | null = null;
  if (query.toLowerCase().includes('last month')) {
    timeFilter = new Date();
    timeFilter.setMonth(timeFilter.getMonth() - 1);
  } else if (query.toLowerCase().includes('last week')) {
    timeFilter = new Date();
    timeFilter.setDate(timeFilter.getDate() - 7);
  }

  return contacts
    .map((contact) => {
      const matchedFields: string[] = [];
      let score = 0;

      // Check each field with weighted scoring
      const fieldWeights: { field: string; value: string | undefined; weight: number }[] = [
        { field: 'name', value: contact.name, weight: 3 },
        { field: 'company', value: contact.company, weight: 2 },
        { field: 'role', value: contact.role, weight: 2 },
        { field: 'industry', value: contact.industry, weight: 1.5 },
        { field: 'location', value: contact.location, weight: 1 },
        { field: 'meeting_location', value: contact.meeting_location, weight: 1 },
        { field: 'event_type', value: contact.event_type, weight: 1 },
        { field: 'notes', value: contact.raw_context, weight: 0.5 },
      ];

      fieldWeights.forEach(({ field, value, weight }) => {
        if (value) {
          const lowerValue = value.toLowerCase();
          const matches = searchTerms.filter(term => lowerValue.includes(term));
          if (matches.length > 0) {
            score += matches.length * weight;
            matchedFields.push(field);
          }
        }
      });

      // Check tags with bonus for exact matches
      (contact.tags || []).forEach(tag => {
        const lowerTag = tag.toLowerCase();
        searchTerms.forEach(term => {
          if (lowerTag === term) {
            score += 2; // Exact tag match
            if (!matchedFields.includes('tags')) matchedFields.push('tags');
          } else if (lowerTag.includes(term)) {
            score += 1;
            if (!matchedFields.includes('tags')) matchedFields.push('tags');
          }
        });
      });

      // Generate match reason
      let matchReason = '';
      if (matchedFields.length > 0) {
        const fieldLabels: { [key: string]: string } = {
          name: 'Name',
          company: 'Company',
          role: 'Role',
          industry: 'Industry',
          location: 'Location',
          meeting_location: 'Met at',
          event_type: 'Event',
          notes: 'Notes',
          tags: 'Tags',
        };
        matchReason = matchedFields.map(f => fieldLabels[f] || f).join(', ');
      }

      return { contact, score, matchedFields, matchReason };
    })
    .filter(({ contact, score }) => {
      // Filter by score
      if (score === 0) return false;

      // Filter by time if applicable
      if (timeFilter && contact.created_at) {
        const contactDate = new Date(contact.met_date || contact.created_at);
        if (contactDate < timeFilter) return false;
      }

      return true;
    })
    .sort((a, b) => b.score - a.score);
}

function generateId(): string {
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
