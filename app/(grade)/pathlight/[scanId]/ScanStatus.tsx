"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AskPathlightLoader from "./AskPathlightLoader";
import { generateSuggestedChips } from "@/lib/prompts/pathlight-chips";
import { PathlightLogo } from "@/components/brand/PathlightLogo";
import { PathlightWordmark } from "@/components/brand/PathlightWordmark";
import type {
  DesignScores,
  LighthouseCategoryScores,
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
  lighthouseScores: LighthouseCategoryScores | null;
  audioSummaryUrl: string | null;
  isOutOfScope: boolean;
  outOfScopeLabel: string | null;
  screenshotNotice: string | null;
};

const ACTIVE_STATUSES = new Set<string>(["pending", "scanning", "analyzing"]);
const POLL_INTERVAL_MS = 3000;
// Audio summary (`a5`) and report email (`e1`) run AFTER `s6` flips
// status to complete, so the URL lands a few seconds late. Keep
// polling for up to ~36s past complete while audioSummaryUrl is still
// null so the player on the live page picks it up without a refresh.
const POST_COMPLETE_AUDIO_POLLS = 12;

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
  const postCompletePollsRef = useRef<number>(0);

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

        if (!ACTIVE_STATUSES.has(data.status) && intervalRef.current) {
          if (data.audioSummaryUrl) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
          }
          postCompletePollsRef.current += 1;
          if (postCompletePollsRef.current >= POST_COMPLETE_AUDIO_POLLS) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
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
        href="/pathlight"
        className="flex items-center"
        style={{ color: "#e7ebf2" }}
        aria-label="Pathlight home"
      >
        <PathlightWordmark height={20} ariaLabel="Pathlight" />
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

/* Strip protocol + trailing slash for cleaner URL display.
   Defensive: returns the original string if the result is empty. */
function formatUrlForDisplay(raw: string): string {
  if (!raw) return raw;
  const stripped = raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  return stripped || raw;
}

/* Eighteen particles drifting outward from the moon center.
   Each particle has a deterministic angle, distance, size, color
   tint, animation duration, animation delay, and a perpendicular
   midpoint offset that turns the otherwise-straight ray into a
   gentle arc. The duration jitter (3.6s-6.4s range) plus the
   independent delay stagger plus the curved path together produce
   moonlight-dust drift instead of mechanical sparkle. CSS-driven
   only (no JS RAF, no per-frame React updates). */
const MOON_PARTICLE_COUNT = 18;
const MOON_PARTICLES = Array.from({ length: MOON_PARTICLE_COUNT }, (_, i) => {
  const angle = (i / MOON_PARTICLE_COUNT) * Math.PI * 2 + i * 0.31;
  /* Vary travel distance by ~25% so the dust field has depth */
  const distance = 100 + ((i * 7) % 30);
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  /* Perpendicular midpoint offset for curved arc; magnitude
     varies so each path is unique */
  const perp = Math.sin(i * 1.7) * 14;
  const mx = dx * 0.5 + Math.cos(angle + Math.PI / 2) * perp;
  const my = dy * 0.5 + Math.sin(angle + Math.PI / 2) * perp;
  /* Sizes 1.5px through 4.5px with a smooth distribution */
  const size = 1.5 + ((i * 0.43) % 3);
  /* Every fifth particle picks up a brand-cyan tint; rest are
     silvery moonlight white */
  const cyan = i % 5 === 0;
  const color = cyan ? "rgba(26, 212, 234, 0.45)" : "rgba(232, 237, 242, 1)";
  const glow = cyan ? "rgba(26, 212, 234, 0.5)" : "rgba(232, 237, 242, 0.65)";
  /* Duration jitter 3.6s-6.4s; delay distributes emission so 8-12
     are visible at any moment */
  const duration = 3.6 + ((i * 0.27) % 2.8);
  const delay = (i * 0.32) % duration;
  return {
    dx,
    dy,
    mx,
    my,
    size,
    color,
    glow,
    duration: duration.toFixed(2),
    delay: delay.toFixed(2),
  };
});

function ScanningMoon() {
  return (
    <div
      aria-hidden="true"
      className="pathlight-moon-stage relative h-[200px] w-[200px] sm:h-[220px] sm:w-[220px]"
    >
      {/* Aurora ribbons (counter-rotating conic gradient, blurred).
          Sits behind everything; provides slow ribbon-like motion that
          reads as moonlight refracting through atmosphere. */}
      <div className="pathlight-moon-aurora pointer-events-none absolute inset-[-65%] rounded-full mix-blend-screen" />

      {/* Pulsating expansion rings. Two soft rings expand outward and
          fade, offset by half their period so one is always visible. */}
      <div className="pathlight-moon-ring pathlight-moon-ring-a pointer-events-none absolute inset-0 rounded-full" />
      <div className="pathlight-moon-ring pathlight-moon-ring-b pointer-events-none absolute inset-0 rounded-full" />

      {/* Particles drifting outward on curved arcs (CSS animation only) */}
      <div className="pathlight-moon-particles pointer-events-none absolute inset-0">
        {MOON_PARTICLES.map((p, i) => (
          <span
            key={i}
            style={
              {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${p.size}px`,
                height: `${p.size}px`,
                marginLeft: `-${p.size / 2}px`,
                marginTop: `-${p.size / 2}px`,
                borderRadius: "9999px",
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.size * 0.5}px ${p.glow}`,
                willChange: "transform, opacity",
                animation: `pathlight-moon-particle ${p.duration}s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s infinite`,
                "--mx": `${p.mx.toFixed(1)}px`,
                "--my": `${p.my.toFixed(1)}px`,
                "--dx": `${p.dx.toFixed(1)}px`,
                "--dy": `${p.dy.toFixed(1)}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Atmospheric moonlight halo with breathing pulse */}
      <div
        className="pathlight-moon-pulse absolute inset-0 rounded-full mix-blend-screen"
        style={{
          boxShadow:
            "0 0 50px 12px rgba(248, 250, 252, 0.45), 0 0 110px 40px rgba(186, 230, 253, 0.22), 0 0 220px 90px rgba(147, 197, 253, 0.10)",
        }}
      />

      {/* Physical moon body. Rotation and libration are split across
          two nested elements so each runs on its own pure timing
          function: the spinner rotates linearly at a constant 24s
          period (perfectly smooth, no stagger), while the texture
          librates rotateX/rotateY sinusoidally over an independent
          18s period (sine via ease-in-out keyframes). The two
          combine visually into a wobbling moon that never slows or
          stops. Perspective set on the stage parent so rotateX/Y
          reads as a tilt rather than a flatten. */}
      <div className="absolute inset-0 rounded-full bg-black overflow-hidden">
        <div
          className="pathlight-moon-spinner h-full w-full"
          style={
            {
              "--moon-spin-duration": "24s",
            } as React.CSSProperties
          }
        >
          <div
            className="pathlight-moon-active h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: "url(/brand/moon.webp)",
              filter:
                "sepia(8%) hue-rotate(-12deg) contrast(1.25) brightness(1.15) saturate(0.95)",
            }}
          />
        </div>
      </div>

      {/* Spherical terminator overlay */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 28% 32%, transparent 38%, rgba(0,0,0,0.97) 82%)",
        }}
      />
    </div>
  );
}

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
        className="pathlight-moon-eyebrow text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: "#1AD4EA" }}
      >
        Pathlight scan
      </p>
      <h1
        className="mt-1.5 break-all font-display text-2xl font-semibold sm:text-3xl"
        style={{ color: "#e7ebf2" }}
      >
        {formatUrlForDisplay(url)}
      </h1>

      <div className="mt-3 flex flex-col items-center gap-2 sm:mt-4">
        <ScanningMoon />
        <div className="mt-1 mb-4 flex flex-col items-center">
          <p
            className="text-base font-medium"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Your report typically takes 2–3 minutes. Here&apos;s why that matters.
          </p>
          <p
            className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            When you ask ChatGPT, Gemini, or any AI chatbot to &ldquo;audit my
            website,&rdquo; it never actually sees your site. It reads metadata
            and source code, if it can access them at all, and writes a generic
            essay based on assumptions. It cannot open a browser. It cannot
            capture a screenshot. It cannot see that your headline is unreadable
            over your hero image, that your CTA button blends into the
            background, or that your mobile layout is broken. It is guessing
            what your site looks like.
          </p>
          <p
            className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Pathlight doesn&apos;t guess. It opens a real browser, captures real
            screenshots at desktop and mobile sizes, runs a full Google
            PageSpeed audit against Core Web Vitals, analyzes your actual visual
            design and brand positioning with AI vision, researches real
            industry benchmarks for your specific business type, and computes
            revenue impact from verified data. Every number and recommendation
            in your report is based on what your visitors actually see, not
            what your source code suggests they might see.
          </p>
        </div>
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

const FAILED_FALLBACK =
  "Something went wrong with the scan. Please try again, and if the problem persists, contact us.";

function FailedState({
  url,
  message,
}: {
  url: string;
  message: string | null;
}) {
  const friendly = message ?? FAILED_FALLBACK;
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
  const isOutOfScope = report.isOutOfScope;
  // Revenue and benchmark only make sense when the design audit also ran.
  // Defensive guard: if a stale state ever leaves revenue without design,
  // do not render the dollar headline.
  const hasDesign = !!report.design;
  const hasRevenue = !isOutOfScope && hasDesign && !!report.revenueImpact;

  const fixItems = report.remediation?.items ?? [];
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const handlePrint = () => {
    const prev = new Set(openIndices);
    setOpenIndices(new Set(fixItems.map((_, i) => i)));
    setTimeout(() => {
      window.print();
      setOpenIndices(prev);
    }, 300);
  };

  return (
    <section className="pathlight-report flex flex-col gap-16 py-12">
      <div className="flex justify-center">
        <PathlightLogo
          size={160}
          priority
          className="h-[120px] w-[120px] sm:h-[160px] sm:w-[160px]"
          alt="Pathlight"
        />
      </div>

      {isPartial ? <PartialNotice /> : null}
      {report.screenshotNotice ? (
        <ScreenshotHealthNotice message={report.screenshotNotice} />
      ) : null}

      {hasScore ? (
        <ScoreHero
          score={report.pathlightScore!}
          url={displayUrl}
          scanDate={scanDate}
        />
      ) : null}

      <div className="print-hidden flex items-center justify-center gap-6 -mt-8">
        <button
          type="button"
          onClick={handlePrint}
          className="text-sm text-white/60 hover:text-white/90 transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print Full Report
        </button>
        <DownloadPdfButton scanId={report.scanId} />
      </div>

      {report.audioSummaryUrl ? (
        <AudioSummary src={report.audioSummaryUrl} />
      ) : null}

      {report.pillarScores ? <PillarBreakdown scores={report.pillarScores} /> : null}

      {report.lighthouseScores ? (
        <LighthouseBreakdown scores={report.lighthouseScores} />
      ) : null}

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

      {isOutOfScope ? (
        <OutOfScopeNotice label={report.outOfScopeLabel ?? "national brand"} />
      ) : hasRevenue ? (
        <RevenueImpactBlock impact={report.revenueImpact!} />
      ) : null}

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

function AudioSummary({ src }: { src: string }) {
  return (
    <section
      id="summary"
      aria-label="60-second audio summary"
      className="print-hidden mx-auto w-full max-w-2xl"
    >
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "rgba(10,12,18,0.7)",
        }}
      >
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: "#60a5fa" }}
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#9aa3b2" }}
            >
              Your 60-second summary
            </p>
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Audio walkthrough of the highest-impact finding on your scan.
            </p>
          </div>
        </div>
        <audio
          controls
          preload="metadata"
          src={src}
          className="mt-3 w-full"
          style={{ colorScheme: "dark" }}
        >
          Your browser does not support the audio element. You can{" "}
          <a href={src} style={{ color: "#60a5fa" }}>
            download the audio file
          </a>{" "}
          instead.
        </audio>
      </div>
    </section>
  );
}

function DownloadPdfButton({ scanId }: { scanId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch(`/api/scan/${scanId}/pdf`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`PDF endpoint returned ${res.status}`);
      }
      const blob = await res.blob();
      let filename = "Pathlight-Report.pdf";
      const cd = res.headers.get("content-disposition");
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/);
        if (match && match[1]) filename = match[1];
      }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      setState("idle");
    } catch (err) {
      console.error("[pdf-download] failed", err);
      setState("error");
      // Auto-reset to idle after a few seconds so the user can retry
      // without having to refresh.
      setTimeout(() => setState("idle"), 5000);
    }
  }

  const label =
    state === "loading"
      ? "Generating…"
      : state === "error"
        ? "Try again"
        : "Download PDF";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-busy={state === "loading"}
      className="text-sm text-white/60 hover:text-white/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
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

function ScreenshotHealthNotice({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border p-5 text-sm"
      style={{
        borderColor: "rgba(245,158,11,0.35)",
        backgroundColor: "rgba(120,53,15,0.15)",
        color: "#fcd34d",
      }}
    >
      {message}
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
  { key: "searchVisibility", label: "Search Visibility", weight: "15%" },
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
          const isNull = value === null;
          const color = isNull ? "#6b7280" : scoreColor(value as number);
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
                {isNull ? "n/a" : value}
                {!isNull ? (
                  <span
                    className="ml-1 text-xs font-normal"
                    style={{ color: "#6b7280" }}
                  >
                    /100
                  </span>
                ) : null}
              </div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: isNull ? "0%" : `${value as number}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────── Lighthouse Breakdown ─────────── */

function LighthouseBreakdown({ scores }: { scores: LighthouseCategoryScores }) {
  const [open, setOpen] = useState(false);
  const items = [
    { label: "Performance", value: scores.performance },
    { label: "Accessibility", value: scores.accessibility },
    { label: "Best Practices", value: scores.bestPractices },
    { label: "SEO", value: scores.seo },
  ];

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white/70 transition-colors"
      >
        <span>Lighthouse Scores</span>
        <span
          className="text-[10px] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      <div className={`mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 print-grid-expand${open ? "" : " hidden"}`}>
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(10,12,18,0.5)",
            }}
          >
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "#9aa3b2" }}>
              {item.label}
            </span>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{
                color:
                  item.value >= 90
                    ? "#22c55e"
                    : item.value >= 50
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {item.value}
              <span className="text-sm font-normal" style={{ color: "#6b7280" }}>
                /100
              </span>
            </p>
          </div>
        ))}
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
        <ScreenshotPanel label="Mobile" src={mobile} aspect="aspect-[9/16]" printBreakBefore />
      </div>
    </section>
  );
}

function ScreenshotPanel({
  label,
  src,
  aspect,
  printBreakBefore = false,
}: {
  label: string;
  src: string | null;
  aspect: string;
  printBreakBefore?: boolean;
}) {
  if (!src) return null;
  return (
    <div
      className={`rounded-2xl border p-3 print-avoid-break${printBreakBefore ? " print-break-before" : ""}`}
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${label} screenshot`}
          className="h-full w-full object-cover object-top"
        />
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
              className="overflow-hidden rounded-2xl border"
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

/* ─────────── Out-of-Scope Notice ─────────── */

function OutOfScopeNotice({ label }: { label: string }) {
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
        <div
          className="font-display text-2xl font-bold sm:text-3xl"
          style={{ color: "#e7ebf2" }}
        >
          Calibrated for small and regional businesses
        </div>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "#c5ccd8" }}>
          This site reads as a {label}, which sits outside the audience
          Pathlight is built for. Revenue estimates here would compare a
          single-storefront benchmark to a multi-location operation, so the
          number was suppressed rather than shown misleadingly. The design,
          performance, positioning, and remediation findings above still apply
          and can be read directionally.
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#c5ccd8" }}>
          Run Pathlight on your own business website to see a calibrated
          revenue estimate.
        </p>
      </div>
    </section>
  );
}

/* ─────────── Revenue Impact ─────────── */

function RevenueImpactBlock({
  impact,
}: {
  impact: RevenueImpactResult;
}) {
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
        className="pathlight-cta rounded-3xl border px-6 py-8"
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
