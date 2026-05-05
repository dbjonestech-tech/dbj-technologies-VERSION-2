"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { recordChange } from "@/lib/canopy/audit";
import { canFireScan, incrementScanUsage } from "@/lib/canopy/pathlight-gate";
import { triggerRescanForContact, type RescanResult } from "@/lib/canopy/pathlight-client";
import { track } from "@/lib/services/monitoring";

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

export type ScanRescanResult =
  | { ok: true; newScanId: string }
  | { ok: false; error: string; reason?: string };

/**
 * Re-fire a scan by id without going through the public /api/scan
 * endpoint. Used by the /admin/monitor/scan/[scanId] drilldown so an
 * admin who just looked at a partial scan can retry it in one click.
 *
 * Behavior: load the original scan, insert a fresh row carrying its
 * URL / email / business_name / city, fire the pipeline event, log
 * the trigger to monitoring_events, and return the new scan id. The
 * original row is preserved untouched so the partial diagnosis stays
 * available for comparison.
 */
export async function rescanByScanIdAction(input: {
  scanId: string;
}): Promise<ScanRescanResult> {
  try {
    const admin = await requireAdmin();

    const gate = await canFireScan("rescan");
    if (!gate.allowed) {
      return { ok: false, error: gate.reason ?? "Scan gate denied", reason: gate.reason };
    }

    const sql = getDb();
    const original = (await sql`
      SELECT id::text, url, email, business_name, city
      FROM scans
      WHERE id = ${input.scanId}::uuid
      LIMIT 1
    `) as Array<{
      id: string;
      url: string;
      email: string;
      business_name: string | null;
      city: string | null;
    }>;
    const src = original[0];
    if (!src) {
      return { ok: false, error: "Scan not found" };
    }

    const inserted = (await sql`
      INSERT INTO scans (url, email, business_name, city, status)
      VALUES (
        ${src.url},
        ${src.email},
        ${src.business_name},
        ${src.city ?? "Dallas"},
        'pending'
      )
      RETURNING id::text
    `) as Array<{ id: string }>;
    const newScanId = inserted[0]?.id;
    if (!newScanId) {
      return { ok: false, error: "Failed to create new scan row" };
    }

    await inngest.send({
      name: "pathlight/scan.requested",
      data: { scanId: newScanId },
    });

    await incrementScanUsage(1);

    await track(
      "scan.requested",
      {
        url: src.url,
        hasBusinessName: Boolean(src.business_name),
        rescanOf: src.id,
        triggeredBy: admin.email,
      },
      { scanId: newScanId },
    );

    await recordChange({
      entityType: "scan",
      entityId: newScanId,
      action: "pathlight.rescan.from-monitor",
      after: { rescan_of: src.id, triggered_by: admin.email },
    });

    revalidatePath(`/admin/monitor/scan/${input.scanId}`);
    revalidatePath(`/admin/monitor/scan/${newScanId}`);
    revalidatePath("/admin/monitor");
    revalidatePath("/admin/scans");
    return { ok: true, newScanId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
