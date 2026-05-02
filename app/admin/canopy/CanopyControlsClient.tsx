"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  setCanopyToggle,
  setMonthlyBudget,
  resetCurrentPeriodCounter,
  setBranding,
} from "@/lib/actions/canopy-settings";
import type { CanopySettings } from "@/lib/canopy/settings";

type ToggleKey =
  | "pathlight_master_enabled"
  | "manual_rescan_enabled"
  | "prospecting_enabled"
  | "competitive_intel_enabled"
  | "change_monitoring_enabled"
  | "attribution_beacon_enabled"
  | "digest_enabled";

interface ToggleDef {
  key: ToggleKey;
  label: string;
  hint: string;
}

const PATHLIGHT_TOGGLES: ToggleDef[] = [
  {
    key: "manual_rescan_enabled",
    label: "Manual rescan",
    hint: "Allow operators to click Re-scan on a contact to fire a fresh Pathlight scan. Counts against the monthly budget.",
  },
  {
    key: "prospecting_enabled",
    label: "Prospecting",
    hint: "Allow scanning prospect lists from /admin/prospecting. Each candidate scan counts against the monthly budget.",
  },
  {
    key: "competitive_intel_enabled",
    label: "Competitive intelligence",
    hint: "Allow per-contact competitor scans (up to 5 competitors per click). Counts as N scans against the monthly budget.",
  },
  {
    key: "change_monitoring_enabled",
    label: "Website change monitoring",
    hint: "Allow the daily HEAD-request cron to flag candidate sites for re-scan. The cron itself never auto-fires a scan; it surfaces actionable items only.",
  },
  {
    key: "attribution_beacon_enabled",
    label: "Attribution beacon",
    hint: "Allow client sites to phone home with post-launch metrics for the deal Case Study tab. No marginal cost per event.",
  },
];

interface Props {
  initial: CanopySettings;
}

export default function CanopyControlsClient({ initial }: Props) {
  const [settings, setSettings] = useState<CanopySettings>(initial);
  const [pending, start] = useTransition();
  const [budgetInput, setBudgetInput] = useState<string>(
    String(initial.monthly_scan_budget)
  );
  const [error, setError] = useState<string | null>(null);

  function applyToggle(key: ToggleKey, value: boolean) {
    setError(null);
    setSettings((s) => ({ ...s, [key]: value }));
    start(async () => {
      const result = await setCanopyToggle(key, value);
      if (!result.ok) {
        setError(result.error);
        setSettings((s) => ({ ...s, [key]: !value }));
      }
    });
  }

  function applyBudget() {
    setError(null);
    const next = Number(budgetInput);
    if (!Number.isFinite(next) || next < 0) {
      setError("Budget must be a non-negative number");
      return;
    }
    start(async () => {
      const result = await setMonthlyBudget(next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSettings((s) => ({ ...s, monthly_scan_budget: Math.floor(next) }));
    });
  }

  function applyResetPeriod() {
    setError(null);
    start(async () => {
      const result = await resetCurrentPeriodCounter();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSettings((s) => ({ ...s, scans_used_this_period: 0 }));
    });
  }

  const masterOn = settings.pathlight_master_enabled;
  const remaining = Math.max(0, settings.monthly_scan_budget - settings.scans_used_this_period);
  const periodResetsAt = new Date(settings.period_resets_at);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Pathlight master kill
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              Universal lock. When OFF, no Pathlight scan can fire from anywhere in Canopy regardless of per-feature toggles or budget. Default OFF on install.
            </p>
          </div>
          <MasterPill on={masterOn} />
        </header>
        <Toggle
          checked={masterOn}
          disabled={pending}
          onChange={(v) => applyToggle("pathlight_master_enabled", v)}
          label={masterOn ? "Pathlight is enabled" : "Pathlight is paused"}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Per-feature toggles
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Independent of the master kill. Each toggle gates a specific Pathlight surface. With the master kill OFF, none of these can fire scans.
          </p>
        </header>
        <ul className="space-y-4">
          {PATHLIGHT_TOGGLES.map((t) => (
            <li key={t.key} className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{t.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{t.hint}</p>
                </div>
                <Toggle
                  checked={settings[t.key]}
                  disabled={pending}
                  onChange={(v) => applyToggle(t.key, v)}
                  label={settings[t.key] ? "On" : "Off"}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Monthly scan budget
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Hard cap on Pathlight scans per period. 0 = blocked even with toggles on. Period rolls automatically to the start of next month.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Cap (scans / month)" value={settings.monthly_scan_budget.toLocaleString()} />
          <Stat label="Used this period" value={settings.scans_used_this_period.toLocaleString()} />
          <Stat label="Remaining" value={remaining.toLocaleString()} tone={remaining === 0 ? "danger" : "neutral"} />
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">
          Period resets {periodResetsAt.toLocaleString()}.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Set new cap
            </span>
            <input
              type="number"
              min={0}
              max={1_000_000}
              step={1}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              disabled={pending}
              className="mt-1 block w-40 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={applyBudget}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save cap
          </button>
          <button
            type="button"
            onClick={applyResetPeriod}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            Reset period counter to 0
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Notifications
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Weekly narrative digest sent to operator emails. The digest itself ships in Phase 7. The toggle is wired now so the cron is dormant until enabled.
          </p>
        </header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">Weekly digest email</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              Sent {formatDayOfWeek(settings.digest_day_of_week)} at {settings.digest_hour_local.toString().padStart(2, "0")}:00 {settings.timezone}.
            </p>
          </div>
          <Toggle
            checked={settings.digest_enabled}
            disabled={pending}
            onChange={(v) => applyToggle("digest_enabled", v)}
            label={settings.digest_enabled ? "On" : "Off"}
          />
        </div>
      </section>

      <BrandingSection initial={settings} pending={pending} onSave={(input) => start(async () => { await setBranding(input); })} />
    </div>
  );
}

function MasterPill({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
        on
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      {on ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      {on ? "Pathlight ON" : "Pathlight PAUSED"}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-zinc-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "danger";
}) {
  const valueColor = tone === "danger" ? "text-red-700" : "text-zinc-900";
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-xl font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function formatDayOfWeek(d: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d] ?? "";
}

function BrandingSection({
  initial,
  pending,
  onSave,
}: {
  initial: CanopySettings;
  pending: boolean;
  onSave: (input: {
    brand_logo_url?: string | null;
    brand_accent_color?: string | null;
    brand_email_from_name?: string | null;
  }) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(initial.brand_logo_url ?? "");
  const [accent, setAccent] = useState(initial.brand_accent_color ?? "");
  const [fromName, setFromName] = useState(initial.brand_email_from_name ?? "");
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          White-label branding
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          Optional per-install overrides. Phase 8 swaps the logomark, accent color, and email from-name based on these. Leave blank to inherit DBJ defaults.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
        <Field label="Accent color (hex)" value={accent} onChange={setAccent} placeholder="#0ea5b7" />
        <Field label="Email from-name" value={fromName} onChange={setFromName} placeholder="Canopy" />
      </div>
      <div className="mt-4">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onSave({
              brand_logo_url: logoUrl.trim() || null,
              brand_accent_color: accent.trim() || null,
              brand_email_from_name: fromName.trim() || null,
            })
          }
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          Save branding
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
      />
    </label>
  );
}
