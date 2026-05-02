"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { recordChange } from "@/lib/canopy/audit";
import { triggerRescanForContact, type RescanResult } from "@/lib/canopy/pathlight-client";

export type RescanActionResult =
  | { ok: true; data: RescanResult }
  | { ok: false; error: string; reason?: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

export async function triggerRescanAction(input: {
  contactId: number;
  reason?: string;
  url?: string;
}): Promise<RescanActionResult> {
  try {
    const admin = await requireAdmin();
    const result = await triggerRescanForContact({
      contactId: input.contactId,
      triggeredByEmail: admin.email,
      reason: input.reason,
      url: input.url,
    });

    if (!result.ok) {
      return result;
    }

    await recordChange({
      entityType: "contact",
      entityId: String(input.contactId),
      action: "pathlight.rescan.trigger",
      after: {
        scan_id: result.data.scan_id,
        previous_scan_id: result.data.previous_scan_id,
        reason: input.reason ?? null,
      },
    });

    revalidatePath(`/admin/contacts/${input.contactId}`);
    revalidatePath("/admin/canopy");
    revalidatePath("/admin");
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
