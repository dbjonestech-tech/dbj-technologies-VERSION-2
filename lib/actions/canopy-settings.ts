"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  getCanopySettings,
  CANOPY_SETTINGS_PATHS,
  type CanopySettings,
} from "@/lib/canopy/settings";
import { recordChange } from "@/lib/canopy/audit";

type ToggleKey =
  | "pathlight_master_enabled"
  | "manual_rescan_enabled"
  | "prospecting_enabled"
  | "competitive_intel_enabled"
  | "change_monitoring_enabled"
  | "attribution_beacon_enabled"
  | "digest_enabled";

const TOGGLE_KEYS: ReadonlySet<ToggleKey> = new Set([
  "pathlight_master_enabled",
  "manual_rescan_enabled",
  "prospecting_enabled",
  "competitive_intel_enabled",
  "change_monitoring_enabled",
  "attribution_beacon_enabled",
  "digest_enabled",
]);

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("not authorized");
  }
}

export async function setCanopyToggle(
  key: ToggleKey,
  value: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!TOGGLE_KEYS.has(key)) {
    return { ok: false, error: "unknown toggle" };
  }
  const before = await getCanopySettings();
  const sql = getDb();
  /* Identifier interpolation is safe here because key is constrained to
     the TOGGLE_KEYS set above. */
  switch (key) {
    case "pathlight_master_enabled":
      await sql`UPDATE canopy_settings SET pathlight_master_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "manual_rescan_enabled":
      await sql`UPDATE canopy_settings SET manual_rescan_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "prospecting_enabled":
      await sql`UPDATE canopy_settings SET prospecting_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "competitive_intel_enabled":
      await sql`UPDATE canopy_settings SET competitive_intel_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "change_monitoring_enabled":
      await sql`UPDATE canopy_settings SET change_monitoring_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "attribution_beacon_enabled":
      await sql`UPDATE canopy_settings SET attribution_beacon_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
    case "digest_enabled":
      await sql`UPDATE canopy_settings SET digest_enabled = ${value}, updated_at = NOW() WHERE id = 1`;
      break;
  }
  for (const p of CANOPY_SETTINGS_PATHS) revalidatePath(p);
  await recordChange({
    entityType: "canopy_settings",
    entityId: "1",
    action: `setting.toggle.${key}`,
    before: { [key]: before[key] },
    after: { [key]: value },
  });
  return { ok: true };
}

export async function setMonthlyBudget(
  value: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
    return { ok: false, error: "budget must be between 0 and 1,000,000" };
  }
  const before = await getCanopySettings();
  const sql = getDb();
  const intValue = Math.floor(value);
  await sql`
    UPDATE canopy_settings
    SET monthly_scan_budget = ${intValue}, updated_at = NOW()
    WHERE id = 1
  `;
  for (const p of CANOPY_SETTINGS_PATHS) revalidatePath(p);
  await recordChange({
    entityType: "canopy_settings",
    entityId: "1",
    action: "setting.budget",
    before: { monthly_scan_budget: before.monthly_scan_budget },
    after: { monthly_scan_budget: intValue },
  });
  return { ok: true };
}

export async function resetCurrentPeriodCounter(): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const before = await getCanopySettings();
  const sql = getDb();
  await sql`
    UPDATE canopy_settings
    SET scans_used_this_period = 0,
        updated_at = NOW()
    WHERE id = 1
  `;
  for (const p of CANOPY_SETTINGS_PATHS) revalidatePath(p);
  await recordChange({
    entityType: "canopy_settings",
    entityId: "1",
    action: "setting.budget.reset_period",
    before: { scans_used_this_period: before.scans_used_this_period },
    after: { scans_used_this_period: 0 },
  });
  return { ok: true };
}

export async function setBranding(input: {
  brand_logo_url?: string | null;
  brand_accent_color?: string | null;
  brand_email_from_name?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const before = await getCanopySettings();
  const sql = getDb();
  await sql`
    UPDATE canopy_settings
    SET brand_logo_url        = COALESCE(${input.brand_logo_url ?? null}, brand_logo_url),
        brand_accent_color    = COALESCE(${input.brand_accent_color ?? null}, brand_accent_color),
        brand_email_from_name = COALESCE(${input.brand_email_from_name ?? null}, brand_email_from_name),
        updated_at = NOW()
    WHERE id = 1
  `;
  for (const p of CANOPY_SETTINGS_PATHS) revalidatePath(p);
  await recordChange({
    entityType: "canopy_settings",
    entityId: "1",
    action: "setting.branding",
    before: {
      brand_logo_url: before.brand_logo_url,
      brand_accent_color: before.brand_accent_color,
      brand_email_from_name: before.brand_email_from_name,
    },
    after: {
      brand_logo_url: input.brand_logo_url ?? before.brand_logo_url,
      brand_accent_color: input.brand_accent_color ?? before.brand_accent_color,
      brand_email_from_name: input.brand_email_from_name ?? before.brand_email_from_name,
    },
  });
  return { ok: true };
}

export type { CanopySettings };
