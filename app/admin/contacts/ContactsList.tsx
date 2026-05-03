"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  X,
} from "lucide-react";
import {
  CONTACT_STATUSES,
  CONTACT_SOURCES,
  type ContactListRow,
  type ContactSource,
  type ContactStatus,
} from "@/lib/services/contacts";
import {
  createContactAction,
  syncContactsAction,
} from "@/lib/actions/contacts";
import type { SequenceRow } from "@/lib/canopy/automation/sequences";
import BulkActionsBar from "./BulkActionsBar";

type Props = {
  rows: ContactListRow[];
  activeStatus: ContactStatus | "all";
  activeSource: ContactSource | "all";
  activeSearch: string;
  activeOverdue: boolean;
  sequences: SequenceRow[];
};

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

const SOURCE_LABEL: Record<ContactSource, string> = {
  pathlight_scan: "Scan",
  contact_form: "Form",
  manual: "Manual",
  client_import: "Client",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatFollowUp(iso: string | null): {
  label: string;
  tone: "overdue" | "soon" | "later" | "none";
} {
  if (!iso) return { label: "-", tone: "none" };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00.000Z");
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

export default function ContactsList({
  rows,
  activeStatus,
  activeSource,
  activeSearch,
  activeOverdue,
  sequences,
}: Props) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(activeSearch);
  const [showNewForm, setShowNewForm] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* Roving tabindex for keyboard navigation. focusedIndex tracks
   * which row owns tabIndex=0; arrow keys move it, Enter opens the
   * contact, Space toggles the row selection. */
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (focusedIndex >= rows.length) setFocusedIndex(Math.max(0, rows.length - 1));
  }, [rows.length, focusedIndex]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  const focusRow = useCallback(
    (idx: number) => {
      if (rows.length === 0) return;
      const clamped = Math.max(0, Math.min(rows.length - 1, idx));
      setFocusedIndex(clamped);
      rowRefs.current[clamped]?.focus();
    },
    [rows.length]
  );

  const onRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, idx: number, id: number) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusRow(idx + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusRow(idx - 1);
          break;
        case "Home":
          e.preventDefault();
          focusRow(0);
          break;
        case "End":
          e.preventDefault();
          focusRow(rows.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          router.push(`/admin/contacts/${id}`);
          break;
        case " ":
          /* Don't hijack space when the user is typing in an input
           * inside the row (search the whole tbody for focused input)
           * or when toggling the visible checkbox directly. */
          if ((e.target as HTMLElement).tagName === "INPUT") break;
          e.preventDefault();
          toggleOne(id);
          break;
      }
    },
    [focusRow, rows.length, router, toggleOne]
  );

  /* Debounced search: rewrite the URL after 300ms idle so the server
   * can re-query without flooding navigation events. */
  useEffect(() => {
    if (searchValue === activeSearch) return;
    const t = setTimeout(() => {
      const params = buildParams({
        status: activeStatus,
        source: activeSource,
        overdue: activeOverdue,
        search: searchValue,
      });
      router.push(`/admin/contacts${params}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  function navWith(updates: Partial<{
    status: ContactStatus | "all";
    source: ContactSource | "all";
    overdue: boolean;
  }>) {
    const params = buildParams({
      status: updates.status ?? activeStatus,
      source: updates.source ?? activeSource,
      overdue: updates.overdue ?? activeOverdue,
      search: searchValue,
    });
    router.push(`/admin/contacts${params}`);
  }

  async function onSync() {
    setSyncMessage("Syncing...");
    const result = await syncContactsAction();
    if (result.ok) {
      setSyncMessage(
        result.data.created === 0 && result.data.updated === 0
          ? "Already up to date"
          : `Synced: ${result.data.created} created, ${result.data.updated} updated`
      );
      router.refresh();
    } else {
      setSyncMessage(`Sync failed: ${result.error}`);
    }
    setTimeout(() => setSyncMessage(null), 4000);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pink-700"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New contact
        </button>
        <button
          type="button"
          onClick={() => startTransition(onSync)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Sync contacts
        </button>
        {syncMessage ? (
          <span className="text-xs text-zinc-600">{syncMessage}</span>
        ) : null}
      </div>

      {showNewForm ? (
        <NewContactForm
          onClose={() => setShowNewForm(false)}
          onCreated={(id) => {
            setShowNewForm(false);
            router.push(`/admin/contacts/${id}`);
          }}
        />
      ) : null}

      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Status
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip
              active={activeStatus === "all"}
              label="All"
              onClick={() => navWith({ status: "all" })}
            />
            {CONTACT_STATUSES.map((s) => (
              <Chip
                key={s}
                active={activeStatus === s}
                label={STATUS_LABEL[s]}
                onClick={() => navWith({ status: s })}
              />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Source
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Chip
              active={activeSource === "all"}
              label="All"
              onClick={() => navWith({ source: "all" })}
            />
            {CONTACT_SOURCES.map((s) => (
              <Chip
                key={s}
                active={activeSource === s}
                label={SOURCE_LABEL[s]}
                onClick={() => navWith({ source: s })}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[200px]">
            <SearchIcon
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search name, email, company"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 focus:border-pink-400 focus:outline-none"
            />
          </label>
          <Chip
            active={activeOverdue}
            label="Overdue only"
            onClick={() => navWith({ overdue: !activeOverdue })}
            tone="danger"
          />
        </div>
      </section>

      {selectedIds.size > 0 ? (
        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          sequences={sequences}
          onClear={() => setSelectedIds(new Set())}
          onMutated={() => router.refresh()}
        />
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-500">
            No contacts match the current filters. Click Sync contacts to
            backfill from existing leads, contact-form submissions, and
            engagement clients.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="canopy-table w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-2 font-semibold">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={rows.length > 0 && selectedIds.size === rows.length}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < rows.length;
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-semibold">Last activity</th>
                  <th className="px-3 py-2 text-right font-semibold">Follow-up</th>
                  <th className="px-3 py-2 text-right font-semibold">Touchpoints</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <ContactRow
                    key={r.id}
                    row={r}
                    selected={selectedIds.has(r.id)}
                    onToggle={() => toggleOne(r.id)}
                    tabIndex={focusedIndex === idx ? 0 : -1}
                    isFocused={focusedIndex === idx}
                    onKeyDown={(e) => onRowKeyDown(e, idx, r.id)}
                    onFocus={() => setFocusedIndex(idx)}
                    rowRef={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Chip({
  active,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  const activeClass =
    tone === "danger" && active
      ? "bg-red-600 text-white ring-red-500"
      : active
        ? "bg-pink-600 text-white ring-pink-500"
        : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${activeClass}`}
    >
      {label}
    </button>
  );
}

function ContactRow({
  row,
  selected,
  onToggle,
  tabIndex,
  isFocused,
  onKeyDown,
  onFocus,
  rowRef,
}: {
  row: ContactListRow;
  selected: boolean;
  onToggle: () => void;
  tabIndex: number;
  isFocused: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => void;
  onFocus: () => void;
  rowRef: (el: HTMLTableRowElement | null) => void;
}) {
  const followUp = formatFollowUp(row.followUpDate);
  const followUpClass =
    followUp.tone === "overdue"
      ? "text-red-700 font-semibold"
      : followUp.tone === "soon"
        ? "text-emerald-700"
        : followUp.tone === "later"
          ? "text-zinc-700"
          : "text-zinc-400";
  const focusedRing = isFocused
    ? "ring-2 ring-inset ring-pink-400 outline-none"
    : "outline-none";
  return (
    <tr
      ref={rowRef}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      aria-selected={selected}
      aria-label={`${row.name ?? row.email}${row.company ? ` at ${row.company}` : ""}, ${selected ? "selected" : "not selected"}. Press Enter to open, Space to toggle.`}
      className={`cursor-pointer border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-pink-50 ${focusedRing} ${selected ? "!bg-pink-100" : ""}`}
    >
      <td className="px-2 py-2 align-middle">
        <input
          type="checkbox"
          aria-label={`Select ${row.email}`}
          checked={selected}
          onChange={onToggle}
          /* Don't grab keyboard tab stops; row keyboard nav handles
           * select via Space. Mouse and screen-reader users still
           * interact with the checkbox directly. */
          tabIndex={-1}
        />
      </td>
      <td className="px-3 py-2">
        <Link
          href={`/admin/contacts/${row.id}`}
          className="block hover:underline"
          tabIndex={-1}
        >
          {row.name ? (
            <>
              <span className="font-semibold text-zinc-900">{row.name}</span>
              <p className="text-[11px] text-zinc-500">{row.email}</p>
            </>
          ) : (
            <span className="font-mono text-xs text-zinc-900">{row.email}</span>
          )}
          {row.company ? (
            <p className="text-[10px] text-zinc-400">{row.company}</p>
          ) : null}
        </Link>
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_TINT[row.status]}`}
        >
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-[11px] text-zinc-600">
        {SOURCE_LABEL[row.source]}
      </td>
      <td
        className="px-3 py-2 text-right font-mono text-[11px] text-zinc-500"
        title={
          row.lastActivityAt
            ? new Date(row.lastActivityAt).toLocaleString("en-US")
            : ""
        }
      >
        {formatRelative(row.lastActivityAt)}
      </td>
      <td className={`px-3 py-2 text-right text-xs ${followUpClass}`}>
        {followUp.label}
      </td>
      <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-600">
        {row.scanCount > 0 ? `${row.scanCount} scan${row.scanCount === 1 ? "" : "s"}` : null}
        {row.scanCount > 0 && (row.formCount > 0 || row.emailCount > 0) ? " · " : null}
        {row.formCount > 0 ? `${row.formCount} form${row.formCount === 1 ? "" : "s"}` : null}
        {row.formCount > 0 && row.emailCount > 0 ? " · " : null}
        {row.emailCount > 0 ? `${row.emailCount} email${row.emailCount === 1 ? "" : "s"}` : null}
        {row.scanCount === 0 && row.formCount === 0 && row.emailCount === 0 ? (
          <span className="text-zinc-400">none</span>
        ) : null}
      </td>
    </tr>
  );
}

function NewContactForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mb-6 rounded-xl border border-pink-200 bg-pink-50/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-pink-900">
          New contact
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-zinc-500 hover:bg-white hover:text-zinc-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const input = {
            email: String(data.get("email") || ""),
            name: String(data.get("name") || ""),
            company: String(data.get("company") || ""),
            phone: String(data.get("phone") || ""),
            website: String(data.get("website") || ""),
            initialNote: String(data.get("note") || ""),
          };
          startTransition(async () => {
            const result = await createContactAction(input);
            if (result.ok) {
              onCreated(result.data.id);
            } else {
              setError(result.error);
            }
          });
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Field name="email" label="Email" type="email" required icon={<Mail />} />
        <Field name="name" label="Name" />
        <Field name="company" label="Company" />
        <Field name="phone" label="Phone" icon={<Phone />} />
        <Field name="website" label="Website" placeholder="https://..." />
        <label className="sm:col-span-2 flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Initial note (optional)
          <textarea
            name="note"
            rows={2}
            className="mt-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-pink-400 focus:outline-none"
          />
        </label>
        {error ? (
          <p className="sm:col-span-2 text-xs text-red-700">{error}</p>
        ) : null}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:opacity-60"
          >
            {pending ? "Creating..." : "Create contact"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  icon,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {label}
      {required ? <span className="ml-1 text-pink-700">*</span> : null}
      <span className="relative mt-1">
        {icon ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400">
            {icon}
          </span>
        ) : null}
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={`w-full rounded-md border border-zinc-200 bg-white py-1.5 ${
            icon ? "pl-8" : "pl-3"
          } pr-3 text-xs text-zinc-900 focus:border-pink-400 focus:outline-none`}
        />
      </span>
    </label>
  );
}

function buildParams(args: {
  status: ContactStatus | "all";
  source: ContactSource | "all";
  overdue: boolean;
  search: string;
}): string {
  const sp = new URLSearchParams();
  if (args.status !== "all") sp.set("status", args.status);
  if (args.source !== "all") sp.set("source", args.source);
  if (args.overdue) sp.set("overdue", "1");
  if (args.search.trim()) sp.set("q", args.search.trim());
  const s = sp.toString();
  return s ? `?${s}` : "";
}
