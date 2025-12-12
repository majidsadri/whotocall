import { NextRequest, NextResponse } from 'next/server';
import { enrichByEmail, searchByNameAndCompany } from '@/lib/hunter';
import { getContacts, updateContact } from '@/lib/storage';
import type { ContactEnrichment } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { contactId, email, name, company } = await request.json();

    let result;

    // Try email first if available
    if (email) {
      result = await enrichByEmail(email);
    } else if (name && company) {
      // Fall back to name + company search
      result = await searchByNameAndCompany(name, company);
    } else if (name) {
      return NextResponse.json(
        { error: 'Company name required for search (Hunter.io needs company domain)' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: 'Email or name+company required for enrichment' },
        { status: 400 }
      );
    }

    if (result.error && !result.person && !result.company) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    // Transform to our enrichment format
    const enrichment: ContactEnrichment = {
      enriched_at: new Date().toISOString(),
    };

    if (result.person) {
      enrichment.linkedin_handle = result.person.linkedin?.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '').replace(/\/$/, '');
      enrichment.twitter_handle = result.person.twitter?.replace('https://twitter.com/', '').replace('@', '');
      enrichment.employment = {
        title: result.person.position,
        role: result.person.department,
        seniority: result.person.seniority,
      };
    }

    if (result.company) {
      enrichment.company_info = {
        name: result.company.company,
        domain: result.company.domain,
        description: `${result.company.industry} company in ${result.company.city || result.company.country}`,
        location: [result.company.city, result.company.state, result.company.country].filter(Boolean).join(', '),
        employees_range: result.company.size,
        industry: result.company.industry,
        sector: result.company.type,
        linkedin_handle: result.company.linkedin?.replace('https://www.linkedin.com/company/', '').replace(/\/$/, ''),
        twitter_handle: result.company.twitter?.replace('https://twitter.com/', '').replace('@', ''),
      };
    }

    // If contactId provided, update the contact with enrichment
    if (contactId) {
      const contacts = getContacts();
      const contact = contacts.find(c => c.id === contactId);

      if (contact) {
        // Update LinkedIn URL if we found one
        const linkedinUrl = result.linkedin_url ||
          (result.person?.linkedin ? result.person.linkedin : contact.linkedin_url);

        updateContact(contactId, {
          enrichment,
          linkedin_url: linkedinUrl,
          // Update other fields if missing
          email: contact.email || result.person?.email,
          company: contact.company || enrichment.company_info?.name,
          role: contact.role || enrichment.employment?.title,
          location: contact.location || enrichment.company_info?.location,
          industry: contact.industry || enrichment.company_info?.industry,
        });
      }
    }

    return NextResponse.json({
      success: true,
      enrichment,
      linkedin_url: result.linkedin_url || result.person?.linkedin,
    });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to enrich contact' },
      { status: 500 }
    );
  }
}
