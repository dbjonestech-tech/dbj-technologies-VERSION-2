import { type LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════
 * CONSTANTS — re-exports from the single source of truth
 * ═══════════════════════════════════════════════════════
 * All content now lives in lib/siteContent.ts.
 * This file re-exports everything so existing component
 * imports continue to work without changes.
 * ═══════════════════════════════════════════════════════ */

export type {
  ServiceItem,
  StatItem,
  ProcessStep,
  ValueItem,
  PricingFeature,
  PricingTier,
  PortfolioItem,
  FaqItem,
  HeroContent,
  AboutPrinciple,
  CTADefaults,
} from "./siteContent";

export {
  HERO_CONTENT,
  STATS,
  SERVICES,
  PROCESS_STEPS,
  TECH_STACK,
  VALUES,
  PORTFOLIO_ITEMS,
  PRICING_TIERS,
  FAQ_ITEMS,
  CTA_DEFAULTS,
  ABOUT_CONTENT,
  BUDGET_OPTIONS,
  PROJECT_TYPE_OPTIONS,
} from "./siteContent";

/* ─── SITE META ─────────────────────────────────────── */
export const SITE = {
  name: "DBJ Technologies",
  tagline: "Engineering that ships.",
  description:
    "DBJ Technologies is a bespoke digital engineering studio in Dallas, TX. I build high-performance websites, production-grade web applications, and cloud infrastructure using Next.js, React, and TypeScript.",
  url: "https://dbjtechnologies.com",
  email: "hello@dbjtechnologies.com",
  address: "Dallas, TX",
};

/* ─── NAV LINKS ─────────────────────────────────────── */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Process", href: "/process" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
] as const;

/* ─── FOOTER LINKS (EXTENDED) ─────────────────────── */
export const FOOTER_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Process", href: "/process" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

/* ─── SUPPORT LINKS (FOOTER) ──────────────────────── */
export const SUPPORT_LINKS = [
  { label: "Maintenance & Support", href: "/maintenance-support" },
  { label: "Why DBJ", href: "/why-dbj" },
] as const;

/* ─── SOCIAL LINKS ──────────────────────────────────── */
export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/dbjtechnologies", icon: "github" },
  { label: "LinkedIn", href: "https://linkedin.com/company/dbjtechnologies", icon: "linkedin" },
] as const;

/* ─── TESTIMONIALS ──────────────────────────────────── */
export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];

/* ─── CLIENT LOGOS ─────────────────────────────────── */
export const CLIENT_LOGOS: string[] = [];

/* ─── TEAM MEMBERS ─────────────────────────────────── */
export const TEAM_MEMBERS: { name: string; role: string; bio: string }[] = [];
