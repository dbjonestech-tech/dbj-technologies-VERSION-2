import Link from "next/link";
import { Activity, Calendar, ExternalLink, Sparkles } from "lucide-react";
import type { AttributionEvent } from "@/lib/canopy/attribution-beacon";
import type { BeaconRollup, MetricSeries } from "@/lib/canopy/case-study";

interface Props {
  dealId: number;
  contactId: number;
  events: AttributionEvent[];
  beacon: BeaconRollup;
  series: MetricSeries[];
  beaconEnabled: boolean;
}

const EVENT_LABEL: Record<AttributionEvent["event_type"], string> = {
  scan_sent: "Scan sent",
  meeting_booked: "Meeting booked",
  proposal_sent: "Proposal sent",
  deal_won: "Deal won",
  site_launched: "Site launched",
  metric_recorded: "Metric recorded",
  milestone: "Milestone",
};

export default function CaseStudyTab({
  contactId,
  events,
  beacon,
  series,
  beaconEnabled,
}: Props) {
  const total =
    beacon.total_pageviews +
    beacon.total_sessions +
    beacon.total_conversions +
    beacon.total_form_submits;

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-zinc-900">
            <Sparkles className="h-4 w-4 text-zinc-500" aria-hidden />
            Case study
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Attribution events and live beacon data on this deal&apos;s post-launch site. Use this tab to build the public case study after the engagement ships.
          </p>
        </div>
        <Link
          href="/admin/canopy/beacon"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Beacon snippet
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {!beaconEnabled ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Attribution beacon is disabled in <Link href="/admin/canopy" className="underline">/admin/canopy</Link>. The endpoint will return 403 until the toggle is on.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Pageviews" value={beacon.total_pageviews} tone="zinc" />
        <Tile label="Sessions" value={beacon.total_sessions} tone="sky" />
        <Tile label="Conversions" value={beacon.total_conversions} tone="emerald" />
        <Tile label="Form submits" value={beacon.total_form_submits} tone="violet" />
      </div>

      {total === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
          No beacon data yet for this client (contact #{contactId}). Generate the snippet from <Link href="/admin/canopy/beacon" className="underline">/admin/canopy/beacon</Link> and paste it on the launched site.
        </p>
      ) : (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Last {series.length} active day{series.length === 1 ? "" : "s"}
          </h3>
          <ul className="space-y-1 font-mono text-xs">
            {series.slice(-14).map((d) => (
              <li
                key={d.date}
                className="flex items-center gap-3 rounded-md border border-zinc-100 px-3 py-1.5"
              >
                <span className="w-24 text-zinc-500">{d.date}</span>
                <span className="text-zinc-900">{d.pageviews} pv</span>
                <span className="text-emerald-700">{d.conversions} conv</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Attribution events
        </h3>
        {events.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-500">
            No attribution events recorded for this deal.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 text-xs"
              >
                <Calendar className="h-3 w-3 text-zinc-400" aria-hidden />
                <span className="font-mono text-[11px] text-zinc-500">
                  {new Date(e.recorded_at).toLocaleString()}
                </span>
                <span className="font-semibold text-zinc-900">
                  {EVENT_LABEL[e.event_type]}
                </span>
                {Object.keys(e.payload).length > 0 ? (
                  <code className="font-mono text-[10px] text-zinc-500">
                    {JSON.stringify(e.payload)}
                  </code>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "zinc" | "sky" | "emerald" | "violet";
}) {
  const ring =
    tone === "zinc"
      ? "border-zinc-200"
      : tone === "sky"
        ? "border-sky-200"
        : tone === "emerald"
          ? "border-emerald-200"
          : "border-violet-200";
  const text =
    tone === "zinc"
      ? "text-zinc-700"
      : tone === "sky"
        ? "text-sky-700"
        : tone === "emerald"
          ? "text-emerald-700"
          : "text-violet-700";
  return (
    <div className={`rounded-lg border ${ring} bg-white p-3`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-lg font-semibold ${text}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
