/**
 * Per-card palette tokens for the /admin (Canopy) dashboard. Each
 * card on the dashboard, and each /admin/<route> page it links to,
 * gets a distinct color identity. Palettes are grouped into the
 * five column families so visual relationships at the column level
 * still read clearly:
 *
 *   Today        sky / cyan / teal / blue
 *   Acquisition  violet / indigo / fuchsia / purple / pink
 *   Operations   amber / orange / yellow / stone
 *   Health       emerald / green / red / lime
 *   Account      zinc
 *
 * Each token is a fully-realized Tailwind class string so the JIT
 * scanner can pick it up. Do not interpolate color names into class
 * names elsewhere; pull the relevant token from PALETTES[name].
 */

export type PaletteName =
  | "sky"
  | "cyan"
  | "teal"
  | "blue"
  | "violet"
  | "indigo"
  | "fuchsia"
  | "purple"
  | "pink"
  | "amber"
  | "orange"
  | "yellow"
  | "stone"
  | "emerald"
  | "green"
  | "red"
  | "lime"
  | "zinc";

export type PaletteTokens = {
  /** Top accent stripe gradient. */
  stripe: string;
  /** Icon tile gradient background. */
  iconTile: string;
  /** Icon color. */
  iconColor: string;
  /** Hover shadow color tag. */
  hoverShadow: string;
  /** Hover border color. */
  hoverBorder: string;
  /** KPI primary color when tone is "neutral". */
  kpiNeutralText: string;
  /** Subtle hover background gradient overlay. */
  hoverOverlay: string;
  /** Solid dot in column/family identifier. */
  dot: string;
  /** Page-header accent stripe gradient. */
  pageStripe: string;
  /** Page-header eyebrow text color (replaces zinc-400). */
  pageEyebrow: string;
};

export const PALETTES: Record<PaletteName, PaletteTokens> = {
  sky: {
    stripe: "bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500",
    iconTile: "bg-gradient-to-br from-sky-50 to-sky-100",
    iconColor: "text-sky-700",
    hoverShadow: "hover:shadow-sky-500/20",
    hoverBorder: "group-hover:border-sky-200",
    kpiNeutralText: "text-sky-700",
    hoverOverlay: "from-sky-50/0 via-sky-50/50 to-sky-50/0",
    dot: "bg-sky-500",
    pageStripe: "bg-gradient-to-r from-sky-400 to-sky-600",
    pageEyebrow: "text-sky-700",
  },
  cyan: {
    stripe: "bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500",
    iconTile: "bg-gradient-to-br from-cyan-50 to-sky-100",
    iconColor: "text-cyan-700",
    hoverShadow: "hover:shadow-cyan-500/20",
    hoverBorder: "group-hover:border-cyan-200",
    kpiNeutralText: "text-cyan-700",
    hoverOverlay: "from-cyan-50/0 via-cyan-50/50 to-cyan-50/0",
    dot: "bg-cyan-500",
    pageStripe: "bg-gradient-to-r from-cyan-400 to-cyan-600",
    pageEyebrow: "text-cyan-700",
  },
  teal: {
    stripe: "bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500",
    iconTile: "bg-gradient-to-br from-teal-50 to-teal-100",
    iconColor: "text-teal-700",
    hoverShadow: "hover:shadow-teal-500/20",
    hoverBorder: "group-hover:border-teal-200",
    kpiNeutralText: "text-teal-700",
    hoverOverlay: "from-teal-50/0 via-teal-50/50 to-teal-50/0",
    dot: "bg-teal-500",
    pageStripe: "bg-gradient-to-r from-teal-400 to-teal-600",
    pageEyebrow: "text-teal-700",
  },
  blue: {
    stripe: "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500",
    iconTile: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconColor: "text-blue-700",
    hoverShadow: "hover:shadow-blue-500/20",
    hoverBorder: "group-hover:border-blue-200",
    kpiNeutralText: "text-blue-700",
    hoverOverlay: "from-blue-50/0 via-blue-50/50 to-blue-50/0",
    dot: "bg-blue-500",
    pageStripe: "bg-gradient-to-r from-blue-400 to-blue-600",
    pageEyebrow: "text-blue-700",
  },
  violet: {
    stripe: "bg-gradient-to-r from-violet-400 via-violet-500 to-purple-500",
    iconTile: "bg-gradient-to-br from-violet-50 to-purple-100",
    iconColor: "text-violet-700",
    hoverShadow: "hover:shadow-violet-500/20",
    hoverBorder: "group-hover:border-violet-200",
    kpiNeutralText: "text-violet-700",
    hoverOverlay: "from-violet-50/0 via-violet-50/50 to-violet-50/0",
    dot: "bg-violet-500",
    pageStripe: "bg-gradient-to-r from-violet-400 to-violet-600",
    pageEyebrow: "text-violet-700",
  },
  indigo: {
    stripe: "bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-500",
    iconTile: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    iconColor: "text-indigo-700",
    hoverShadow: "hover:shadow-indigo-500/20",
    hoverBorder: "group-hover:border-indigo-200",
    kpiNeutralText: "text-indigo-700",
    hoverOverlay: "from-indigo-50/0 via-indigo-50/50 to-indigo-50/0",
    dot: "bg-indigo-500",
    pageStripe: "bg-gradient-to-r from-indigo-400 to-indigo-600",
    pageEyebrow: "text-indigo-700",
  },
  fuchsia: {
    stripe: "bg-gradient-to-r from-fuchsia-400 via-fuchsia-500 to-pink-500",
    iconTile: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100",
    iconColor: "text-fuchsia-700",
    hoverShadow: "hover:shadow-fuchsia-500/20",
    hoverBorder: "group-hover:border-fuchsia-200",
    kpiNeutralText: "text-fuchsia-700",
    hoverOverlay: "from-fuchsia-50/0 via-fuchsia-50/50 to-fuchsia-50/0",
    dot: "bg-fuchsia-500",
    pageStripe: "bg-gradient-to-r from-fuchsia-400 to-fuchsia-600",
    pageEyebrow: "text-fuchsia-700",
  },
  purple: {
    stripe: "bg-gradient-to-r from-purple-400 via-purple-500 to-fuchsia-500",
    iconTile: "bg-gradient-to-br from-purple-50 to-purple-100",
    iconColor: "text-purple-700",
    hoverShadow: "hover:shadow-purple-500/20",
    hoverBorder: "group-hover:border-purple-200",
    kpiNeutralText: "text-purple-700",
    hoverOverlay: "from-purple-50/0 via-purple-50/50 to-purple-50/0",
    dot: "bg-purple-500",
    pageStripe: "bg-gradient-to-r from-purple-400 to-purple-600",
    pageEyebrow: "text-purple-700",
  },
  pink: {
    stripe: "bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500",
    iconTile: "bg-gradient-to-br from-pink-50 to-pink-100",
    iconColor: "text-pink-700",
    hoverShadow: "hover:shadow-pink-500/20",
    hoverBorder: "group-hover:border-pink-200",
    kpiNeutralText: "text-pink-700",
    hoverOverlay: "from-pink-50/0 via-pink-50/50 to-pink-50/0",
    dot: "bg-pink-500",
    pageStripe: "bg-gradient-to-r from-pink-400 to-pink-600",
    pageEyebrow: "text-pink-700",
  },
  amber: {
    stripe: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
    iconTile: "bg-gradient-to-br from-amber-50 to-orange-100",
    iconColor: "text-amber-700",
    hoverShadow: "hover:shadow-amber-500/20",
    hoverBorder: "group-hover:border-amber-200",
    kpiNeutralText: "text-amber-700",
    hoverOverlay: "from-amber-50/0 via-amber-50/50 to-amber-50/0",
    dot: "bg-amber-500",
    pageStripe: "bg-gradient-to-r from-amber-400 to-amber-600",
    pageEyebrow: "text-amber-700",
  },
  orange: {
    stripe: "bg-gradient-to-r from-orange-400 via-orange-500 to-red-500",
    iconTile: "bg-gradient-to-br from-orange-50 to-orange-100",
    iconColor: "text-orange-700",
    hoverShadow: "hover:shadow-orange-500/20",
    hoverBorder: "group-hover:border-orange-200",
    kpiNeutralText: "text-orange-700",
    hoverOverlay: "from-orange-50/0 via-orange-50/50 to-orange-50/0",
    dot: "bg-orange-500",
    pageStripe: "bg-gradient-to-r from-orange-400 to-orange-600",
    pageEyebrow: "text-orange-700",
  },
  yellow: {
    stripe: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500",
    iconTile: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    iconColor: "text-yellow-700",
    hoverShadow: "hover:shadow-yellow-500/20",
    hoverBorder: "group-hover:border-yellow-200",
    kpiNeutralText: "text-yellow-700",
    hoverOverlay: "from-yellow-50/0 via-yellow-50/50 to-yellow-50/0",
    dot: "bg-yellow-500",
    pageStripe: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    pageEyebrow: "text-yellow-700",
  },
  stone: {
    stripe: "bg-gradient-to-r from-stone-400 via-stone-500 to-stone-600",
    iconTile: "bg-gradient-to-br from-stone-50 to-stone-100",
    iconColor: "text-stone-700",
    hoverShadow: "hover:shadow-stone-500/20",
    hoverBorder: "group-hover:border-stone-300",
    kpiNeutralText: "text-stone-700",
    hoverOverlay: "from-stone-50/0 via-stone-50/50 to-stone-50/0",
    dot: "bg-stone-500",
    pageStripe: "bg-gradient-to-r from-stone-400 to-stone-600",
    pageEyebrow: "text-stone-700",
  },
  emerald: {
    stripe: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500",
    iconTile: "bg-gradient-to-br from-emerald-50 to-teal-100",
    iconColor: "text-emerald-700",
    hoverShadow: "hover:shadow-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-200",
    kpiNeutralText: "text-emerald-700",
    hoverOverlay: "from-emerald-50/0 via-emerald-50/50 to-emerald-50/0",
    dot: "bg-emerald-500",
    pageStripe: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    pageEyebrow: "text-emerald-700",
  },
  green: {
    stripe: "bg-gradient-to-r from-green-400 via-green-500 to-emerald-500",
    iconTile: "bg-gradient-to-br from-green-50 to-green-100",
    iconColor: "text-green-700",
    hoverShadow: "hover:shadow-green-500/20",
    hoverBorder: "group-hover:border-green-200",
    kpiNeutralText: "text-green-700",
    hoverOverlay: "from-green-50/0 via-green-50/50 to-green-50/0",
    dot: "bg-green-500",
    pageStripe: "bg-gradient-to-r from-green-400 to-green-600",
    pageEyebrow: "text-green-700",
  },
  red: {
    stripe: "bg-gradient-to-r from-red-400 via-red-500 to-rose-500",
    iconTile: "bg-gradient-to-br from-red-50 to-red-100",
    iconColor: "text-red-700",
    hoverShadow: "hover:shadow-red-500/20",
    hoverBorder: "group-hover:border-red-200",
    kpiNeutralText: "text-red-700",
    hoverOverlay: "from-red-50/0 via-red-50/50 to-red-50/0",
    dot: "bg-red-500",
    pageStripe: "bg-gradient-to-r from-red-400 to-red-600",
    pageEyebrow: "text-red-700",
  },
  lime: {
    stripe: "bg-gradient-to-r from-lime-400 via-lime-500 to-green-500",
    iconTile: "bg-gradient-to-br from-lime-50 to-lime-100",
    iconColor: "text-lime-700",
    hoverShadow: "hover:shadow-lime-500/20",
    hoverBorder: "group-hover:border-lime-200",
    kpiNeutralText: "text-lime-700",
    hoverOverlay: "from-lime-50/0 via-lime-50/50 to-lime-50/0",
    dot: "bg-lime-500",
    pageStripe: "bg-gradient-to-r from-lime-400 to-lime-600",
    pageEyebrow: "text-lime-700",
  },
  zinc: {
    stripe: "bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500",
    iconTile: "bg-gradient-to-br from-zinc-50 to-zinc-100",
    iconColor: "text-zinc-700",
    hoverShadow: "hover:shadow-zinc-500/15",
    hoverBorder: "group-hover:border-zinc-300",
    kpiNeutralText: "text-zinc-700",
    hoverOverlay: "from-zinc-50/0 via-zinc-50/50 to-zinc-50/0",
    dot: "bg-zinc-400",
    pageStripe: "bg-gradient-to-r from-zinc-300 to-zinc-500",
    pageEyebrow: "text-zinc-600",
  },
};

/**
 * Mapping from /admin/<route> href to the palette that page (and its
 * dashboard card) uses. Pages that aren't in the dashboard grid still
 * pick up a sensible fallback if requested.
 */
export const PAGE_PALETTE: Record<string, PaletteName> = {
  "/admin/visitors": "sky",
  "/admin/monitor": "cyan",
  "/admin/scans": "teal",
  "/admin/leads": "blue",
  "/admin/funnel": "violet",
  "/admin/search": "indigo",
  "/admin/performance/rum": "fuchsia",
  "/admin/email": "purple",
  "/admin/recurring": "pink",
  "/admin/costs": "amber",
  "/admin/database": "orange",
  "/admin/clients": "yellow",
  "/admin/audit": "stone",
  "/admin/pipeline": "emerald",
  "/admin/platform": "green",
  "/admin/errors": "red",
  "/admin/infrastructure": "lime",
  "/admin/users": "zinc",
};

export function getPalette(href: string): PaletteTokens {
  const name = PAGE_PALETTE[href];
  return PALETTES[name ?? "zinc"];
}
