/* Cold-load skeleton for /admin/contacts. Mirrors the page shape:
 * page header, action bar, filter chips, contacts table. Renders
 * during the initial getContacts/getContactsDashboardSummary fetch
 * and streams out when the real page is ready. */

export default function ContactsLoading() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-200/70" />
          <div className="mt-3 h-9 w-56 animate-pulse rounded bg-zinc-200/70 sm:h-10 sm:w-72" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-zinc-200/50" />
        </header>

        {/* Action bar (New contact + Sync) */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-7 w-28 animate-pulse rounded-md bg-zinc-200/70" />
          <div className="h-7 w-32 animate-pulse rounded-md bg-zinc-200/60" />
        </div>

        {/* Filter card */}
        <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3">
            <div className="mb-2 h-3 w-12 animate-pulse rounded bg-zinc-200/60" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-16 animate-pulse rounded-full bg-zinc-200/60"
                />
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-2 h-3 w-12 animate-pulse rounded bg-zinc-200/60" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-20 animate-pulse rounded-full bg-zinc-200/60"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 flex-1 animate-pulse rounded-md bg-zinc-200/50" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-zinc-200/60" />
          </div>
        </section>

        {/* Table */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="overflow-hidden">
            <div className="border-b border-zinc-100 pb-2">
              <div className="flex gap-3">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-200/60" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200/60" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200/60" />
                <div className="ml-auto h-3 w-24 animate-pulse rounded bg-zinc-200/60" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-zinc-200/60" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-44 animate-pulse rounded bg-zinc-200/70" />
                    <div className="mt-1.5 h-2.5 w-32 animate-pulse rounded bg-zinc-200/50" />
                  </div>
                  <div className="hidden h-5 w-16 animate-pulse rounded-full bg-zinc-200/60 sm:block" />
                  <div className="hidden h-3 w-16 animate-pulse rounded bg-zinc-200/50 sm:block" />
                  <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/50" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
