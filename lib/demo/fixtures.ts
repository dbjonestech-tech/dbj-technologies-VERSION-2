/**
 * Demo fixtures for the public Canopy showcase route.
 *
 * Every record here is fictional. Names, domains, emails, phone
 * numbers, deal values, and dates are invented for screenshot
 * purposes. Nothing in this module reads from or writes to the
 * production database. Real client data must never appear here.
 *
 * The shape of each record mirrors the live service-layer types
 * just enough to render the corresponding admin component without
 * branching the component for "demo mode." Anywhere a real type
 * has fields the demo cannot fill (foreign keys, audit ids), the
 * fixture supplies a stable invented value.
 */

import type { ContactStatus, ContactSource } from "@/lib/services/contacts";
import type { DealStage } from "@/lib/services/deals";

export interface DemoContact {
  id: number;
  email: string;
  name: string;
  company: string;
  status: ContactStatus;
  source: ContactSource;
  followUpDate: string | null;
  lastActivityAt: string | null;
  scanCount: number;
  formCount: number;
  emailCount: number;
}

export interface DemoDeal {
  id: number;
  name: string;
  contactName: string;
  contactCompany: string;
  stage: DealStage;
  probabilityPct: number;
  valueCents: number;
  expectedCloseAt: string | null;
  closedAt: string | null;
  won: boolean | null;
  ownerEmail: string;
  updatedAt: string;
}

export interface DemoAuditRow {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface DemoActivity {
  id: number;
  type: "note" | "call" | "meeting" | "task" | "email";
  title: string;
  detail: string | null;
  occurredAt: string;
  actor: string;
}

const NOW = new Date("2026-05-02T18:00:00Z").getTime();
const minutes = (n: number) => new Date(NOW - n * 60_000).toISOString();
const hours = (n: number) => new Date(NOW - n * 3_600_000).toISOString();
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const futureDays = (n: number) =>
  new Date(NOW + n * 86_400_000).toISOString().split("T")[0];

export const DEMO_CONTACTS: DemoContact[] = [
  {
    id: 1001,
    email: "miguel@northwoodplumbing.com",
    name: "Miguel Reyes",
    company: "Northwood Plumbing",
    status: "qualified",
    source: "pathlight_scan",
    followUpDate: futureDays(2),
    lastActivityAt: hours(3),
    scanCount: 2,
    formCount: 1,
    emailCount: 6,
  },
  {
    id: 1002,
    email: "sarah@riverbenddental.com",
    name: "Dr. Sarah Patel",
    company: "Riverbend Dental",
    status: "proposal",
    source: "contact_form",
    followUpDate: futureDays(0),
    lastActivityAt: hours(7),
    scanCount: 1,
    formCount: 1,
    emailCount: 11,
  },
  {
    id: 1003,
    email: "owner@acmehvac.example",
    name: "Daniel Cho",
    company: "Acme HVAC",
    status: "contacted",
    source: "pathlight_scan",
    followUpDate: futureDays(-1),
    lastActivityAt: days(2),
    scanCount: 3,
    formCount: 0,
    emailCount: 4,
  },
  {
    id: 1004,
    email: "amelia@lakeshorecpa.com",
    name: "Amelia Park",
    company: "Lakeshore CPA",
    status: "won",
    source: "client_import",
    followUpDate: null,
    lastActivityAt: days(5),
    scanCount: 1,
    formCount: 2,
    emailCount: 22,
  },
  {
    id: 1005,
    email: "front@cottonwoodvet.example",
    name: "Jordan Liu",
    company: "Cottonwood Veterinary",
    status: "new",
    source: "pathlight_scan",
    followUpDate: futureDays(5),
    lastActivityAt: hours(12),
    scanCount: 1,
    formCount: 0,
    emailCount: 0,
  },
  {
    id: 1006,
    email: "team@beaconhillrealty.example",
    name: "Priya Mehta",
    company: "Beacon Hill Realty",
    status: "qualified",
    source: "pathlight_scan",
    followUpDate: futureDays(7),
    lastActivityAt: days(1),
    scanCount: 2,
    formCount: 1,
    emailCount: 9,
  },
  {
    id: 1007,
    email: "ops@harborlinelogistics.example",
    name: "Theo Nakamura",
    company: "Harborline Logistics",
    status: "lost",
    source: "manual",
    followUpDate: null,
    lastActivityAt: days(18),
    scanCount: 1,
    formCount: 0,
    emailCount: 14,
  },
  {
    id: 1008,
    email: "owner@summitautoglass.example",
    name: "Renata Aguirre",
    company: "Summit Auto Glass",
    status: "proposal",
    source: "pathlight_scan",
    followUpDate: futureDays(1),
    lastActivityAt: hours(20),
    scanCount: 2,
    formCount: 1,
    emailCount: 8,
  },
];

export const DEMO_DEALS: DemoDeal[] = [
  {
    id: 9001,
    name: "Riverbend Dental, site rebuild + Pathlight retainer",
    contactName: "Dr. Sarah Patel",
    contactCompany: "Riverbend Dental",
    stage: "proposal",
    probabilityPct: 75,
    valueCents: 1_850_000,
    expectedCloseAt: futureDays(7),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: hours(7),
  },
  {
    id: 9002,
    name: "Northwood Plumbing, local SEO + scan retainer",
    contactName: "Miguel Reyes",
    contactCompany: "Northwood Plumbing",
    stage: "qualified",
    probabilityPct: 50,
    valueCents: 1_200_000,
    expectedCloseAt: futureDays(14),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: hours(3),
  },
  {
    id: 9003,
    name: "Acme HVAC, page rebuild",
    contactName: "Daniel Cho",
    contactCompany: "Acme HVAC",
    stage: "contacted",
    probabilityPct: 30,
    valueCents: 950_000,
    expectedCloseAt: futureDays(21),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: days(2),
  },
  {
    id: 9004,
    name: "Beacon Hill Realty, schema + listing pages",
    contactName: "Priya Mehta",
    contactCompany: "Beacon Hill Realty",
    stage: "qualified",
    probabilityPct: 60,
    valueCents: 1_650_000,
    expectedCloseAt: futureDays(10),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: days(1),
  },
  {
    id: 9005,
    name: "Summit Auto Glass, site + booking flow",
    contactName: "Renata Aguirre",
    contactCompany: "Summit Auto Glass",
    stage: "proposal",
    probabilityPct: 70,
    valueCents: 1_450_000,
    expectedCloseAt: futureDays(5),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: hours(20),
  },
  {
    id: 9006,
    name: "Cottonwood Veterinary, first scan + scope call",
    contactName: "Jordan Liu",
    contactCompany: "Cottonwood Veterinary",
    stage: "new",
    probabilityPct: 15,
    valueCents: 800_000,
    expectedCloseAt: futureDays(28),
    closedAt: null,
    won: null,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: hours(12),
  },
  {
    id: 9007,
    name: "Lakeshore CPA, annual retainer",
    contactName: "Amelia Park",
    contactCompany: "Lakeshore CPA",
    stage: "won",
    probabilityPct: 100,
    valueCents: 2_400_000,
    expectedCloseAt: days(-3),
    closedAt: days(3),
    won: true,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: days(3),
  },
  {
    id: 9008,
    name: "Harborline Logistics, discovery only",
    contactName: "Theo Nakamura",
    contactCompany: "Harborline Logistics",
    stage: "lost",
    probabilityPct: 0,
    valueCents: 1_100_000,
    expectedCloseAt: days(-12),
    closedAt: days(12),
    won: false,
    ownerEmail: "joshua@dbjtechnologies.com",
    updatedAt: days(12),
  },
];

export const DEMO_AUDIT: DemoAuditRow[] = [
  {
    id: "a1",
    occurredAt: minutes(8),
    actor: "joshua@dbjtechnologies.com",
    action: "deal.stage.changed",
    before: { stage: "qualified", probability_pct: 50 },
    after: { stage: "proposal", probability_pct: 75 },
  },
  {
    id: "a2",
    occurredAt: minutes(34),
    actor: "joshua@dbjtechnologies.com",
    action: "contact.follow_up.set",
    before: { follow_up_date: null },
    after: { follow_up_date: futureDays(2) },
  },
  {
    id: "a3",
    occurredAt: hours(2),
    actor: "joshua@dbjtechnologies.com",
    action: "email.sent",
    before: null,
    after: {
      to: "miguel@northwoodplumbing.com",
      subject: "Quick follow-up on the scan results",
    },
  },
  {
    id: "a4",
    occurredAt: hours(5),
    actor: "joshua@dbjtechnologies.com",
    action: "tag.added",
    before: { tags: ["local-seo"] },
    after: { tags: ["local-seo", "fast-mover"] },
  },
  {
    id: "a5",
    occurredAt: hours(9),
    actor: "system",
    action: "scan.completed",
    before: null,
    after: { score: 72, score_delta: 14, source: "rescan" },
  },
  {
    id: "a6",
    occurredAt: days(1),
    actor: "joshua@dbjtechnologies.com",
    action: "template.created",
    before: null,
    after: { name: "Pathlight follow-up day 3", merge_fields: 4 },
  },
  {
    id: "a7",
    occurredAt: days(2),
    actor: "joshua@dbjtechnologies.com",
    action: "deal.value.changed",
    before: { value_cents: 850_000 },
    after: { value_cents: 1_200_000 },
  },
  {
    id: "a8",
    occurredAt: days(3),
    actor: "joshua@dbjtechnologies.com",
    action: "deal.closed.won",
    before: { stage: "proposal", closed_at: null },
    after: { stage: "won", closed_at: days(3), value_cents: 2_400_000 },
  },
];

export const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 1,
    type: "call",
    title: "30-min discovery with Northwood Plumbing",
    detail:
      "Walked the scan score together. Two emergency-service rivals outranking on local pack. Agreed to scope a retainer.",
    occurredAt: hours(3),
    actor: "joshua@dbjtechnologies.com",
  },
  {
    id: 2,
    type: "email",
    title: "Sent: Pathlight follow-up day 3",
    detail: "Auto-merged subject and body. Open + click tracked.",
    occurredAt: hours(8),
    actor: "joshua@dbjtechnologies.com",
  },
  {
    id: 3,
    type: "note",
    title: "Site decision-maker is Sarah, not the office mgr",
    detail:
      "Office manager is gatekeeper for scheduling but Sarah signs the proposal. Plan around her schedule going forward.",
    occurredAt: days(1),
    actor: "joshua@dbjtechnologies.com",
  },
  {
    id: 4,
    type: "meeting",
    title: "Strategy walk-through with Riverbend Dental",
    detail: "Reviewed scan, proposal, and rough timeline. Sent contract.",
    occurredAt: days(2),
    actor: "joshua@dbjtechnologies.com",
  },
];

export interface DemoDashboardKpiCard {
  href: string;
  primary: string;
  secondary?: string;
  meta?: string;
}

export const DEMO_DASHBOARD_KPIS: DemoDashboardKpiCard[] = [
  { href: "/showcase/canopy/visitors", primary: "1,284", secondary: "+18% vs prev 7d", meta: "humans, last 7d" },
  { href: "/showcase/canopy/contacts", primary: "127", secondary: "3 overdue follow-ups", meta: "active records" },
  { href: "/showcase/canopy/deals", primary: "$94.5k", secondary: "weighted, 12 open", meta: "pipeline" },
  { href: "/showcase/canopy/scans", primary: "342", secondary: "94% complete rate", meta: "Pathlight runs, 30d" },
  { href: "/showcase/canopy/leads", primary: "63", secondary: "+9 this week", meta: "captured leads" },
  { href: "/showcase/canopy/costs", primary: "$11.83", secondary: "$0.034 / scan avg", meta: "spend, last 7d" },
  { href: "/showcase/canopy/errors", primary: "0", secondary: "no unresolved", meta: "Sentry, 24h" },
  { href: "/showcase/canopy/email", primary: "98.7%", secondary: "deliverability", meta: "Resend, 30d" },
];

export const DEMO_TASKS_SUMMARY = {
  overdue: 1,
  dueToday: 3,
  dueThisWeek: 7,
  nextDueTitle: "Send Riverbend Dental contract",
};

export const DEMO_PIPELINE = {
  weightedCents: 9_450_000,
  unweightedCents: 17_500_000,
  closedWonMonthCents: 2_400_000,
  openCount: 6,
  wonMonthCount: 1,
};

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toLocaleString("en-US")}`;
}

export function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ─── ANALYTICS & PERFORMANCE FIXTURES ────────────── */

export const DEMO_VISITOR_KPIS = {
  humans7d: 1284,
  humans7dDeltaPct: 18,
  sessions7d: 1631,
  pagesPerSession: 2.4,
  bounceRatePct: 38,
  avgDurationSec: 142,
  recurringRate: 22,
};

export interface DemoVisitorRow {
  id: string;
  city: string | null;
  source: string;
  pageviews: number;
  durationSec: number;
  device: "desktop" | "mobile" | "tablet";
  startedAt: string;
}

export const DEMO_VISITORS_RECENT: DemoVisitorRow[] = [
  { id: "v1", city: "Dallas, TX", source: "google.com", pageviews: 5, durationSec: 287, device: "desktop", startedAt: minutes(4) },
  { id: "v2", city: "Plano, TX", source: "direct", pageviews: 3, durationSec: 142, device: "mobile", startedAt: minutes(11) },
  { id: "v3", city: "Frisco, TX", source: "linkedin.com", pageviews: 8, durationSec: 521, device: "desktop", startedAt: minutes(18) },
  { id: "v4", city: "Richardson, TX", source: "google.com", pageviews: 2, durationSec: 73, device: "mobile", startedAt: minutes(24) },
  { id: "v5", city: "Austin, TX", source: "twitter.com", pageviews: 4, durationSec: 198, device: "desktop", startedAt: minutes(31) },
  { id: "v6", city: "Houston, TX", source: "google.com", pageviews: 1, durationSec: 22, device: "mobile", startedAt: minutes(38) },
  { id: "v7", city: null, source: "direct", pageviews: 6, durationSec: 312, device: "desktop", startedAt: minutes(47) },
  { id: "v8", city: "Fort Worth, TX", source: "bing.com", pageviews: 3, durationSec: 165, device: "tablet", startedAt: minutes(53) },
];

export interface DemoTopPage {
  path: string;
  views: number;
  avgDurationSec: number;
  bounceRatePct: number;
}

export const DEMO_TOP_PAGES: DemoTopPage[] = [
  { path: "/", views: 487, avgDurationSec: 124, bounceRatePct: 32 },
  { path: "/services/web-design", views: 213, avgDurationSec: 198, bounceRatePct: 28 },
  { path: "/work/canopy", views: 184, avgDurationSec: 264, bounceRatePct: 19 },
  { path: "/pathlight", views: 167, avgDurationSec: 312, bounceRatePct: 22 },
  { path: "/about", views: 142, avgDurationSec: 156, bounceRatePct: 41 },
  { path: "/contact", views: 89, avgDurationSec: 87, bounceRatePct: 18 },
  { path: "/work", views: 71, avgDurationSec: 142, bounceRatePct: 35 },
];

export interface DemoTopSource {
  label: string;
  visits: number;
  conversions: number;
}

export const DEMO_TOP_SOURCES: DemoTopSource[] = [
  { label: "google.com", visits: 612, conversions: 14 },
  { label: "direct", visits: 348, conversions: 11 },
  { label: "linkedin.com", visits: 154, conversions: 9 },
  { label: "twitter.com", visits: 87, conversions: 3 },
  { label: "bing.com", visits: 53, conversions: 1 },
  { label: "duckduckgo.com", visits: 30, conversions: 0 },
];

export const DEMO_RUM = {
  lcpSec: 1.8,
  lcpThreshold: { good: 2.5, poor: 4.0 },
  inpMs: 124,
  inpThreshold: { good: 200, poor: 500 },
  cls: 0.04,
  clsThreshold: { good: 0.1, poor: 0.25 },
  ttfbSec: 0.62,
  fcpSec: 1.2,
};

export interface DemoSearchQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctrPct: number;
  avgPosition: number;
}

export const DEMO_SEARCH_QUERIES: DemoSearchQuery[] = [
  { query: "dallas web design", impressions: 1240, clicks: 87, ctrPct: 7.0, avgPosition: 4.2 },
  { query: "pathlight website audit", impressions: 612, clicks: 92, ctrPct: 15.0, avgPosition: 1.8 },
  { query: "principal architect studio", impressions: 184, clicks: 31, ctrPct: 16.8, avgPosition: 2.4 },
  { query: "operations dashboard small business", impressions: 156, clicks: 18, ctrPct: 11.5, avgPosition: 3.6 },
  { query: "next.js studio dallas", impressions: 92, clicks: 14, ctrPct: 15.2, avgPosition: 2.1 },
];

/* ─── AUTOMATION FIXTURES ─────────────────────────── */

export interface DemoSequence {
  id: number;
  name: string;
  status: "active" | "paused" | "draft";
  enrolled: number;
  completed: number;
  replied: number;
  nextStepLabel: string;
  steps: number;
}

export const DEMO_SEQUENCES: DemoSequence[] = [
  {
    id: 7001,
    name: "Pathlight scan follow-up",
    status: "active",
    enrolled: 14,
    completed: 38,
    replied: 6,
    nextStepLabel: "Day 3 nudge",
    steps: 4,
  },
  {
    id: 7002,
    name: "Discovery call no-show recovery",
    status: "active",
    enrolled: 3,
    completed: 11,
    replied: 4,
    nextStepLabel: "Day 1 reschedule offer",
    steps: 3,
  },
  {
    id: 7003,
    name: "Proposal sent, day 5 check-in",
    status: "active",
    enrolled: 5,
    completed: 9,
    replied: 5,
    nextStepLabel: "Day 5 soft-close",
    steps: 2,
  },
  {
    id: 7004,
    name: "Closed-Lost reactivation, 90-day",
    status: "paused",
    enrolled: 0,
    completed: 4,
    replied: 1,
    nextStepLabel: "Day 0 reopener",
    steps: 5,
  },
];

export interface DemoWorkflowRule {
  id: number;
  name: string;
  triggerLabel: string;
  enabled: boolean;
  fired24h: number;
  fired7d: number;
  lastFiredAt: string | null;
}

export const DEMO_WORKFLOWS: DemoWorkflowRule[] = [
  {
    id: 8001,
    name: "Deal moved to Proposal, send proof-of-craft email and create follow-up task",
    triggerLabel: "Deal stage changed",
    enabled: true,
    fired24h: 2,
    fired7d: 8,
    lastFiredAt: hours(2),
  },
  {
    id: 8002,
    name: "New scan completed with score below 50, flag for outreach",
    triggerLabel: "Pathlight scan completed",
    enabled: true,
    fired24h: 4,
    fired7d: 14,
    lastFiredAt: hours(5),
  },
  {
    id: 8003,
    name: "Contact form submitted with budget over $10k, send instant intro and assign",
    triggerLabel: "Contact form submitted",
    enabled: true,
    fired24h: 1,
    fired7d: 3,
    lastFiredAt: hours(9),
  },
  {
    id: 8004,
    name: "Deal silent for 14 days, reset stage to Qualified and log warning",
    triggerLabel: "Deal idle",
    enabled: true,
    fired24h: 0,
    fired7d: 1,
    lastFiredAt: days(2),
  },
  {
    id: 8005,
    name: "Reply received during sequence, exit enrollment",
    triggerLabel: "Email reply received",
    enabled: true,
    fired24h: 3,
    fired7d: 11,
    lastFiredAt: hours(1),
  },
];

export interface DemoEmailTemplate {
  id: number;
  name: string;
  subject: string;
  mergeFieldCount: number;
  lastUsedAt: string | null;
  usedCount: number;
}

export const DEMO_EMAIL_TEMPLATES: DemoEmailTemplate[] = [
  {
    id: 6001,
    name: "Pathlight scan results, day 0",
    subject: "Your Pathlight scan results are ready",
    mergeFieldCount: 4,
    lastUsedAt: hours(3),
    usedCount: 142,
  },
  {
    id: 6002,
    name: "Pathlight follow-up, day 3",
    subject: "A few specific things I would change on {{contact.company}}",
    mergeFieldCount: 5,
    lastUsedAt: hours(8),
    usedCount: 87,
  },
  {
    id: 6003,
    name: "Proof of craft, post-call",
    subject: "Reference architectures for {{contact.vertical}}",
    mergeFieldCount: 3,
    lastUsedAt: days(1),
    usedCount: 34,
  },
  {
    id: 6004,
    name: "Proposal sent, day 5 check-in",
    subject: "Quick follow-up on the proposal",
    mergeFieldCount: 2,
    lastUsedAt: hours(20),
    usedCount: 19,
  },
];

/* ─── OPERATIONS & HEALTH FIXTURES ────────────────── */

export type DemoStatusLevel = "ok" | "warn" | "fail";

export interface DemoStatusSignal {
  area: string;
  level: DemoStatusLevel;
  message: string;
}

export const DEMO_STATUS_BANNER = {
  level: "ok" as DemoStatusLevel,
  signals: [
    { area: "Deployments", level: "ok", message: "Last deploy 4h ago, all checks green." },
    { area: "Pipeline", level: "ok", message: "All scheduled jobs ran on time, last 24h." },
    { area: "Budget", level: "ok", message: "$12.40 of $200 monthly budget used." },
    { area: "Infrastructure", level: "ok", message: "All tracked domains pass TLS, WHOIS, DKIM, DMARC." },
    { area: "Errors", level: "ok", message: "0 unresolved issues, last 24h." },
    { area: "Mobile RUM", level: "ok", message: "LCP 1.8s, CLS 0.04, INP 124ms, all within target." },
  ] satisfies DemoStatusSignal[],
};

export interface DemoInfraCheck {
  domain: string;
  tlsExpiryDays: number;
  whoisExpiryDays: number;
  spfPass: boolean;
  dkimPass: boolean;
  dmarcPass: boolean;
}

export const DEMO_INFRA_CHECKS: DemoInfraCheck[] = [
  { domain: "dbjtechnologies.com", tlsExpiryDays: 67, whoisExpiryDays: 312, spfPass: true, dkimPass: true, dmarcPass: true },
  { domain: "pathlight.dbjtechnologies.com", tlsExpiryDays: 67, whoisExpiryDays: 312, spfPass: true, dkimPass: true, dmarcPass: true },
  { domain: "thestarautoservice.com", tlsExpiryDays: 41, whoisExpiryDays: 198, spfPass: true, dkimPass: true, dmarcPass: true },
  { domain: "ops.thestarautoservice.com", tlsExpiryDays: 41, whoisExpiryDays: 198, spfPass: true, dkimPass: true, dmarcPass: true },
  { domain: "soil-depot.com", tlsExpiryDays: 23, whoisExpiryDays: 152, spfPass: true, dkimPass: true, dmarcPass: true },
];

export const DEMO_DELIVERABILITY = {
  sent30d: 1842,
  delivered30d: 1818,
  bounced30d: 24,
  complained30d: 1,
  deliveryRatePct: 98.7,
  bounceRatePct: 1.3,
};

export interface DemoFunctionRow {
  name: string;
  invocations24h: number;
  errorRatePct: number;
  p95Ms: number;
}

export const DEMO_FUNCTION_HEALTH: DemoFunctionRow[] = [
  { name: "scan-pipeline", invocations24h: 28, errorRatePct: 0, p95Ms: 87000 },
  { name: "contact-form", invocations24h: 6, errorRatePct: 0, p95Ms: 412 },
  { name: "infra-check-daily", invocations24h: 1, errorRatePct: 0, p95Ms: 19400 },
  { name: "email-kpi-refresh", invocations24h: 24, errorRatePct: 0, p95Ms: 1240 },
  { name: "vercel-telemetry", invocations24h: 24, errorRatePct: 0, p95Ms: 890 },
];

export const DEMO_BUDGET_HEADROOM = {
  monthlyBudgetUsd: 200,
  spentThisPeriodUsd: 12.4,
  pctSpent: 6.2,
  daysRemaining: 26,
};

/* ─── PATHLIGHT INTEGRATION FIXTURES ──────────────── */

/* Public-OK gate state. Per .claude/rules/canopy.md: the EXISTENCE
 * of guardrails is a sales feature; per-layer order and column
 * names stay private. This fixture exposes status only, not
 * implementation specifics. */
export const DEMO_PATHLIGHT_GATE = {
  capabilityEnabled: true,
  manualOnly: true,
  monthlyBudgetUsd: 200,
  spentThisPeriodUsd: 12.4,
  budgetRemainingUsd: 187.6,
  pctSpent: 6.2,
};

export interface DemoProspect {
  id: number;
  business: string;
  domain: string;
  vertical: string;
  city: string;
  scanScore: number | null;
  status: "candidate" | "scanned" | "outreach";
  scannedAt: string | null;
}

export const DEMO_PROSPECTS: DemoProspect[] = [
  { id: 4001, business: "Northwood Plumbing", domain: "northwoodplumbing.com", vertical: "Plumbing", city: "Plano, TX", scanScore: 47, status: "outreach", scannedAt: hours(8) },
  { id: 4002, business: "Riverbend Dental", domain: "riverbenddental.com", vertical: "Dental Practice", city: "Frisco, TX", scanScore: 53, status: "outreach", scannedAt: days(2) },
  { id: 4003, business: "Beacon Hill Realty", domain: "beaconhillrealty.example", vertical: "Real Estate", city: "Dallas, TX", scanScore: 61, status: "scanned", scannedAt: days(1) },
  { id: 4004, business: "Cottonwood Veterinary", domain: "cottonwoodvet.example", vertical: "Veterinary", city: "Richardson, TX", scanScore: 44, status: "scanned", scannedAt: hours(12) },
  { id: 4005, business: "Summit Auto Glass", domain: "summitautoglass.example", vertical: "Auto Repair", city: "Dallas, TX", scanScore: 51, status: "outreach", scannedAt: hours(20) },
  { id: 4006, business: "Bluebonnet HVAC", domain: "bluebonnethvac.example", vertical: "HVAC", city: "Plano, TX", scanScore: null, status: "candidate", scannedAt: null },
  { id: 4007, business: "Lakeshore CPA", domain: "lakeshorecpa.com", vertical: "Financial Advisor", city: "Frisco, TX", scanScore: 78, status: "outreach", scannedAt: days(5) },
  { id: 4008, business: "Heritage Med Spa", domain: "heritagemedspa.example", vertical: "Med Spa", city: "Dallas, TX", scanScore: null, status: "candidate", scannedAt: null },
];

export interface DemoChangeAlert {
  id: number;
  contactCompany: string;
  domain: string;
  changeKind: string;
  observedAt: string;
  resolved: boolean;
}

export const DEMO_CHANGE_ALERTS: DemoChangeAlert[] = [
  { id: 5001, contactCompany: "Riverbend Dental", domain: "riverbenddental.com", changeKind: "Hero copy and CTA changed", observedAt: hours(3), resolved: false },
  { id: 5002, contactCompany: "Northwood Plumbing", domain: "northwoodplumbing.com", changeKind: "New service-area page added", observedAt: hours(11), resolved: false },
  { id: 5003, contactCompany: "Beacon Hill Realty", domain: "beaconhillrealty.example", changeKind: "Site theme refreshed sitewide", observedAt: days(1), resolved: false },
  { id: 5004, contactCompany: "Lakeshore CPA", domain: "lakeshorecpa.com", changeKind: "Blog post added", observedAt: days(2), resolved: true },
];

export interface DemoCompetitorScan {
  id: number;
  forContactCompany: string;
  competitor: string;
  competitorDomain: string;
  scanScore: number;
  delta: number;
  scannedAt: string;
}

export const DEMO_COMPETITOR_SCANS: DemoCompetitorScan[] = [
  { id: 3001, forContactCompany: "Northwood Plumbing", competitor: "Cedarbrook Plumbing", competitorDomain: "cedarbrookplumbing.example", scanScore: 62, delta: 15, scannedAt: hours(6) },
  { id: 3002, forContactCompany: "Northwood Plumbing", competitor: "Pinewood Plumbing", competitorDomain: "pinewoodplumbing.example", scanScore: 38, delta: -9, scannedAt: hours(6) },
  { id: 3003, forContactCompany: "Riverbend Dental", competitor: "Whitestone Dental", competitorDomain: "whitestonedental.example", scanScore: 71, delta: 18, scannedAt: days(1) },
  { id: 3004, forContactCompany: "Riverbend Dental", competitor: "Greenpoint Family Dental", competitorDomain: "greenpointdental.example", scanScore: 59, delta: 6, scannedAt: days(1) },
];
