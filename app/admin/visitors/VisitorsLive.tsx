"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LiveVisitorRow } from "@/lib/services/analytics";

/**
 * Live presence + recent-events feed for /admin/visitors.
 *
 * Hits two SSE endpoints:
 *
 *   /admin/visitors/api/presence   pushes the current "who is online
 *                                  in the last 5 minutes" snapshot
 *                                  every 10 seconds.
 *
 *   /admin/visitors/api/stream     pushes new page_views as they land,
 *                                  same SSE pattern as monitor.
 *
 * Connection lifetime is capped at 5 minutes by the server. EventSource
 * auto-reconnects when the server closes, which is exactly what we want.
 */

type StreamEvent = {
  id: string;
  path: string;
  referrer_host: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  is_bot: boolean;
  created_at: string;
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function VisitorsLive({ seed }: { seed: LiveVisitorRow[] }) {
  const [presence, setPresence] = useState<LiveVisitorRow[]>(seed);
  const [stream, setStream] = useState<StreamEvent[]>([]);
  const presenceSrc = useRef<EventSource | null>(null);
  const streamSrc = useRef<EventSource | null>(null);

  useEffect(() => {
    const presence = new EventSource("/admin/visitors/api/presence");
    presenceSrc.current = presence;
    presence.onmessage = (event) => {
      try {
        const rows = JSON.parse(event.data) as LiveVisitorRow[];
        setPresence(rows);
      } catch {
        /* ignore parse errors */
      }
    };
    presence.onerror = () => {
      /* EventSource auto-reconnects */
    };

    const stream = new EventSource("/admin/visitors/api/stream");
    streamSrc.current = stream;
    stream.onmessage = (event) => {
      try {
        const row = JSON.parse(event.data) as StreamEvent;
        setStream((prev) => [row, ...prev].slice(0, 50));
      } catch {
        /* ignore parse errors */
      }
    };
    stream.onerror = () => {
      /* EventSource auto-reconnects */
    };

    return () => {
      presence.close();
      stream.close();
      presenceSrc.current = null;
      streamSrc.current = null;
    };
  }, []);

  return (
    <div className="space-y-5">
      {presence.length === 0 ? (
        <p className="text-sm text-zinc-500">No visitors active right now.</p>
      ) : (
        <ul className="space-y-1.5">
          {presence.map((v) => (
            <li
              key={v.visitorId}
              className="flex items-center gap-3 text-sm"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <Link
                href={`/admin/visitors/sessions/${v.sessionId}`}
                className="font-mono text-xs text-zinc-900 hover:underline"
              >
                {v.path}
              </Link>
              <span className="text-xs text-zinc-500">
                {[v.city, v.country].filter(Boolean).join(", ") || "-"}
              </span>
              <span className="text-xs text-zinc-500">
                {[v.browser, v.deviceType].filter(Boolean).join(" / ") || "-"}
              </span>
              <span className="ml-auto font-mono text-xs text-zinc-400">
                {formatRelative(v.lastSeenAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {stream.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Live event stream
          </p>
          <ul className="max-h-72 space-y-1 overflow-auto rounded-md border border-zinc-100 bg-zinc-50/50 p-3">
            {stream.map((row) => (
              <li
                key={row.id}
                className="flex items-baseline gap-2 font-mono text-[11px]"
              >
                <span className="text-zinc-400">{formatRelative(row.created_at)}</span>
                <span className="text-zinc-900">{row.path}</span>
                <span className="text-zinc-500">
                  {[row.city, row.country].filter(Boolean).join(", ") || "-"}
                </span>
                <span className="text-zinc-500">
                  {[row.browser, row.device_type].filter(Boolean).join(" / ") || "-"}
                </span>
                {row.is_bot ? (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    bot
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
