"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MonitoringEventRow } from "@/lib/services/monitoring";

const MAX_EVENTS_RETAINED = 200;

export default function MonitorLive({
  seed,
}: {
  seed: MonitoringEventRow[];
}) {
  const [events, setEvents] = useState<MonitoringEventRow[]>(seed);
  const [connected, setConnected] = useState<boolean>(false);
  const lastIdRef = useRef<string>(seed[0]?.id ?? "0");

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;

    function open() {
      if (cancelled) return;
      const url = `/admin/monitor/api/stream?after=${encodeURIComponent(lastIdRef.current)}`;
      source = new EventSource(url);
      source.onopen = () => setConnected(true);
      source.onmessage = (e) => {
        if (!e.data) return;
        try {
          const row = JSON.parse(e.data) as MonitoringEventRow;
          lastIdRef.current = row.id;
          setEvents((prev) => {
            /* Dedup by id. Reconnect logic uses ?after=lastId so the
             * stream should never replay rows we already have, but a
             * race between the seeded snapshot and the first SSE batch
             * can deliver an overlap. Without this guard React warns on
             * duplicate keys. */
            if (prev.some((p) => p.id === row.id)) return prev;
            const next = [row, ...prev];
            return next.slice(0, MAX_EVENTS_RETAINED);
          });
        } catch {
          /* malformed payload, skip */
        }
      };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (!cancelled) {
          // SSE route caps at 5 minutes; reopen with the latest id so we
          // pick up where we left off without replaying older rows.
          setTimeout(open, 1500);
        }
      };
    }

    open();
    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-xs">
        <span
          className={
            connected
              ? "text-emerald-600"
              : "text-amber-600"
          }
        >
          ● {connected ? "live" : "reconnecting…"}
        </span>
        <span className="text-zinc-500">
          {events.length} event{events.length === 1 ? "" : "s"} retained
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="px-3 py-2 font-semibold">Lvl</th>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold">Scan</th>
              <th className="px-3 py-2 font-semibold">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <EventRow key={e.id} row={e} />
            ))}
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-zinc-500"
                >
                  No events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({ row }: { row: MonitoringEventRow }) {
  const time = new Date(row.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const levelClass =
    row.level === "error"
      ? "text-red-600"
      : row.level === "warn"
        ? "text-amber-600"
        : "text-emerald-600";
  return (
    <tr className="border-t border-zinc-100">
      <td className="px-3 py-2 font-mono text-xs text-zinc-500">{time}</td>
      <td className={`px-3 py-2 ${levelClass}`}>{row.level}</td>
      <td className="px-3 py-2 font-mono text-xs text-zinc-900">{row.event}</td>
      <td className="px-3 py-2 font-mono text-[11px]">
        {row.scan_id ? (
          <Link
            href={`/admin/monitor/scan/${row.scan_id}`}
            className="text-blue-600 hover:underline"
          >
            {row.scan_id.slice(0, 8)}…
          </Link>
        ) : (
          <span className="text-zinc-400">-</span>
        )}
      </td>
      <td
        className="max-w-[300px] truncate px-3 py-2 font-mono text-[11px] text-zinc-500"
        title={JSON.stringify(row.payload)}
      >
        {Object.keys(row.payload).length === 0
          ? "-"
          : JSON.stringify(row.payload)}
      </td>
    </tr>
  );
}
