"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AvgTimeInStageRow,
  LossReasonRow,
  PipelineSummary,
  RevenueBucket,
  SourceAttributionRow,
} from "@/lib/analytics/pipeline";
import { formatDealValue } from "@/lib/services/deals";

interface Props {
  summary: PipelineSummary;
  timeInStage: AvgTimeInStageRow[];
  revenue: RevenueBucket[];
  sources: SourceAttributionRow[];
  lossReasons: LossReasonRow[];
}

const STAGE_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#0ea5e9",
  qualified: "#0891b2",
  proposal: "#7c3aed",
  won: "#059669",
  lost: "#dc2626",
};

const SOURCE_COLORS = ["#0891b2", "#7c3aed", "#f59e0b", "#059669", "#dc2626", "#64748b"];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-zinc-500">{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default function PipelineDashboard({
  summary,
  timeInStage,
  revenue,
  sources,
  lossReasons,
}: Props) {
  const funnelData = summary.funnel.map((r) => ({
    stage: r.stage,
    open: r.open_count,
    closed: r.closed_count,
    open_value: r.open_value_cents / 100,
  }));

  const timeInStageData = timeInStage.map((r) => ({
    stage: r.stage,
    avg_days: r.avg_days ?? 0,
    sample_size: r.sample_size,
  }));

  const revenueData = revenue.map((r) => ({
    month: new Date(r.bucket_start).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    won: r.won_cents / 100,
    count: r.won_count,
  }));

  const sourceData = sources.map((s) => ({
    name: s.source,
    contacts: s.contacts,
    deals_won: s.deals_won,
    won_value: s.won_value_cents / 100,
  }));

  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatDealValue(summary.open_pipeline_cents)}
          hint={`${summary.funnel.reduce((s, r) => s + r.open_count, 0)} open deals`}
        />
        <StatCard
          label="Win rate (30d)"
          value={summary.win_rate_30d_pct === null ? "-" : `${summary.win_rate_30d_pct}%`}
          hint={summary.win_rate_90d_pct === null ? "no closed deals" : `90d: ${summary.win_rate_90d_pct}%`}
        />
        <StatCard
          label="Avg deal size (90d won)"
          value={summary.avg_deal_size_cents === null ? "-" : formatDealValue(summary.avg_deal_size_cents)}
        />
        <StatCard
          label="Avg sales cycle (180d won)"
          value={summary.avg_sales_cycle_days === null ? "-" : `${summary.avg_sales_cycle_days}d`}
          hint="created_at to closed_at"
        />
      </div>

      <ChartCard
        title="Stage funnel"
        hint="Open and closed deal counts by stage. Bar color matches the kanban column."
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="stage" stroke="#71717a" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="open" name="Open" fill="#0891b2">
                {funnelData.map((d) => (
                  <Cell key={`open-${d.stage}`} fill={STAGE_COLORS[d.stage] ?? "#0891b2"} />
                ))}
              </Bar>
              <Bar dataKey="closed" name="Closed" fill="#a1a1aa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Approx time in pipeline by stage"
          hint="Created-to-now (or to close) average. Without a stage history table, this is a residence approximation, not a true Markovian dwell time."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeInStageData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="stage" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} unit="d" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="avg_days" name="Avg days" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue (won deals, last 12 months)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(value) =>
                    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0)
                  }
                />
                <Line type="monotone" dataKey="won" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Source attribution (last 180 days)" hint="Contacts created and deals won, grouped by source.">
          {sourceData.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="contacts" nameKey="name" outerRadius={88} label fontSize={12}>
                    {sourceData.map((_, i) => (
                      <Cell key={`s-${i}`} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Loss reasons (last 180 days)">
          {lossReasons.length === 0 ? (
            <p className="text-sm text-zinc-500">No losses recorded.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lossReasons.map((r) => ({
                    reason: r.reason,
                    count: r.count,
                    forfeited: r.forfeited_value_cents / 100,
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 96, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" stroke="#71717a" fontSize={12} />
                  <YAxis type="category" dataKey="reason" stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
