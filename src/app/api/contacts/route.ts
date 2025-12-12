import { NextRequest, NextResponse } from 'next/server';
import { getContacts, saveContact } from '@/lib/storage';

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      role,
      linkedin_url,
      location,
      industry,
      event_type,
      tags = [],
      raw_context,
      card_image_url,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const contact = saveContact({
      name,
      email,
      phone,
      company,
      role,
      linkedin_url,
      location,
      industry,
      event_type,
      met_date: new Date().toISOString().split('T')[0],
      tags,
      raw_context,
      card_image_url,
    });

    return NextResponse.json({ success: true, contact });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to save contact' },
      { status: 500 }
    );
  }
}

// GET - Retrieve all contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '50');

    let contacts = getContacts();

    // Apply filters
    if (industry) {
      contacts = contacts.filter((c) =>
        c.industry?.toLowerCase().includes(industry.toLowerCase())
      );
    }

    if (location) {
      contacts = contacts.filter((c) =>
        c.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply limit
    contacts = contacts.slice(0, limit);

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
