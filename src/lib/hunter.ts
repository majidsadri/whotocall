// Hunter.io API integration for contact enrichment
// Sign up at https://hunter.io/ - Free tier: 25 searches/month

export interface HunterPerson {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  position: string;
  seniority: string;
  department: string;
  linkedin: string;
  twitter: string;
  phone_number: string;
  company: string;
  sources: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
  }>;
}

export interface HunterCompany {
  domain: string;
  company: string;
  industry: string;
  type: string;
  size: string;
  country: string;
  city: string;
  state: string;
  linkedin: string;
  twitter: string;
  facebook: string;
}

export interface EnrichmentResult {
  person: HunterPerson | null;
  company: HunterCompany | null;
  linkedin_url: string | null;
  error?: string;
}

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

// Find email and person info by name and company domain
export async function findPerson(
  firstName: string,
  lastName: string,
  domain: string
): Promise<EnrichmentResult> {
  if (!HUNTER_API_KEY) {
    return { person: null, company: null, linkedin_url: null, error: 'Hunter.io API key not configured' };
  }

  try {
    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: HUNTER_API_KEY,
    });

    const response = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      return { person: null, company: null, linkedin_url: null, error: errorData.errors?.[0]?.details || 'API error' };
    }

    const data = await response.json();

    if (data.data) {
      const person: HunterPerson = {
        first_name: data.data.first_name || firstName,
        last_name: data.data.last_name || lastName,
        full_name: `${data.data.first_name || firstName} ${data.data.last_name || lastName}`,
        email: data.data.email || '',
        position: data.data.position || '',
        seniority: data.data.seniority || '',
        department: data.data.department || '',
        linkedin: data.data.linkedin_url || '',
        twitter: data.data.twitter || '',
        phone_number: data.data.phone_number || '',
        company: data.data.company || '',
        sources: data.data.sources || [],
      };

      return {
        person,
        company: null,
        linkedin_url: data.data.linkedin_url || null,
      };
    }

    return { person: null, company: null, linkedin_url: null, error: 'Person not found' };
  } catch (err: any) {
    return { person: null, company: null, linkedin_url: null, error: err.message };
  }
}

// Get company info by domain
export async function getCompanyInfo(domain: string): Promise<HunterCompany | null> {
  if (!HUNTER_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      domain,
      api_key: HUNTER_API_KEY,
    });

    const response = await fetch(`https://api.hunter.io/v2/domain-search?${params}`);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.data) {
      return {
        domain: data.data.domain || domain,
        company: data.data.organization || '',
        industry: data.data.industry || '',
        type: data.data.type || '',
        size: data.data.size || '',
        country: data.data.country || '',
        city: data.data.city || '',
        state: data.data.state || '',
        linkedin: data.data.linkedin || '',
        twitter: data.data.twitter || '',
        facebook: data.data.facebook || '',
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Search by full name and company name (tries to find domain first)
export async function searchByNameAndCompany(
  fullName: string,
  companyName?: string
): Promise<EnrichmentResult> {
  if (!HUNTER_API_KEY) {
    return { person: null, company: null, linkedin_url: null, error: 'Hunter.io API key not configured' };
  }

  // Parse name
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  if (!companyName) {
    return { person: null, company: null, linkedin_url: null, error: 'Company name required for search' };
  }

  try {
    // First, try to find company domain
    const domainParams = new URLSearchParams({
      company: companyName,
      api_key: HUNTER_API_KEY,
    });

    const domainResponse = await fetch(`https://api.hunter.io/v2/domain-search?${domainParams}`);

    if (domainResponse.ok) {
      const domainData = await domainResponse.json();

      if (domainData.data?.domain) {
        // Get company info
        const company = await getCompanyInfo(domainData.data.domain);

        // Now search for the person
        const personResult = await findPerson(firstName, lastName, domainData.data.domain);

        return {
          person: personResult.person,
          company,
          linkedin_url: personResult.linkedin_url,
          error: personResult.error,
        };
      }
    }

    return { person: null, company: null, linkedin_url: null, error: 'Could not find company domain' };
  } catch (err: any) {
    return { person: null, company: null, linkedin_url: null, error: err.message };
  }
}

// Enrich by email
export async function enrichByEmail(email: string): Promise<EnrichmentResult> {
  if (!HUNTER_API_KEY) {
    return { person: null, company: null, linkedin_url: null, error: 'Hunter.io API key not configured' };
  }

  try {
    // Verify email and get info
    const params = new URLSearchParams({
      email,
      api_key: HUNTER_API_KEY,
    });

    const response = await fetch(`https://api.hunter.io/v2/email-verifier?${params}`);

    if (!response.ok) {
      return { person: null, company: null, linkedin_url: null, error: 'Email verification failed' };
    }

    const data = await response.json();

    // Extract domain from email for company lookup
    const domain = email.split('@')[1];
    let company: HunterCompany | null = null;

    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
      company = await getCompanyInfo(domain);
    }

    const person: HunterPerson = {
      first_name: data.data?.first_name || '',
      last_name: data.data?.last_name || '',
      full_name: data.data?.full_name || '',
      email: email,
      position: '',
      seniority: '',
      department: '',
      linkedin: '',
      twitter: '',
      phone_number: '',
      company: company?.company || '',
      sources: data.data?.sources || [],
    };

    return {
      person,
      company,
      linkedin_url: null,
    };
  } catch (err: any) {
    return { person: null, company: null, linkedin_url: null, error: err.message };
  }
}
