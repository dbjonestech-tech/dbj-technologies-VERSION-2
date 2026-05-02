"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Search } from "lucide-react";
import { acknowledgeWebsiteSignalAction } from "@/lib/actions/prospect-lists";
import type { SignalWithContact } from "@/lib/canopy/change-monitoring";

interface SignalRow extends SignalWithContact {
  kind_label: string;
  kind_tone: string;
}

interface Props {
  initial: SignalRow[];
}

export default function WebsiteChangesClient({ initial }: Props) {
  const [rows, setRows] = useState<SignalRow[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAck(id: number) {
    setError(null);
    start(async () => {
      const r = await acknowledgeWebsiteSignalAction({ signalId: id });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows((s) => s.filter((x) => x.id !== id));
    });
  }

  if (rows.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-sm text-zinc-600">
          No unacknowledged website-change signals.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          The cron runs daily at 09:30 UTC. New signals appear here when a tracked site&apos;s etag, Last-Modified, or content-hash changes since the previous probe.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      <table className="canopy-table w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Contact</th>
            <th className="text-left">URL</th>
            <th className="text-left">Change</th>
            <th className="text-left">Observed</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                {s.contact_id ? (
                  <Link
                    href={`/admin/contacts/${s.contact_id}`}
                    className="font-semibold text-zinc-900 hover:underline"
                  >
                    {s.contact_company || s.contact_name || s.contact_email || `Contact #${s.contact_id}`}
                  </Link>
                ) : (
                  <span className="text-xs text-zinc-500">unlinked</span>
                )}
              </td>
              <td>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-700 hover:underline"
                >
                  {s.url}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </td>
              <td>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.kind_tone}`}
                >
                  {s.kind_label}
                </span>
                {s.error_message ? (
                  <span className="ml-2 text-[10px] text-red-700">
                    {s.error_message}
                  </span>
                ) : null}
              </td>
              <td className="text-xs text-zinc-500">
                {new Date(s.observed_at).toLocaleString()}
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {s.contact_id ? (
                    <Link
                      href={`/admin/contacts/${s.contact_id}#rescan`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                      title="Open the contact and trigger a manual rescan"
                    >
                      <Search className="h-3 w-3" />
                      Re-scan
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleAck(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <Check className="h-3 w-3" />
                    Acknowledge
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
