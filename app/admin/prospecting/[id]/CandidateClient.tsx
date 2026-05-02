"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import {
  addProspectCandidateAction,
  removeProspectCandidateAction,
  scanProspectCandidateAction,
} from "@/lib/actions/prospect-lists";
import type {
  ProspectCandidate,
  CandidateScanStatus,
  VerticalConfidence,
} from "@/lib/canopy/prospect-lists";

interface Props {
  listId: number;
  candidates: ProspectCandidate[];
  gateBlocked: boolean;
  gateReason: string | null;
  remaining: number;
}

const STATUS_TONES: Record<CandidateScanStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  scanning: "bg-amber-100 text-amber-700",
  scanned: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-zinc-100 text-zinc-500",
};

const CONFIDENCE_TONES: Record<VerticalConfidence, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-sky-100 text-sky-700",
  low: "bg-amber-100 text-amber-700",
  none: "bg-zinc-100 text-zinc-500",
};

export default function CandidateClient({
  listId,
  candidates,
  gateBlocked,
  gateReason,
  remaining,
}: Props) {
  const [rows, setRows] = useState<ProspectCandidate[]>(candidates);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({
    businessName: "",
    websiteUrl: "",
    location: "",
    vertical: "",
    businessModel: "",
    notes: "",
  });

  function handleAdd() {
    if (!draft.businessName.trim() || !draft.websiteUrl.trim()) return;
    setError(null);
    start(async () => {
      const r = await addProspectCandidateAction({
        listId,
        businessName: draft.businessName,
        websiteUrl: draft.websiteUrl,
        location: draft.location || undefined,
        vertical: draft.vertical || undefined,
        businessModel: draft.businessModel || undefined,
        notes: draft.notes || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setShowAdd(false);
      setDraft({
        businessName: "",
        websiteUrl: "",
        location: "",
        vertical: "",
        businessModel: "",
        notes: "",
      });
      window.location.reload();
    });
  }

  function handleScan(candidateId: number) {
    setError(null);
    start(async () => {
      const r = await scanProspectCandidateAction({ candidateId });
      if (!r.ok) {
        setError(r.reason ?? r.error);
        return;
      }
      setRows((s) =>
        s.map((row) =>
          row.id === candidateId ? { ...row, scan_status: "scanning" } : row
        )
      );
    });
  }

  function handleRemove(candidateId: number) {
    if (!confirm("Remove this candidate from the list?")) return;
    setError(null);
    start(async () => {
      const r = await removeProspectCandidateAction({ candidateId, listId });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows((s) => s.filter((x) => x.id !== candidateId));
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Scan budget
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
            {gateBlocked ? "Blocked" : `${remaining} remaining`}
          </p>
          {gateReason ? (
            <p className="mt-1 text-xs text-amber-700">{gateReason}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Add candidate
        </button>
      </section>

      {showAdd ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-display text-base font-semibold text-zinc-900">
            New candidate
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Business name *">
              <input
                type="text"
                value={draft.businessName}
                onChange={(e) =>
                  setDraft({ ...draft, businessName: e.target.value })
                }
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              />
            </Field>
            <Field label="Website URL *">
              <input
                type="text"
                placeholder="example.com"
                value={draft.websiteUrl}
                onChange={(e) =>
                  setDraft({ ...draft, websiteUrl: e.target.value })
                }
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              />
            </Field>
            <Field label="Vertical guess (will be matched against the curated database)">
              <input
                type="text"
                placeholder="e.g. Auto Repair Shop"
                value={draft.vertical}
                onChange={(e) =>
                  setDraft({ ...draft, vertical: e.target.value })
                }
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              />
            </Field>
            <Field label="Business model">
              <select
                value={draft.businessModel}
                onChange={(e) =>
                  setDraft({ ...draft, businessModel: e.target.value })
                }
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              >
                <option value="">unspecified</option>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
                <option value="mixed">mixed</option>
              </select>
            </Field>
            <Field label="Notes">
              <input
                type="text"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                pending || !draft.businessName.trim() || !draft.websiteUrl.trim()
              }
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add to list
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </section>
      ) : null}

      {rows.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-600">
            No candidates in this list yet.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Business</th>
                <th className="text-left">URL</th>
                <th className="text-left">Vertical</th>
                <th className="text-left">Confidence</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-semibold text-zinc-900">
                      {c.business_name}
                    </span>
                    {c.location ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        {c.location}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-700 hover:underline"
                    >
                      {c.website_url}
                    </a>
                  </td>
                  <td className="text-xs text-zinc-700">
                    {c.vertical ?? "-"}
                  </td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CONFIDENCE_TONES[c.vertical_confidence ?? "none"]}`}
                    >
                      {c.vertical_confidence ?? "none"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONES[c.scan_status]}`}
                    >
                      {c.scan_status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={
                          gateBlocked ||
                          pending ||
                          c.scan_status === "scanning" ||
                          c.scan_status === "scanned"
                        }
                        onClick={() => handleScan(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={gateBlocked ? (gateReason ?? "Gate blocked") : "Scan this candidate"}
                      >
                        <Search className="h-3 w-3" />
                        Scan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(c.id)}
                        className="rounded-md p-1 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-red-700"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
