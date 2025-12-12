import { NextRequest, NextResponse } from 'next/server';
import { getContactById, updateContact, deleteContact } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a single contact by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const contact = getContactById(id);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PUT - Update a contact
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove id and created_at from updates to prevent overwriting
    const { id: _, created_at: __, ...updates } = body;

    const contact = updateContact(id, updates);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, contact });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = deleteContact(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
