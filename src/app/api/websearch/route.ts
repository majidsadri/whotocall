import { NextRequest, NextResponse } from 'next/server';
import { runContactSearchAgent } from '@/lib/agent';
import { searchWithSerpAPI } from '@/lib/websearch';

export async function POST(request: NextRequest) {
  try {
    const { name, company, location, role, context, useAgent = true } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required for web search' },
        { status: 400 }
      );
    }

    // Use LangGraph agent for intelligent search
    if (useAgent && process.env.OPENAI_API_KEY) {
      try {
        const agentResult = await runContactSearchAgent({
          name,
          company,
          role,
          location,
          context,
        });

        return NextResponse.json({
          success: true,
          linkedinProfiles: agentResult.linkedinProfiles.map(p => ({
            url: p.url,
            name: p.name,
            title: p.title,
            company: p.company,
            confidence: p.confidence,
            reason: p.reason,
          })),
          webResults: agentResult.webResults.map(r => ({
            title: r.title,
            link: r.link,
            snippet: r.snippet,
            source: r.source,
          })),
          bestMatch: agentResult.bestMatch,
          confidence: agentResult.confidence,
          summary: agentResult.summary,
          searchQueries: agentResult.searchQueries,
          source: 'agent',
        });
      } catch (agentError) {
        console.error('Agent error, falling back to simple search:', agentError);
        // Fall through to simple search
      }
    }

    // Fallback: Try SerpAPI or constructed search
    const results = await searchWithSerpAPI(name, company, location);

    // Add role context to LinkedIn profiles
    if (role && results.linkedinProfiles.length > 0) {
      results.linkedinProfiles = results.linkedinProfiles.map(profile => ({
        ...profile,
        title: profile.title || role,
      }));
    }

    return NextResponse.json({
      success: true,
      ...results,
      source: 'simple',
    });
  } catch (err: any) {
    console.error('Web search error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to perform web search' },
      { status: 500 }
    );
  }
}
