import { getDb } from "@/lib/db";
import { getCanopySettings } from "./settings";

export type ScanKind = "rescan" | "prospecting" | "competitive_intel";

export interface GateResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

/* The three independent locks every Pathlight scan must pass.
 *
 * Layer 1: feature toggles in canopy_settings.
 * Layer 2: a manual click-driven trigger (enforced by callers - every
 *          Pathlight entrypoint is a Server Action behind a button,
 *          never a background auto-fire).
 * Layer 3: a monthly budget counter. 0 = hard off.
 *
 * Any layer failing returns allowed:false with a user-facing reason
 * the UI surfaces beside the disabled trigger. */
export async function canFireScan(kind: ScanKind): Promise<GateResult> {
  await resetPeriodIfDue();
  const s = await getCanopySettings();

  if (!s.pathlight_master_enabled) {
    return { allowed: false, reason: "Pathlight is paused in Settings (master kill is on)." };
  }

  switch (kind) {
    case "rescan":
      if (!s.manual_rescan_enabled) {
        return { allowed: false, reason: "Manual rescan is disabled in Canopy settings." };
      }
      break;
    case "prospecting":
      if (!s.prospecting_enabled) {
        return { allowed: false, reason: "Prospecting is disabled in Canopy settings." };
      }
      break;
    case "competitive_intel":
      if (!s.competitive_intel_enabled) {
        return { allowed: false, reason: "Competitive intelligence is disabled in Canopy settings." };
      }
      break;
  }

  if (s.monthly_scan_budget <= 0) {
    return { allowed: false, reason: "Monthly scan budget is 0. Set a budget in Canopy settings." };
  }

  const remaining = s.monthly_scan_budget - s.scans_used_this_period;
  if (remaining <= 0) {
    return { allowed: false, reason: "Monthly scan budget reached. Reset on the next period or raise the cap." };
  }

  return { allowed: true, remaining };
}

export interface ReservationResult {
  allowed: boolean;
  reason?: string;
  /* Slots remaining AFTER the reservation. Undefined on denial. */
  remaining?: number;
  /* Slots actually reserved. 0 on denial; equals the requested count
   * on success. Useful for batch callers that want to confirm the
   * reservation matched the request. */
  reserved: number;
}

/* Atomic check-and-reserve. The three layers (master kill, per-kind
 * toggle, monthly budget) are all checked, and on success the budget
 * counter is incremented in the same SQL UPDATE so concurrent callers
 * cannot both pass when only one slot remains.
 *
 * Pattern for callers:
 *
 *   const reservation = await tryReserveScan("rescan", 1);
 *   if (!reservation.allowed) {
 *     return { ok: false, error: reservation.reason };
 *   }
 *   try {
 *     await inngest.send({ ... });
 *   } catch (err) {
 *     await releaseScanReservation(1);
 *     throw err;
 *   }
 *
 * The release call refunds the reservation if the scan never actually
 * queued, so a transient Inngest failure does not consume budget for
 * scans that did not run.
 *
 * The non-budget gates (master kill, per-feature toggle) are read-only
 * boolean settings without a counter, so they have no race; they stay
 * checked in JS for fast-fail on cheap conditions before the SQL hit.
 * The budget check + increment is what becomes atomic. */
export async function tryReserveScan(
  kind: ScanKind,
  count = 1
): Promise<ReservationResult> {
  if (count <= 0) {
    return { allowed: false, reason: "Reserve count must be positive.", reserved: 0 };
  }

  await resetPeriodIfDue();
  const s = await getCanopySettings();

  if (!s.pathlight_master_enabled) {
    return {
      allowed: false,
      reason: "Pathlight is paused in Settings (master kill is on).",
      reserved: 0,
    };
  }

  switch (kind) {
    case "rescan":
      if (!s.manual_rescan_enabled) {
        return { allowed: false, reason: "Manual rescan is disabled in Canopy settings.", reserved: 0 };
      }
      break;
    case "prospecting":
      if (!s.prospecting_enabled) {
        return { allowed: false, reason: "Prospecting is disabled in Canopy settings.", reserved: 0 };
      }
      break;
    case "competitive_intel":
      if (!s.competitive_intel_enabled) {
        return { allowed: false, reason: "Competitive intelligence is disabled in Canopy settings.", reserved: 0 };
      }
      break;
  }

  if (s.monthly_scan_budget <= 0) {
    return {
      allowed: false,
      reason: "Monthly scan budget is 0. Set a budget in Canopy settings.",
      reserved: 0,
    };
  }

  /* Atomic reservation. The WHERE clause runs inside Postgres at
   * row-lock time; two concurrent transactions serialize on the
   * canopy_settings row, so only one can pass when fewer than `count`
   * slots remain. RETURNING gives the post-increment remaining. */
  const sql = getDb();
  try {
    const rows = (await sql`
      UPDATE canopy_settings
      SET scans_used_this_period = scans_used_this_period + ${count},
          updated_at = NOW()
      WHERE id = 1
        AND scans_used_this_period + ${count} <= monthly_scan_budget
      RETURNING (monthly_scan_budget - scans_used_this_period)::int AS remaining
    `) as Array<{ remaining: number }>;

    if (rows.length === 0) {
      return {
        allowed: false,
        reason:
          count === 1
            ? "Monthly scan budget reached. Reset on the next period or raise the cap."
            : `Need ${count} scans but the monthly budget cannot fit that many right now.`,
        reserved: 0,
      };
    }

    return { allowed: true, remaining: rows[0]!.remaining, reserved: count };
  } catch {
    /* Table missing or DB failure: fail closed, mirrors the
     * getCanopySettings posture. */
    return { allowed: false, reason: "Could not reserve a scan slot.", reserved: 0 };
  }
}

/* Refund a reservation when the scan failed to queue (Inngest send
 * threw, or other post-reservation failure). Best-effort; if this
 * itself fails the reservation stays consumed and the period reset
 * eventually self-corrects. GREATEST clamps at 0 to prevent a negative
 * counter from a stale or duplicate refund. */
export async function releaseScanReservation(count = 1): Promise<void> {
  if (count <= 0) return;
  const sql = getDb();
  try {
    await sql`
      UPDATE canopy_settings
      SET scans_used_this_period = GREATEST(0, scans_used_this_period - ${count}),
          updated_at = NOW()
      WHERE id = 1
    `;
  } catch {
    /* swallow */
  }
}

/* If the current period has rolled, reset the counter and bump the
 * reset-at to the start of the next month. Idempotent. */
export async function resetPeriodIfDue(): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      UPDATE canopy_settings
      SET scans_used_this_period = 0,
          period_resets_at = date_trunc('month', NOW()) + INTERVAL '1 month',
          updated_at = NOW()
      WHERE id = 1
        AND NOW() >= period_resets_at
    `;
  } catch {
    /* Table may not exist yet (migration 024 unapplied). The default
       settings already block all scans, so a missing reset is safe. */
  }
}
