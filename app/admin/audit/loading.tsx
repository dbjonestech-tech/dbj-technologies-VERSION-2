/* Cold-load skeleton for /admin/audit. Mirrors the page shape:
 * page header, four 24h stat cards, filter bar, results count line,
 * and the audit table. Renders while admin_audit_log is queried. */

export default function AuditLoading() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200/70" />
          <div className="mt-3 h-9 w-44 animate-pulse rounded bg-zinc-200/70 sm:h-10 sm:w-56" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-zinc-200/50" />
          <div className="mt-1.5 h-4 w-3/4 max-w-xl animate-pulse rounded bg-zinc-200/50" />
        </header>

        {/* 24h stat cards */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/60" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-zinc-200/70" />
            </div>
          ))}
        </section>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-8 w-36 animate-pulse rounded-md bg-zinc-200/50" />
            </div>
          ))}
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-200/70" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200/50" />
          </div>
        </div>

        <div className="mt-4 mb-3 h-3 w-32 animate-pulse rounded bg-zinc-200/50" />

        {/* Audit table */}
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 w-16 animate-pulse rounded bg-zinc-200/60"
                />
              ))}
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-t border-zinc-100 px-4 py-3"
            >
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-3 w-32 animate-pulse rounded bg-zinc-200/70" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200/60" />
              <div className="h-3 w-40 animate-pulse rounded bg-zinc-200/50" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/50" />
              <div className="ml-auto h-3 w-20 animate-pulse rounded bg-zinc-200/50" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
