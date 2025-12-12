import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import type { Contact } from "@/types";

// Define the state for voice search agent
const VoiceSearchState = Annotation.Root({
  // Input
  voiceQuery: Annotation<string>,
  contacts: Annotation<Contact[]>({
    reducer: (_, y) => y,
    default: () => []
  }),

  // Processing
  parsedIntent: Annotation<SearchIntent>({
    reducer: (_, y) => y,
    default: () => ({ type: "general", keywords: [], filters: {}, originalQuery: "" })
  }),
  scoredContacts: Annotation<ScoredContact[]>({
    reducer: (_, y) => y,
    default: () => []
  }),

  // Output
  bestMatches: Annotation<ScoredContact[]>({
    reducer: (_, y) => y,
    default: () => []
  }),
  explanation: Annotation<string>({
    reducer: (_, y) => y,
    default: () => ""
  }),
  suggestedFollowUp: Annotation<string>({
    reducer: (_, y) => y,
    default: () => ""
  }),
});

interface SearchIntent {
  type: "name" | "company" | "industry" | "location" | "time" | "general";
  keywords: string[];
  filters: {
    name?: string;
    company?: string;
    industry?: string;
    location?: string;
    timeframe?: string;
    priority?: "high" | "medium" | "low";
  };
  originalQuery: string;
}

interface ScoredContact {
  contact: Contact;
  score: number;
  matchReasons: string[];
  relevance: "high" | "medium" | "low";
}

// Create the LLM
function getLLM() {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// Node 1: Parse the voice query to understand intent
async function parseVoiceQuery(state: typeof VoiceSearchState.State) {
  const llm = getLLM();

  const prompt = `Analyze this voice search query for finding a contact and extract the search intent.

Voice Query: "${state.voiceQuery}"

Extract:
1. Search type: "name" (looking for specific person), "company" (looking by company), "industry" (by industry/field), "location" (by place), "time" (recently met), or "general"
2. Keywords to search for
3. Specific filters if mentioned (name, company, industry, location, timeframe like "last week", priority)

Return JSON:
{
  "type": "name|company|industry|location|time|general",
  "keywords": ["keyword1", "keyword2"],
  "filters": {
    "name": "optional name",
    "company": "optional company",
    "industry": "optional industry",
    "location": "optional location",
    "timeframe": "optional timeframe",
    "priority": "optional high|medium|low"
  },
  "originalQuery": "the original query"
}`;

  const response = await llm.invoke(prompt);
  const content = response.content as string;

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
    return {
      parsedIntent: {
        ...parsed,
        originalQuery: state.voiceQuery,
      },
    };
  } catch {
    return {
      parsedIntent: {
        type: "general" as const,
        keywords: state.voiceQuery.toLowerCase().split(" ").filter(w => w.length > 2),
        filters: {},
        originalQuery: state.voiceQuery,
      },
    };
  }
}

// Node 2: Score contacts based on parsed intent
async function scoreContacts(state: typeof VoiceSearchState.State) {
  const { parsedIntent, contacts } = state;
  const scoredContacts: ScoredContact[] = [];

  for (const contact of contacts) {
    let score = 0;
    const matchReasons: string[] = [];

    // Score based on name match
    if (parsedIntent.filters.name) {
      const nameMatch = contact.name.toLowerCase().includes(parsedIntent.filters.name.toLowerCase());
      if (nameMatch) {
        score += 10;
        matchReasons.push("Name match");
      }
    }

    // Score based on company match
    if (parsedIntent.filters.company && contact.company) {
      const companyMatch = contact.company.toLowerCase().includes(parsedIntent.filters.company.toLowerCase());
      if (companyMatch) {
        score += 8;
        matchReasons.push("Company match");
      }
    }

    // Score based on industry match
    if (parsedIntent.filters.industry && contact.industry) {
      const industryMatch = contact.industry.toLowerCase().includes(parsedIntent.filters.industry.toLowerCase());
      if (industryMatch) {
        score += 6;
        matchReasons.push("Industry match");
      }
    }

    // Score based on location match
    if (parsedIntent.filters.location) {
      const locationMatch =
        contact.location?.toLowerCase().includes(parsedIntent.filters.location.toLowerCase()) ||
        contact.meeting_location?.toLowerCase().includes(parsedIntent.filters.location.toLowerCase());
      if (locationMatch) {
        score += 5;
        matchReasons.push("Location match");
      }
    }

    // Score based on timeframe
    if (parsedIntent.filters.timeframe && contact.met_date) {
      const metDate = new Date(contact.met_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - metDate.getTime()) / (1000 * 60 * 60 * 24));

      const timeframe = parsedIntent.filters.timeframe.toLowerCase();
      let timeMatch = false;

      if ((timeframe.includes("today") || timeframe.includes("just")) && daysDiff === 0) {
        timeMatch = true;
      } else if ((timeframe.includes("yesterday") || timeframe.includes("recent")) && daysDiff <= 1) {
        timeMatch = true;
      } else if (timeframe.includes("week") && daysDiff <= 7) {
        timeMatch = true;
      } else if (timeframe.includes("month") && daysDiff <= 30) {
        timeMatch = true;
      }

      if (timeMatch) {
        score += 7;
        matchReasons.push("Recent meeting");
      }
    }

    // Score based on priority
    if (parsedIntent.filters.priority && contact.priority !== undefined) {
      const priorityValue = contact.priority;
      let priorityMatch = false;

      if (parsedIntent.filters.priority === "high" && priorityValue >= 67) {
        priorityMatch = true;
      } else if (parsedIntent.filters.priority === "medium" && priorityValue >= 34 && priorityValue < 67) {
        priorityMatch = true;
      } else if (parsedIntent.filters.priority === "low" && priorityValue < 34) {
        priorityMatch = true;
      }

      if (priorityMatch) {
        score += 4;
        matchReasons.push("Priority match");
      }
    }

    // Score based on keyword matches in various fields
    for (const keyword of parsedIntent.keywords) {
      const kw = keyword.toLowerCase();

      if (contact.name.toLowerCase().includes(kw)) {
        score += 3;
        if (!matchReasons.includes("Name contains keyword")) matchReasons.push("Name contains keyword");
      }
      if (contact.company?.toLowerCase().includes(kw)) {
        score += 2;
        if (!matchReasons.includes("Company contains keyword")) matchReasons.push("Company contains keyword");
      }
      if (contact.role?.toLowerCase().includes(kw)) {
        score += 2;
        if (!matchReasons.includes("Role match")) matchReasons.push("Role match");
      }
      if (contact.industry?.toLowerCase().includes(kw)) {
        score += 2;
        if (!matchReasons.includes("Industry contains keyword")) matchReasons.push("Industry contains keyword");
      }
      if (contact.tags?.some(tag => tag.toLowerCase().includes(kw))) {
        score += 2;
        if (!matchReasons.includes("Tag match")) matchReasons.push("Tag match");
      }
      if (contact.raw_context?.toLowerCase().includes(kw)) {
        score += 1;
        if (!matchReasons.includes("Context match")) matchReasons.push("Context match");
      }
    }

    // Only include contacts with some match
    if (score > 0) {
      scoredContacts.push({
        contact,
        score,
        matchReasons,
        relevance: score >= 8 ? "high" : score >= 4 ? "medium" : "low",
      });
    }
  }

  // Sort by score descending
  scoredContacts.sort((a, b) => b.score - a.score);

  return { scoredContacts };
}

// Node 3: Generate explanation and select best matches
async function generateResults(state: typeof VoiceSearchState.State) {
  const llm = getLLM();
  const { scoredContacts, parsedIntent } = state;

  // Take top 10 matches
  const bestMatches = scoredContacts.slice(0, 10);

  if (bestMatches.length === 0) {
    return {
      bestMatches: [],
      explanation: `I couldn't find any contacts matching "${parsedIntent.originalQuery}". Try searching with different keywords or check if you have added contacts that match this description.`,
      suggestedFollowUp: "Try searching by name, company, or industry",
    };
  }

  // Generate natural language explanation
  const topMatch = bestMatches[0];
  const prompt = `Generate a brief, natural explanation for why these contacts match the search query.

Query: "${parsedIntent.originalQuery}"
Top match: ${topMatch.contact.name} (${topMatch.contact.company || "Unknown company"}) - Match reasons: ${topMatch.matchReasons.join(", ")}
Total matches: ${bestMatches.length}

Write a concise 1-2 sentence explanation. Be conversational and helpful.`;

  const response = await llm.invoke(prompt);
  const explanation = response.content as string;

  // Generate follow-up suggestion if few results
  let suggestedFollowUp = "";
  if (bestMatches.length <= 3) {
    suggestedFollowUp = `You might also try searching for "${parsedIntent.keywords.slice(0, 2).join('" or "')}" with different terms.`;
  }

  return {
    bestMatches,
    explanation: explanation.trim(),
    suggestedFollowUp,
  };
}

// Build the graph
function createVoiceSearchGraph() {
  const workflow = new StateGraph(VoiceSearchState)
    .addNode("parseQuery", parseVoiceQuery)
    .addNode("scoreContacts", scoreContacts)
    .addNode("generateResults", generateResults)
    .addEdge(START, "parseQuery")
    .addEdge("parseQuery", "scoreContacts")
    .addEdge("scoreContacts", "generateResults")
    .addEdge("generateResults", END);

  return workflow.compile();
}

// Main function to run the voice search agent
export async function runVoiceSearchAgent(
  voiceQuery: string,
  contacts: Contact[]
) {
  const graph = createVoiceSearchGraph();

  const result = await graph.invoke({
    voiceQuery,
    contacts,
    parsedIntent: { type: "general", keywords: [], filters: {}, originalQuery: "" },
    scoredContacts: [],
    bestMatches: [],
    explanation: "",
    suggestedFollowUp: "",
  });

  return {
    results: result.bestMatches.map((m: ScoredContact) => ({
      ...m.contact,
      _score: m.score,
      _matchReason: m.matchReasons.join(", "),
      _matchedFields: m.matchReasons,
      _relevance: m.relevance,
    })),
    explanation: result.explanation,
    suggestedFollowUp: result.suggestedFollowUp,
    parsedIntent: result.parsedIntent,
    totalMatches: result.bestMatches.length,
  };
}

export type { SearchIntent, ScoredContact };
