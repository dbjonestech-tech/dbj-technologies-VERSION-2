import type { CanopyAuditRow } from "@/lib/canopy/audit";

interface Props {
  audit: CanopyAuditRow[];
  title?: string;
  description?: string;
}

/* Per-entity audit log section. Server component (no client-side
 * interactivity needed - just renders the rows). Used on contact
 * and deal detail pages so each surface has the same audit shape:
 *
 *   action            who           when
 *   {before} -> {after}
 *
 * Empty audit shows a soft "no changes" state. The before/after
 * JSON is stringified rather than table-rendered because audit
 * payloads are heterogeneous; one row might have stage change,
 * another might have a renamed field, another tag adds. The fixed
 * format trades pretty for honest. */
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
                <span className="text-xs text-zinc-500">
                  {new Date(row.occurred_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {row.actor_email ?? "system"}
                {row.before && row.after ? (
                  <>
                    {" "}
                    <span className="font-mono">
                      {JSON.stringify(row.before)} -&gt; {JSON.stringify(row.after)}
                    </span>
                  </>
                ) : row.after ? (
                  <>
                    {" "}
                    <span className="font-mono">{JSON.stringify(row.after)}</span>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
