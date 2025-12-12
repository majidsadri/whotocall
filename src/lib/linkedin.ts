// LinkedIn integration utilities

export interface LinkedInProfile {
  name: string;
  headline?: string;
  company?: string;
  role?: string;
  location?: string;
  industry?: string;
  profilePicUrl?: string;
  linkedinUrl: string;
}

// Extract username from LinkedIn URL
export function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([\w-]+)/);
  return match ? match[1] : null;
}

// Validate LinkedIn URL format
export function isValidLinkedInUrl(url: string): boolean {
  const regex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
  return regex.test(url);
}

// Generate LinkedIn profile URL from username
export function getLinkedInProfileUrl(username: string): string {
  return `https://www.linkedin.com/in/${username}`;
}

// Parse LinkedIn profile from Proxycurl response
export function parseProxycurlResponse(data: any): LinkedInProfile {
  return {
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    headline: data.headline,
    company: data.experiences?.[0]?.company,
    role: data.experiences?.[0]?.title,
    location: data.city || data.state || data.country_full_name,
    industry: data.industry,
    profilePicUrl: data.profile_pic_url,
    linkedinUrl: data.public_identifier
      ? getLinkedInProfileUrl(data.public_identifier)
      : '',
  };
}

// Import contacts from LinkedIn (requires OAuth)
export async function importFromLinkedIn(accessToken: string): Promise<LinkedInProfile[]> {
  // This would use LinkedIn's Connections API
  // Requires specific LinkedIn partner permissions
  throw new Error('LinkedIn import requires partner API access');
}
