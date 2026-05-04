# Current State

Last updated: May 4, 2026 (Canopy showcase tour expanded from 4 to 8 sections + /work/canopy now links to /showcase/canopy via the View Live Site button, shipped at `d84f1b7`). **All 10 Canopy phases shipped (0 through 9 inclusive).**

## Canopy v2 build status

**All ten phases of `docs/ai/canopy-build-plan.md` are now COMPLETE end-to-end** (phases 0 through 9 inclusive). Phases 0-9 are committed, pushed, and migrations applied to prod Neon. Phase 4 (Gmail integration) shipped May 2 across three commits + a final UI commit.

| Phase | Surface | Status | Migration |
|-------|---------|--------|-----------|
| 0 | Settings, audit, Pathlight locks | shipped | 024 |
| 1 | Deals architecture pivot | shipped | 025 |
| 2 | Activities + tasks | shipped | 026 |
| 3 | Custom fields, tags, segments | shipped | 027 |
| 4 | Email integration (Gmail OAuth + ingest cron + tracking + compose UI + templates) | **shipped** | 033 |
| 5 | Automation: sequences, workflow rules, bulk actions | shipped | 029 |
| 6 | Pathlight manual integrations (rescan, AI search check, lead score) | shipped | 028 |
| 7 | Analytics + narrative digest | shipped | (uses 024 fields) |
| 8 | Multi-user enterprise (RBAC, REST API tokens, webhooks) | shipped | 030 + 031 |
| 9 | Pathlight Advanced (prospecting, change monitoring, competitive intel, beacon) | shipped | 032 |

The Star Auto install at `ops.thestarautoservice.com` is now eligible to be rebuilt from this canonical Canopy per the operational note in `canopy-build-plan.md`. The frozen starter at `github.com/dbjonestech-tech/canopy` is also eligible for rebuild from this codebase.

## Canopy showcase-link tightening: hero label override, conditional icon, in-section copy refinement (May 4, 2026)

Shipped at `0e6e0fc`. Three small label/icon refinements after the chip+links commit landed, all driven by the same observation: the hero CTA "View Live Site" with ExternalLink icon was inherited from projects with real production URLs (Pathlight, The Star Auto Service, Soil Depot all use https URLs that legitimately open external) but for Canopy the liveUrl points at the internal `/showcase/canopy` tour, where "View Live Site" + the external-link icon both read slightly off.

- `lib/work-data.ts` ProjectDetail interface gained an optional `liveUrlLabel?: string` field. Defaults to "View Live Site" when omitted, preserving the rendering of every other work entry. Canopy entry sets `liveUrlLabel: "Open the Showcase"` so the hero button reads accurately for a fixture-only tour destination.
- `components/templates/ProjectDetailLayout.tsx` hero-button rendering now branches the icon on `liveUrl.startsWith("http")`. External URLs (the other three projects) keep the existing `ExternalLink` icon. Internal URLs (Canopy) render `ArrowRight` instead. Aligns with the convention that the external-link icon should only signal "this leaves the site" actions.
- `components/templates/ProjectDetailLayout.tsx` in-section link copy tightened from "View this live →" to "Open in showcase →". Differentiates verb ("Open" vs "View") and names the destination ("showcase") so it does not parallel the hero CTA's "View Live Site" pattern. Verb consistency between the new hero "Open the Showcase" and the in-section "Open in showcase →" reinforces the destination relationship.

Pathlight, The Star Auto Service, and Soil Depot detail pages remain visually identical to the prior commit; the new override field is unset on those entries and the icon-branching keeps `ExternalLink` for all three. Verification: tsc clean, lint clean, 0 em dashes in changed files.

## Canopy work-card chip wrap fix and in-section showcase links (May 4, 2026)

Shipped at `5f0732f`. End-to-end browser audit surfaced two visual gaps after the showcase expansion landed; this commit closes both.

- `lib/work-data.ts` Canopy entry: "Live Install" metric chip value shortened from "The Star Auto Service" (21 chars, wrapped to three lines on the work-card at sm:grid-cols-3) to "The Star Auto" (13 chars, two-line max). Article preserved (canonical to the brand), recognizable "Star Auto" anchor preserved, redundant "Service" word dropped. Full brand name "The Star Auto Service" stays everywhere else in the file (description, heroDescription, notable, timeline, all section bodies) and across the rest of the codebase. Fix is purely at the data value-string layer; no styling, no Tailwind, no chip-width or overflow CSS touched.
- `lib/work-data.ts` ProjectSection interface gained an optional `liveHref?: string` field. Six Canopy sections now carry liveHref pointing to their matching showcase pages: Section 3 Analytics & Performance → /showcase/canopy/analytics, Section 4 Pipeline & Relationships → /showcase/canopy/deals, Section 5 Automation → /showcase/canopy/automation, Section 6 Operations & Health → /showcase/canopy/operations, Section 7 Pathlight Integration → /showcase/canopy/pathlight, Section 8 Architecture & Ownership → /showcase/canopy/audit. Sections 1 (The Problem), 2 (What You Get), and 9 (What Comes Next) deliberately omit liveHref because they are narrative, not capability surfaces.
- `components/templates/ProjectDetailLayout.tsx` adds a conditional render inside the section body wrapper at line ~399. When `section.liveHref` is truthy, a quiet "View this live →" Link renders below the body paragraph: text-sm font-medium, accent-tinted color, accent/40 border underline. Quieter than the hero secondary "Read the Case Study" CTA by weight (medium vs semibold) and color (accent vs text-primary) so it does not compete with the hero CTA pair. Pathlight, The Star Auto Service, and Soil Depot detail pages render unchanged because none of their sections set liveHref.

No /admin/* surface touched. No /showcase/canopy/* page or shared layout touched. No hero CTA pair touched. No styling fix to the chip; data-only. No new components introduced.

## Canopy showcase expansion: tour mirrors the 9-section /work/canopy narrative (May 4, 2026)

Shipped at `d84f1b7`. The /showcase/canopy tour previously had four pages (Dashboard, Contacts, Deals, Audit log) while the Phase 1C /work/canopy work entry described nine capability sections. A buyer reading the comprehensive 9-section pitch and clicking through to the showcase saw a 4-page tour with no Analytics, Automation, Operations, or Pathlight surface. This commit closes that coverage gap.

Four new showcase pages, all fixture-only and publicly indexable:

- `app/showcase/canopy/analytics/page.tsx`: First-party visitor KPIs (humans 7d, sessions, pages/session, bounce rate, avg duration, recurring rate), Real-User Web Vitals tiles (LCP, INP, CLS, TTFB, FCP) with thresholded color, top pages table, top sources table, search-queries table, recent visitors table. Eyebrow "Acquisition", sky palette.
- `app/showcase/canopy/automation/page.tsx`: Sequences table with reply-exit framing, workflow rules list with trigger labels and 24h/7d fire counts, email templates table with merge-field counts and last-used timestamps. Eyebrow "Automation", violet palette.
- `app/showcase/canopy/operations/page.tsx`: Worst-of status banner with six area signals, infrastructure table (per-domain TLS expiry, WHOIS expiry, SPF/DKIM/DMARC pass marks), deliverability stats, function-health table with invocations/error rate/p95, budget headroom panel with progress bar. Eyebrow "Operations", cyan palette.
- `app/showcase/canopy/pathlight/page.tsx`: Layered guardrails status panel (capability enabled, triggers manual or rules-bounded, monthly budget headroom), prospecting candidates table with vertical/score/status, change-monitoring alerts list with manual-rescan framing, competitive scans list with delta vs the contact's own score. Eyebrow "Pathlight Advanced", lime palette. Per canopy.md Public Presentation: describes the EXISTENCE of guardrails (sales feature) without revealing per-layer order, column names, function signatures, or lead-score component names.

Showcase navigation updated from 4 items to 8: Dashboard / Analytics / Contacts / Deals / Automation / Operations / Pathlight / Audit log. The original four sections retain their existing palettes; the new four use sky, indigo, cyan, and lime to match the canonical /admin sidebar palette assignments.

Showcase dashboard polish:
- Salutation changed from "Good afternoon, Joshua." to "Good afternoon." A public-indexable page should not greet a specific operator by name; the Phase 1C "demo view of an operator's view" framing subhead carries the demo context.
- Previously dead-linked dashboard cards (`/showcase/canopy` self-references for Visitors, Monitor, Pathlight scans, Costs, Errors) now point to their corresponding new pages: Visitors → /analytics, Monitor → /operations, Pathlight scans → /pathlight, Costs → /operations, Errors → /operations.

Cross-link from /work/canopy to /showcase/canopy:
- `lib/work-data.ts` Canopy entry adds `liveUrl: "/showcase/canopy"`. The ProjectDetailLayout component already renders a "View Live Site" button when `liveUrl` is present, so the work-page deep-dive hero now has that button alongside the existing Get in Touch CTA. The previous comment explaining the absence of `liveUrl` (auth-walled per-client install) is replaced with a comment pointing at the showcase as the public-rendered demo.

Demo fixtures added to `lib/demo/fixtures.ts` (~390 new lines): DEMO_VISITOR_KPIS, DEMO_VISITORS_RECENT, DEMO_TOP_PAGES, DEMO_TOP_SOURCES, DEMO_RUM, DEMO_SEARCH_QUERIES, DEMO_SEQUENCES, DEMO_WORKFLOWS, DEMO_EMAIL_TEMPLATES, DEMO_STATUS_BANNER, DEMO_INFRA_CHECKS, DEMO_DELIVERABILITY, DEMO_FUNCTION_HEALTH, DEMO_BUDGET_HEADROOM, DEMO_PATHLIGHT_GATE, DEMO_PROSPECTS, DEMO_CHANGE_ALERTS, DEMO_COMPETITOR_SCANS. All values fictional, names invented, no production data.

No /admin/* surface touched. No Pathlight code touched. No cron registry touched. No `lib/canopy/*` code touched. No migrations touched. Verification gates passed: tsc clean, lint clean, 0 em dashes, 0 JSONB in marketing copy, 0 deliberate lead-score enumeration, 0 RBAC enum lists, 0 "three-layer" / "Layer N" disclosure, 0 "we"/"our"/"us" in new copy.

## Canopy marketing Phase 1C, Layer 1 work-page rewrite (May 4, 2026)

Shipped at `c58a8a8`. Six files touched in one focused commit:

- `lib/work-data.ts`: Canopy entry expanded from 5 sections to 9 (The Problem, What You Get, Analytics & Performance, Pipeline & Relationships, Automation, Operations & Health, Pathlight Integration, Architecture & Ownership, What Comes Next). Sentry/Datadog/PostHog "excellent products" vendor list at the prior line 375 removed in favor of generic SaaS-sprawl framing per the canopy.md Vendor Posture rule. Section-5 "we can scope a custom build" voice violation fixed to first-person. Description and heroDescription tightened to first-person and refer to Canopy as an "operating-system admin" rather than "operations dashboard." Metrics array updated to `Sections: 9 / Live Install: The Star Auto Service / Categories Replaced: 6` (replacing the prior `5-7` range with a concrete count). techStack expanded from 4 items to 8: Next.js 16, TypeScript, Neon Postgres, Auth.js, Inngest, Vercel, Resend, Sentry. The Section-7 Pathlight integration paragraph uses "layered guardrails" framing rather than the prior "three-layer guardrail" phrasing, to keep the per-layer order private per canopy.md.
- `app/(marketing)/about/AboutContent.tsx`: legacy `OPS_CAPABILITIES` constant renamed to `CANOPY_CAPABILITIES` at the declaration and the single usage. No copy changes; the Built for Myself First section already aligned with the April 30 reposition.
- `app/showcase/canopy/layout.tsx`: metadata description and in-page Live demo banner softened from "the operating-system admin DBJ Technologies runs and ships to clients" to install-zero-honest first-person framing ("the operating-system admin I built for the studio, with the first external install live for a client").
- `app/showcase/canopy/page.tsx`: "One cockpit" replaced with "One canopy" in the showcase dashboard header. New subhead added between the Canopy Admin eyebrow and the salutation: "A demo view of Canopy as an operator would see it. Fictional data, real product."
- `.claude/rules/canopy.md`: three factual fixes. Line 3 disambiguation block "the /pricing/canopy detail page" corrected to "the /work/canopy detail page." Line 15 Public-Presentation forbidden-list "/work entry, /pricing/canopy detail page, /showcase/canopy tour" corrected to "/work/canopy detail page, /showcase/canopy tour." Line 80 Legacy-Names "The /pricing/operations slug 308-redirects to /pricing/canopy" corrected to reflect the actual `next.config.mjs` posture (both `/pricing/operations` and `/pricing/canopy` 308-redirect to `/work/canopy`).
- `docs/ai/current-state.md`: this section added; the prior stale "Canopy DBJ marketing surfaces" subsection rewritten to reflect actual production state.

No /admin/* surface touched. No Pathlight code touched. No cron registry touched. No `lib/canopy/*` code touched. No migrations touched. Layer 2 (animated drop-down toggles) and Layer 3 (dedicated deep-dive routes per section) remain deferred to subsequent phases.



## Canopy v2 build (May 1, latest) - Phase 1 deals architecture pivot staged in working tree

The architectural pivot from contact-stage to deal-stage CRM. One contact can now have multiple deals over time, each with its own value, probability, expected close, and won/lost outcome. The new `/admin/deals` Kanban becomes the primary deal board; the existing `/admin/relationships/pipeline` (contact-stage kanban) keeps working with a banner pointing to the new board.

**Working tree (uncommitted):** migration `025_deals.sql` with idempotent backfill from contacts.status (one deal per contact), `lib/services/deals.ts` (kanban query, rollups, stage rollups, format helpers), `lib/actions/deals.ts` (six audit-logged Server Actions: create, updateField, changeStage, closeWon, closeLost, reopen with the probability-never-decreases rule and contact-status mirror rule), `/admin/deals` page with three rollup tiles + kanban, `/admin/deals/[id]` detail with inline editors and audit log, contact detail page gains a Deals panel, dashboard gains a Pipeline rollup section + Deals card, sidebar gains a Deals item, relationships pipeline gains a banner.

`npx tsc --noEmit` and `npm run lint` clean. Migration 025 has NOT been applied to prod Neon yet; until applied `/admin/deals` renders an empty state with a hint to run the migration.

## Canopy v2 build (May 1, late) - error pipeline + Phase 0 shipped at `9f259de` + `20d2bf8` (live in production)

DBJ `/admin` in this repo is now the canonical source of truth for Canopy. The starter at `github.com/dbjonestech-tech/canopy`, the `operations-cockpit` working directory, and the live install at `ops.thestarautoservice.com` are **frozen**. See `docs/ai/decision-log.md` for the full reasoning and `docs/ai/canopy-build-plan.md` for the 9-phase roadmap.

**In working tree, uncommitted, both `npx tsc --noEmit` and `npm run lint` clean:**

- **First-party error capture pipeline.** Migration 023 + `/api/track/error` + `components/analytics/ErrorBeacon.tsx` mounted in root layout + `lib/services/errors.ts` query helpers + rewritten `/admin/errors` page that hybridizes first-party `error_events` (primary, fingerprint-grouped, hourly volume sparkline + by-source bars + top groups table) with the existing Sentry view (secondary). Wires `window.error` and `unhandledrejection` to `sendBeacon`/`fetch`.
- **Phase 0: Settings, Audit, Pathlight Locks.** Migration 024 adds `canopy_settings` (singleton, six Pathlight feature toggles + monthly_scan_budget + scans_used_this_period + period_resets_at + lead_score_weights + brand fields + digest cadence), `canopy_audit_log` (entity-change trail, distinct from existing `admin_audit_log` for auth events), `canopy_feature_flags` (generic key/value scope JSONB). `lib/canopy/{settings,pathlight-gate,audit}.ts` are the runtime helpers; the gate's `canFireScan(kind)` returns `{ allowed, reason?, remaining? }` and is required on every Pathlight entrypoint going forward. `lib/actions/canopy-settings.ts` mutations (admin-gated, audit-logged, revalidatePath). `/admin/canopy` page with master-kill pill, per-feature toggles, monthly budget editor with reset-counter button, white-label form, recent setting changes feed. Sidebar entry under Account.

**Not yet applied to prod Neon:** migrations 023 and 024. Until applied, the corresponding pages render their safe defaults (empty state for /admin/errors first-party section, all-OFF settings on /admin/canopy). Both helpers fall open to defaults if the table is missing, so render paths are robust against an unapplied migration.

**Frozen elsewhere:** `/Users/doulosjones/Desktop/operations-cockpit/` (the productized starter that was source for The Star Auto Service). 8 admin sections vs DBJ's 22+. Audit identified 3 deltas worth porting back: (1) error capture pipeline - DONE this session, (2) exportable CanopyBeacon snippet - deferred, (3) bootstrap/seed scripts - deferred.

## Canopy (productized engagement, April 28; renamed from Operations Cockpit later same day; expanded to 9-section product April 29)

The internal admin dashboard is now positioned publicly as a productized engagement called **Canopy**, "Starting at $25,000," 4-8 week delivery. Pitched as a consolidation of 5-7 SaaS subscriptions into one stack the buyer owns: first-party analytics, real-user performance, deliverability monitoring, infrastructure watchers, error tracking, pipeline observability, cost telemetry. Same architecture I run for DBJ.

### First install LIVE: The Star Auto Service

`https://ops.thestarautoservice.com/admin` is live behind Google sign-in. Test users: `joshua@dbjtechnologies.com` and `thestarautoservice1@gmail.com`. Neon Postgres provisioned and migrated (7 migrations). Cloudflare DNS resolves; SSL valid; auto-redirect to `/signin?callbackUrl=/admin` works. Vercel project `starauto-ops` on the `dbjonestech-9249s-projects` team. CanopyBeacon component mounted in Star Auto's main repo (`github.com/dbjonestech-tech/star-auto-service`, `src/app/layout.tsx` line ~12 with Suspense wrap), endpoint `https://ops.thestarautoservice.com`. CORS allow-list `CANOPY_ALLOWED_ORIGINS` covers both apex and www. Cookies `cnp_vid`/`cnp_sid` set with `Secure; SameSite=None` for cross-origin handshake.

### Canopy product surface (9 admin sections, April 29 expansion)

All routes under `/admin/*`, gated by Auth.js Google sign-in + `ADMIN_EMAILS` allow-list:
- `/admin` (Dashboard): 8 headline stat cards with sparklines + trend deltas, worst-of-status banner, recent deploys/errors/sessions feeds, infrastructure summary
- `/admin/visitors`: chart-driven analytics page (PostHog/Vercel-Analytics level). Hero Recharts area chart with previous-period ghost line; 6 metric tiles (visitors / sessions / page views / bounce rate / pages per session / conversions) with period-over-period deltas (bounce rate color-inverted); three breakdown panels (top pages, top sources, devices+engagement) as styled-div bars; optional top-cities geography panel; live presence + 25-row recent visitors table preserved as-is. Date range selector (7D / 14D / 30D / 90D + custom) updates the chart, tiles, and breakdowns via `/admin/api/visitors-data` without touching the URL params used by the recent-visitors `?before_v=` cursor. Phase 1 of the visitors-page-upgrade build (May 1, 2026)
- `/admin/contacts`, `/admin/contacts/[id]`, `/admin/relationships/pipeline`: lightweight CRM. Migration 022 adds `contacts` (email PK-by-unique, status/source CHECK constraints, follow_up_date with partial index) and `contact_notes` (note / status_change / system types). List page has filter chips (status / source / overdue / search) and `.canopy-table` with touchpoint counts (scans / forms / emails) computed inline via LATERAL subqueries. Detail page shows inline-editable header fields, a Pathlight scan card on the right when one exists (admin-only, no internals leak), and a unified timeline that UNIONs page-views (grouped by session) / scans / forms / email events / notes / client events. Pipeline page is a six-column kanban with per-card status dropdown (no drag-and-drop). Auto-creation wired into the scan finalize step, contact form route, and client invitation accept flow (all best-effort try/catch; never blocks the parent flow). Sidebar shows Contacts row with a red overdue-count badge when applicable. Phase 2 (May 1, 2026)
- `/admin/performance/rum`: 5 Web Vital cards with thresholded color (LCP/INP/CLS/TTFB/FCP), 14d trend sparklines, by-page table, by-device card
- `/admin/platform`: deploy outcomes, 14d cadence, function p95, recent 12 deploys, hot 10 functions table
- `/admin/infrastructure`: per-domain check grid (TLS/WHOIS/MX/SPF/DKIM/DMARC), TLS expiry countdown, auth posture bars
- `/admin/email`: delivery rate, bounce rate, top bouncing recipients, 30d send/delivery/bounce trend, recent webhook events
- `/admin/monitor`: per-host uptime + latency + recent incidents (last 7 days)
- `/admin/errors`: grouped-by-fingerprint with affected user counts, by-source breakdown, 24h hourly volume
- `/admin/audit`: signin/signout/denied log with top actors and recent activity feed

Sidebar grouped Overview / Acquisition / Relationships / Analytics / Automation / Pathlight Advanced / Operations / Health / Account with section icons + Canopy logomark chip + signed-in chip. (Source of truth: `lib/admin/nav-config.ts` `buildAdminNavGroups()`. Earlier "Today / Acquisition / Health / Engagement / Security" labels predate the May 1 expansion and were corrected May 3.)

### Canopy DBJ marketing surfaces (post-April-30 reposition + Phase 1C Layer 1 rewrite shipped May 4)

Surfaces (all on the marketing site, no admin internals exposed):
- **Work page detail entry at `/work/canopy`**: rendered by `app/(marketing)/work/[slug]/page.tsx` from the `slug: "canopy"` entry in `lib/work-data.ts`. Phase 1C expanded the entry from 5 sections to 9 (The Problem, What You Get, Analytics & Performance, Pipeline & Relationships, Automation, Operations & Health, Pathlight Integration, Architecture & Ownership, What Comes Next). techStack expanded to 8 items. Metrics: Sections 9, Live Install The Star Auto Service, Categories Replaced 6.
- **About page**: section "Built for Myself First" (eyebrow "The Stack Behind the Studio") between Operating Principles and the CTA. 6-tile glass-card capability grid; the constant is `CANOPY_CAPABILITIES` (renamed from `OPS_CAPABILITIES` in Phase 1C). CTAs: primary "See What Was Built" to `/work/canopy`, secondary "Get in Touch" to `/contact`. The April 30 reposition removed the prior dual CTAs to `/pricing/canopy` and `/contact?topic=canopy`.
- **Pricing page**: NO Canopy section. The April 30 decision pulled the Specialty Engagement card; a comment block at `app/(marketing)/pricing/PricingContent.tsx:713-717` preserves the context for restoration once 2-3 installs prove the playbook out.
- **Detail page at `/pricing/canopy`**: NO LONGER EXISTS. Pulled from `lib/pricing-data.ts` April 30; only a comment block at lines 210-211 remains. `/pricing/canopy` is a 308 redirect to `/work/canopy` configured in `next.config.mjs:81-83`.
- **Contact form**: `topic=canopy` query param prefills `projectType: "Other"` and a custom-build scoping message; renders a Gauge-icon topic card above the form. The `$25,000+` budget pre-fill was removed April 30. Legacy `topic=operations-cockpit` still routes through the same prefill for transition safety.
- **Redirects**: `/pricing/operations` 308-redirects to `/work/canopy`. `/pricing/canopy` 308-redirects to `/work/canopy`. Both configured in `next.config.mjs:76-83`.
- **Showcase tour at `/showcase/canopy`**: publicly indexable, fixture-only data, mirrors the /admin product surface. Phase 1C softened the metadata description and Live demo banner to install-zero-honest first-person framing. Page-level header gained a "demo view of an operator's view, fictional data, real product" subhead, and the prior "One cockpit for visitors..." dashboard intro was changed to "One canopy for visitors..." per the canopy.md Brand Chrome rule against legacy product-name framings.

Sitemap auto-includes via `getPricingSlugs()`. No new env vars on the DBJ marketing site. No new migrations. Public copy is outcome-led; no Pathlight internals (model names, function IDs, vertical database) leak through.

### Canopy starter repo (separate codebase)

Productized template lives at `github.com/dbjonestech-tech/canopy` (private). Local working directory is `/Users/doulosjones/Desktop/operations-cockpit/`. Vercel project `starauto-ops` is the Star Auto deployment instance, linked to that repo, **deployed and serving traffic at `ops.thestarautoservice.com`**. Latest deploy (April 29, late) ships 9 admin sections + chart primitives (`lib/ui/`) + time-bucket helpers (`lib/services/time-buckets.ts`) + 2 new migrations (006_audit_log, 007_error_events) + Auth.js audit log writer.

### 4th DBJ case study live: Canopy

`lib/work-data.ts` now has 4 entries (Pathlight, The Star Auto Service, Soil Depot, Canopy). Canopy uses a new `category: "Productized Engagement"` (third category alongside "Internal Product" and "Client Project"). 5 sections, 5 tech detail cards. `liveUrl` -> `/pricing/canopy` since the Star Auto install is auth-walled. `ctaHref` -> `/contact?topic=canopy`. Image path `/images/case-studies/canopy-dashboard.webp` is a placeholder; needs Joshua to capture the live dashboard screenshot and drop into `public/images/case-studies/`. `/work` page now renders 4 cards (2x2 on desktop). `/work/canopy` detail page auto-generated from PROJECT_DETAILS via existing slug routing.

## Client portal v1 (white-glove engagement portal at `/portal`)

Live as of April 27, 2026. Provisioned from `/admin/clients`; clients accept their invitation, sign in with Google, and land on a private dashboard.

**Surfaces:**
- `/portal` (home): personalized greeting; one card per active project with a 6-step phase tracker (discovery, design, build, review, launch, maintenance), current milestone, next deliverable, projected ETA, and "View files" link. Past projects appear as read-only summaries below.
- `/portal/files`: deliverables grouped by project with download buttons. Downloads route through `/portal/files/[id]/download` (server proxy that validates session + ownership and streams from Vercel Blob; the browser never sees the underlying Blob URL).
- `/portal/scans`: Pathlight scan history scoped by `scan.email = client.email`. Links to existing public report URLs.
- `/portal/account`: profile (name, company, email, member since), sign-out, "email Joshua for changes" nudge.

**Admin management at `/admin/clients`:**
- Invite form (email + optional name/company). Pre-creates the client row, sends a Welcome email via Resend, and the invitation flow upserts on acceptance.
- Per-client detail page edits client info (name, company, internal-only notes), creates/edits/deletes projects (full-state writes), and manages files per project (label, description, file picker; ~4MB limit).

**Auth (extends Stage 5 invitation flow):**
- `clients` table separate from `admin_users` (split tables, never unified). `admin_invitations.role` now selects which user table acceptance writes to.
- `lib/auth/access.ts` resolveAccess(email) returns `{ role, source }` or null. signIn callback uses it to gate. JWT callback resolves role at sign-in time and trusts it on refresh; session callback maps token.role onto session.user.role with a cutover-safe backwards-compat path for pre-Stage-6 admin JWTs.
- middleware.ts splits ADMIN_PREFIXES (/admin) from PORTAL_PREFIXES (/portal). Admins can preview /portal; clients are blocked from /admin.

**Migration 013 applied:** clients + client_projects + client_files + admin_invitations.role.

**Excluded from v1 (deferred):** payments / Stripe / billing portal / invoices, in-app messaging, scope-add request form, status-change notifications, real-time anything, public client signup. See `docs/ai/portal-strategy.md` for the phased plan.

## Admin portal (operations cockpit, expanded April 28)

Auth: Auth.js v5 + Google OAuth, JWT sessions, `ADMIN_EMAILS` allowlist, `admin_audit_log` table with new-device email notifications. Sign-in at `/signin` (Studio admin, footer-only entry, noindex), middleware gates every `/admin/*` route, layout-level auth check is defense in depth. Sign-out via server action. IP-keyed rate limiter on the auth route handler (10/min, fail-open).

Landing: three-column layout (Today / Acquisition / Health & operations) with a green/yellow/red status bar that rolls up worst-of across deployments, pipeline failure rate, Anthropic budget headroom, infrastructure expiry, recent error volume, and mobile RUM LCP. Each non-green signal renders inline with its area label and message.

Acquisition surface (live at `/admin/*`):
- **Visitors**: 24h/7d/30d overviews (page views, sessions, unique visitors, bounce rate, pages/session, conversions), top pages, top sources, geo, devices, plus a live presence card (5-min window) and an SSE feed of incoming page views. Per-session drill-down at `/admin/visitors/sessions/[id]` shows full path, dwell, scroll depth, UTM/referrer attribution, and direct links to the converted scan or contact submission.
- **Funnel**: stages bar (Sessions -> Pathlight scan started -> Scans completed -> Contact submissions) for 7d and 30d, by-source funnel table with scan rate and contact rate, and an 8-week cohort retention grid. Powered by `funnel_daily_v` and `funnel_cohort_weekly_v` materialized views (refreshed hourly).
- **Search**: top queries, top pages, and an opportunities table (high impressions + position 5-15) for the trailing 28 days. Daily import via service-account JWT against `searchconsole.googleapis.com` (no `googleapis` SDK; minimal node:crypto JWT signer).
- **RUM**: per-page p50 / p75 / p95 LCP, INP, CLS, TTFB, FCP from real visitor measurements, with device tabs (all / mobile / desktop / tablet). Cells colored against web.dev/vitals thresholds. Distinct from synthetic Lighthouse history on the Monitor page.

Operations surface:
- Dashboard landing with status bar.
- Monitor: funnel counts (24h/7d/30d), severity, Lighthouse latest grid, SSE-driven live event tail, per-scan drill-down.
- Costs: provider/operation totals, top scans by spend across 24h/7d/30d.
- Scans: filterable scans table (status + date + revenue bucket + search), 50 per page, links to report and per-scan event timeline.
- Leads: two-tab inbox. "Pathlight signups" reads `leads`; "Contact form" reads `contact_submissions`.
- Database: row counts + 24h/7d/30d insert volume + newest/oldest timestamps for all tracked tables.
- Audit log: filterable view of `admin_audit_log`.
- Users: invite-by-email surface backed by `admin_users` + `admin_invitations`.
- Clients: engagement clients, projects, files (drives `/portal`).

Health surface:
- **Pipeline**: Inngest function health (invocations, failure rate, p50 / p95 / p99) and recent runs. Sourced from `/api/webhooks/inngest` HMAC-verified webhook with hourly catch-up cron.
- **Platform**: Vercel deployment lifecycle with branch / commit / build duration. Sourced from `/api/webhooks/vercel` plus hourly REST snapshot.
- **Errors**: top unresolved Sentry issues from the trailing 24 hours, cached 5 minutes via Upstash Redis.
- **Email**: deliverability KPIs by type (sent / delivered / bounced / complained / delivery rate), 30-day daily trend. Bounce rate >1% colored amber, >2% red; complaint rate >0.05% amber, >0.1% red. Powered by `email_kpi_daily_v` MV.
- **Infrastructure**: per-domain TLS / WHOIS / MX / SPF / DKIM / DMARC checks. Daily cron at 08:00 UTC; Sentry-warns at 14 days from cert expiry, 30 days from registration expiry, or any DNS auth fail. Currently watches dbjtechnologies.com (Resend DKIM) and thestarautoservice.com.

First-party analytics layer: `AnalyticsBeacon` mounted in the root layout posts page-view + engagement (CWV via PerformanceObserver, scroll depth, dwell) to `/api/track/{view,engage}`. Cookies `dbj_vid` (13-month) and `dbj_sid` (30-min idle) stitch sessions. `attachScanToSession` and `attachContactToSession` are called from the scan and contact endpoints so funnel cohort math joins cleanly. Raw IP is never persisted; only sha256(ip || daily_salt) and the request-derived geo. Bot filtering layered (UA pattern + length + Accept-Language fallback). Tracking exclusions match the existing GA exclusions: /admin, /portal, /signin, /api, /pathlight/[scanId].

Inngest crons added: funnelRefreshHourly, vercelTelemetryHourly, inngestHealthHourly, infrastructureCheckDaily (08:00 UTC), anthropicBudgetHourly, searchConsoleDaily (06:00 UTC), emailKpiRefreshHourly. The existing monitoringPurgeDaily was extended to drop page_views >90d and sessions/visitors >395d.

**Wiring status as of May 3, 2026 (post-Commit-E, all seven crons registered):**

- **Now wired** (Commits A, B, C, D, E): `inngest-health-hourly`, `funnel-refresh-hourly`, `email-kpi-refresh-hourly` (Commit A, verified green); `vercel-telemetry-hourly` (Commit B, registered, awaiting first `:10` fire); `anthropic-budget-hourly` (Commit C, defensively coded with local-event fallback); `search-console-daily` (Commit D, fires daily at 06:00 UTC); `infrastructure-check-daily` (Commit E, this commit, fires daily at 08:00 UTC). The staged registration plan (one risk-tier per commit) is complete; all seven previously-unwired cron exports from the April 28 monitoring-cockpit work are now in the serve handler and discoverable by Inngest.
- The `runInfrastructureChecks` helper exercises WHOIS, TLS, and DNS authentication checks for every domain DBJ manages and Sentry-warns at <=14 days from any expiry so renewal happens before silent outage. Function configured with `retries: 0` (intentional design choice; the WHOIS / TLS probes are slow and a retry on a slow operation amplifies the per-cron budget envelope). Operationally this means a transient network failure on the first 08:00 UTC fire will not auto-retry; verify success in the Inngest dashboard the morning after deploy and manually invoke if needed.
- **Verification posture for the four crons not yet first-fired:** `vercel-telemetry-hourly` (Commit B) fires next at the first `:10` UTC after deploy; `anthropic-budget-hourly` (Commit C) at the first `:20`; `search-console-daily` (Commit D) at next 06:00 UTC; `infrastructure-check-daily` (Commit E) at next 08:00 UTC. For the daily ones, a manual Inngest dashboard invoke shortcuts the wait. Watch the Inngest dashboard for green first runs.
- Outstanding risk: Commit D's first run will return 403 if the GSC service account associated with `GOOGLE_SC_CREDENTIALS_JSON` does not have access to the GSC property. Fix is granting access in the GSC property's Users/Permissions page (no code change), then manually invoking the cron from the Inngest dashboard to backfill.

Contact form persistence: `app/(marketing)/api/contact/route.ts` writes to `contact_submissions` (migration 011) on every path and now also returns the inserted id so the route can attach it to the originating session for funnel attribution.

## DBJ Technologies Site (dbjtechnologies.com)

### Working and Deployed
- ~24 unique URLs live (18 page.tsx files plus dynamic [slug] expansions), deployed on Vercel via GitHub `dbj-technologies-VERSION-2` (origin main)
- Lighthouse baseline: Performance 99-100, Accessibility 100, Best Practices 100, SEO 100
- Homepage: HeroCinema phase-based animation (blueprint -> build -> reveal -> complete), "Architect The Impossible." headline with period. Initial-load gap (between CSS-paint and HeroCinema's ssr:false chunk arriving) covered by a static dark fallback div rendered in app/layout.tsx (id="hero-cinema-fallback", inline-styled position:fixed z:100 #06060a, only emitted on /) which HeroCinema removes from the DOM in its mount useEffect so its own animated overlay takes the slot seamlessly.
- About page: dark hero section, split layout with joshua-jones.webp (true alpha-channel transparent PNG; new "Joshua Profile Headshot" source converted via cwebp -q 90 -alpha_q 100; 640 KB, 6400x4263, RGBA preserved). Photo column enlarged for desktop: w-80 mobile, lg:w-[600px], xl:w-[720px], with the hero container widened to xl:max-w-7xl so the text column doesn't get crushed. Headline capped at md:text-6xl lg:text-5xl to prevent character-level mid-word wrap once the photo column grows. No maskImage; subject silhouette floats directly over the dark page bg. Clip-path reveal animation, floating geometric accents, character-level headline animation, story sections ("Why I Work This Way", "What You Actually Get", "How I Build", "Who This Is For"), personal sign-off, gradient divider, values cards with hover glow.
- Work page: 3 case studies (The Star Auto Service, Pathlight, Soil Depot) with real screenshots, comprehensive detail pages, metrics rows, tech stacks, "View Case Study" + "Live Site" links. Below the case-study row, the **Design Briefs** section: 8 vertical reference architectures (Dental Practice, Med Spa, Upscale Restaurant, Financial Advisor, Personal Injury Law, Luxury Real Estate, Luxury Home Builder, HVAC Contractor) presented as full-width project-style cards (md:grid-cols-2, h-52 preview WebP, accent-tinted vertical badge, headline, 3-sentence DFW-aware description, 3-up "Key Surfaces" tile grid, accent-tinted "In the Brief" callout, single "Read the Design Brief" CTA). Each card preview is a real screenshot of the corresponding template, stored at `public/design-briefs/{slug}.webp` (cwebp -q 92, ~25MB PNG -> ~2.2MB WebP). Each deep-dive page at `/work/design-briefs/[slug]` shows the same screenshot as a framed full-width hero (border + accent-tinted shadow), followed by the markdown body from `docs/design-briefs/{slug}.md`. Live HTML templates remain on disk under `/public/templates/` but are no longer linked from any UI surface. Old `/work/blueprints/[slug]` URLs 308-redirect to `/work/design-briefs/[slug]` via next.config.mjs.
- Services: 6 dedicated service pages (website-design, business-systems, hosting, user-experience, ecommerce, speed-and-search). Renamed from old developer-jargon slugs (frontend-architecture, backend-systems, cloud-infrastructure, interface-engineering, ecommerce-platforms, web-performance) on 2026-04-30. Old paths 301-redirect to new ones via next.config.mjs.
- Pricing: Fix Sprint $2,995 (post-Pathlight, 2 weeks), Starter $4,500, Professional $9,500, Enterprise custom (price: null, scoped during paid discovery). Maintenance $299/month. Hourly consulting $175/hour. Each tier has a dedicated detail page at /pricing/{slug} with 6 slugs total (fix-sprint, starter, professional, enterprise, maintenance, consulting). Fix Sprint sits as a distinct callout block on /pricing above the "Three Tiers" section (id="fix-sprint"), driven by FIX_SPRINT export in lib/siteContent.ts; the three full-build tiers below are unchanged. Fix Sprint is intentionally excluded from the /pricing/build configurator (BuildContent only iterates starter/professional/enterprise) since it is a fix engagement, not a build. Detail layout: hero with name/price/timeline + per-tier inline CTA, Ideal For paragraph, three-section breakdown (heading + body), tier-filtered Add-Ons section (only starter/professional/enterprise), tier FAQ accordion, standard CTASection. Add-ons live in a single global ADD_ONS array in lib/pricing-data.ts with a tiers[] field per entry; getAddOnsByTier(slug) filters at render time. Schema for PRICING_DETAILS was refactored from the old whatsIncluded/addOns/timeline/revisions/support shape to the new sections/idealFor/ctaText/ctaHref shape; layout component PricingDetailLayout.tsx was rewritten to match. The legacy /maintenance-support page (which had its own 3-tier $299/$599/$999 plan grid) was deleted; a 308 permanent redirect from /maintenance-support to /pricing/maintenance is now configured in next.config.mjs. Footer SUPPORT_LINKS, sitemap, addon card hrefs on the main /pricing page, and the "See maintenance & support plans" link in PricingContent.tsx all point at /pricing/maintenance now.
- Package configurator at /pricing/build (server shell + client BuildContent). Three-step flow: pick base tier (Starter, Professional, Enterprise - Maintenance and Consulting deliberately excluded as service relationships), toggle relevant add-ons (filtered by ADD_ONS[].tiers), and see a sticky bottom-bar summary with running total. Per-unit add-ons (Additional Pages, Content Writing) get an inline +/- quantity stepper (range 1-20) with a calculated line total. Switching tiers automatically deselects incompatible add-ons. Request a Quote button links to /contact?package=...&addons=...&qty_<slug>=...&estimate=... and the contact form reads those params (via useSearchParams behind a Suspense boundary in app/(marketing)/contact/page.tsx) to render a "Your Selected Package" summary card above the form and pre-fill the Message field with a first-person sentence. AddOn interface in lib/pricing-data.ts gained slug, priceValue (number), perUnit, and unitLabel fields plus a getAddOnBySlug helper. The main /pricing page got a new "Not sure which package? Build a custom package →" CTA button between the hero subheading and the tier cards, linking to /pricing/build.
- Contact form: Resend integration, sends to joshua@dbjtechnologies.com, phone field included. Sidebar (April 30 afternoon) now displays Email card (`mailto:joshua@dbjtechnologies.com`) and Phone card (`tel:+16823258324`, displayed as `682-DBJ-TECH` for `\d{3}-\d{3}-\d{4}` scrape-resistance) above Location + Response Time. Phone constants live at `SITE.phoneDisplay` / `SITE.phoneTel` in `lib/constants.ts`.
- Services page (April 30 afternoon): mobile capability stack fix in `ServicesContent.tsx`. Row alignment `items-start lg:items-center`, tagline `line-clamp-2 lg:truncate`, `01`-`06` trailing badge hidden below `sm:`, tighter mobile padding. Other pages render fine at the same h1 clamp; this was specific to the right-column CapabilityStack with 6 long service titles wrapping on 375px viewports.
- Google Business Profile: verified + active as of April 30. Physical address `5073 Co Rd 2656, Royse City, TX 75189`, service area `Hunt County, Texas`, phone `(682) 325-8324` (numeric, same E.164 as lettered site display), 5.0 / 2 Google reviews, profile strength `Looks good!`. NAP-consistency open question: site brands as "Dallas, TX" but GBP shows Royse City. Decide between (a) hide GBP physical address and broaden service area to "Dallas-Fort Worth Metroplex" or (b) widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex" before pursuing local SEO work.
- Footer: LinkedIn company page + GitHub social icons with proper aria-labels
- Schema.org: JSON-LD with sameAs for social profiles
- Professional email: joshua@dbjtechnologies.com (Google Workspace, SPF/DKIM/DMARC verified)
- Pathlight landing page (overhauled April 25): hero tagline updated to "Find where your website is losing trust, leads, and revenue." with subtext "Free. No credit card. Results in minutes." DBJ emblem + "by DBJ Technologies" link under wordmark. Form unchanged (id="scan-form" added as anchor target). New server-rendered sections below the form via app/(grade)/pathlight/PathlightContent.tsx: (3) "What Your Report Includes" 2x2 dark glass card grid covering Pathlight Score, Revenue Impact Estimate, Top 3 Priority Fixes, Full Desktop & Mobile Screenshots; (4) "Most audits check code. Pathlight checks the experience." three-paragraph differentiator; (5) "Built for businesses where one lead matters" audience flow line; (6) Secondary CTA card with "Scan My Website Free" anchor + "Book a Strategy Call" link to /contact; (7) "Powered by DBJ Technologies" footer line. PathlightBackdrop (fixed inset-0) continues to span behind all sections as user scrolls.

### Known Gaps (Not Blocking Launch)
- No email capture or lead magnets anywhere on the site
- No blog or SEO content surface
- No Google Voice business line (signature has no phone number) -- but Joshua's primary line `(682) 325-8324` is now displayed on `/contact` as `682-DBJ-TECH` with `tel:` click-to-call.
- No inbound lead response process documented (response template, discovery call structure, proposal format)

## Pathlight

### Stage 1 enhancements (May 3, 2026): page critique (CTAs, headline alternatives, hero observation)

Stage 1 of the Pathlight enhancement project shipped after Stage 2, deliberately re-architected from the original "richer single vision call" plan into a SPLIT-call architecture per the Stage 0 audit's recommendation. The existing vision call and its `visionAuditSchema` are unchanged; the page critique is a separate, parallel artifact with its own Zod schema.

What runs on every scan now (in addition to the existing pipeline):
- **Page critique side-step (`c1`).** Inserted AFTER the report email (`e1`) and BEFORE the first follow-up sleep (`w1`). Sends the desktop above-the-fold screenshot only (saving roughly half the vision tokens versus a two-viewport call) plus a small text context summarizing the existing design and positioning sub-scores so the model does not redundantly call out the same issues. Output is per-scan `{ heroObservation, headline { current, alternatives[3] }, ctas[1-5] }`. Persisted to `scan_results.page_critique`. Failure is swallowed (mirrors the audio + forms-audit posture); a scan never goes partial because the critique failed.
- **Per-call timeout** kept at the standard 90s for this step; the prompt asks for ~2KB of structured output against one image, comparable in shape to the existing vision-audit call which routinely lands in 15-25s. Sequencing post-email means a retry cascade cannot block report delivery.

What changed in the public scan API (`/api/scan/[scanId]`):
- New surfaced field: `pageCritique` ({ heroObservation, headline, ctas } or null). The `htmlSnapshot` from Stage 2 remains server-side-only.

What changed in the report rendering (`app/(grade)/pathlight/[scanId]/ScanStatus.tsx`):
- New `HeroCritiqueSection` component inserted between `LighthouseBreakdown` and `FormsAuditSection`. Renders three sub-blocks: hero observation paragraph, headline rewrite block (current + 3 alternatives), CTA cards (each with location label, visibility tone, observation, "Try this" callout). Renders nothing when `pageCritique` is null.
- `ScoreHero`, `PillarBreakdown`, `RevenueImpactBlock` continue untouched.

What changed in the post-complete polling:
- Old behavior: stop polling as soon as `audioSummaryUrl` lands or after 36s.
- New behavior: stop polling once every expected post-finalize artifact has settled (`audioSummaryUrl`, `formsAudit`, `pageCritique`) or after 60s. Out-of-scope scans skip audio gracefully (already-existing behavior); scans without forms hit the cap and stop on time.

What changed in the chat suggested-prompts surface (`lib/prompts/pathlight-chips.ts`):
- New finding-aware chips. When at least one CTA scored low visibility, surface "Which CTA should I rewrite first?". When the headline rewrite landed, surface "Walk me through the headline alternatives". When the forms audit flagged a high-impact item, surface "What is wrong with my form?". The chip strip is capped at 5 entries so it stays scannable.

What changed in the Pathlight Health dashboard (`/admin/monitor`):
- `PATHLIGHT_STAGES` extended with `page-critique`. `LABEL_TO_STAGE` extended likewise. Forward-compat scaffolding only; failures are swallowed today.

What was deliberately NOT shipped in Stage 1:
- Modifications to the existing `visionAuditSchema`. The Stage 0 audit identified schema modification as the single largest risk in the project; the split-call architecture lets Stage 1 ship value without taking that risk. Three downstream pipeline steps and the chat agent continue to read the existing schema unchanged.
- Item 15 (per-vertical trust signal inventory): better delivered via Stage 3's per-vertical checklist file where vertical-specific knowledge can be curated.
- Item 16 (read-time / scannability): text-side analysis better delivered via Stage 3 reading the captured HTML body.
- Item 18 (literal "first 5 seconds simulation"): the substantive content lives in `heroObservation` already, with the dramatized framing dropped per the Stage 0 leakage concern.

### Stage 2 enhancements (May 3, 2026): HTML capture, full-page screenshots, forms audit

Stage 2 of the Pathlight enhancement project ships in working tree as of this session. Migration 034 (applied to prod Neon, three additive nullable JSONB columns) and the wired pipeline + render changes commit together.

What is now captured on every scan:
- **Body HTML.** The Browserless function returns `await page.content()` truncated to 256KB at the boundary, persisted to `scan_results.html_snapshot` (`{ html, capturedAt, viewport, truncatedAt }`). The HTML is captured server-side only and is not surfaced through the public scan API; it is the substrate for Stage 3 text-side analyses (tone-of-voice, NAP extract, OG/social-card preview).
- **Full-page screenshots.** A second pair of Browserless calls captures `fullPage: true` desktop and mobile screenshots in parallel with the existing above-the-fold pair. Persisted to `scan_results.screenshots_fullpage`. Rendered in a collapsible accordion under the existing AtF hero pair on the report (closed by default; expanded automatically in print/PDF). The AtF pair stays the hero pair.
- **Form descriptors.** An in-Browserless DOM walk captures every `<form>` (capped at 5) with field count, field types, required/optional/hidden/unlabeled counts, button copy, action, method, label association, and aria-label. Persisted under `scan_results.forms_audit.extracted.forms[]`.

What is now analyzed on every scan with at least one form:
- **Forms audit.** A new post-finalize side-step (mirrors the audio side-step posture: gated, swallowed-on-failure, never marks the scan partial) calls Sonnet against the form descriptors plus a 6KB HTML excerpt. Output is per-form `{ headline, observation, nextAction, impact }` items, persisted under `scan_results.forms_audit.analysis.items[]`. Per-call timeout is 30s (well below the standard 90s) so a stuck forms-audit cannot block the report email. Render copy is first-person "I", with a "Try this" callout per item carrying the concrete next action.

What changed in the public scan API (`/api/scan/[scanId]`):
- New surfaced fields: `screenshotsFullPage` (the data-URI pair) and `formsAudit` (extracted descriptors plus optional analysis). The HTML snapshot is **not** surfaced (server-side only).

What changed in the report rendering (`app/(grade)/pathlight/[scanId]/ScanStatus.tsx`):
- New `FormsAuditSection` component inserted between `LighthouseBreakdown` and `ScreenshotsSection`. Renders only when forms exist.
- `ScreenshotsSection` now renders a collapsible "Full-page captures" accordion below the AtF pair when full-page captures are present.
- Existing `ScoreHero`, `PillarBreakdown`, `RevenueImpactBlock` were not touched.

What changed in the Pathlight Health dashboard (`/admin/monitor`):
- `PATHLIGHT_STAGES` extended with `forms-audit`. `LABEL_TO_STAGE` extended likewise (forward-compat scaffolding; forms-audit failures are swallowed and do not currently surface in the partial cascade). Provider rollups gain new operations `screenshot-fullpage-desktop` and `screenshot-fullpage-mobile`.

What was deliberately NOT shipped in this stage:
- No design-audit schema changes. The `visionAuditSchema` at `lib/services/claude-analysis.ts` remains untouched. Stage 1's bundled vision call is a separate workstream.
- No new vendor signups, no new env vars.
- No `.claude/rules/pathlight-enhancements.md`. That file is a Stage 1 deliverable per the Stage 0 audit.
- No updates to `do-not-break.md` yet. Wait for at least one real scan in production to confirm the new capture and render work end-to-end before declaring Stage 2 pieces load-bearing.

### Pipeline (All Shipped and Validated)
- Phase 1 (c86fc2e): Vision classifies businessModel (B2B/B2C/mixed), inferredVertical, inferredVerticalParent
- Phase 2 (8a9e9cc): Benchmark prompt receives classification, rejects residential sources for B2B (HomeAdvisor/Fixr/Angi/Thumbtack blocklist), $500 B2B floor clamp
- Phase 3 (1c8f2d8): Revenue prompt confidence-aware, does not rubber-stamp benchmark values, applies judgment
- Phase 4 (f6efcf0 + 72c32ca): Chatbot methodology transparency (7 rules), benchmark source/confidence rendered into prompt
- Phase 5 (a82bfb9): businessModel, inferredVertical, inferredVerticalParent surfaced on PathlightReport and chatbot prompt
- Retry logic (d7a3d52): callWithRetry wrapping all Claude API calls. 3 attempts, 15s/30s backoff. Transient errors only.
- PSI retry logic (98df1ec): 3-attempt retry on PageSpeed Insights calls. 10s/20s backoff.
- Curated vertical database (5376a56 + 2afa3c9): 206 entries at lib/data/verticals.ts. Three-layer matching: exact name -> alias table (23 entries: 17 originals + 6 pragmatic additions) -> fuzzy scoring with synonym expansion. 51 high/medium confidence verticals skip the Claude API benchmark call entirely (46 high + 5 medium; remaining 156 are single-source).
- Temperature 0 on all Claude calls (eliminates sampling randomness)
- Server-side revenue computation (estimatedMonthlyLoss computed from assumption fields, not generated by Claude)
- Mobile screenshot device emulation (iPhone UA, isMobile, hasTouch, deviceScaleFactor 2)
- Lighthouse category scores surfaced on report page (collapsible section) and in Ask Pathlight chat context
- "Search Visibility" pillar (renamed from "Findability") in lib/types/scan.ts. Backward compatibility maintained via coercePillarScores in lib/db/queries.ts. NOTE: rename is incomplete in public copy - lib/work-data.ts:82 (Pathlight case study body) still reads "Findability (15%)". Update separately.
- Value-framing loading copy during scan (3 paragraphs explaining why Pathlight is different from chatbot audits)
- Print stylesheet: pathlight-report wrapper class, print-expand for accordions, print-grid-expand for Lighthouse grid, print-hidden on backdrop/chat

### Validated Results
- MAA Firm (PI law firm): Two scans produced identical revenue ($22,800/mo, $19,000 deal value) sourced from curated database at high confidence. Zero scan-to-scan variance for covered verticals.
- Soil Depot: Correctly classified as B2B commercial soil brokerage. Revenue range $5,500-$13,750/mo (2.5x spread expected for uncovered verticals falling through to web research). No residential sources.
- DBJ Technologies self-scan: Pathlight Score 78/100. Revenue flagged as LOW CONFIDENCE correctly (solo consultant doesn't match standard benchmarks). Chatbot honestly explained methodology limitations when challenged.

### Intermittent Issues
- "Some analysis steps could not be completed" orange banner appears occasionally. Not systematic. Existing retry logic handles most transient failures. Root cause traced April 27 to s6 finalize: triggered when ANY of vision/remediation/revenue/score steps fail while audit + screenshots succeed; the most likely remaining trigger is non-transient Anthropic responses (schema validation failures after one retry, or benchmark research timeouts on cold cache). No mitigation shipped yet.

### Resend bounce/complaint webhook (April 27 evening)
New `/api/webhooks/resend` endpoint handles `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained` from Resend. Signature verified via `svix` (already installed at 1.90.0). Migration 006 extends `email_events.status` enum + adds partial unique index `(resend_id, status)` for idempotent ingestion. Outgoing emails now carry `scan_id` + `email_type` tags. Hard bounce or spam complaint auto-unsubscribes the recipient (writes both `leads.unsubscribed_at` and `email_unsubscribes`). 7-day bounce-rate monitor fires Sentry warning at 2%, error at 5% (Resend's suspension threshold). Migration 006 applied to prod Neon, `RESEND_WEBHOOK_SECRET` set in Vercel, webhook URL registered in Resend dashboard. Boundary schema loosened April 27 after real Resend test events were rejecting on `tags[].value: null` and `data.to: null`; failure log now includes the failing field path so future regressions are diagnosable from function logs.

### Voice report Blob store (April 27 evening)
Initial `pathlight-audio` Vercel Blob store was created Private, which conflicts with the public-PUT REST call in `lib/services/voice.ts` uploadToBlob (400: `Cannot use public access on a private store`). Symptom: ElevenLabs was being called and counted in `api_usage_events` but `audio_summary_url` was always NULL. The `a5` step's try/catch swallowed the error so the report still shipped without audio (graceful degradation working as designed). Resolved April 27 by deleting the private store and recreating `pathlight-audio` as Public. `BLOB_READ_WRITE_TOKEN` rotated automatically with the new store.

### Lockdown (April 27, deployed via 320efad)
Pathlight internals stripped from public surfaces. Specifically: `/api/scan/[scanId]` no longer returns `businessScale`, `screenshotHealth`, or `industryBenchmark` fields (replaced with computed `isOutOfScope`/`outOfScopeLabel`/`screenshotNotice`). Chat stream errors return generic copy. Chat system prompt no longer receives `inferredVertical`/`businessModel`/benchmark `source`; new GUARDRAILS block refuses all internals via a fixed "Pathlight uses proprietary analysis methods" response. Inngest step IDs renamed to opaque s1/s2/s3/s4/a1/a2/a3/a4/s5/s6/e1/e2/e3/e4/w1/w2/w3 (any in-flight follow-up jobs at deploy time will break, expected). Pathlight landing report items + differentiator paragraph rewritten in outcome language. Work case study (lib/work-data.ts) Pathlight entry: `AI Pipeline Stages 5` + `Curated Verticals 206` metrics replaced with $0/scan-time/delivery; `AI/LLM Integration` removed from techStack; pipeline-architecture body text neutralized. Report-delivery email outcome rewrite (no more "Lighthouse performance scores, AI-powered design analysis, conversion psychology evaluation"). `productionBrowserSourceMaps: false` made explicit in next.config.mjs. Full audit + Phase 2 verification + Phase 3 feasibility doc shipped under docs/ai/.

### In-house monitoring (April 27 evening)
New observability stack independent of Sentry. Migration 009 adds `monitoring_events` (generic event capture: scan funnel, audio, email webhooks, contact form, chat, canary, lighthouse) and `lighthouse_history` (one row per scheduled audit). `track(event, payload, options?)` writer in `lib/services/monitoring.ts` is wired into the scan pipeline (s6/a5/e1/outer catch), the scan submit endpoint, the Resend webhook handler (mirrors email.delivered/bounced/complained), the chat endpoint, and the contact form. Three new Inngest crons: `lighthouseMonitorDaily` (09:00 UTC, audits 7 pages x 2 strategies, alerts on >5pt regression vs 7d median or below `MONITORING_LIGHTHOUSE_FLOOR` floor of 90), `pathlightSyntheticCheck` (every 4h, narrow PSI + Browserless canary against `MONITORING_CANARY_URL`/thestarautoservice.com, 2-consecutive-fails escalation), `monitoringPurgeDaily` (events >30d / lighthouse >365d). Dashboard at `/internal/monitor?pin=...` (server component, INTERNAL_ADMIN_PIN gate same as /internal/cost) shows: canary status pill, funnel counts (24h/7d/30d) with auto-flagged ratio breaches, severity counts, latest Lighthouse grid (color-coded), SSE-driven live event tail, per-scan drill-down at `/internal/monitor/scan/[scanId]`. Public `/api/status` JSON for external uptime probes (200 healthy, 503 on 2+ canary fails or DB outage; 30s edge cache; no internals exposed).

## The Star Auto Service (thestarautoservice.com)
- Live and deployed. DNS on Cloudflare, hosted on Vercel.
- Lighthouse Performance 100, Accessibility 100, SEO 100.
- Contact form with Resend email integration.
- First mechanic-shop template for reuse.

## Infrastructure
- Google Workspace: joshua@dbjtechnologies.com (SPF/DKIM/DMARC authenticated)
- Email signature: DBJ cyan icon mark on white background, "Joshua Jones / Founder & Principal Architect / DBJ Technologies"
- Vercel env vars (verified against .env.example): CONTACT_EMAIL, CONTACT_FROM_EMAIL, NEXT_PUBLIC_SITE_URL, ANTHROPIC_API_KEY, BROWSERLESS_API_KEY, BROWSERLESS_BASE_URL (optional), PAGESPEED_API_KEY (optional), UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, POSTGRES_URL, SENTRY_DSN, RESEND_API_KEY, RESEND_FROM_EMAIL, CALENDLY_URL. SMTP_* vars deleted (migrated to Resend).
- Sentry observability: @sentry/nextjs wrapping next.config.mjs (withSentryConfig), tunnelRoute "/monitoring" to bypass ad-blockers, Sentry.captureException in app/global-error.tsx, separate sentry.edge.config.ts and sentry.server.config.ts.
- LinkedIn company page: https://www.linkedin.com/company/dbj-technologies/
- GitHub org: https://github.com/dbjonestech-tech
