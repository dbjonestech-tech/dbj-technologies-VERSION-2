import type { CanopyAuditRow } from "@/lib/canopy/audit";

interface Props {
  audit: CanopyAuditRow[];
  title?: string;
  description?: string;
}

/* Per-entity audit log section. Server component (no client-side
 * interactivity needed). Used on contact and deal detail pages.
 *
 * Each row renders:
 *   action  (+ relative timestamp, absolute on hover)
 *   actor
 *   key-by-key diff: before/after JSON broken into added (+green),
 *                    removed (-red), and changed (red->green) lines.
 * Empty audit shows a soft "no changes" state. */
export default function EntityAuditList({
  audit,
  title = "Audit log",
  description = "Every change to this record, who made it, and the before/after values. Powered by canopy_audit_log.",
}: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-3">
        <h2 className="font-display text-base font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </header>
      {audit.length === 0 ? (
        <p className="text-sm text-zinc-500">No changes recorded yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {audit.map((row) => (
            <li key={row.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-700">{row.action}</span>
                <span
                  className="text-xs text-zinc-500"
                  title={new Date(row.occurred_at).toLocaleString()}
                >
                  {formatRelative(row.occurred_at)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {row.actor_email ?? "system"}
              </p>
              <DiffView before={row.before} after={row.after} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  if (ms < 5_000) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface DiffEntry {
  type: "added" | "removed" | "changed" | "unchanged";
  key: string;
  before?: unknown;
  after?: unknown;
}

function DiffView({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (before === null && after === null) return null;

  /* Both are objects: compute key-by-key diff. */
  if (before !== null && after !== null) {
    const entries = computeDiff(before, after);
    if (entries.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px]">
        {entries.map((e) => (
          <DiffLine key={e.key} entry={e} />
        ))}
      </ul>
    );
  }

  /* Single-sided payloads: a creation (after only) or a deletion
   * (before only). Render the present side as a key:value list
   * tinted to the appropriate tone. */
  const present = after ?? before;
  if (!present) return null;
  const keys = Object.keys(present).sort();
  if (keys.length === 0) return null;
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

function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): DiffEntry[] {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  ).sort();
  const out: DiffEntry[] = [];
  for (const key of keys) {
    const inBefore = key in before;
    const inAfter = key in after;
    if (inBefore && !inAfter) {
      out.push({ type: "removed", key, before: before[key] });
    } else if (!inBefore && inAfter) {
      out.push({ type: "added", key, after: after[key] });
    } else if (stringify(before[key]) !== stringify(after[key])) {
      out.push({
        type: "changed",
        key,
        before: before[key],
        after: after[key],
      });
    }
    /* Skip unchanged keys: they add noise and the diff is for what
     * actually moved. */
  }
  return out;
}

function DiffLine({ entry }: { entry: DiffEntry }) {
  if (entry.type === "added") {
    return (
      <li className="flex gap-2 font-mono">
        <span className="shrink-0 text-emerald-600">+</span>
        <span className="text-zinc-500">{entry.key}:</span>
        <span className="break-all text-emerald-700">
          {stringify(entry.after)}
        </span>
      </li>
    );
  }
  if (entry.type === "removed") {
    return (
      <li className="flex gap-2 font-mono">
        <span className="shrink-0 text-rose-600">-</span>
        <span className="text-zinc-500">{entry.key}:</span>
        <span className="break-all text-rose-700 line-through">
          {stringify(entry.before)}
        </span>
      </li>
    );
  }
  if (entry.type === "changed") {
    return (
      <li className="flex flex-wrap items-baseline gap-2 font-mono">
        <span className="shrink-0 text-amber-600">~</span>
        <span className="text-zinc-500">{entry.key}:</span>
        <span className="break-all text-rose-700 line-through">
          {stringify(entry.before)}
        </span>
        <span className="text-zinc-400">→</span>
        <span className="break-all text-emerald-700">
          {stringify(entry.after)}
        </span>
      </li>
    );
  }
  return null;
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
