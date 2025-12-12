import { NextRequest, NextResponse } from 'next/server';
import { runVoiceSearchAgent } from '@/lib/searchAgent';
import { getContacts } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { query, useAgent = true } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get all contacts
    const contacts = getContacts();

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        explanation: "You don't have any contacts yet. Add some contacts first!",
        suggestedFollowUp: "Go to 'Add Contact' to start building your network.",
        source: 'empty',
      });
    }

    // Use LangGraph agent for intelligent search
    if (useAgent && process.env.OPENAI_API_KEY) {
      try {
        const agentResult = await runVoiceSearchAgent(query, contacts);

        return NextResponse.json({
          success: true,
          results: agentResult.results,
          explanation: agentResult.explanation,
          suggestedFollowUp: agentResult.suggestedFollowUp,
          parsedIntent: agentResult.parsedIntent,
          totalMatches: agentResult.totalMatches,
          topScore: agentResult.results[0]?._score || 0,
          source: 'agent',
        });
      } catch (agentError) {
        console.error('Voice search agent error:', agentError);
        // Fall through to simple search
      }
    }

    // Fallback: Simple keyword search
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter((w: string) => w.length > 2);

    const results = contacts
      .map(contact => {
        let score = 0;
        const matchedFields: string[] = [];

        // Search in various fields
        if (contact.name.toLowerCase().includes(queryLower)) {
          score += 5;
          matchedFields.push('Name');
        }
        if (contact.company?.toLowerCase().includes(queryLower)) {
          score += 3;
          matchedFields.push('Company');
        }
        if (contact.role?.toLowerCase().includes(queryLower)) {
          score += 2;
          matchedFields.push('Role');
        }
        if (contact.industry?.toLowerCase().includes(queryLower)) {
          score += 2;
          matchedFields.push('Industry');
        }

        // Keyword matching
        for (const kw of keywords) {
          if (contact.name.toLowerCase().includes(kw)) score += 1;
          if (contact.company?.toLowerCase().includes(kw)) score += 1;
          if (contact.tags?.some(t => t.toLowerCase().includes(kw))) {
            score += 1;
            if (!matchedFields.includes('Tags')) matchedFields.push('Tags');
          }
        }

        return {
          ...contact,
          _score: score,
          _matchReason: matchedFields.join(', '),
          _matchedFields: matchedFields,
        };
      })
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      results,
      explanation: results.length > 0
        ? `Found ${results.length} contact${results.length > 1 ? 's' : ''} matching "${query}"`
        : `No contacts found for "${query}"`,
      topScore: results[0]?._score || 0,
      source: 'simple',
    });
  } catch (err: any) {
    console.error('Voice search error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to search contacts' },
      { status: 500 }
    );
  }
}
