import { Lock, ShieldCheck } from "lucide-react";
import {
  DEMO_PATHLIGHT_GATE,
  DEMO_PROSPECTS,
  DEMO_CHANGE_ALERTS,
  DEMO_COMPETITOR_SCANS,
  formatRelativeTime,
} from "@/lib/demo/fixtures";

/* Showcase Pathlight Integration. Surfaces the gate state,
 * prospecting candidates with scan context, change-monitoring
 * alerts, and competitive scans. Per .claude/rules/canopy.md
 * Public Presentation: the EXISTENCE of guardrails is public-OK
 * and a sales feature; per-layer order, column names, and
 * function signatures stay private. This page describes
 * outcomes and behavior, not implementation specifics. */

export default function ShowcasePathlightPage() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime-700">
            Pathlight Advanced
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Pathlight Integration
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Pathlight signals become operator workflows: prospecting
            candidate research, change monitoring on existing customer
            sites, competitive scans on direct competitors. Every
            Pathlight call passes through layered guardrails so a
            runaway loop cannot turn into a surprise bill.
          </p>
        </header>

        <GateStatusPanel />

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-lime-500" />
              Prospecting Candidates
            </h2>
            <span className="text-[11px] text-zinc-500">{DEMO_PROSPECTS.length} candidates</span>
          </div>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Business</th>
                <th className="px-2 py-2 font-semibold">Vertical</th>
                <th className="px-2 py-2 font-semibold">Location</th>
                <th className="px-2 py-2 text-right font-semibold">Scan score</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 text-right font-semibold">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PROSPECTS.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2">
                    <p className="text-[13px] font-semibold text-zinc-900">{p.business}</p>
                    <p className="font-mono text-[10px] text-zinc-500">{p.domain}</p>
                  </td>
                  <td className="px-2 py-2 text-[12px] text-zinc-700">{p.vertical}</td>
                  <td className="px-2 py-2 text-[11px] text-zinc-500">{p.city}</td>
                  <td className="px-2 py-2 text-right">
                    {p.scanScore !== null ? (
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-mono text-[12px] font-semibold ring-1 ring-inset ${scoreClass(p.scanScore)}`}>
                        {p.scanScore}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-zinc-400">not scanned</span>
                    )}
                  </td>
                  <td className="px-2 py-2"><ProspectStatusPill status={p.status} /></td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">
                    {p.scannedAt ? formatRelativeTime(p.scannedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Change Monitoring
            </h2>
            <ul className="divide-y divide-zinc-100">
              {DEMO_CHANGE_ALERTS.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[13px] font-semibold text-zinc-900">{a.contactCompany}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{a.domain}</p>
                      <p className="mt-1 text-[12px] text-zinc-700">{a.changeKind}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-[11px] text-zinc-500">{formatRelativeTime(a.observedAt)}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                        a.resolved
                          ? "bg-zinc-50 text-zinc-600 ring-zinc-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}>
                        {a.resolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-[11px] text-zinc-600">
              Daily HEAD-request cron flags candidates. No scan auto-fires.
              Each alert offers a manual rescan that respects the gate.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
              Competitive Scans
            </h2>
            <ul className="divide-y divide-zinc-100">
              {DEMO_COMPETITOR_SCANS.map((c) => (
                <li key={c.id} className="py-3">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">vs {c.forContactCompany}</p>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">{c.competitor}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{c.competitorDomain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-mono text-[12px] font-semibold ring-1 ring-inset ${scoreClass(c.scanScore)}`}>
                        {c.scanScore}
                      </span>
                      <span className={`font-mono text-[11px] ${c.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {c.delta >= 0 ? "+" : ""}{c.delta}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function GateStatusPanel() {
  const g = DEMO_PATHLIGHT_GATE;
  return (
    <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 ring-1 ring-inset ring-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Guardrails active
        </span>
        <span className="text-[11px] text-zinc-600">
          Every Pathlight call passes through layered checks. Any one failing aborts the call.
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <GateTile
          label="Capability"
          value={g.capabilityEnabled ? "Enabled" : "Disabled"}
          sub="Per-install master switch"
          tone={g.capabilityEnabled ? "ok" : "off"}
        />
        <GateTile
          label="Triggers"
          value={g.manualOnly ? "Manual or rules-bounded" : "Automatic"}
          sub="No background auto-fire"
          tone={g.manualOnly ? "ok" : "warn"}
        />
        <GateTile
          label="Monthly budget"
          value={`$${g.spentThisPeriodUsd.toFixed(2)} / $${g.monthlyBudgetUsd}`}
          sub={`${g.pctSpent}% used, $${g.budgetRemainingUsd.toFixed(2)} remaining`}
          tone="ok"
        />
      </div>
    </section>
  );
}

function GateTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn" | "off";
}) {
  const valueColor = tone === "ok" ? "text-emerald-800" : tone === "warn" ? "text-amber-800" : "text-zinc-500";
  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
        <Lock className="h-3 w-3 text-emerald-700" aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-1.5 font-mono text-sm font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

function ProspectStatusPill({ status }: { status: "candidate" | "scanned" | "outreach" }) {
  const map = {
    candidate: { bg: "bg-zinc-50", ring: "ring-zinc-200", text: "text-zinc-700", dot: "bg-zinc-400" },
    scanned: { bg: "bg-cyan-50", ring: "ring-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500" },
    outreach: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  } as const;
  const tone = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${tone.bg} ${tone.ring} ${tone.text}`}>
      <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {status}
    </span>
  );
}

function scoreClass(score: number): string {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}
