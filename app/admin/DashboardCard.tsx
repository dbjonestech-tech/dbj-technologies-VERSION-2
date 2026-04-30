"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Database,
  DollarSign,
  FileText,
  Filter,
  Globe,
  Mail,
  Search,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CardKpi, KpiTone } from "@/lib/services/dashboard-kpis";

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
  Search,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Workflow,
  Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export type CardTheme = "cyan" | "violet" | "amber" | "emerald" | "zinc";

type ThemeTokens = {
  /** Top accent stripe gradient. */
  stripe: string;
  /** Icon tile gradient background. */
  iconTile: string;
  /** Icon color. */
  iconColor: string;
  /** Hover shadow color tag (Tailwind colored-shadow class). */
  hoverShadow: string;
  /** Hover border color. */
  hoverBorder: string;
  /** Default KPI primary color when tone is "neutral". */
  kpiNeutralText: string;
  /** Subtle hover background gradient overlay. */
  hoverOverlay: string;
};

const THEMES: Record<CardTheme, ThemeTokens> = {
  cyan: {
    stripe: "bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500",
    iconTile: "bg-gradient-to-br from-cyan-50 to-sky-100",
    iconColor: "text-cyan-700",
    hoverShadow: "hover:shadow-cyan-500/20",
    hoverBorder: "group-hover:border-cyan-200",
    kpiNeutralText: "text-cyan-700",
    hoverOverlay: "from-cyan-50/0 via-cyan-50/50 to-cyan-50/0",
  },
  violet: {
    stripe: "bg-gradient-to-r from-violet-400 via-violet-500 to-purple-500",
    iconTile: "bg-gradient-to-br from-violet-50 to-purple-100",
    iconColor: "text-violet-700",
    hoverShadow: "hover:shadow-violet-500/20",
    hoverBorder: "group-hover:border-violet-200",
    kpiNeutralText: "text-violet-700",
    hoverOverlay: "from-violet-50/0 via-violet-50/50 to-violet-50/0",
  },
  amber: {
    stripe: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
    iconTile: "bg-gradient-to-br from-amber-50 to-orange-100",
    iconColor: "text-amber-700",
    hoverShadow: "hover:shadow-amber-500/20",
    hoverBorder: "group-hover:border-amber-200",
    kpiNeutralText: "text-amber-700",
    hoverOverlay: "from-amber-50/0 via-amber-50/50 to-amber-50/0",
  },
  emerald: {
    stripe: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500",
    iconTile: "bg-gradient-to-br from-emerald-50 to-teal-100",
    iconColor: "text-emerald-700",
    hoverShadow: "hover:shadow-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-200",
    kpiNeutralText: "text-emerald-700",
    hoverOverlay: "from-emerald-50/0 via-emerald-50/50 to-emerald-50/0",
  },
  zinc: {
    stripe: "bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500",
    iconTile: "bg-gradient-to-br from-zinc-50 to-zinc-100",
    iconColor: "text-zinc-700",
    hoverShadow: "hover:shadow-zinc-500/15",
    hoverBorder: "group-hover:border-zinc-300",
    kpiNeutralText: "text-zinc-700",
    hoverOverlay: "from-zinc-50/0 via-zinc-50/50 to-zinc-50/0",
  },
};

function toneTextClass(tone: KpiTone | undefined, theme: CardTheme): string {
  if (tone === "positive") return "text-emerald-700";
  if (tone === "warning") return "text-amber-700";
  if (tone === "danger") return "text-red-700";
  return THEMES[theme].kpiNeutralText;
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
  theme: CardTheme;
  kpi?: CardKpi;
};

export default function DashboardCard({
  label,
  description,
  href,
  iconName,
  theme,
  kpi,
}: DashboardCardProps) {
  const Icon = ICONS[iconName];
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const tokens = THEMES[theme];
  const kpiText = kpi ? toneTextClass(kpi.tone, theme) : "";
  const dotClass = toneDotClass(kpi?.tone);

  return (
    <motion.div
      animate={reduced ? undefined : { y: hovered ? -3 : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="h-full"
    >
      <Link
        href={href}
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

        {/* Icon tile + arrow row */}
        <div className="relative mb-4 flex items-start justify-between">
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
        <div className="relative">
          <h3 className="font-display text-base font-semibold text-zinc-900">
            {label}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>

        {/* KPI footer reserved at bottom of the card. The container is
            always mounted so card heights stay stable across hover.
            The KPI line itself fades + slides in on hover. A subtle
            zinc dash sits in default state so the bottom of every
            card has the same visual weight. */}
        {kpi ? (
          <div className="relative mt-auto pt-4">
            <div className="border-t border-zinc-100 pt-3">
              <div className="relative h-5">
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 flex items-center transition-opacity duration-300 ${hovered ? "opacity-0" : "opacity-100"}`}
                >
                  <span className="inline-block h-1 w-10 rounded-full bg-zinc-200" />
                </span>
                <motion.div
                  aria-hidden={!hovered}
                  initial={false}
                  animate={
                    reduced
                      ? { opacity: hovered ? 1 : 0 }
                      : { opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center gap-2"
                >
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
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-4">
            <div className="border-t border-zinc-100 pt-3">
              <div className="h-5" />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
