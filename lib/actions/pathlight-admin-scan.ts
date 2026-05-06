"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { recordChange } from "@/lib/canopy/audit";
import {
  releaseScanReservation,
  tryReserveScan,
} from "@/lib/canopy/pathlight-gate";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { hostnameResolvesPublic, normalizeUrl } from "@/lib/services/url";
import { track } from "@/lib/services/monitoring";

/**
 * Admin one-shot Pathlight scan trigger.
 *
 * Fires a Pathlight scan from inside Canopy without going through
 * the public /api/scan endpoint. Skips the public flow's friction
 * (Cloudflare Turnstile, per-IP rate limit, per-email rate limit,
 * 24h dedupe window) because the caller is already authenticated
 * as admin.
 *
 * Does NOT skip the three-layer Pathlight gate. Per Canopy rules
 * (.claude/rules/canopy.md), every Pathlight-billable code path
 * routes through canFireScan. This action uses tryReserveScan with
 * kind "prospecting" since manually pulling a prospect's URL into
 * the scan pipeline IS the prospecting workflow. Joshua needs
 * `prospecting_enabled` and a non-zero monthly_scan_budget set in
 * /admin/canopy for the action to succeed.
 *
 * Audit posture: writes a `pathlight.admin-scan` entry to
 * canopy_audit_log on success, recording the actor's email plus
 * the URL and prospect email so the trigger is traceable. Never
 * logs the email-as-PII into a "before" payload because there is
 * no prior state to compare against.
 */

export type AdminScanResult =
  | { ok: true; scanId: string }
  | { ok: false; error: string; reason?: string };

export interface AdminScanInput {
  url: string;
  email: string;
  businessName?: string | null;
  city?: string | null;
}

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function triggerAdminScanAction(
  input: AdminScanInput,
): Promise<AdminScanResult> {
  try {
    const admin = await requireAdmin();

    /* Boundary input validation. The pipeline does its own
     * validateUrl with a Browserless fallback later; these checks
     * keep garbage strings out of the scans table and give the
     * admin form fast inline feedback. */
    const rawUrl = (input.url ?? "").trim();
    if (!rawUrl) {
      return { ok: false, error: "URL is required." };
    }
    let url: string;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Invalid URL.",
      };
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { ok: false, error: "Invalid URL." };
    }
    if (!(await hostnameResolvesPublic(parsed.hostname))) {
      return { ok: false, error: "URL must be a publicly reachable site." };
    }

    const email = (input.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return { ok: false, error: "A valid recipient email is required." };
    }

    const businessName =
      typeof input.businessName === "string" && input.businessName.trim().length
        ? input.businessName.trim().slice(0, 200)
        : null;
    const city =
      typeof input.city === "string" && input.city.trim().length
        ? input.city.trim().slice(0, 120)
        : "Dallas";

    /* Three-layer gate + atomic budget reservation. Any layer
     * failing returns the gate's user-facing reason so the form
     * can render it ("Pathlight is paused in Settings", "Monthly
     * scan budget reached", "Prospecting is disabled in Canopy
     * settings"). The reservation is refunded if the Inngest send
     * fails so a transient queue outage does not consume budget
     * for scans that never ran. */
    const reservation = await tryReserveScan("prospecting", 1);
    if (!reservation.allowed) {
      return {
        ok: false,
        error: reservation.reason ?? "Pathlight scan gate denied.",
        reason: reservation.reason,
      };
    }

    const sql = getDb();

    const scanRows = (await sql`
      INSERT INTO scans (url, email, business_name, city, status)
      VALUES (
        ${url},
        ${email},
        ${businessName},
        ${city},
        'pending'
      )
      RETURNING id::text
    `) as Array<{ id: string }>;
    const scanId = scanRows[0]?.id;
    if (!scanId) {
      await releaseScanReservation(1);
      return { ok: false, error: "Failed to create scan record." };
    }

    /* Mirror the public flow's leads upsert so the lead-nurture
     * surfaces (Recurring users, scan_count, last_scan_at) stay
     * consistent regardless of how a scan got triggered. */
    await sql`
      INSERT INTO leads (email, business_name, url, city, scan_id)
      VALUES (${email}, ${businessName}, ${url}, ${city}, ${scanId})
      ON CONFLICT (email) DO UPDATE
      SET scan_count = leads.scan_count + 1,
          last_scan_at = now(),
          business_name = COALESCE(EXCLUDED.business_name, leads.business_name)
    `;

    try {
      await inngest.send({
        name: "pathlight/scan.requested",
        data: { scanId },
      });
    } catch (err) {
      await releaseScanReservation(1);
      throw err;
    }

    await track(
      "scan.requested",
      {
        url,
        hasBusinessName: Boolean(businessName),
        triggeredBy: admin.email,
        source: "admin-scan-form",
      },
      { scanId },
    );

    await recordChange({
      entityType: "scan",
      entityId: scanId,
      action: "pathlight.admin-scan",
      after: {
        triggered_by: admin.email,
        url,
        email,
        business_name: businessName,
        city,
      },
    });

    revalidatePath("/admin/scans");
    revalidatePath("/admin/monitor");
    return { ok: true, scanId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
