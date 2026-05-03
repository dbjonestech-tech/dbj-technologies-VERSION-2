import { DEMO_AUDIT, formatRelativeTime } from "@/lib/demo/fixtures";

/* Showcase audit log. Same key-by-key diff visualization the
 * EntityAuditList renders on real contact and deal pages, fed from
 * fixture data. */

export default function ShowcaseAuditPage() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-700">
            Account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Audit log
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Every operator-initiated change. Relative timestamp on
            each entry, absolute on hover. Diffs render key-by-key:
            green for additions, red strikethrough for removals,
            amber for changes. Unchanged keys are skipped to keep
            signal high.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <ul className="divide-y divide-zinc-100">
            {DEMO_AUDIT.map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-700">
                    {row.action}
                  </span>
                  <span
                    className="text-xs text-zinc-500"
                    title={new Date(row.occurredAt).toLocaleString()}
                  >
                    {formatRelativeTime(row.occurredAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{row.actor}</p>
                <DiffView before={row.before} after={row.after} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function DiffView({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (before === null && after === null) return null;

  if (before !== null && after !== null) {
    const keys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)])
    ).sort();
    const entries = keys
      .map((key) => {
        const inBefore = key in before;
        const inAfter = key in after;
        if (inBefore && !inAfter) {
          return { key, type: "removed" as const, before: before[key] };
        }
        if (!inBefore && inAfter) {
          return { key, type: "added" as const, after: after[key] };
        }
        if (stringify(before[key]) !== stringify(after[key])) {
          return {
            key,
            type: "changed" as const,
            before: before[key],
            after: after[key],
          };
        }
        return null;
      })
      .filter(
        (
          e
        ): e is
          | { key: string; type: "added"; after: unknown }
          | { key: string; type: "removed"; before: unknown }
          | { key: string; type: "changed"; before: unknown; after: unknown } =>
          e !== null
      );
    if (entries.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px]">
        {entries.map((e) => {
          if (e.type === "added") {
            return (
              <li key={e.key} className="flex gap-2 font-mono">
                <span className="shrink-0 text-emerald-600">+</span>
                <span className="text-zinc-500">{e.key}:</span>
                <span className="break-all text-emerald-700">
                  {stringify(e.after)}
                </span>
              </li>
            );
          }
          if (e.type === "removed") {
            return (
              <li key={e.key} className="flex gap-2 font-mono">
                <span className="shrink-0 text-rose-600">-</span>
                <span className="text-zinc-500">{e.key}:</span>
                <span className="break-all text-rose-700 line-through">
                  {stringify(e.before)}
                </span>
              </li>
            );
          }
          return (
            <li
              key={e.key}
              className="flex flex-wrap items-baseline gap-2 font-mono"
            >
              <span className="shrink-0 text-amber-600">~</span>
              <span className="text-zinc-500">{e.key}:</span>
              <span className="break-all text-rose-700 line-through">
                {stringify(e.before)}
              </span>
              <span className="text-zinc-400">→</span>
              <span className="break-all text-emerald-700">
                {stringify(e.after)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const present = after ?? before;
  if (!present) return null;
  const keys = Object.keys(present).sort();
  const isCreate = after !== null;
  const sign = isCreate ? "+" : "-";
  const signClass = isCreate ? "text-emerald-600" : "text-rose-600";
  const valueClass = isCreate ? "text-emerald-700" : "text-rose-700";
  return (
    <ul className="mt-2 space-y-1 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px]">
      {keys.map((k) => (
        <li key={k} className="flex gap-2 font-mono">
          <span className={`shrink-0 ${signClass}`}>{sign}</span>
          <span className="text-zinc-500">{k}:</span>
          <span className={`break-all ${valueClass}`}>
            {stringify(present[k])}
          </span>
        </li>
      ))}
    </ul>
  );
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
