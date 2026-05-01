"use client";

import type { SparkPoint } from "@/lib/services/dashboard-kpis";

export type SparklineProps = {
  points: SparkPoint[];
  /* Tailwind text color class. Stroke + fill use currentColor so the
   * caller controls the hue via this class (e.g. "text-sky-500"). */
  colorClass: string;
  height?: number;
  /* When false, draws an unfilled line only. Default true. */
  filled?: boolean;
  ariaLabel?: string;
};

/**
 * Pure-SVG sparkline. No chart library, no client-side data fetching.
 * Renders an area + line for the provided points, plus a small dot on
 * the latest value. All shapes use currentColor so the parent's text
 * color drives the visual hue.
 *
 * Designed for the /admin CardPreview popover: ~440px wide x 56px tall
 * by default, with 4px internal padding so the line never clips.
 */
export default function Sparkline({
  points,
  colorClass,
  height = 56,
  filled = true,
  ariaLabel,
}: SparklineProps) {
  if (!points.length) {
    return (
      <div
        className="flex h-14 w-full items-center justify-center rounded-md border border-dashed border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-400"
        aria-label="no time series data"
      >
        no trend data
      </div>
    );
  }

  /* Use a fixed viewBox so the SVG scales cleanly to whatever width
   * its container provides. Internal coordinate space is 100x36 with
   * 2px insets on every side. */
  const W = 100;
  const H = 36;
  const PAD = 2;

  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const stepX = (W - PAD * 2) / Math.max(1, points.length - 1);
  const project = (v: number, i: number): [number, number] => {
    const x = PAD + i * stepX;
    /* Higher value = higher on screen = lower y. */
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return [x, y];
  };

  const linePath = points
    .map((p, i) => {
      const [x, y] = project(p.value, i);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const lastIdx = points.length - 1;
  const [lastX, lastY] = project(points[lastIdx]!.value, lastIdx);

  const areaPath = filled
    ? `${linePath} L${(PAD + lastIdx * stepX).toFixed(2)},${(H - PAD).toFixed(2)} L${PAD.toFixed(2)},${(H - PAD).toFixed(2)} Z`
    : null;

  const totalLabel = points.reduce((sum, p) => sum + p.value, 0);
  const ariaText =
    ariaLabel ?? `14 day trend, total ${totalLabel.toLocaleString()}`;

  return (
    <svg
      role="img"
      aria-label={ariaText}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`block w-full ${colorClass}`}
      style={{ height: `${height}px` }}
    >
      {areaPath ? (
        <path d={areaPath} fill="currentColor" fillOpacity="0.12" />
      ) : null}
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="1.4" fill="currentColor" />
    </svg>
  );
}
