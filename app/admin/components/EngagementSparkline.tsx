"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SparklinePoint } from "@/lib/analytics/contact";

interface Props {
  data: SparklinePoint[];
  totals: {
    notes: number;
    calls: number;
    meetings: number;
    emails: number;
    tasks_completed: number;
    scans: number;
  };
  medianResponseMinutes: number | null;
}

function formatResponseMinutes(m: number | null): string {
  if (m === null) return "-";
  if (m < 60) return `${m}m`;
  const hours = m / 60;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = hours / 24;
  return `${Math.round(days * 10) / 10}d`;
}

export default function EngagementSparkline({ data, totals, medianResponseMinutes }: Props) {
  const total30d =
    totals.notes + totals.calls + totals.meetings + totals.emails + totals.tasks_completed;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-zinc-900">Engagement (30d)</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Activities recorded against this contact, day by day.
          </p>
        </div>
        <span className="font-mono text-2xl font-semibold text-zinc-900">{total30d}</span>
      </header>

      {data.length > 0 ? (
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="engagement-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 11, padding: "4px 8px" }}
                formatter={(v) => [`${Number(v) || 0} activities`, "count"]}
                labelFormatter={(label) =>
                  new Date(String(label)).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <Area type="monotone" dataKey="count" stroke="#0891b2" fill="url(#engagement-grad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-zinc-400">No activity yet.</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs sm:grid-cols-6">
        <Stat label="Notes" value={totals.notes} />
        <Stat label="Calls" value={totals.calls} />
        <Stat label="Meetings" value={totals.meetings} />
        <Stat label="Emails" value={totals.emails} />
        <Stat label="Tasks done" value={totals.tasks_completed} />
        <Stat label="Scans" value={totals.scans} />
      </dl>

      <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Median response time
        </p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-900">
          {formatResponseMinutes(medianResponseMinutes)}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Time between an inbound signal and the next outbound action.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-base font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}
