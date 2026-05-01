"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ChevronUp,
  Database,
  DollarSign,
  FileText,
  Filter,
  Globe,
  Mail,
  Repeat,
  Search,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CardKpi, KpiTone } from "@/lib/services/dashboard-kpis";
import { PALETTES, type PaletteName } from "@/lib/admin/page-themes";
import CardPreview from "./CardPreview";

/* The dashboard page is a Server Component but this card is a Client
 * Component (motion + useState). Functions cannot cross the
 * Server -> Client RSC boundary, so we cannot accept a Lucide icon
 * component as a prop. Instead, the parent passes the icon's *name*
 * (a string) and we look it up here. */
const ICONS = {
  Activity,
  AlertTriangle,
  Briefcase,
  Database,
  DollarSign,
  FileText,
  Filter,
  Globe,
  Mail,
  Repeat,
  Search,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Workflow,
  Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

function toneTextClass(tone: KpiTone | undefined, palette: PaletteName): string {
  if (tone === "positive") return "text-emerald-700";
  if (tone === "warning") return "text-amber-700";
  if (tone === "danger") return "text-red-700";
  return PALETTES[palette].kpiNeutralText;
}

function toneDotClass(tone: KpiTone | undefined): string {
  if (tone === "positive") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  if (tone === "danger") return "bg-red-500";
  return "bg-zinc-400";
}

export type DashboardCardProps = {
  label: string;
  description: string;
  href: string;
  iconName: IconName;
  palette: PaletteName;
  kpi?: CardKpi;
};

/* Grace period (ms) between cursor leaving the card/popover and the
 * popover actually closing. Long enough to let the operator move
 * cursor across the gap; short enough to feel responsive. */
const HOVER_LEAVE_GRACE = 140;

export default function DashboardCard({
  label,
  description,
  href,
  iconName,
  palette,
  kpi,
}: DashboardCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = ICONS[iconName];
  const tokens = PALETTES[palette];
  const kpiText = kpi ? toneTextClass(kpi.tone, palette) : "";
  const dotClass = toneDotClass(kpi?.tone);

  /* Capture the card's rect each time the preview opens so positioning
   * is fresh after any layout shift since the card mounted. */
  function openPreview() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (cardRef.current) {
      setAnchorRect(cardRef.current.getBoundingClientRect());
    }
    setPreviewOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPreviewOpen(false), HOVER_LEAVE_GRACE);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  /* Cleanup any pending close timer on unmount so we don't update
   * state after the component is gone. */
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <>
      <motion.div
        ref={cardRef}
        data-card-id={href}
        animate={reduced ? undefined : { y: hovered ? -3 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onHoverStart={() => {
          setHovered(true);
          openPreview();
        }}
        onHoverEnd={() => {
          setHovered(false);
          scheduleClose();
        }}
        className="relative h-full"
      >
        <div
          className={`group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:shadow-xl ${tokens.hoverShadow} ${tokens.hoverBorder}`}
        >
          {/* Top accent stripe (full width, brightens on hover) */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${tokens.stripe} opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
          />

          {/* Subtle hover gradient overlay (fades in behind content) */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tokens.hoverOverlay} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
          />

          {/* The whole card is the navigation target; this absolute
              link sits beneath visible content via z-index. Rendered
              before content so content can claim higher z. */}
          <Link
            href={href}
            aria-label={`Open ${label}`}
            className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
            onFocus={openPreview}
            onBlur={scheduleClose}
          >
            <span className="sr-only">{label}</span>
          </Link>

          {/* Icon tile + arrow row */}
          <div className="pointer-events-none relative z-[1] mb-4 flex items-start justify-between">
            <motion.span
              aria-hidden="true"
              animate={
                reduced
                  ? undefined
                  : hovered
                    ? { scale: 1.08, rotate: -3 }
                    : { scale: 1, rotate: 0 }
              }
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ring-1 ring-inset ring-white/60 ${tokens.iconTile}`}
            >
              <Icon className={`h-6 w-6 ${tokens.iconColor}`} aria-hidden="true" />
            </motion.span>

            <motion.span
              aria-hidden="true"
              animate={
                reduced
                  ? undefined
                  : hovered
                    ? { x: 0, opacity: 1 }
                    : { x: -6, opacity: 0 }
              }
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${tokens.iconColor}`}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          </div>

          {/* Title + description */}
          <div className="pointer-events-none relative z-[1]">
            <h3 className="font-display text-base font-semibold text-zinc-900">
              {label}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {description}
            </p>
          </div>

          {/* Always-visible primary KPI footer. The richer detail panel
              that used to live here in-card has moved to CardPreview
              (a floating popover) so it is no longer constrained by
              card width. */}
          {kpi ? (
            <div className="pointer-events-none relative z-[1] mt-auto pt-4">
              <div className="border-t border-zinc-100 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}
                  />
                  <span className={`font-mono text-[13px] font-semibold ${kpiText}`}>
                    {kpi.primary}
                  </span>
                  {kpi.secondary ? (
                    <span className="truncate text-[11px] text-zinc-500">
                      {kpi.secondary}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none relative z-[1] mt-auto pt-4">
              <div className="border-t border-zinc-100 pt-3">
                <div className="h-5" />
              </div>
            </div>
          )}

          {/* Touch / no-hover affordance: a small expand chevron sitting
              above the absolute link. Hidden on hover-capable devices
              because the popover already opens on hover there. */}
          <button
            type="button"
            aria-label={`Show ${label} preview`}
            aria-expanded={previewOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (previewOpen) {
                setPreviewOpen(false);
              } else {
                openPreview();
              }
            }}
            className="absolute bottom-3 right-3 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-700 [@media(hover:hover)]:hidden"
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {previewOpen && anchorRect ? (
          <CardPreview
            anchorRect={anchorRect}
            label={label}
            description={description}
            href={href}
            Icon={Icon}
            palette={palette}
            kpi={kpi}
            onClose={() => setPreviewOpen(false)}
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
