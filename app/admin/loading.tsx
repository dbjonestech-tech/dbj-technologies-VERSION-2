/* Cold-load skeleton for /admin. Mirrors the dashboard layout so the
 * operator never sees a flash of blank white before the real content
 * paints. Renders during the initial Promise.all in app/admin/page.tsx
 * and gets swapped out by Next.js streaming when the real page is
 * ready. Pure server component, no JS shipped to the client. */

export default function AdminLoading() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200/70" />
          <div className="mt-3 h-9 w-72 animate-pulse rounded bg-zinc-200/70 sm:h-10 sm:w-96" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-zinc-200/50" />
          <div className="mt-1.5 h-4 w-2/3 max-w-md animate-pulse rounded bg-zinc-200/50" />
        </header>

        {/* Status bar */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 animate-pulse rounded-full bg-zinc-200/70" />
            <div className="h-3 w-64 animate-pulse rounded bg-zinc-200/50" />
          </div>
        </section>

        {/* Pipeline rollups */}
        <section className="mb-8">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-zinc-200/60" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="h-3 w-28 animate-pulse rounded bg-zinc-200/60" />
                <div className="mt-3 h-8 w-32 animate-pulse rounded bg-zinc-200/70" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-200/50" />
              </div>
            ))}
          </div>
        </section>

        {/* Today's tasks card */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-4 w-32 animate-pulse rounded bg-zinc-200/60" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/60" />
                <div className="mt-2 h-7 w-12 animate-pulse rounded bg-zinc-200/70" />
              </div>
            ))}
          </div>
        </section>

        {/* Card grid (4 columns on lg) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-4 lg:gap-6">
              {Array.from({ length: col === 1 ? 5 : 4 }).map((_, row) => (
                <div
                  key={row}
                  className="flex h-[200px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-12 w-12 animate-pulse rounded-xl bg-zinc-200/70" />
                  </div>
                  <div className="h-4 w-32 animate-pulse rounded bg-zinc-200/70" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-zinc-200/50" />
                  <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-zinc-200/50" />
                  <div className="mt-auto flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-200/70" />
                    <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/60" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
