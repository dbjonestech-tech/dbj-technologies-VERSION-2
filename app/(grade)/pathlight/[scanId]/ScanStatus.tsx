"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScanningCore } from "./ScanningCore";
import AskPathlightLoader from "./AskPathlightLoader";
import { generateSuggestedChips } from "@/lib/prompts/pathlight-chips";
import type {
  DesignScores,
  PerformanceScores,
  PillarScores,
  PositioningScores,
  RemediationItem,
  RemediationResult,
  RevenueImpactResult,
  ScanStatus as ScanStatusValue,
} from "@/lib/types/scan";

type InitialScanState = {
  scanId: string;
  url: string;
  status: string;
};

type ApiReport = {
  scanId: string;
  status: ScanStatusValue;
  url: string;
  resolvedUrl: string | null;
  scores: PerformanceScores | null;
  screenshotDesktop: string | null;
  screenshotMobile: string | null;
  errorMessage: string | null;
  error: string | null;
  duration: number | null;
  completedAt: string | null;
  createdAt: string;
  businessName: string | null;
  industry: string | null;
  design: DesignScores | null;
  positioning: PositioningScores | null;
  remediation: RemediationResult | null;
  revenueImpact: RevenueImpactResult | null;
  pathlightScore: number | null;
  pillarScores: PillarScores | null;
};

const ACTIVE_STATUSES = new Set<string>(["pending", "scanning", "analyzing"]);
const POLL_INTERVAL_MS = 3000;

const PHASE_LABELS = [
  "Capturing screenshots…",
  "Running performance audit…",
  "Analyzing design and positioning…",
  "Generating fix priorities…",
  "Calculating revenue impact…",
];

const SCANNING_PHASES = [0, 1];
const ANALYZING_PHASES = [2, 3, 4];

export function ScanStatus({
  initial,
  calendlyUrl = null,
}: {
  initial: InitialScanState;
  calendlyUrl?: string | null;
}) {
  const [report, setReport] = useState<ApiReport | null>(null);
  const [statusState, setStatusState] = useState<string>(initial.status);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOnce() {
      try {
        const res = await fetch(`/api/scan/${initial.scanId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as ApiReport;
        if (cancelled) return;
        setReport(data);
        setStatusState(data.status);
      } catch {
        /* transient — next tick will retry */
      }
    }

    fetchOnce();
    intervalRef.current = setInterval(fetchOnce, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [initial.scanId]);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(statusState) && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [statusState]);

  const displayUrl = report?.resolvedUrl ?? report?.url ?? initial.url;
  const isActive = ACTIVE_STATUSES.has(statusState);
  const isFailed = statusState === "failed";
  const isPartial = statusState === "partial";
  const isComplete = statusState === "complete";
  const hasReportData = isComplete || isPartial;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ color: "#e7ebf2" }}
    >
      <TopBar />
      <div className="mx-auto w-full max-w-[1120px] px-6 py-10 sm:py-14">
        {isActive ? (
          <LoadingState status={statusState} url={displayUrl} />
        ) : null}

        {isFailed ? (
          <FailedState
            url={displayUrl}
            message={report?.errorMessage ?? report?.error ?? null}
          />
        ) : null}

        {hasReportData && report ? (
          <Report
            report={report}
            isPartial={isPartial}
            calendlyUrl={calendlyUrl}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────── Top Bar ─────────────────────── */

function TopBar() {
  return (
    <header
      className="print-hidden print-static sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4"
      style={{
        backgroundColor: "rgba(6,6,10,0.9)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Link
        href="/"
        className="font-display text-sm font-semibold tracking-wide"
        style={{ color: "#e7ebf2" }}
      >
        DBJ Technologies
      </Link>
      <Link
        href="/pathlight"
        className="print-hidden text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: "#9aa3b2" }}
      >
        Scan another website →
      </Link>
    </header>
  );
}

/* ─────────────────────── Loading ─────────────────────── */

function LoadingState({ status, url }: { status: string; url: string }) {
  const [phaseIndex, setPhaseIndex] = useState<number>(() =>
    status === "scanning" ? SCANNING_PHASES[0]! : status === "analyzing" ? ANALYZING_PHASES[0]! : 0
  );

  useEffect(() => {
    const phases =
      status === "scanning"
        ? SCANNING_PHASES
        : status === "analyzing"
          ? ANALYZING_PHASES
          : null;
    if (!phases) {
      setPhaseIndex(0);
      return;
    }
    let i = 0;
    setPhaseIndex(phases[0]!);
    const id = setInterval(() => {
      i = (i + 1) % phases.length;
      setPhaseIndex(phases[i]!);
    }, 4000);
    return () => clearInterval(id);
  }, [status]);

  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <p
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Pathlight scan
      </p>
      <h1
        className="mt-2 break-all font-display text-2xl font-semibold sm:text-3xl"
        style={{ color: "#e7ebf2" }}
      >
        {url}
      </h1>

      <div className="mt-12 flex flex-col items-center gap-6">
        <ScanningCore />
        <div
          className="font-display text-lg font-semibold"
          style={{ color: "#60a5fa" }}
        >
          {PHASE_LABELS[phaseIndex]}
        </div>
        <div className="text-sm" style={{ color: "#9aa3b2" }}>
          This usually takes about 60–120 seconds.
        </div>

        <ol className="mt-4 flex w-full max-w-xl flex-col gap-2 text-left">
          {PHASE_LABELS.map((label, idx) => {
            const isDone = idx < phaseIndex;
            const isCurrent = idx === phaseIndex;
            return (
              <li
                key={label}
                className="flex items-center gap-3 text-sm"
                style={{ color: isDone ? "#9aa3b2" : isCurrent ? "#60a5fa" : "#4b5563" }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isDone
                      ? "#22c55e"
                      : isCurrent
                        ? "#60a5fa"
                        : "#374151",
                  }}
                />
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────── Failed ─────────────────────── */

function sanitizeScanError(raw: string | null): {
  friendly: string;
  technical: string | null;
} {
  const fallback =
    "Something went wrong with the scan. Please try again, and if the problem persists, contact us.";
  if (!raw) return { friendly: fallback, technical: null };
  const lower = raw.toLowerCase();
  let friendly = fallback;
  if (
    lower.includes("401") ||
    lower.includes("invalid api key") ||
    lower.includes("api key")
  ) {
    friendly =
      "Our scanning service is temporarily unavailable. Please try again in a few minutes.";
  } else if (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    friendly =
      "We're experiencing high demand. Please try again in a few minutes.";
  } else if (lower.includes("timeout") || lower.includes("etimedout")) {
    friendly =
      "The scan took too long to complete. The target website may be slow to respond. Please try again.";
  } else if (
    lower.includes("enotfound") ||
    lower.includes("dns") ||
    lower.includes("getaddrinfo")
  ) {
    friendly =
      "We couldn't reach that website. Please check the URL and try again.";
  } else if (lower.includes("ssl") || lower.includes("certificate")) {
    friendly =
      "We couldn't establish a secure connection to that website. The site may have SSL issues.";
  }
  return { friendly, technical: raw };
}

function FailedState({
  url,
  message,
}: {
  url: string;
  message: string | null;
}) {
  const { friendly, technical } = sanitizeScanError(message);
  return (
    <section className="mx-auto max-w-xl py-20 text-center">
      <p
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Pathlight scan
      </p>
      <h1
        className="mt-2 break-all font-display text-2xl font-semibold sm:text-3xl"
        style={{ color: "#e7ebf2" }}
      >
        {url}
      </h1>
      <div
        className="mt-10 rounded-2xl border p-8"
        style={{
          borderColor: "rgba(239,68,68,0.35)",
          backgroundColor: "rgba(127,29,29,0.12)",
        }}
      >
        <div
          className="font-display text-xl font-semibold"
          style={{ color: "#fca5a5" }}
        >
          Scan failed
        </div>
        <p className="mt-3 text-sm" style={{ color: "#f5c6c6" }}>
          {friendly}
        </p>
        {technical ? (
          <details className="mt-4 text-left">
            <summary
              className="cursor-pointer select-none text-xs font-medium uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              Show technical details
            </summary>
            <pre
              className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border p-3 text-[11px] leading-relaxed"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "#9aa3b2",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {technical}
            </pre>
          </details>
        ) : null}
        <div>
          <Link
            href="/pathlight"
            className="mt-6 inline-block rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
              color: "white",
            }}
          >
            Try another scan
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Report ─────────────────────── */

function Report({
  report,
  isPartial,
  calendlyUrl,
}: {
  report: ApiReport;
  isPartial: boolean;
  calendlyUrl: string | null;
}) {
  const scanDate = formatScanDate(report.completedAt ?? report.createdAt);
  const displayUrl = report.resolvedUrl ?? report.url;

  const hasScore =
    typeof report.pathlightScore === "number" && report.pillarScores !== null;
  const hasScreenshots =
    !!report.screenshotDesktop || !!report.screenshotMobile;
  const hasFixes =
    !!report.remediation && report.remediation.items.length > 0;
  const hasRevenue = !!report.revenueImpact;

  const fixItems = report.remediation?.items ?? [];
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const handlePrint = () => {
    setOpenIndices(new Set(fixItems.map((_, i) => i)));
    setTimeout(() => window.print(), 300);
  };

  return (
    <section className="flex flex-col gap-16 py-12">
      {isPartial ? <PartialNotice /> : null}

      {hasScore ? (
        <ScoreHero
          score={report.pathlightScore!}
          url={displayUrl}
          scanDate={scanDate}
        />
      ) : null}

      <button
        type="button"
        onClick={handlePrint}
        className="print-hidden text-sm text-white/60 hover:text-white/90 transition-colors flex items-center gap-1.5 mx-auto -mt-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print Full Report
      </button>

      {report.pillarScores ? <PillarBreakdown scores={report.pillarScores} /> : null}

      {hasScreenshots ? (
        <ScreenshotsSection
          desktop={report.screenshotDesktop}
          mobile={report.screenshotMobile}
        />
      ) : null}

      {hasFixes ? (
        <TopFixes
          items={report.remediation!.items}
          openIndices={openIndices}
          setOpenIndices={setOpenIndices}
        />
      ) : null}

      {hasRevenue ? <RevenueImpactBlock impact={report.revenueImpact!} /> : null}

      <FinalCta calendlyUrl={calendlyUrl} />

      <AskPathlightLoader
        scanId={report.scanId}
        businessName={report.businessName}
        pathlightScore={report.pathlightScore ?? null}
        suggestedChips={generateSuggestedChips(report)}
        calendlyUrl={calendlyUrl}
      />
    </section>
  );
}

function PartialNotice() {
  return (
    <div
      className="rounded-2xl border p-5 text-sm"
      style={{
        borderColor: "rgba(245,158,11,0.35)",
        backgroundColor: "rgba(120,53,15,0.15)",
        color: "#fcd34d",
      }}
    >
      Some analysis steps could not be completed. The available results are
      shown below.
    </div>
  );
}

/* ─────────── Score Hero ─────────── */

function scoreColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function ScoreHero({
  score,
  url,
  scanDate,
}: {
  score: number;
  url: string;
  scanDate: string;
}) {
  const ringColor = scoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const dash = (score / 100) * circumference;

  return (
    <section className="flex flex-col items-center text-center">
      <p
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Pathlight Score
      </p>
      <div className="relative mt-5 inline-flex h-44 w-44 items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="10"
            stroke="rgba(255,255,255,0.08)"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="10"
            stroke={ringColor}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-5xl font-bold"
            style={{ color: ringColor }}
          >
            {score}
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#9aa3b2" }}>
            / 100
          </span>
        </div>
      </div>
      <h1
        className="mt-6 break-all font-display text-xl font-semibold sm:text-2xl"
        style={{ color: "#e7ebf2" }}
      >
        {url}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "#9aa3b2" }}>
        Scanned {scanDate}
      </p>
    </section>
  );
}

/* ─────────── Pillar Breakdown ─────────── */

const PILLAR_CONFIG: {
  key: keyof PillarScores;
  label: string;
  weight: string;
}[] = [
  { key: "design", label: "Design", weight: "35%" },
  { key: "performance", label: "Performance", weight: "25%" },
  { key: "positioning", label: "Positioning", weight: "25%" },
  { key: "findability", label: "Findability", weight: "15%" },
];

function PillarBreakdown({ scores }: { scores: PillarScores }) {
  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Pillar breakdown
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PILLAR_CONFIG.map((p) => {
          const value = scores[p.key];
          const color = scoreColor(value);
          return (
            <div
              key={p.key}
              className="rounded-2xl border p-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(10,12,18,0.7)",
              }}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className="font-display text-sm font-semibold"
                  style={{ color: "#e7ebf2" }}
                >
                  {p.label}
                </span>
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  {p.weight}
                </span>
              </div>
              <div
                className="mt-3 font-display text-3xl font-bold"
                style={{ color }}
              >
                {value}
                <span
                  className="ml-1 text-xs font-normal"
                  style={{ color: "#6b7280" }}
                >
                  /100
                </span>
              </div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${value}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────── Screenshots ─────────── */

function ScreenshotsSection({
  desktop,
  mobile,
}: {
  desktop: string | null;
  mobile: string | null;
}) {
  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Screenshots
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ScreenshotPanel label="Desktop" src={desktop} aspect="aspect-[16/10]" />
        <ScreenshotPanel label="Mobile" src={mobile} aspect="aspect-[9/16]" />
      </div>
    </section>
  );
}

function ScreenshotPanel({
  label,
  src,
  aspect,
}: {
  label: string;
  src: string | null;
  aspect: string;
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#9aa3b2" }}
      >
        {label}
      </div>
      <div
        className={`mt-3 ${aspect} overflow-hidden rounded-xl`}
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${label} screenshot`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ color: "#6b7280" }}
          >
            Not captured
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Top Fixes ─────────── */

function TopFixes({
  items,
  openIndices,
  setOpenIndices,
}: {
  items: RemediationItem[];
  openIndices: Set<number>;
  setOpenIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Top 3 fixes
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, idx) => {
          const isOpen = openIndices.has(idx);
          return (
            <div
              key={`${idx}-${item.title}`}
              className="overflow-hidden rounded-2xl border break-inside-avoid"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(10,12,18,0.7)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenIndices((prev) => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx);
                    else next.add(idx);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(59,130,246,0.15)",
                      color: "#60a5fa",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="font-display text-base font-semibold"
                    style={{ color: "#e7ebf2" }}
                  >
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ImpactBadge impact={item.impact} />
                  <DifficultyBadge difficulty={item.difficulty} />
                  <span
                    className="print-hidden text-xs"
                    style={{
                      color: "#9aa3b2",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 150ms ease",
                    }}
                  >
                    ▾
                  </span>
                </div>
              </button>
              <div
                className={`print-expand border-t px-5 py-4 text-sm${isOpen ? "" : " hidden"}`}
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  color: "#c5ccd8",
                }}
              >
                <div>
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "#6b7280" }}
                  >
                    Problem
                  </span>
                  <p className="mt-1">{item.problem}</p>
                </div>
                <div className="mt-4">
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "#6b7280" }}
                  >
                    Improvement
                  </span>
                  <p className="mt-1">{item.improvement}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ImpactBadge({ impact }: { impact: RemediationItem["impact"] }) {
  const palette: Record<RemediationItem["impact"], { bg: string; fg: string }> =
    {
      high: { bg: "rgba(34,197,94,0.15)", fg: "#86efac" },
      medium: { bg: "rgba(245,158,11,0.15)", fg: "#fcd34d" },
      low: { bg: "rgba(148,163,184,0.15)", fg: "#cbd5e1" },
    };
  const c = palette[impact];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {impact} impact
    </span>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: RemediationItem["difficulty"];
}) {
  const palette: Record<
    RemediationItem["difficulty"],
    { bg: string; fg: string }
  > = {
    easy: { bg: "rgba(59,130,246,0.15)", fg: "#93c5fd" },
    moderate: { bg: "rgba(168,85,247,0.15)", fg: "#d8b4fe" },
    hard: { bg: "rgba(239,68,68,0.15)", fg: "#fca5a5" },
  };
  const c = palette[difficulty];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {difficulty}
    </span>
  );
}

/* ─────────── Revenue Impact ─────────── */

function RevenueImpactBlock({ impact }: { impact: RevenueImpactResult }) {
  const formatted = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(impact.estimatedMonthlyLoss)));
  }, [impact.estimatedMonthlyLoss]);

  const { assumptions } = impact;

  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Revenue impact
      </h2>
      <div
        className="mt-4 rounded-2xl border p-6"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "rgba(10,12,18,0.7)",
        }}
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <div
            className="font-display text-4xl font-bold sm:text-5xl"
            style={{ color: "#fbbf24" }}
          >
            {formatted}
          </div>
          <div className="text-xs uppercase tracking-widest" style={{ color: "#9aa3b2" }}>
            estimated monthly loss · {impact.confidence} confidence
          </div>
        </div>

        <p className="mt-5 text-sm" style={{ color: "#c5ccd8" }}>
          {impact.methodology}
        </p>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AssumptionRow
            label="Estimated monthly visitors"
            value={assumptions.estimatedMonthlyVisitors.toLocaleString()}
          />
          <AssumptionRow
            label="Industry avg. conversion rate"
            value={`${(assumptions.industryAvgConversionRate * 100).toFixed(1)}%`}
          />
          <AssumptionRow
            label="Average deal value"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(assumptions.avgDealValue)}
          />
          <AssumptionRow
            label="Conversion improvement if fixed"
            value={`${(assumptions.conversionImprovementEstimate * 100).toFixed(0)}%`}
          />
        </dl>

        <p className="mt-5 text-xs" style={{ color: "#6b7280" }}>
          Pathlight uses AI analysis and conservative revenue modeling.
          Estimates are directional only and not a substitute for professional
          consultation.
        </p>
      </div>
    </section>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <dt className="text-xs" style={{ color: "#9aa3b2" }}>
        {label}
      </dt>
      <dd
        className="text-sm font-semibold"
        style={{ color: "#e7ebf2" }}
      >
        {value}
      </dd>
    </div>
  );
}

/* ─────────── Final CTA ─────────── */

function FinalCta({ calendlyUrl }: { calendlyUrl: string | null }) {
  const ctaHref =
    calendlyUrl && calendlyUrl !== "#"
      ? calendlyUrl
      : "/contact?utm_source=pathlight";
  return (
    <section className="mt-4 text-center">
      <div
        className="rounded-3xl border px-6 py-12"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          backgroundImage:
            "radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 60%)",
        }}
      >
        <h2
          className="font-display text-2xl font-semibold sm:text-3xl"
          style={{ color: "#e7ebf2" }}
        >
          Ready to fix these?
        </h2>
        <p
          className="mx-auto mt-3 max-w-xl text-sm sm:text-base"
          style={{ color: "#c5ccd8" }}
        >
          Book a discovery call and I will show you exactly what your site
          could look like.
        </p>
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold"
          style={{
            backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
            color: "white",
          }}
        >
          Book a discovery call
        </a>
        <div
          className="mt-6 text-[11px] uppercase tracking-[0.25em]"
          style={{ color: "#6b7280" }}
        >
          Powered by DBJ Technologies
        </div>
      </div>
    </section>
  );
}

/* ─────────── Helpers ─────────── */

function formatScanDate(raw: string | null): string {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
