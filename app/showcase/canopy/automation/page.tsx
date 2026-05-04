import {
  DEMO_SEQUENCES,
  DEMO_WORKFLOWS,
  DEMO_EMAIL_TEMPLATES,
  formatRelativeTime,
} from "@/lib/demo/fixtures";

/* Showcase automation. Sequences, workflow rules, and email
 * templates. Static rendering of the same surfaces /admin/sequences,
 * /admin/automations, and /admin/canopy/templates produce. */

export default function ShowcaseAutomationPage() {
  const activeSequences = DEMO_SEQUENCES.filter((s) => s.status === "active").length;
  const activeWorkflows = DEMO_WORKFLOWS.filter((w) => w.enabled).length;
  const fired24h = DEMO_WORKFLOWS.reduce((sum, w) => sum + w.fired24h, 0);
  const totalEnrolled = DEMO_SEQUENCES.reduce((sum, s) => sum + s.enrolled, 0);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-700">
            Automation
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Sequences & Workflows
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Sequences send multi-step outbound with reply-exit.
            Workflow rules fire on domain events, conditioned on the
            audit log. Every automated action writes the rule that
            fired it back to the same audit log, so a rule that fired
            wrong is one query away from explaining itself.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active sequences" value={String(activeSequences)} sub={`${totalEnrolled} contacts enrolled`} />
          <Stat label="Active rules" value={String(activeWorkflows)} sub={`${fired24h} fired in last 24h`} />
          <Stat label="Templates" value={String(DEMO_EMAIL_TEMPLATES.length)} sub="versioned, merge-aware" />
          <Stat label="Reply-exits, 7d" value={String(DEMO_SEQUENCES.reduce((s, q) => s + q.replied, 0))} sub="prospects who replied" />
        </section>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
            Sequences
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 text-right font-semibold">Enrolled</th>
                <th className="px-2 py-2 text-right font-semibold">Completed</th>
                <th className="px-2 py-2 text-right font-semibold">Replied</th>
                <th className="px-2 py-2 font-semibold">Next step</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SEQUENCES.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2">
                    <p className="text-[13px] font-semibold text-zinc-900">{s.name}</p>
                    <p className="text-[10px] text-zinc-500">{s.steps} steps</p>
                  </td>
                  <td className="px-2 py-2">
                    <SequenceStatusPill status={s.status} />
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{s.enrolled}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px] text-zinc-500">{s.completed}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px] text-emerald-700">{s.replied}</td>
                  <td className="px-2 py-2 text-[12px] text-zinc-700">{s.nextStepLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            Workflow Rules
          </h2>
          <ul className="divide-y divide-zinc-100">
            {DEMO_WORKFLOWS.map((w) => (
              <li key={w.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[260px]">
                    <p className="text-[13px] font-semibold text-zinc-900">{w.name}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      <span className="font-mono">{w.triggerLabel}</span>
                      {w.lastFiredAt ? <span> · last fired {formatRelativeTime(w.lastFiredAt)}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {w.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {w.fired24h} / 24h · {w.fired7d} / 7d
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
            Email Templates
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">Subject</th>
                <th className="px-2 py-2 text-right font-semibold">Merge fields</th>
                <th className="px-2 py-2 text-right font-semibold">Used</th>
                <th className="px-2 py-2 text-right font-semibold">Last sent</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_EMAIL_TEMPLATES.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2 text-[13px] font-semibold text-zinc-900">{t.name}</td>
                  <td className="px-2 py-2 font-mono text-[11px] text-zinc-700">{t.subject}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px] text-zinc-500">{t.mergeFieldCount}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{t.usedCount}</td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">
                    {t.lastUsedAt ? formatRelativeTime(t.lastUsedAt) : "-"}
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

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

function SequenceStatusPill({ status }: { status: "active" | "paused" | "draft" }) {
  const map = {
    active: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    paused: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    draft: { bg: "bg-zinc-50", ring: "ring-zinc-200", text: "text-zinc-700", dot: "bg-zinc-400" },
  } as const;
  const tone = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${tone.bg} ${tone.ring} ${tone.text}`}>
      <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {status}
    </span>
  );
}
