"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MonitoringEventRow } from "@/lib/services/monitoring";

const MAX_EVENTS_RETAINED = 200;

export default function MonitorLive({
  seed,
  pin,
}: {
  seed: MonitoringEventRow[];
  pin: string;
}) {
  const [events, setEvents] = useState<MonitoringEventRow[]>(seed);
  const [connected, setConnected] = useState<boolean>(false);
  const lastIdRef = useRef<string>(seed[0]?.id ?? "0");

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;

    function open() {
      if (cancelled) return;
      const url = `/internal/monitor/api/stream?pin=${encodeURIComponent(pin)}&after=${encodeURIComponent(lastIdRef.current)}`;
      source = new EventSource(url);
      source.onopen = () => setConnected(true);
      source.onmessage = (e) => {
        if (!e.data) return;
        try {
          const row = JSON.parse(e.data) as MonitoringEventRow;
          lastIdRef.current = row.id;
          setEvents((prev) => {
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
  }, [pin]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span
          style={{ color: connected ? "#86efac" : "#fcd34d" }}
        >
          ● {connected ? "live" : "reconnecting…"}
        </span>
        <span style={{ color: "#6b7280" }}>
          {events.length} event{events.length === 1 ? "" : "s"} retained
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Lvl</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Scan</th>
              <th className="px-3 py-2">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <EventRow key={e.id} row={e} pin={pin} />
            ))}
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center"
                  style={{ color: "#9aa3b2" }}
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

function EventRow({ row, pin }: { row: MonitoringEventRow; pin: string }) {
  const time = new Date(row.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const levelColor =
    row.level === "error"
      ? "#fca5a5"
      : row.level === "warn"
        ? "#fcd34d"
        : "#86efac";
  return (
    <tr className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <td
        className="px-3 py-2 font-mono text-xs"
        style={{ color: "#9aa3b2" }}
      >
        {time}
      </td>
      <td className="px-3 py-2" style={{ color: levelColor }}>
        {row.level}
      </td>
      <td className="px-3 py-2 font-mono text-xs">{row.event}</td>
      <td className="px-3 py-2 font-mono text-[11px]">
        {row.scan_id ? (
          <Link
            href={`/internal/monitor/scan/${row.scan_id}?pin=${encodeURIComponent(pin)}`}
            style={{ color: "#60a5fa" }}
          >
            {row.scan_id.slice(0, 8)}…
          </Link>
        ) : (
          <span style={{ color: "#6b7280" }}>-</span>
        )}
      </td>
      <td
        className="max-w-[300px] truncate px-3 py-2 font-mono text-[11px]"
        style={{ color: "#9aa3b2" }}
        title={JSON.stringify(row.payload)}
      >
        {Object.keys(row.payload).length === 0
          ? "-"
          : JSON.stringify(row.payload)}
      </td>
    </tr>
  );
}
