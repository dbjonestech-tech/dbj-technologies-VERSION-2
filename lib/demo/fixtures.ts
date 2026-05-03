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
