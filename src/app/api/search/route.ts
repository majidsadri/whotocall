import { NextRequest, NextResponse } from 'next/server';
import { searchContacts } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const searchResults = searchContacts(query);

    // Return results with scores for UI
    return NextResponse.json({
      results: searchResults.slice(0, 20).map(r => ({
        ...r.contact,
        _score: r.score,
        _matchReason: r.matchReason,
        _matchedFields: r.matchedFields,
      })),
      topScore: searchResults[0]?.score || 0,
      query,
    });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
