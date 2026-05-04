import {
  DEMO_STATUS_BANNER,
  DEMO_INFRA_CHECKS,
  DEMO_DELIVERABILITY,
  DEMO_FUNCTION_HEALTH,
  DEMO_BUDGET_HEADROOM,
  type DemoStatusLevel,
} from "@/lib/demo/fixtures";

/* Showcase operations & health. Worst-of status banner,
 * infrastructure checks, deliverability, function-level error
 * volume, and budget headroom. Static rendering of the same
 * panels /admin/monitor, /admin/infrastructure, /admin/email,
 * /admin/platform, and /admin/costs produce. */

export default function ShowcaseOperationsPage() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Operations
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Operations & Health
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            One banner that summarizes the worst of every signal
            across the whole stack. Per-domain TLS, WHOIS, and
            email-authentication posture run on a daily cron and
            write to the audit log. Deliverability, function health,
            and budget headroom are read against the same window.
          </p>
        </header>

        <WorstOfBanner />

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-lime-500" />
            Infrastructure
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Domain</th>
                <th className="px-2 py-2 text-right font-semibold">TLS expiry</th>
                <th className="px-2 py-2 text-right font-semibold">WHOIS expiry</th>
                <th className="px-2 py-2 text-center font-semibold">SPF</th>
                <th className="px-2 py-2 text-center font-semibold">DKIM</th>
                <th className="px-2 py-2 text-center font-semibold">DMARC</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_INFRA_CHECKS.map((c) => (
                <tr key={c.domain} className="border-t border-zinc-100">
                  <td className="px-2 py-2 font-mono text-[12px] text-zinc-800">{c.domain}</td>
                  <td className={`px-2 py-2 text-right font-mono text-[12px] ${c.tlsExpiryDays <= 30 ? "text-amber-700" : "text-zinc-700"}`}>
                    {c.tlsExpiryDays}d
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-[12px] text-zinc-700">{c.whoisExpiryDays}d</td>
                  <td className="px-2 py-2 text-center"><CheckBadge ok={c.spfPass} /></td>
                  <td className="px-2 py-2 text-center"><CheckBadge ok={c.dkimPass} /></td>
                  <td className="px-2 py-2 text-center"><CheckBadge ok={c.dmarcPass} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
              Deliverability, last 30d
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Sent" value={DEMO_DELIVERABILITY.sent30d.toLocaleString()} tone="neutral" />
              <Stat label="Delivered" value={DEMO_DELIVERABILITY.delivered30d.toLocaleString()} tone="ok" />
              <Stat label="Bounced" value={String(DEMO_DELIVERABILITY.bounced30d)} tone="warn" />
              <Stat label="Complained" value={String(DEMO_DELIVERABILITY.complained30d)} tone="warn" />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-zinc-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Delivery rate</p>
              <p className="font-mono text-2xl font-semibold text-emerald-700">{DEMO_DELIVERABILITY.deliveryRatePct}%</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Budget Headroom
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Spent this period</p>
                  <p className="font-mono text-xl font-semibold text-zinc-900">${DEMO_BUDGET_HEADROOM.spentThisPeriodUsd.toFixed(2)}</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${DEMO_BUDGET_HEADROOM.pctSpent}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{DEMO_BUDGET_HEADROOM.pctSpent}% of ${DEMO_BUDGET_HEADROOM.monthlyBudgetUsd} monthly budget</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-[11px] text-zinc-600">
                {DEMO_BUDGET_HEADROOM.daysRemaining} days remaining in the period. Hard cap blocks any spend that would exceed the configured ceiling.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Function Health, last 24h
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Function</th>
                <th className="px-2 py-2 text-right font-semibold">Invocations</th>
                <th className="px-2 py-2 text-right font-semibold">Error rate</th>
                <th className="px-2 py-2 text-right font-semibold">p95 duration</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_FUNCTION_HEALTH.map((f) => (
                <tr key={f.name} className="border-t border-zinc-100">
                  <td className="px-2 py-2 font-mono text-[12px] text-zinc-800">{f.name}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{f.invocations24h}</td>
                  <td className={`px-2 py-2 text-right font-mono text-[12px] ${f.errorRatePct > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {f.errorRatePct.toFixed(1)}%
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">
                    {f.p95Ms >= 1000 ? `${(f.p95Ms / 1000).toFixed(1)}s` : `${f.p95Ms}ms`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function WorstOfBanner() {
  const tone = DEMO_STATUS_BANNER.level;
  const map = {
    ok: { bg: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "All systems normal" },
    warn: { bg: "border-amber-200 bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Attention this week" },
    fail: { bg: "border-rose-200 bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Action needed now" },
  };
  const cls = map[tone];
  return (
    <section className="mb-8">
      <div className={`rounded-xl border ${cls.bg} p-5`}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ${cls.text} ring-current/20`}>
            <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${cls.dot}`} />
            {cls.label}
          </span>
          <span className="text-[11px] text-zinc-600">
            Worst-of every signal. Click any area for the underlying data.
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_STATUS_BANNER.signals.map((s) => (
            <li key={s.area} className="rounded-lg border border-white/60 bg-white/80 p-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
                <SignalDot level={s.level} />
                {s.area}
              </p>
              <p className="mt-1 text-[12px] text-zinc-600">{s.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SignalDot({ level }: { level: DemoStatusLevel }) {
  const dot =
    level === "ok" ? "bg-emerald-500" : level === "warn" ? "bg-amber-500" : "bg-rose-500";
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />;
}

function CheckBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      ✓
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
      ✗
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "neutral" }) {
  const valueColor = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-zinc-900";
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
