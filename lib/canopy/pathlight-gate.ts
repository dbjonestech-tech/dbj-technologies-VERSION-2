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

/* Increment the scans_used counter by `count`. Caller has already
 * passed canFireScan; this is the post-fire bookkeeping. */
export async function incrementScanUsage(count = 1): Promise<void> {
  if (count <= 0) return;
  const sql = getDb();
  await sql`
    UPDATE canopy_settings
    SET scans_used_this_period = scans_used_this_period + ${count},
        updated_at = NOW()
    WHERE id = 1
  `;
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
