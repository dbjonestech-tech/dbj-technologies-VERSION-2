"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { CalendarRange, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useReducedMotion } from "framer-motion";

/* Self-contained dashboard above the recent visitors table. Owns the
 * date-range state and fetches the per-range payload from
 * /admin/api/visitors-data. The recent visitors table below is driven
 * by the URL ?before= cursor and is intentionally independent. */

export type SeriesPoint = { date: string; visitors: number };

export type DashboardMetrics = {
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  pagesPerSession: number;
  conversions: number;
  previousVisitors: number | null;
  previousSessions: number | null;
  previousPageViews: number | null;
  previousBounceRate: number | null;
  previousPagesPerSession: number | null;
  previousConversions: number | null;
};

export type DashboardTopPage = {
  path: string;
  prettyPath: string;
  views: number;
  sessions: number;
  visitors: number;
  pct: number;
};

export type DashboardTopSource = {
  source: string;
  sessions: number;
  scanConversions: number;
  contactConversions: number;
  pct: number;
};

export type DashboardDevice = {
  device: string;
  sessions: number;
  pct: number;
};

export type DashboardEngagement = {
  engaged: number;
  light: number;
  none: number;
  likelyBot: number;
};

export type DashboardTopCity = {
  city: string;
  region: string;
  country: string;
  visitors: number;
};

export type VisitorsDashboardData = {
  windowDays: number;
  currentStart: string;
  currentEnd: string;
  previousStart: string | null;
  previousEnd: string | null;
  series: SeriesPoint[];
  comparisonSeries: SeriesPoint[];
  metrics: DashboardMetrics;
  topPages: DashboardTopPage[];
  topSources: DashboardTopSource[];
  devices: DashboardDevice[];
  engagement: DashboardEngagement;
  topCities: DashboardTopCity[];
};

type RangeKey = "7d" | "14d" | "30d" | "90d" | "custom";

const RANGE_LABELS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "14d", label: "14D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDelta(current: number, previous: number | null): {
  pct: number | null;
  label: string;
  tone: "up" | "down" | "flat" | "none";
} {
  if (previous === null || previous === undefined) {
    return { pct: null, label: "", tone: "none" };
  }
  if (previous === 0 && current === 0) {
    return { pct: 0, label: "0%", tone: "flat" };
  }
  if (previous === 0) {
    return { pct: 100, label: "new", tone: "up" };
  }
  const pct = ((current - previous) / previous) * 100;
  const abs = Math.abs(pct);
  if (abs < 2) {
    return { pct: 0, label: "flat", tone: "flat" };
  }
  return {
    pct,
    label: `${abs.toFixed(0)}%`,
    tone: pct > 0 ? "up" : "down",
  };
}

function shortDateLabel(iso: string, windowDays: number): string {
  const d = new Date(iso + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return iso;
  if (windowDays <= 14) {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function fullDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* Source-color helper. Determines a hue from the source string itself
 * (no hardcoded full-domain map). Direct = zinc, Google = emerald,
 * social = blue, anything else = violet. */
function sourceColor(source: string): { bg: string; bar: string } {
  const s = source.toLowerCase();
  if (s === "(direct)" || s === "direct" || s === "(none)") {
    return { bg: "bg-zinc-100", bar: "bg-zinc-400" };
  }
  if (s.includes("google")) {
    return { bg: "bg-emerald-100", bar: "bg-emerald-500" };
  }
  if (
    s.includes("twitter") ||
    s.includes("x.com") ||
    s.includes("facebook") ||
    s.includes("fb.com") ||
    s.includes("instagram") ||
    s.includes("linkedin") ||
    s.includes("tiktok") ||
    s.includes("youtube") ||
    s.includes("reddit")
  ) {
    return { bg: "bg-blue-100", bar: "bg-blue-500" };
  }
  return { bg: "bg-violet-100", bar: "bg-violet-500" };
}

export default function VisitorsDashboard() {
  const reduced = useReducedMotion();
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [data, setData] = useState<VisitorsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build a stable query string for fetch identity tracking.
  const fetchKey = useMemo(() => {
    if (rangeKey === "custom") {
      return `from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(
        customTo
      )}`;
    }
    return `range=${rangeKey}`;
  }, [rangeKey, customFrom, customTo]);

  useEffect(() => {
    if (rangeKey === "custom" && (!customFrom || !customTo)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/admin/api/visitors-data?${fetchKey}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = (await res.json()) as VisitorsDashboardData;
        if (!cancelled) {
          setData(j);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, customFrom, customTo, rangeKey]);

  return (
    <section className="mb-6 space-y-6">
      <HeroChart
        data={data}
        loading={loading}
        error={error}
        rangeKey={rangeKey}
        onRangeChange={(k) => {
          setRangeKey(k);
          if (k !== "custom") setShowCustomPanel(false);
        }}
        showCustomPanel={showCustomPanel}
        toggleCustom={() => {
          if (rangeKey !== "custom") setRangeKey("custom");
          setShowCustomPanel((v) => !v);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        reducedMotion={reduced ?? false}
      />

      <SummaryLine data={data} />
      <MetricTiles data={data} />
      <BreakdownPanels data={data} />
      <GeographyPanel data={data} />
    </section>
  );
}

function HeroChart({
  data,
  loading,
  error,
  rangeKey,
  onRangeChange,
  showCustomPanel,
  toggleCustom,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  reducedMotion,
}: {
  data: VisitorsDashboardData | null;
  loading: boolean;
  error: string | null;
  rangeKey: RangeKey;
  onRangeChange: (k: RangeKey) => void;
  showCustomPanel: boolean;
  toggleCustom: () => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
  reducedMotion: boolean;
}) {
  const series = useMemo(() => data?.series ?? [], [data?.series]);
  const comparison = useMemo(
    () => data?.comparisonSeries ?? [],
    [data?.comparisonSeries]
  );
  const windowDays = data?.windowDays ?? 30;
  const lastValue = series.length > 0 ? series[series.length - 1]!.visitors : 0;

  // Merge both series for the composed chart. Comparison is aligned by
  // index so the dashed ghost line tracks the same calendar position
  // (day 1 of current vs day 1 of previous) regardless of the actual
  // dates. fillDailySeries on the server guarantees equal-length arrays
  // when comparisonSeries is non-empty.
  const merged = useMemo(() => {
    return series.map((p, i) => ({
      date: p.date,
      visitors: p.visitors,
      comparison:
        comparison.length > i ? comparison[i]?.visitors ?? null : null,
    }));
  }, [series, comparison]);

  // Sensible tick count: 7-10 ticks max.
  const tickInterval = useMemo(() => {
    const len = merged.length;
    if (len <= 10) return 0;
    return Math.max(1, Math.floor(len / 8));
  }, [merged.length]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Visitors over time
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Daily unique visitors with the previous period for comparison.
          </p>
        </div>
        <RangePills
          rangeKey={rangeKey}
          onRangeChange={onRangeChange}
          showCustomPanel={showCustomPanel}
          toggleCustom={toggleCustom}
        />
      </div>

      {showCustomPanel ? (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="mt-1 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-900 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            To
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="mt-1 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-900 focus:border-sky-400 focus:outline-none"
            />
          </label>
          {customFrom && customTo ? (
            <p className="text-xs text-zinc-600">
              {fullDateLabel(customFrom)} to {fullDateLabel(customTo)}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Pick both dates to apply.</p>
          )}
        </div>
      ) : null}

      <div
        className={`relative transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
      >
        {error ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500 sm:h-[280px]">
            Could not load chart. Try a different range or refresh.
          </div>
        ) : (
          <div className="h-[200px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={merged}
                margin={{ top: 10, right: 24, bottom: 0, left: -16 }}
              >
                <defs>
                  <linearGradient id="visitorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => shortDateLabel(v, windowDays)}
                  interval={tickInterval}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#e4e4e7" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip content={<HeroTooltip />} />
                {comparison.length > 0 ? (
                  <Line
                    type="monotone"
                    dataKey="comparison"
                    stroke="#a1a1aa"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    dot={false}
                    isAnimationActive={!reducedMotion}
                  />
                ) : null}
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="url(#visitorFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#0284c7" }}
                  isAnimationActive={!reducedMotion}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {!error && !loading && lastValue > 0 ? (
          <div className="pointer-events-none absolute right-6 top-2 text-[10px] uppercase tracking-wider text-sky-700">
            <span className="font-semibold">{formatNumber(lastValue)}</span>{" "}
            today
          </div>
        ) : null}
      </div>
    </div>
  );
}

type TooltipPayload = {
  payload: { date: string; visitors: number; comparison: number | null };
};

function HeroTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<TooltipPayload>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const cur = p.visitors;
  const prev = p.comparison;
  const delta = formatDelta(cur, prev);
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-900/95 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
        {label ? fullDateLabel(label) : ""}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold text-white">
        {formatNumber(cur)} visitor{cur === 1 ? "" : "s"}
      </p>
      {prev !== null && prev !== undefined ? (
        <p className="mt-0.5 text-[11px] text-zinc-300">
          {formatNumber(prev)} previous period
          {delta.tone !== "none" ? (
            <span
              className={`ml-2 ${
                delta.tone === "up"
                  ? "text-emerald-400"
                  : delta.tone === "down"
                    ? "text-rose-400"
                    : "text-zinc-400"
              }`}
            >
              {delta.tone === "up" ? "▲" : delta.tone === "down" ? "▼" : "·"}{" "}
              {delta.label}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function RangePills({
  rangeKey,
  onRangeChange,
  showCustomPanel,
  toggleCustom,
}: {
  rangeKey: RangeKey;
  onRangeChange: (k: RangeKey) => void;
  showCustomPanel: boolean;
  toggleCustom: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
      {RANGE_LABELS.map((r) => {
        const active = rangeKey === r.key;
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onRangeChange(r.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {r.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={toggleCustom}
        aria-label="Custom date range"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          rangeKey === "custom" || showCustomPanel
            ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-200"
            : "text-zinc-600 hover:text-zinc-900"
        }`}
      >
        <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function SummaryLine({ data }: { data: VisitorsDashboardData | null }) {
  if (!data) return null;
  const { visitors, previousVisitors } = data.metrics;
  const days = data.windowDays;
  const delta = formatDelta(visitors, previousVisitors);

  let toneClass = "text-zinc-600";
  let toneIcon: React.ReactNode = null;
  if (delta.tone === "up") {
    toneClass = "text-emerald-700";
    toneIcon = <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
  } else if (delta.tone === "down") {
    toneClass = "text-rose-700";
    toneIcon = <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />;
  } else if (delta.tone === "flat") {
    toneClass = "text-zinc-500";
    toneIcon = <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  return (
    <p className="text-sm leading-relaxed text-zinc-700">
      <span className="font-semibold text-zinc-900">
        {formatNumber(visitors)}
      </span>{" "}
      unique visitor{visitors === 1 ? "" : "s"} in the last {days} day
      {days === 1 ? "" : "s"}
      {previousVisitors !== null && delta.tone !== "none" ? (
        <span className={`ml-1 inline-flex items-center gap-1 ${toneClass}`}>
          ,{" "}
          {delta.tone === "flat"
            ? "roughly flat"
            : delta.tone === "up"
              ? `up ${delta.label}`
              : `down ${delta.label}`}{" "}
          from the previous {days} day{days === 1 ? "" : "s"}
          {toneIcon}
        </span>
      ) : previousVisitors === null ? (
        <span className="ml-1 text-zinc-500">
          (not enough history for comparison)
        </span>
      ) : null}
      .
    </p>
  );
}

function MetricTiles({ data }: { data: VisitorsDashboardData | null }) {
  if (!data) return <MetricTilesSkeleton />;
  const m = data.metrics;
  const tiles = [
    {
      label: "Unique Visitors",
      value: formatNumber(m.visitors),
      cur: m.visitors,
      prev: m.previousVisitors,
      invert: false,
    },
    {
      label: "Sessions",
      value: formatNumber(m.sessions),
      cur: m.sessions,
      prev: m.previousSessions,
      invert: false,
    },
    {
      label: "Page Views",
      value: formatNumber(m.pageViews),
      cur: m.pageViews,
      prev: m.previousPageViews,
      invert: false,
    },
    {
      label: "Bounce Rate",
      value: `${m.bounceRate.toFixed(1)}%`,
      cur: m.bounceRate,
      prev: m.previousBounceRate,
      invert: true, // lower bounce = good
    },
    {
      label: "Pages / Session",
      value: m.pagesPerSession.toFixed(1),
      cur: m.pagesPerSession,
      prev: m.previousPagesPerSession,
      invert: false,
    },
    {
      label: "Conversions",
      value: formatNumber(m.conversions),
      cur: m.conversions,
      prev: m.previousConversions,
      invert: false,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <MetricTile key={t.label} {...t} />
      ))}
    </div>
  );
}

function MetricTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 bg-white p-3 opacity-60"
        >
          <div className="h-2 w-16 rounded bg-zinc-200" />
          <div className="mt-2 h-5 w-12 rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

function MetricTile({
  label,
  value,
  cur,
  prev,
  invert,
}: {
  label: string;
  value: string;
  cur: number;
  prev: number | null;
  invert: boolean;
}) {
  const delta = formatDelta(cur, prev);
  // For inverted metrics (bounce rate), an "up" delta is bad.
  const effectiveTone =
    invert && delta.tone === "up"
      ? "down"
      : invert && delta.tone === "down"
        ? "up"
        : delta.tone;
  const arrowClass =
    effectiveTone === "up"
      ? "text-emerald-700"
      : effectiveTone === "down"
        ? "text-rose-700"
        : "text-zinc-500";
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">
        {value}
      </p>
      {prev !== null && delta.tone !== "none" ? (
        <p
          className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold ${arrowClass}`}
        >
          {effectiveTone === "up" ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : effectiveTone === "down" ? (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Minus className="h-3 w-3" aria-hidden="true" />
          )}
          {delta.label}
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] text-zinc-400">no comparison</p>
      )}
    </div>
  );
}

function BreakdownPanels({ data }: { data: VisitorsDashboardData | null }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TopPagesPanel rows={data?.topPages ?? []} />
      <TopSourcesPanel rows={data?.topSources ?? []} />
      <DevicesEngagementPanel
        devices={data?.devices ?? []}
        engagement={
          data?.engagement ?? { engaged: 0, light: 0, none: 0, likelyBot: 0 }
        }
      />
    </div>
  );
}

function TopPagesPanel({ rows }: { rows: DashboardTopPage[] }) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? rows : rows.slice(0, 8);
  const max = rows.length > 0 ? rows[0]!.views : 1;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-zinc-900">
        Top pages
      </h3>
      {display.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {display.map((r) => (
            <li key={r.path} className="group">
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-3"
                title={`${formatNumber(r.views)} views · ${formatNumber(r.sessions)} sessions · ${formatNumber(r.visitors)} visitors`}
              >
                <div className="min-w-0 truncate font-mono text-xs text-zinc-900">
                  {r.prettyPath}
                </div>
                <div className="font-mono text-[11px] text-zinc-500">
                  {r.pct.toFixed(1)}%
                </div>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{
                    width: `${Math.max(2, (r.views / max) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 8 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs font-semibold text-sky-700 hover:underline"
        >
          {showAll ? "Show top 8" : `Show all ${rows.length}`}
        </button>
      ) : null}
    </div>
  );
}

function TopSourcesPanel({ rows }: { rows: DashboardTopSource[] }) {
  const display = rows.slice(0, 6);
  const max = rows.length > 0 ? rows[0]!.sessions : 1;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-zinc-900">
        Top sources
      </h3>
      {display.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {display.map((r) => {
            const c = sourceColor(r.source);
            return (
              <li key={r.source}>
                <div
                  className="grid grid-cols-[1fr_auto] items-center gap-3"
                  title={`${formatNumber(r.sessions)} sessions · ${formatNumber(r.scanConversions)} scans · ${formatNumber(r.contactConversions)} forms`}
                >
                  <div className="min-w-0 truncate font-mono text-xs text-zinc-900">
                    {r.source}
                  </div>
                  <div className="font-mono text-[11px] text-zinc-500">
                    {r.pct.toFixed(1)}%
                  </div>
                </div>
                <div
                  className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${c.bg}`}
                >
                  <div
                    className={`h-full rounded-full ${c.bar} transition-all`}
                    style={{
                      width: `${Math.max(2, (r.sessions / max) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DevicesEngagementPanel({
  devices,
  engagement,
}: {
  devices: DashboardDevice[];
  engagement: DashboardEngagement;
}) {
  const desktop = devices.find((d) => d.device === "desktop")?.pct ?? 0;
  const mobile = devices.find((d) => d.device === "mobile")?.pct ?? 0;
  const tablet = devices.find((d) => d.device === "tablet")?.pct ?? 0;

  const totalEng = engagement.engaged + engagement.light + engagement.none;
  const engPct = totalEng > 0 ? (engagement.engaged / totalEng) * 100 : 0;
  const lightPct = totalEng > 0 ? (engagement.light / totalEng) * 100 : 0;
  const nonePct = totalEng > 0 ? (engagement.none / totalEng) * 100 : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-zinc-900">
        Devices + engagement
      </h3>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Devices
        </p>
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${desktop}%` }}
            title={`Desktop ${desktop.toFixed(1)}%`}
          />
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${mobile}%` }}
            title={`Mobile ${mobile.toFixed(1)}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${tablet}%` }}
            title={`Tablet ${tablet.toFixed(1)}%`}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
          <span>
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 align-middle" />
            Desktop {desktop.toFixed(0)}%
          </span>
          <span>
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-violet-500 align-middle" />
            Mobile {mobile.toFixed(0)}%
          </span>
          <span>
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />
            Tablet {tablet.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Engagement
        </p>
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${engPct}%` }}
            title={`Engaged ${engPct.toFixed(1)}%`}
          />
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${lightPct}%` }}
            title={`Light ${lightPct.toFixed(1)}%`}
          />
          <div
            className="h-full bg-rose-400 transition-all"
            style={{ width: `${nonePct}%` }}
            title={`None ${nonePct.toFixed(1)}%`}
          />
        </div>
        <div className="mt-2 text-[11px] text-zinc-600">
          {formatNumber(engagement.engaged)} engaged ·{" "}
          {formatNumber(engagement.light)} light ·{" "}
          {formatNumber(engagement.none)} none
        </div>
        {engagement.likelyBot > 0 ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
            {formatNumber(engagement.likelyBot)} likely bot
            {engagement.likelyBot === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function GeographyPanel({ data }: { data: VisitorsDashboardData | null }) {
  const cities = data?.topCities ?? [];
  if (cities.length === 0) return null;
  const max = cities[0]!.visitors;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold text-zinc-900">
        Top cities
      </h3>
      <ul className="mt-3 space-y-2">
        {cities.map((c, i) => (
          <li key={`${c.city}-${c.region}-${c.country}-${i}`}>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="min-w-0 truncate font-mono text-xs text-zinc-900">
                {c.city || "(unknown)"}
                {c.region ? (
                  <span className="text-zinc-500">, {c.region}</span>
                ) : null}
                {c.country ? (
                  <span className="text-zinc-400"> · {c.country}</span>
                ) : null}
              </div>
              <div className="font-mono text-[11px] text-zinc-500">
                {formatNumber(c.visitors)}
              </div>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: `${Math.max(2, (c.visitors / max) * 100)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

