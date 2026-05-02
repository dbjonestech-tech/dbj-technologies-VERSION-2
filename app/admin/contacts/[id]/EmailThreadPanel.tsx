import { ArrowDownLeft, ArrowUpRight, Eye, MousePointerClick } from "lucide-react";
import {
  getThreadEmailMessages,
  type EmailMessageRow,
} from "@/lib/canopy/email/messages";

function formatTimestamp(raw: string | null): string {
  if (!raw) return "";
  return new Date(raw).toLocaleString();
}

function effectiveDate(row: EmailMessageRow): string {
  return row.received_at ?? row.sent_at ?? row.created_at;
}

function clip(s: string | null, max = 220): string {
  if (!s) return "";
  const trimmed = s.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default async function EmailThreadPanel({
  contactId,
}: {
  contactId: number;
}) {
  const messages = await getThreadEmailMessages(contactId, 25).catch(() => []);
  if (messages.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-display text-sm font-semibold text-zinc-900">
          Email thread
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          No emails on file for this contact yet. Once a connected admin sends
          to this address or receives a reply, the thread will populate
          automatically (Gmail ingest runs every 5 minutes).
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <h2 className="font-display text-sm font-semibold text-zinc-900">
          Email thread
        </h2>
        <span className="text-xs text-zinc-500">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </header>
      <ul className="divide-y divide-zinc-100">
        {messages.map((m) => {
          const isOut = m.direction === "out";
          const opens = Array.isArray(m.opened_at) ? m.opened_at.length : 0;
          const clicks = Array.isArray(m.clicked_links)
            ? m.clicked_links.filter(
                (c) => c && typeof c === "object" && c.url !== "__send_failed__"
              ).length
            : 0;
          const failed =
            Array.isArray(m.clicked_links) &&
            m.clicked_links.some(
              (c) => c && typeof c === "object" && c.url === "__send_failed__"
            );
          return (
            <li key={m.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isOut
                      ? "bg-zinc-900 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                  title={isOut ? "Outbound" : "Inbound"}
                >
                  {isOut ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {m.subject ?? "(no subject)"}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatTimestamp(effectiveDate(m))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    <span className="font-mono">{m.from_address}</span>
                    {m.to_addresses.length > 0 && (
                      <>
                        {" → "}
                        <span className="font-mono">
                          {m.to_addresses.join(", ")}
                        </span>
                      </>
                    )}
                  </p>
                  {m.body_text && (
                    <p className="mt-1 text-sm text-zinc-700">
                      {clip(m.body_text)}
                    </p>
                  )}
                  {(opens > 0 || clicks > 0 || failed) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {opens > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                          <Eye className="h-3 w-3" /> {opens} open
                          {opens === 1 ? "" : "s"}
                        </span>
                      )}
                      {clicks > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">
                          <MousePointerClick className="h-3 w-3" /> {clicks}{" "}
                          click{clicks === 1 ? "" : "s"}
                        </span>
                      )}
                      {failed && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-800">
                          send failed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
