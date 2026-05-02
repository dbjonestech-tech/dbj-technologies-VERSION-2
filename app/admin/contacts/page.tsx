import type { Metadata } from "next";
import {
  getContacts,
  getContactsDashboardSummary,
  CONTACT_STATUSES,
  CONTACT_SOURCES,
  type ContactStatus,
  type ContactSource,
} from "@/lib/services/contacts";
import { listSequences } from "@/lib/canopy/automation/sequences";
import PageHeader from "../PageHeader";
import ContactsList from "./ContactsList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false, nocache: true },
};

function parseFilter<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[]
): T | "all" {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "all";
  if (value === "all") return "all";
  return (allowed as readonly string[]).includes(value) ? (value as T) : "all";
}

function parseString(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = parseFilter<ContactStatus>(params["status"], CONTACT_STATUSES);
  const source = parseFilter<ContactSource>(params["source"], CONTACT_SOURCES);
  const search = parseString(params["q"]);
  const overdueOnly = params["overdue"] === "1";

  const [contacts, summary, sequences] = await Promise.all([
    getContacts({
      status,
      source,
      search: search || undefined,
      overdueOnly,
    }),
    getContactsDashboardSummary(),
    listSequences(),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="pink"
          section="Relationships"
          pageName="Contacts"
          description="Every person you can follow up with. Pathlight scan signups, contact-form submissions, manually-added prospects, and engagement clients in one place."
        />

        <SummaryStrip summary={summary} />

        <ContactsList
          rows={contacts}
          activeStatus={status}
          activeSource={source}
          activeSearch={search}
          activeOverdue={overdueOnly}
          sequences={sequences}
        />
      </div>
    </div>
  );
}

function SummaryStrip({
  summary,
}: {
  summary: {
    total: number;
    newThisWeek: number;
    overdue: number;
  };
}) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Stat label="Total contacts" value={summary.total.toString()} />
      <Stat
        label="New this week"
        value={summary.newThisWeek.toString()}
        tone="info"
      />
      <Stat
        label="Follow-ups overdue"
        value={summary.overdue.toString()}
        tone={summary.overdue > 0 ? "danger" : "good"}
      />
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "info" | "danger" | "good";
}) {
  const valueClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "good"
        ? "text-emerald-700"
        : tone === "info"
          ? "text-pink-700"
          : "text-zinc-900";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
