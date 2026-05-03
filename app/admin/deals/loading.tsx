/* Cold-load skeleton for /admin/deals. Mirrors the deals board shape:
 * page header, three rollup cards, and a 6-column kanban grid.
 * Renders during getDealsForKanban + getDealRollups and streams out
 * when the real page is ready. Pure server component. */

const STAGE_LABELS = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function DealsLoading() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-200/70" />
          <div className="mt-3 h-9 w-48 animate-pulse rounded bg-zinc-200/70 sm:h-10 sm:w-64" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-zinc-200/50" />
          <div className="mt-1.5 h-4 w-3/4 max-w-xl animate-pulse rounded bg-zinc-200/50" />
        </header>

        {/* Rollup row */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200/60" />
              <div className="mt-2 h-7 w-32 animate-pulse rounded bg-zinc-200/70" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-200/50" />
            </div>
          ))}
        </section>

        {/* Kanban board */}
        <section className="overflow-x-auto">
          <div className="grid min-w-[1100px] grid-cols-6 gap-3">
            {STAGE_LABELS.map((label, ci) => (
              <div
                key={label}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-zinc-200/70" />
                  <div className="h-3 w-6 animate-pulse rounded bg-zinc-200/50" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: ci === 5 ? 1 : 3 - (ci % 2) }).map((_, ri) => (
                    <div
                      key={ri}
                      className="rounded-lg border border-zinc-100 bg-zinc-50/40 p-3"
                    >
                      <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200/70" />
                      <div className="mt-1.5 h-2.5 w-3/4 animate-pulse rounded bg-zinc-200/50" />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-3 w-12 animate-pulse rounded bg-zinc-200/60" />
                        <div className="h-3 w-16 animate-pulse rounded bg-zinc-200/60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
