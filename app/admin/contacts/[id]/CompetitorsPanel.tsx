"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, Swords, Trash2 } from "lucide-react";
import {
  addCompetitorAction,
  removeCompetitorAction,
  scanCompetitorsAction,
} from "@/lib/actions/competitors";
import {
  type Competitor,
  type CompetitorScanStatus,
  MAX_COMPETITORS_PER_CONTACT,
} from "@/lib/canopy/competitors";
import { useToast } from "../../components/Toast";

interface Props {
  contactId: number;
  initial: Competitor[];
  gateBlocked: boolean;
  gateReason: string | null;
}

const STATUS_TONES: Record<CompetitorScanStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  scanning: "bg-amber-100 text-amber-700",
  scanned: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default function CompetitorsPanel({
  contactId,
  initial,
  gateBlocked,
  gateReason,
}: Props) {
  const [rows, setRows] = useState<Competitor[]>(initial);
  const [pending, start] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ competitorName: "", websiteUrl: "" });
  const router = useRouter();
  const toast = useToast();

  const atCap = rows.length >= MAX_COMPETITORS_PER_CONTACT;

  function handleAdd() {
    if (!draft.competitorName.trim() || !draft.websiteUrl.trim()) return;
    const name = draft.competitorName.trim();
    start(async () => {
      const r = await addCompetitorAction({
        contactId,
        competitorName: draft.competitorName,
        websiteUrl: draft.websiteUrl,
      });
      if (!r.ok) {
        toast.show({ tone: "error", message: r.error });
        return;
      }
      setShowAdd(false);
      setDraft({ competitorName: "", websiteUrl: "" });
      toast.show({ tone: "success", message: `${name} added.` });
      /* Soft refresh: re-runs server components to pull the new row
       * (with its db-assigned id and default scan_status) without a
       * full page reload. Preserves scroll position and feels instant. */
      router.refresh();
    });
  }

  function handleRemove(id: number, name: string) {
    if (!confirm(`Remove ${name} from this contact's competitors?`)) return;
    start(async () => {
      const r = await removeCompetitorAction({ competitorId: id, contactId });
      if (!r.ok) {
        toast.show({ tone: "error", message: r.error });
        return;
      }
      setRows((s) => s.filter((c) => c.id !== id));
      toast.show({ tone: "info", message: `${name} removed.` });
    });
  }

  function handleScanAll() {
    start(async () => {
      const r = await scanCompetitorsAction({ contactId });
      if (!r.ok) {
        toast.show({ tone: "error", message: r.reason ?? r.error });
        return;
      }
      setRows((s) =>
        s.map((c) =>
          c.scan_status === "pending" || c.scan_status === "failed"
            ? { ...c, scan_status: "scanning" }
            : c
        )
      );
      toast.show({
        tone: "success",
        message: `Queued ${r.data.scanned} competitor scan${r.data.scanned === 1 ? "" : "s"}. ${r.data.remaining ?? 0} budget remaining.`,
      });
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-zinc-900">
            <Swords className="h-4 w-4 text-zinc-500" aria-hidden />
            Competitors
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Up to {MAX_COMPETITORS_PER_CONTACT} competitor sites per contact. Scanning all of them counts as N scans against the monthly Pathlight budget. Gated by the master kill and the competitive intelligence toggle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 ? (
            <button
              type="button"
              onClick={handleScanAll}
              disabled={
                gateBlocked ||
                pending ||
                rows.every(
                  (c) => c.scan_status === "scanning" || c.scan_status === "scanned"
                )
              }
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              title={gateBlocked ? (gateReason ?? "Gate blocked") : "Scan pending competitors"}
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              Scan all pending
            </button>
          ) : null}
          <button
            type="button"
            disabled={atCap}
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {atCap ? "Cap reached" : "Add"}
          </button>
        </div>
      </header>

      {showAdd ? (
        <div className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input
            type="text"
            placeholder="Competitor name"
            value={draft.competitorName}
            onChange={(e) =>
              setDraft({ ...draft, competitorName: e.target.value })
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
          />
          <input
            type="text"
            placeholder="example.com"
            value={draft.websiteUrl}
            onChange={(e) =>
              setDraft({ ...draft, websiteUrl: e.target.value })
            }
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                pending ||
                !draft.competitorName.trim() ||
                !draft.websiteUrl.trim()
              }
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center">
          <p className="text-xs text-zinc-500">
            No competitors tracked yet.
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Add up to {MAX_COMPETITORS_PER_CONTACT} sites to benchmark this contact's market against.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-zinc-900">{c.competitor_name}</p>
                <a
                  href={c.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-500 hover:underline"
                >
                  {c.website_url}
                </a>
              </div>
              <div className="flex items-center gap-3">
                {c.last_pathlight_score !== null ? (
                  <span className="font-mono text-xs text-zinc-700">
                    {c.last_pathlight_score}/100
                  </span>
                ) : null}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONES[c.scan_status]}`}
                >
                  {c.scan_status}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(c.id, c.competitor_name)}
                  className="rounded-md p-1 text-xs text-zinc-400 hover:text-red-700"
                  aria-label="Remove competitor"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
