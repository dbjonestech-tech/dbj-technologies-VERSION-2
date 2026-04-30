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
  PricingAddon,
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
  PRICING_ADDONS,
  FAQ_ITEMS,
  CTA_DEFAULTS,
  ABOUT_CONTENT,
  ABOUT_STORY,
  BUDGET_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PATHLIGHT_CTA_CONTENT,
  DIAGNOSE_FIX_GROW,
} from "./siteContent";

/* ─── SITE META ─────────────────────────────────────── */
export const SITE = {
  name: "DBJ Technologies",
  tagline: "Architect The Impossible.",
  description:
    "DBJ Technologies is a bespoke digital engineering studio in Dallas, TX. I build high performance websites, production grade web applications, and cloud infrastructure using Next.js, React, and TypeScript.",
  url: "https://dbjtechnologies.com",
  address: "Dallas, TX",
  email: "joshua@dbjtechnologies.com",
  // Display the lettered form so scrapers parsing /\d{3}-\d{3}-\d{4}/ skip it.
  phoneDisplay: "682-DBJ-TECH",
  phoneTel: "+16823258324",
};

/* ─── NAV LINKS ─────────────────────────────────────── */
export const NAV_LINKS = [
  { label: "Pathlight", href: "/pathlight" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Process", href: "/process" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/* ─── SOCIAL LINKS ─────────────────────────────────── */
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/dbj-technologies/", icon: "linkedin" },
  { label: "GitHub", href: "https://github.com/dbjonestech-tech", icon: "github" },
] as const;

/* ─── FOOTER LINKS (EXTENDED) ─────────────────────── */
export const FOOTER_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Pathlight", href: "/pathlight" },
  { label: "Process", href: "/process" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

/* ─── SUPPORT LINKS (FOOTER) ──────────────────────── */
export const SUPPORT_LINKS = [
  { label: "Maintenance & Support", href: "/pricing/maintenance" },
  { label: "Why DBJ", href: "/why-dbj" },
] as const;

/* ─── TESTIMONIALS ──────────────────────────────────── */
export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  business: string;
  location: string;
  url: string;
  rating: number;
  source: string;
  credential?: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Created an amazing business website for us! Very impressed and would highly recommend to anyone!",
    name: "Miguel Ibarra",
    title: "Owner",
    business: "Star Auto Service",
    location: "Richardson, TX",
    url: "https://thestarautoservice.com",
    rating: 5,
    source: "Google",
  },
  {
    quote:
      "Highly recommend DBJ Technologies for website development. Joshua did our company website and it looks incredible. I get comments all the time on how much people like the site. He is working on SEO now and we are already getting quite a bit of traffic. This is money well spent and will recommend him to all my friends.",
    name: "Tyler Dirks",
    title: "Owner",
    business: "Soil Depot",
    location: "Plano, TX",
    url: "https://soil-depot.com",
    rating: 5,
    source: "Google",
    credential: "Google Local Guide · 45 reviews · 17 photos",
  },
];

/* ─── CLIENT LOGOS ─────────────────────────────────── */
export const CLIENT_LOGOS: string[] = [];

/* ─── TEAM MEMBERS ─────────────────────────────────── */
export const TEAM_MEMBERS: { name: string; role: string; bio: string }[] = [];
