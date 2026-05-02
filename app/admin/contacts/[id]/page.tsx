import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Eye,
  Mail,
  MessageSquare,
  PenLine,
  Search,
  ArrowRight,
  User,
  ExternalLink,
} from "lucide-react";
import {
  getContact,
  getContactNotes,
  getContactTimeline,
  getPathlightScansForContact,
  type ContactRow,
  type TimelineEntry,
  type TimelineEventType,
} from "@/lib/services/contacts";
import {
  getDealsForContact,
  formatDealValue,
  type DealRow,
} from "@/lib/services/deals";
import { getActivitiesForContact } from "@/lib/services/activities";
import PageHeader from "../../PageHeader";
import ContactHeader from "./ContactHeader";
import ContactNotes from "./ContactNotes";
import ActivityComposer from "../../components/ActivityComposer";
import ActivityFeed from "../../components/ActivityFeed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: false, nocache: true },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContactDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const contact = await getContact(id);
  if (!contact) notFound();

  const [timeline, notes, scanInfo, deals, activities] = await Promise.all([
    getContactTimeline(contact.email, contact.id, 50),
    getContactNotes(contact.id),
    getPathlightScansForContact(contact.email),
    getDealsForContact(contact.id),
    getActivitiesForContact(contact.id, 50),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/admin/contacts"
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
        >
          ← All contacts
        </Link>
        <PageHeader
          palette="pink"
          section="Relationships"
          pageName={contact.name || contact.email}
          description={
            contact.company
              ? `${contact.company} · ${contact.email}`
              : contact.email
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ContactHeader contact={contact} />
          {scanInfo.latest ? (
            <PathlightScanCard
              latest={scanInfo.latest}
              totalCount={scanInfo.totalCount}
            />
          ) : null}
        </div>

        <DealsPanel deals={deals} />

        <div className="mt-8">
          <ActivityComposer contactId={contact.id} />
        </div>

        {activities.length > 0 ? (
          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
            <header className="mb-4">
              <h2 className="font-display text-base font-semibold text-zinc-900">
                Logged activities
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Calls, meetings, tasks, and notes you've logged for this contact. Counted in the dashboard's Today's Tasks card and the per-deal audit log.
              </p>
            </header>
            <ActivityFeed activities={activities} />
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <header className="mb-4">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Activity timeline
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {timeline.length} entr{timeline.length === 1 ? "y" : "ies"} from
              page views, scans, contact-form submissions, email events,
              status changes, and your own notes.
            </p>
          </header>

          <ContactNotes contactId={contact.id} notes={notes} />

          <Timeline entries={timeline} />
        </section>
      </div>
    </div>
  );
}

function DealsPanel({ deals }: { deals: DealRow[] }) {
  const open = deals.filter((d) => d.closed_at === null);
  const closed = deals.filter((d) => d.closed_at !== null);
  const openValue = open.reduce((s, d) => s + Number(d.value_cents), 0);
  const wonValue = closed
    .filter((d) => d.won === true)
    .reduce((s, d) => s + Number(d.value_cents), 0);

  return (
    <section className="mt-8 rounded-xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/40 to-white p-6 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Deals
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            {open.length} open · {closed.length} closed · {formatDealValue(openValue)} open value
            {wonValue > 0 ? ` · ${formatDealValue(wonValue)} won` : ""}
          </p>
        </div>
        <Link
          href="/admin/deals"
          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200"
        >
          Open Deals board <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>
      {deals.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No deals yet. Create the first deal from the Deals board (the contact will be linked automatically) or via the API once Phase 8 ships.
        </p>
      ) : (
        <ul className="divide-y divide-violet-100">
          {deals.map((d) => (
            <li key={d.id} className="py-3">
              <Link
                href={`/admin/deals/${d.id}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    {d.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {d.closed_at
                      ? `${d.won ? "Won" : "Lost"} on ${new Date(d.closed_at).toLocaleDateString()}`
                      : `${d.stage} · ${d.probability_pct}% probability`}
                    {d.expected_close_at && !d.closed_at
                      ? ` · expected ${d.expected_close_at}`
                      : ""}
                  </p>
                  {d.loss_reason ? (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Loss reason: {d.loss_reason}
                    </p>
                  ) : null}
                </div>
                <span className="font-mono text-sm font-semibold text-zinc-900">
                  {formatDealValue(Number(d.value_cents), d.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PathlightScanCard({
  latest,
  totalCount,
}: {
  latest: NonNullable<
    Awaited<ReturnType<typeof getPathlightScansForContact>>["latest"]
  >;
  totalCount: number;
}) {
  const scoreClass =
    latest.score === null
      ? "bg-zinc-100 text-zinc-700"
      : latest.score < 50
        ? "bg-red-100 text-red-700 ring-red-300"
        : latest.score < 75
          ? "bg-amber-100 text-amber-700 ring-amber-300"
          : "bg-emerald-100 text-emerald-700 ring-emerald-300";
  const monthly = latest.estimatedMonthlyImpact;
  return (
    <aside className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/40 to-violet-50 p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">
        Pathlight scan
      </p>
      <p className="mt-2 font-display text-base font-semibold text-zinc-900">
        {latest.businessName ?? "Most recent scan"}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full ring-2 ring-inset ${scoreClass}`}
        >
          <span className="font-mono text-xl font-semibold">
            {latest.score ?? "-"}
          </span>
          <span className="text-[8px] uppercase tracking-wider opacity-80">
            score
          </span>
        </div>
        <div className="text-xs text-zinc-700">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Estimated monthly impact
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-zinc-900">
            {typeof monthly === "number"
              ? `$${Math.round(monthly).toLocaleString("en-US")}`
              : "Not available"}
          </p>
        </div>
      </div>
      <Link
        href={`/pathlight/${latest.scanId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
      >
        View full report <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </Link>
      {totalCount > 1 ? (
        <p className="mt-2 text-[11px] text-zinc-500">
          {totalCount - 1} earlier scan{totalCount - 1 === 1 ? "" : "s"} on file
        </p>
      ) : null}
    </aside>
  );
}

const ICON_BY_TYPE: Record<TimelineEventType, { Icon: typeof Eye; tone: string }> = {
  page_view: { Icon: Eye, tone: "bg-cyan-100 text-cyan-700" },
  scan: { Icon: Search, tone: "bg-violet-100 text-violet-700" },
  email: { Icon: Mail, tone: "bg-amber-100 text-amber-700" },
  contact_form: { Icon: MessageSquare, tone: "bg-blue-100 text-blue-700" },
  note: { Icon: PenLine, tone: "bg-zinc-100 text-zinc-700" },
  status_change: { Icon: ArrowRight, tone: "bg-emerald-100 text-emerald-700" },
  client: { Icon: User, tone: "bg-rose-100 text-rose-700" },
};

function formatTimelineDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-zinc-500">
        No activity yet. Once they run a Pathlight scan, submit the contact
        form, or you add a note, it will appear here.
      </p>
    );
  }
  return (
    <ol className="mt-2 space-y-4">
      {entries.map((entry, i) => {
        const cfg = ICON_BY_TYPE[entry.eventType];
        const Icon = cfg.Icon;
        return (
          <li
            key={`${entry.eventType}-${entry.timestamp}-${i}`}
            className="flex gap-3"
          >
            <span
              className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${cfg.tone}`}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-semibold text-zinc-900">{entry.title}</p>
                <p
                  className="font-mono text-[11px] text-zinc-400"
                  title={new Date(entry.timestamp).toLocaleString("en-US")}
                >
                  {formatTimelineDate(entry.timestamp)}
                </p>
              </div>
              {entry.detail ? (
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  {entry.detail}
                </p>
              ) : null}
              {entry.link ? (
                <Link
                  href={entry.link}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pink-700 hover:underline"
                  target={entry.link.startsWith("/admin") ? undefined : "_blank"}
                  rel={
                    entry.link.startsWith("/admin")
                      ? undefined
                      : "noopener noreferrer"
                  }
                >
                  Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export type { ContactRow };
