import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { z } from "zod";

// Define the state for our agent
const ContactSearchState = Annotation.Root({
  // Input
  name: Annotation<string>,
  company: Annotation<string | undefined>,
  role: Annotation<string | undefined>,
  location: Annotation<string | undefined>,
  context: Annotation<string | undefined>,

  // Processing
  searchQueries: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => []
  }),
  linkedinProfiles: Annotation<LinkedInResult[]>({
    reducer: (_, y) => y,
    default: () => []
  }),
  webResults: Annotation<WebResult[]>({
    reducer: (_, y) => y,
    default: () => []
  }),
  analysis: Annotation<string>({
    reducer: (_, y) => y,
    default: () => ""
  }),

  // Output
  bestLinkedInMatch: Annotation<LinkedInResult | null>({
    reducer: (_, y) => y,
    default: () => null
  }),
  confidence: Annotation<"high" | "medium" | "low">({
    reducer: (_, y) => y,
    default: () => "low"
  }),
  summary: Annotation<string>({
    reducer: (_, y) => y,
    default: () => ""
  }),
});

interface LinkedInResult {
  url: string;
  name?: string;
  title?: string;
  company?: string;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

interface WebResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevance: number;
}

// Create the LLM
function getLLM() {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// Node 1: Generate search queries
async function generateSearchQueries(state: typeof ContactSearchState.State) {
  const llm = getLLM();

  const prompt = `Generate optimized search queries to find information about this person on LinkedIn and the web.

Person Details:
- Name: ${state.name}
${state.company ? `- Company: ${state.company}` : ""}
${state.role ? `- Role: ${state.role}` : ""}
${state.location ? `- Location: ${state.location}` : ""}
${state.context ? `- Context: ${state.context}` : ""}

Generate 3 search queries:
1. A LinkedIn-specific search query (for site:linkedin.com/in)
2. A professional/company search query
3. A general web search query

Return as JSON: { "queries": ["query1", "query2", "query3"] }`;

  const response = await llm.invoke(prompt);
  const content = response.content as string;

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
    return { searchQueries: parsed.queries || [] };
  } catch {
    // Fallback queries
    const queries = [
      `"${state.name}" ${state.company || ""} site:linkedin.com/in`,
      `"${state.name}" ${state.company || ""} ${state.role || ""}`,
      `${state.name} ${state.company || ""} professional`,
    ];
    return { searchQueries: queries };
  }
}

// Node 2: Construct LinkedIn profiles
async function findLinkedInProfiles(state: typeof ContactSearchState.State) {
  const nameParts = state.name.trim().toLowerCase().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts[nameParts.length - 1] || "";

  const profiles: LinkedInResult[] = [];

  // Generate common LinkedIn URL patterns
  const baseUrl = "https://www.linkedin.com/in/";
  const patterns = [
    `${firstName}-${lastName}`,
    `${firstName}${lastName}`,
    `${lastName}-${firstName}`,
    `${firstName}-${lastName}-${lastName.charAt(0)}`,
  ];

  // Add direct profile suggestions
  patterns.forEach((pattern, idx) => {
    profiles.push({
      url: `${baseUrl}${pattern}`,
      name: state.name,
      title: state.role,
      company: state.company,
      confidence: idx === 0 ? "medium" : "low",
      reason: idx === 0 ? "Most common LinkedIn URL pattern" : "Alternative URL pattern",
    });
  });

  // Add Google search for LinkedIn
  profiles.unshift({
    url: `https://www.google.com/search?q=${encodeURIComponent(`"${state.name}" ${state.company || ""} site:linkedin.com/in`)}`,
    name: state.name,
    title: "Search on Google",
    company: state.company,
    confidence: "high",
    reason: "Google search for most accurate result",
  });

  // Add LinkedIn search
  profiles.push({
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${state.name} ${state.company || ""}`)}`,
    name: state.name,
    title: "Search on LinkedIn",
    company: state.company,
    confidence: "medium",
    reason: "Direct LinkedIn people search",
  });

  return { linkedinProfiles: profiles };
}

// Node 3: Generate web search suggestions
async function generateWebResults(state: typeof ContactSearchState.State) {
  const results: WebResult[] = [];

  // Google search
  results.push({
    title: `Search for "${state.name}"`,
    link: `https://www.google.com/search?q=${encodeURIComponent(`${state.name} ${state.company || ""}`)}`,
    snippet: `Find information about ${state.name}${state.company ? ` at ${state.company}` : ""}`,
    source: "google.com",
    relevance: 1.0,
  });

  // Company website search if company is known
  if (state.company) {
    results.push({
      title: `Find ${state.company} Team Page`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`"${state.name}" site:${state.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)}`,
      snippet: `Look for ${state.name} on ${state.company}'s website`,
      source: "company website",
      relevance: 0.9,
    });
  }

  // Twitter/X search
  results.push({
    title: `Find on Twitter/X`,
    link: `https://twitter.com/search?q=${encodeURIComponent(`${state.name} ${state.company || ""}`)}`,
    snippet: `Search Twitter for ${state.name}`,
    source: "twitter.com",
    relevance: 0.7,
  });

  // Crunchbase if company context
  if (state.company || state.role?.toLowerCase().includes("ceo") || state.role?.toLowerCase().includes("founder")) {
    results.push({
      title: `Crunchbase Profile`,
      link: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(state.name)}`,
      snippet: `Find business profile on Crunchbase`,
      source: "crunchbase.com",
      relevance: 0.8,
    });
  }

  return { webResults: results };
}

// Node 4: Analyze and rank results
async function analyzeResults(state: typeof ContactSearchState.State) {
  const llm = getLLM();

  const prompt = `Analyze the search results for this contact and determine the best approach to find them online.

Person: ${state.name}
${state.company ? `Company: ${state.company}` : ""}
${state.role ? `Role: ${state.role}` : ""}
${state.context ? `Context: ${state.context}` : ""}

LinkedIn profiles found: ${state.linkedinProfiles.length}
Web results: ${state.webResults.length}

Based on the information available, provide:
1. Confidence level (high/medium/low) that we can find this person online
2. The best search strategy recommendation
3. A brief summary of what to look for

Return as JSON: { "confidence": "high|medium|low", "strategy": "...", "summary": "..." }`;

  const response = await llm.invoke(prompt);
  const content = response.content as string;

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));

    // Find the best LinkedIn match
    const bestMatch = state.linkedinProfiles.find(p => p.confidence === "high") ||
                      state.linkedinProfiles[0] ||
                      null;

    return {
      bestLinkedInMatch: bestMatch,
      confidence: parsed.confidence || "medium",
      summary: parsed.summary || `Search for ${state.name} on LinkedIn and Google for best results.`,
      analysis: parsed.strategy || "",
    };
  } catch {
    return {
      bestLinkedInMatch: state.linkedinProfiles[0] || null,
      confidence: "medium" as const,
      summary: `We recommend searching Google for "${state.name}" on LinkedIn to find the most accurate profile.`,
      analysis: "Use Google site search for best results",
    };
  }
}

// Build the graph
function createContactSearchGraph() {
  const workflow = new StateGraph(ContactSearchState)
    .addNode("generateQueries", generateSearchQueries)
    .addNode("findLinkedIn", findLinkedInProfiles)
    .addNode("findWeb", generateWebResults)
    .addNode("analyze", analyzeResults)
    .addEdge(START, "generateQueries")
    .addEdge("generateQueries", "findLinkedIn")
    .addEdge("findLinkedIn", "findWeb")
    .addEdge("findWeb", "analyze")
    .addEdge("analyze", END);

  return workflow.compile();
}

// Main function to run the agent
export async function runContactSearchAgent(input: {
  name: string;
  company?: string;
  role?: string;
  location?: string;
  context?: string;
}) {
  const graph = createContactSearchGraph();

  const result = await graph.invoke({
    name: input.name,
    company: input.company,
    role: input.role,
    location: input.location,
    context: input.context,
    searchQueries: [],
    linkedinProfiles: [],
    webResults: [],
    analysis: "",
    bestLinkedInMatch: null,
    confidence: "low",
    summary: "",
  });

  return {
    linkedinProfiles: result.linkedinProfiles,
    webResults: result.webResults,
    bestMatch: result.bestLinkedInMatch,
    confidence: result.confidence,
    summary: result.summary,
    searchQueries: result.searchQueries,
  };
}

export type { LinkedInResult, WebResult };
