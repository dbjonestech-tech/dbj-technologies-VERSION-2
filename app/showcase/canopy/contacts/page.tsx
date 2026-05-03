import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { DEMO_CONTACTS, formatRelativeTime } from "@/lib/demo/fixtures";
import type { ContactStatus } from "@/lib/services/contacts";

/* Showcase contacts list. Static rendering of the same table look
 * the live /admin/contacts page produces, fed from fixture data. */

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const STATUS_TINT: Record<ContactStatus, string> = {
  new: "bg-blue-100 text-blue-700 ring-blue-200",
  contacted: "bg-amber-100 text-amber-700 ring-amber-200",
  qualified: "bg-violet-100 text-violet-700 ring-violet-200",
  proposal: "bg-cyan-100 text-cyan-700 ring-cyan-200",
  won: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  lost: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const SOURCE_LABEL: Record<string, string> = {
  pathlight_scan: "Scan",
  contact_form: "Form",
  manual: "Manual",
  client_import: "Client",
};

export default function ShowcaseContactsPage() {
  const rows = DEMO_CONTACTS;
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-700">
            Relationships
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Contacts
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Every active relationship in one place. Status,
            touchpoints, follow-up date, and last interaction visible
            at a glance. Filter by status or source. Bulk-tag,
            sequence-enroll, or export from the selection bar.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New contact
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Sync contacts
          </button>
        </div>

        <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip active label="All" />
              {(Object.keys(STATUS_LABEL) as ContactStatus[]).map((s) => (
                <Chip key={s} label={STATUS_LABEL[s]} />
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Source
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip active label="All" />
              <Chip label="Scan" />
              <Chip label="Form" />
              <Chip label="Manual" />
              <Chip label="Client" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[200px]">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
              />
              <input
                type="search"
                disabled
                placeholder="Search name, email, company"
                className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400"
              />
            </label>
            <Chip label="Overdue only" tone="danger" />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="overflow-x-auto">
            <table className="canopy-table w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider">
                  <th className="px-2 py-2 font-semibold">
                    <input type="checkbox" disabled aria-label="Select all" />
                  </th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Last activity
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Follow-up
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Touchpoints
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const followUp = formatFollowUp(r.followUpDate);
                  return (
                    <tr
                      key={r.id}
                      className="cursor-pointer border-t border-zinc-100 transition-colors hover:bg-pink-50"
                    >
                      <td className="px-2 py-2 align-middle">
                        <input
                          type="checkbox"
                          disabled
                          tabIndex={-1}
                          aria-label={`Select ${r.email}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href="/showcase/canopy/contacts"
                          className="block hover:underline"
                          tabIndex={-1}
                        >
                          <span className="font-semibold">{r.name}</span>
                          <p className="text-[11px]">{r.email}</p>
                          <p className="text-[10px]">{r.company}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_TINT[r.status]}`}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        {SOURCE_LABEL[r.source]}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        {r.lastActivityAt
                          ? formatRelativeTime(r.lastActivityAt)
                          : "-"}
                      </td>
                      <td
                        className={`px-3 py-2 text-right text-xs ${
                          followUp.tone === "overdue"
                            ? "font-semibold text-red-700"
                            : followUp.tone === "soon"
                              ? "text-emerald-700"
                              : ""
                        }`}
                      >
                        {followUp.label}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        {r.scanCount > 0
                          ? `${r.scanCount} scan${r.scanCount === 1 ? "" : "s"}`
                          : null}
                        {r.scanCount > 0 && r.formCount > 0 ? " · " : null}
                        {r.formCount > 0
                          ? `${r.formCount} form${r.formCount === 1 ? "" : "s"}`
                          : null}
                        {(r.scanCount > 0 || r.formCount > 0) && r.emailCount > 0
                          ? " · "
                          : null}
                        {r.emailCount > 0
                          ? `${r.emailCount} email${r.emailCount === 1 ? "" : "s"}`
                          : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({
  active,
  label,
  tone,
}: {
  active?: boolean;
  label: string;
  tone?: "danger";
}) {
  const cls =
    tone === "danger" && active
      ? "bg-red-600 text-white ring-red-500"
      : active
        ? "bg-pink-600 text-white ring-pink-500"
        : "bg-white text-zinc-700 ring-zinc-200";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

function formatFollowUp(iso: string | null): {
  label: string;
  tone: "overdue" | "soon" | "later" | "none";
} {
  if (!iso) return { label: "-", tone: "none" };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00.000Z`);
  const days = Math.round(
    (target.getTime() - today.getTime()) / 86_400_000
  );
  const formatted = target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  if (days < 0) return { label: `${formatted} (overdue)`, tone: "overdue" };
  if (days <= 3) return { label: formatted, tone: "soon" };
  return { label: formatted, tone: "later" };
}
