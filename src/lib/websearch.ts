// Web Search utilities for finding LinkedIn profiles and related info

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export interface LinkedInProfile {
  url: string;
  name?: string;
  title?: string;
  company?: string;
  imageUrl?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SearchResults {
  linkedinProfiles: LinkedInProfile[];
  webResults: WebSearchResult[];
  searchQuery: string;
}

// Search using SerpAPI (Google Search)
export async function searchWithSerpAPI(
  name: string,
  company?: string,
  location?: string
): Promise<SearchResults> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    // Fall back to constructed search without API
    return constructLinkedInSearch(name, company, location);
  }

  const searchQuery = buildSearchQuery(name, company, location);
  const linkedinQuery = `${name} ${company || ''} site:linkedin.com/in`;

  try {
    // Search for LinkedIn profiles
    const linkedinResponse = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(linkedinQuery)}&api_key=${apiKey}&num=5`
    );

    // General web search
    const webResponse = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=5`
    );

    const linkedinData = linkedinResponse.ok ? await linkedinResponse.json() : null;
    const webData = webResponse.ok ? await webResponse.json() : null;

    const linkedinProfiles: LinkedInProfile[] = [];
    const webResults: WebSearchResult[] = [];

    // Parse LinkedIn results
    if (linkedinData?.organic_results) {
      for (const result of linkedinData.organic_results) {
        if (result.link?.includes('linkedin.com/in/')) {
          linkedinProfiles.push({
            url: result.link,
            name: extractNameFromLinkedInTitle(result.title),
            title: extractTitleFromSnippet(result.snippet),
            company: company,
            confidence: calculateConfidence(result, name, company),
          });
        }
      }
    }

    // Parse web results
    if (webData?.organic_results) {
      for (const result of webData.organic_results) {
        if (!result.link?.includes('linkedin.com')) {
          webResults.push({
            title: result.title,
            link: result.link,
            snippet: result.snippet || '',
            source: extractDomain(result.link),
          });
        }
      }
    }

    return {
      linkedinProfiles,
      webResults,
      searchQuery,
    };
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return constructLinkedInSearch(name, company, location);
  }
}

// Construct LinkedIn search URLs without API (free fallback)
export function constructLinkedInSearch(
  name: string,
  company?: string,
  location?: string
): SearchResults {
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0]?.toLowerCase() || '';
  const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';

  const linkedinProfiles: LinkedInProfile[] = [];

  // Generate possible LinkedIn URL patterns
  const possibleHandles = [
    `${firstName}-${lastName}`,
    `${firstName}${lastName}`,
    `${lastName}-${firstName}`,
    `${firstName}-${lastName}-${Math.floor(Math.random() * 9)}`,
  ];

  // Create suggested profiles with Google search links
  linkedinProfiles.push({
    url: `https://www.google.com/search?q=${encodeURIComponent(`"${name}" ${company || ''} site:linkedin.com/in`)}`,
    name: name,
    title: 'Search on Google',
    company: company,
    confidence: 'medium',
  });

  // Direct LinkedIn search URL
  linkedinProfiles.push({
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${name} ${company || ''}`)}`,
    name: name,
    title: 'Search on LinkedIn',
    company: company,
    confidence: 'medium',
  });

  const searchQuery = buildSearchQuery(name, company, location);

  return {
    linkedinProfiles,
    webResults: [
      {
        title: `Search Google for "${name}"`,
        link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        snippet: `Find more information about ${name}${company ? ` at ${company}` : ''}`,
        source: 'google.com',
      },
    ],
    searchQuery,
  };
}

// Search using OpenAI to find the best LinkedIn profile
export async function findBestLinkedInProfile(
  name: string,
  company?: string,
  role?: string,
  context?: string
): Promise<LinkedInProfile | null> {
  // This constructs the most likely LinkedIn URL based on common patterns
  const nameParts = name.trim().toLowerCase().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';

  // Most common LinkedIn URL patterns
  const baseUrl = 'https://www.linkedin.com/in/';
  const possibleUrls = [
    `${baseUrl}${firstName}-${lastName}`,
    `${baseUrl}${firstName}${lastName}`,
    `${baseUrl}${lastName}${firstName}`,
  ];

  return {
    url: possibleUrls[0],
    name: name,
    title: role,
    company: company,
    confidence: 'low',
  };
}

// Helper functions
function buildSearchQuery(name: string, company?: string, location?: string): string {
  const parts = [name];
  if (company) parts.push(company);
  if (location) parts.push(location);
  return parts.join(' ');
}

function extractNameFromLinkedInTitle(title: string): string {
  // LinkedIn titles usually are "Name - Title - Company | LinkedIn"
  if (!title) return '';
  const parts = title.split(' - ');
  return parts[0]?.replace(' | LinkedIn', '').trim() || '';
}

function extractTitleFromSnippet(snippet: string): string {
  if (!snippet) return '';
  // Try to extract job title from snippet
  const match = snippet.match(/(?:is a|as|works as)\s+([^.]+)/i);
  return match?.[1]?.trim() || '';
}

function calculateConfidence(
  result: { title?: string; snippet?: string },
  name: string,
  company?: string
): 'high' | 'medium' | 'low' {
  let score = 0;
  const title = result.title?.toLowerCase() || '';
  const snippet = result.snippet?.toLowerCase() || '';
  const nameLower = name.toLowerCase();
  const companyLower = company?.toLowerCase() || '';

  // Check if name appears in title
  if (title.includes(nameLower)) score += 3;

  // Check name parts
  const nameParts = nameLower.split(' ');
  for (const part of nameParts) {
    if (part.length > 2 && title.includes(part)) score += 1;
  }

  // Check company
  if (companyLower && (title.includes(companyLower) || snippet.includes(companyLower))) {
    score += 2;
  }

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}
