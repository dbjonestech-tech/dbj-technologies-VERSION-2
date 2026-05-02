"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { computeLeadScore, persistLeadScore, type LeadScoreResult } from "@/lib/canopy/lead-scoring";

export type LeadScoreActionResult =
  | { ok: true; data: LeadScoreResult }
  | { ok: false; error: string };

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
}

export async function recomputeLeadScoreAction(contactId: number): Promise<LeadScoreActionResult> {
  try {
    await requireAdmin();
    const result = await computeLeadScore(contactId);
    if (!result) return { ok: false, error: "Contact not found or score could not be computed" };
    await persistLeadScore(contactId, result);
    revalidatePath(`/admin/contacts/${contactId}`);
    revalidatePath("/admin");
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
