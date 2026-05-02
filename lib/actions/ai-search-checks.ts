"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import {
  AI_SEARCH_ENGINES,
  AI_SEARCH_SENTIMENTS,
  type AiSearchCheckRow,
  type AiSearchEngine,
  type AiSearchSentiment,
} from "@/lib/services/ai-search-checks";

export type AiSearchActionResult =
  | { ok: true; data: AiSearchCheckRow }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

export async function recordAiSearchCheckAction(input: {
  contactId: number;
  engine: AiSearchEngine;
  query: string;
  resultText?: string;
  mentioned: boolean;
  sentiment: AiSearchSentiment;
}): Promise<AiSearchActionResult> {
  try {
    const admin = await requireAdmin();
    if (!AI_SEARCH_ENGINES.includes(input.engine)) {
      return { ok: false, error: "Invalid engine" };
    }
    if (!AI_SEARCH_SENTIMENTS.includes(input.sentiment)) {
      return { ok: false, error: "Invalid sentiment" };
    }
    const query = input.query?.trim();
    if (!query) return { ok: false, error: "Query is required" };

    const sql = getDb();
    const rows = (await sql`
      INSERT INTO ai_search_checks
        (contact_id, engine, query, result_text, mentioned, sentiment, checked_by_email)
      VALUES (
        ${input.contactId},
        ${input.engine},
        ${query},
        ${input.resultText?.trim() || null},
        ${input.mentioned},
        ${input.sentiment},
        ${admin.email}
      )
      RETURNING id, contact_id, engine, query, result_text, mentioned, sentiment, checked_by_email, checked_at
    `) as AiSearchCheckRow[];
    const row = rows[0];
    if (!row) return { ok: false, error: "Insert failed" };

    await recordChange({
      entityType: "contact",
      entityId: String(input.contactId),
      action: "ai_search.check",
      after: {
        engine: input.engine,
        query,
        mentioned: input.mentioned,
        sentiment: input.sentiment,
      },
    });

    revalidatePath(`/admin/contacts/${input.contactId}`);
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
