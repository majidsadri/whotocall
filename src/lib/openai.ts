import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractTags(context: string, cardText?: string) {
  const prompt = `You are an AI that analyzes professional contacts and generates comprehensive, searchable tags.

${cardText ? `BUSINESS CARD:\n${cardText}\n\n` : ''}
CONTEXT:\n${context}

Generate a JSON response with contact info AND rich tags for searching later.

{
  "name": "Full name",
  "email": "email if found",
  "phone": "phone if found",
  "company": "Company name",
  "role": "Job title/position",
  "location": "City, State or Country",
  "industry": "Primary industry",
  "event_type": "How we met",
  "tags": [
    // Generate 8-15 tags across these categories:

    // INDUSTRY (2-3 tags)
    // e.g., "real estate", "commercial property", "property investment"

    // EXPERTISE (2-3 tags)
    // e.g., "luxury homes", "first-time buyers", "property management"

    // ROLE TYPE (1-2 tags)
    // e.g., "broker", "agent", "investor", "founder", "executive"

    // NETWORK VALUE (1-2 tags)
    // e.g., "potential client", "referral source", "strategic partner", "mentor"

    // PERSONALITY/STYLE (1-2 tags)
    // e.g., "friendly", "detail-oriented", "fast responder", "networker"

    // INTERESTS if mentioned (1-2 tags)
    // e.g., "golf", "tech", "startups", "travel"

    // LOCATION-BASED (1-2 tags)
    // e.g., "Arizona market", "Phoenix area", "Southwest US"

    // RELATED KEYWORDS (2-3 tags)
    // Add synonyms and related terms that someone might search for
    // e.g., if "real estate" → also add "property", "housing", "realty"
  ]
}

IMPORTANT:
- Generate related/synonym tags to improve searchability
- If someone works in "real estate", also tag: property, housing, homes, realty
- If someone is an "investor", also tag: funding, capital, investment, VC
- If location is "Phoenix", also tag: Arizona, Southwest, AZ
- Make tags lowercase for consistency
- Be generous - more tags = better search results`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  // Ensure tags are lowercase and unique
  if (result.tags) {
    result.tags = Array.from(new Set(result.tags.map((t: string) => t.toLowerCase())));
  }

  return result;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export default openai;
