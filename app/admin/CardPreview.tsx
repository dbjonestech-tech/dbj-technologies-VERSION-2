"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type {
  CardKpi,
  KpiTone,
  KpiDetail,
  RecentEvent,
} from "@/lib/services/dashboard-kpis";
import { PALETTES, type PaletteName } from "@/lib/admin/page-themes";
import Sparkline from "./Sparkline";

export type CardPreviewProps = {
  /** Bounding rect of the originating card (in viewport coordinates). */
  anchorRect: DOMRect;
  /** Card metadata. */
  label: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  palette: PaletteName;
  kpi?: CardKpi;
  /** Called when the popover requests close (Escape, outside click, X button). */
  onClose: () => void;
  /** Called when the cursor enters the popover, so the parent can cancel its leave timer. */
  onPointerEnter?: () => void;
  /** Called when the cursor leaves the popover. The parent inspects
   * relatedTarget to decide whether the cursor returned to the
   * originating card (in which case it skips the close). */
  onPointerLeave?: (e: React.PointerEvent<HTMLDivElement>) => void;
};

const PREVIEW_MAX_WIDTH = 480;
const PREVIEW_VPAD = 16;

function toneText(tone: KpiTone | undefined, palette: PaletteName): string {
  if (tone === "positive") return "text-emerald-700";
  if (tone === "warning") return "text-amber-700";
  if (tone === "danger") return "text-red-700";
  return PALETTES[palette].kpiNeutralText;
}

function toneDot(tone: KpiTone | undefined): string {
  if (tone === "positive") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  if (tone === "danger") return "bg-red-500";
  return "bg-zinc-400";
}

function toneBadge(tone: KpiTone | undefined): string {
  if (tone === "positive") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (tone === "warning") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (tone === "danger") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-zinc-50 text-zinc-600 ring-zinc-200";
}

function DetailLine({
  detail,
  palette,
}: {
  detail: KpiDetail;
  palette: PaletteName;
}) {
  const valueColor = toneText(detail.tone, palette);
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {detail.label}
      </span>
      <span
        className={`shrink-0 font-mono text-[12px] font-semibold ${valueColor}`}
      >
        {detail.value}
      </span>
    </div>
  );
}

function RecentLine({
  event,
  palette,
}: {
  event: RecentEvent;
  palette: PaletteName;
}) {
  const metaColor = toneText(event.tone, palette);
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-700">
        {event.title}
      </span>
      <span className={`shrink-0 font-mono text-[11px] ${metaColor}`}>
        {event.meta}
      </span>
    </div>
  );
}

export default function CardPreview({
  anchorRect,
  label,
  description,
  href,
  Icon,
  palette,
  kpi,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: CardPreviewProps) {
  const reduced = useReducedMotion();
  const tokens = PALETTES[palette];
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "above" | "below";
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  /* Mount flag prevents portal SSR mismatch. */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Compute placement against the viewport. Re-run on resize/scroll
   * (the parent unmounts the preview if the card scrolls out, but we
   * still want to react to viewport resize while open). */
  useLayoutEffect(() => {
    function recompute() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const node = containerRef.current;
      const measuredHeight = node?.offsetHeight ?? 360;

      const width = Math.min(PREVIEW_MAX_WIDTH, vw - PREVIEW_VPAD * 2);

      const spaceAbove = anchorRect.top;
      const spaceBelow = vh - anchorRect.bottom;
      const placement: "above" | "below" =
        spaceAbove >= measuredHeight + PREVIEW_VPAD || spaceAbove > spaceBelow
          ? "above"
          : "below";

      const top =
        placement === "above"
          ? Math.max(PREVIEW_VPAD, anchorRect.top - measuredHeight - 12)
          : Math.min(
              vh - measuredHeight - PREVIEW_VPAD,
              anchorRect.bottom + 12
            );

      const cardCenter = anchorRect.left + anchorRect.width / 2;
      const rawLeft = cardCenter - width / 2;
      const left = Math.max(
        PREVIEW_VPAD,
        Math.min(vw - width - PREVIEW_VPAD, rawLeft)
      );

      setPosition({ top, left, width, placement });
    }
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [anchorRect]);

  /* Escape closes; click outside the popover closes (parent owns the
   * "click on card" case so we only need to handle clicks elsewhere). */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    function onClick(e: MouseEvent) {
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) {
        /* Don't close if the click is on THIS card. Any other card's
         * click is treated as an outside click for this popover; that
         * other card's own state will open its own popover. Without
         * the href specificity, clicking any card pinned every open
         * popover. */
        const cardEl = document.elementFromPoint(e.clientX, e.clientY);
        const matched = cardEl?.closest?.("[data-card-id]");
        if (
          matched &&
          (matched as HTMLElement).getAttribute("data-card-id") === href
        ) {
          return;
        }
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose, href]);

  if (!mounted) return null;

  const tone = kpi?.tone;
  const primaryColor = toneText(tone, palette);
  const dotClass = toneDot(tone);
  const statusLabel =
    tone === "positive"
      ? "Healthy"
      : tone === "warning"
        ? "Attention"
        : tone === "danger"
          ? "Action needed"
          : "Stable";

  const node = (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-label={`${label} preview`}
      data-card-preview="true"
      data-card-preview-of={href}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, y: 0 }
      }
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed z-[60] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width: position?.width ?? PREVIEW_MAX_WIDTH,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {/* Top accent stripe matches the card palette. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] ${tokens.stripe}`}
      />

      {/* Close button (always visible; primary path for keyboard +
          touch users to dismiss without navigating). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="px-5 pb-5 pt-6">
        {/* Header: icon + title + status pill. */}
        <div className="mb-4 flex items-start gap-3 pr-8">
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/60 ${tokens.iconTile}`}
          >
            <Icon className={`h-5 w-5 ${tokens.iconColor}`} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-zinc-900">
              {label}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              {description}
            </p>
          </div>
          {kpi ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${toneBadge(tone)}`}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>

        {/* Primary KPI line. */}
        {kpi ? (
          <div className="mb-4 flex items-baseline gap-3 border-y border-zinc-100 py-3">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
            />
            <span className={`font-mono text-xl font-semibold ${primaryColor}`}>
              {kpi.primary}
            </span>
            {kpi.secondary ? (
              <span className="truncate text-xs text-zinc-500">
                {kpi.secondary}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Sparkline panel. */}
        {kpi?.spark && kpi.spark.points.length > 0 ? (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                14 day trend
              </span>
              {kpi.spark.unit ? (
                <span className="font-mono text-[10px] text-zinc-400">
                  {kpi.spark.unit}
                </span>
              ) : null}
            </div>
            <div className={tokens.iconColor}>
              <Sparkline
                points={kpi.spark.points}
                colorClass={tokens.iconColor}
                height={56}
              />
            </div>
          </div>
        ) : null}

        {/* Two-column layout: details on left, recent on right when
            both exist. Stacks on narrow screens since the popover is
            fixed at 480px on desktop and falls back to viewport-clamped
            width on mobile. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kpi?.details && kpi.details.length > 0 ? (
            <div>
              <h4 className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                At a glance
              </h4>
              <div className="divide-y divide-zinc-100">
                {kpi.details.map((d, i) => (
                  <DetailLine key={`${d.label}-${i}`} detail={d} palette={palette} />
                ))}
              </div>
            </div>
          ) : null}

          {kpi?.recent && kpi.recent.length > 0 ? (
            <div>
              <h4 className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                Recent
              </h4>
              <div className="divide-y divide-zinc-100">
                {kpi.recent.map((e, i) => (
                  <RecentLine key={`${e.title}-${i}`} event={e} palette={palette} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer CTA. */}
        <div className="mt-5 flex items-center justify-end border-t border-zinc-100 pt-4">
          <Link
            href={href}
            className={`group inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700`}
            onClick={onClose}
          >
            View full
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(node, document.body);
}
