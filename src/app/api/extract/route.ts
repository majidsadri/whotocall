import { NextRequest, NextResponse } from 'next/server';
import { extractTags } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { context, cardText } = await request.json();

    if (!context && !cardText) {
      return NextResponse.json(
        { error: 'Context or card text is required' },
        { status: 400 }
      );
    }

    const extractedData = await extractTags(context || '', cardText);

    return NextResponse.json(extractedData);
  } catch (err) {
    console.error('Extract API error:', err);
    return NextResponse.json(
      { error: 'Failed to extract tags' },
      { status: 500 }
    );
  }
}
