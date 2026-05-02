import { getDb } from "@/lib/db";

export interface CanopySettings {
  pathlight_master_enabled: boolean;
  manual_rescan_enabled: boolean;
  prospecting_enabled: boolean;
  competitive_intel_enabled: boolean;
  change_monitoring_enabled: boolean;
  attribution_beacon_enabled: boolean;
  monthly_scan_budget: number;
  scans_used_this_period: number;
  period_resets_at: string;
  lead_score_weights: Record<string, number>;
  brand_logo_url: string | null;
  brand_accent_color: string | null;
  brand_email_from_name: string | null;
  timezone: string;
  digest_enabled: boolean;
  digest_day_of_week: number;
  digest_hour_local: number;
  created_at: string;
  updated_at: string;
}

const DEFAULTS: CanopySettings = {
  pathlight_master_enabled: false,
  manual_rescan_enabled: false,
  prospecting_enabled: false,
  competitive_intel_enabled: false,
  change_monitoring_enabled: false,
  attribution_beacon_enabled: false,
  monthly_scan_budget: 0,
  scans_used_this_period: 0,
  period_resets_at: new Date().toISOString(),
  lead_score_weights: {
    pathlight: 30,
    engagement: 20,
    recency: 15,
    touchpoints: 15,
    deal_value: 15,
    source: 5,
  },
  brand_logo_url: null,
  brand_accent_color: null,
  brand_email_from_name: null,
  timezone: "America/Chicago",
  digest_enabled: false,
  digest_day_of_week: 1,
  digest_hour_local: 8,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

/* Singleton row read. Settings are written rarely (operator UI clicks
 * on /admin/canopy) and read on every Pathlight gate check, so the
 * read is fast (single row by PK). No cache layer; mutations call
 * revalidatePath on /admin/canopy and any other page that surfaces
 * settings-derived data.
 *
 * If migration 024 has not been applied, the table is missing and the
 * function returns DEFAULTS, which evaluates to "blocked" in the
 * gate. Safer than throwing during a render. */
export async function getCanopySettings(): Promise<CanopySettings> {
  try {
    const sql = getDb();
    const rows = (await sql`SELECT * FROM canopy_settings WHERE id = 1 LIMIT 1`) as CanopySettings[];
    return rows[0] ?? DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const CANOPY_SETTINGS_PATHS = [
  "/admin",
  "/admin/canopy",
] as const;
