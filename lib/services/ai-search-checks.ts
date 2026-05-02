import { getDb } from "@/lib/db";

export type AiSearchEngine = "chatgpt" | "claude" | "gemini" | "perplexity" | "other";

export const AI_SEARCH_ENGINES: readonly AiSearchEngine[] = [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "other",
];

export type AiSearchSentiment = "positive" | "neutral" | "negative" | "unknown";

export const AI_SEARCH_SENTIMENTS: readonly AiSearchSentiment[] = [
  "positive",
  "neutral",
  "negative",
  "unknown",
];

export interface AiSearchCheckRow {
  id: number;
  contact_id: number;
  engine: AiSearchEngine;
  query: string;
  result_text: string | null;
  mentioned: boolean;
  sentiment: AiSearchSentiment;
  checked_by_email: string | null;
  checked_at: string;
}

export async function getAiSearchChecksForContact(
  contactId: number,
  limit = 30
): Promise<AiSearchCheckRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, contact_id, engine, query, result_text, mentioned,
             sentiment, checked_by_email, checked_at
      FROM ai_search_checks
      WHERE contact_id = ${contactId}
      ORDER BY checked_at DESC
      LIMIT ${limit}
    `) as AiSearchCheckRow[];
    return rows;
  } catch {
    return [];
  }
}

export interface AiSearchCheckSummary {
  total: number;
  mentioned_count: number;
  positive_count: number;
  by_engine: Record<AiSearchEngine, { total: number; mentioned: number }>;
}

export async function getAiSearchCheckSummary(contactId: number): Promise<AiSearchCheckSummary> {
  const fallback: AiSearchCheckSummary = {
    total: 0,
    mentioned_count: 0,
    positive_count: 0,
    by_engine: {
      chatgpt: { total: 0, mentioned: 0 },
      claude: { total: 0, mentioned: 0 },
      gemini: { total: 0, mentioned: 0 },
      perplexity: { total: 0, mentioned: 0 },
      other: { total: 0, mentioned: 0 },
    },
  };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT engine,
             COUNT(*)::int                                  AS total,
             COUNT(*) FILTER (WHERE mentioned = TRUE)::int  AS mentioned,
             COUNT(*) FILTER (WHERE sentiment = 'positive')::int AS positive
      FROM ai_search_checks
      WHERE contact_id = ${contactId}
      GROUP BY engine
    `) as Array<{ engine: AiSearchEngine; total: number; mentioned: number; positive: number }>;
    let total = 0;
    let mentioned_count = 0;
    let positive_count = 0;
    for (const r of rows) {
      total += r.total;
      mentioned_count += r.mentioned;
      positive_count += r.positive;
      fallback.by_engine[r.engine] = { total: r.total, mentioned: r.mentioned };
    }
    return { total, mentioned_count, positive_count, by_engine: fallback.by_engine };
  } catch {
    return fallback;
  }
}
