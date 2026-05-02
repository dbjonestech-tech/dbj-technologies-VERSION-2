# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-01.md`](history/2026-05-01.md), which holds the verbatim
record of every May 1 entry that was below this header before this reset.

## Current state (May 1, 2026 -- Canopy v2 build BEGUN, error pipeline + Phase 0 staged uncommitted)

### What just happened (this session)

Joshua decided to flip the source of truth: DBJ `/admin` in this repo is now the canonical Canopy. The starter at `github.com/dbjonestech-tech/canopy` and the live install at `ops.thestarautoservice.com` (working dir `/Users/doulosjones/Desktop/operations-cockpit/`) are **frozen** until the perfected DBJ Canopy is ready to rebuild Star Auto from. Audit of the frozen codebase identified three real deltas worth porting: first-party error capture pipeline, exportable CanopyBeacon snippet, bootstrap/seed scripts. This session ported the first one and laid the foundation for the rest of the CRM build.

### What is in the working tree (not yet committed)

**1. First-party error capture pipeline (port from operations-cockpit migration 007).**
- `lib/db/migrations/023_error_events.sql` - `error_events` table with sha256 fingerprint grouping (message + first stack frame), source/severity CHECK constraints, four indexes
- `app/api/track/error/route.ts` - same-origin POST endpoint, fingerprint computed server-side, best-effort insert
- `components/analytics/ErrorBeacon.tsx` - sibling to `AnalyticsBeacon`. Listens to `window.error` and `unhandledrejection`, posts via `sendBeacon` with keepalive-fetch fallback. Mounted in `app/layout.tsx`
- `lib/services/errors.ts` - query helpers (loadErrorHeadline, loadErrorHourlyBuckets, loadTopErrorGroups, loadErrorsBySource, relativeTime). Hourly bucketizer is inline (no `lib/services/time-buckets.ts` port needed)
- `app/admin/errors/page.tsx` - rewritten. First-party error_events events drive 4 stat tiles + hourly volume sparkline + by-source bars + top groups table. Sentry's existing 24h issue list rendered below as "DBJ paid issue tracker (24h)" secondary section. Uses existing `PageHeader` (palette red), `Sparkline` from `@/admin/Sparkline`, and `canopy-table` styling

**2. Canopy build plan saved.**
- `docs/ai/canopy-build-plan.md` - 9-phase roadmap aware of Phase 2 CRM that already shipped (contacts/contact_notes/relationships pipeline). Documents the three-layer Pathlight lock: master toggle + per-feature toggles + monthly budget cap. Each phase notes Pathlight cost (NONE / GATED), acceptance criteria, blast radius. Operational notes call out frozen codebases.

**3. Phase 0 (Settings, Audit, Pathlight Locks) shipped to working tree.**
- `lib/db/migrations/024_canopy_settings_and_audit.sql` - three tables. `canopy_settings` is a singleton (`id = 1` CHECK) with the six Pathlight feature toggles, monthly_scan_budget + scans_used + period_resets_at, lead_score_weights JSONB, white-label fields, timezone, digest cadence. `canopy_audit_log` is the entity-change trail (distinct from existing `admin_audit_log` for auth events) with before/after JSONB and four indexes. `canopy_feature_flags` is generic key/value scope JSONB
- `lib/canopy/settings.ts` - `getCanopySettings` reader. No cache layer; falls open to DEFAULTS when migration is unapplied (DEFAULTS evaluate to "blocked" in the gate so a missing migration cannot accidentally allow a scan)
- `lib/canopy/pathlight-gate.ts` - `canFireScan(kind)` returns `{ allowed, reason?, remaining? }`. `ScanKind` union: `'rescan' | 'prospecting' | 'competitive_intel'`. `incrementScanUsage(count)` and `resetPeriodIfDue` for post-fire bookkeeping
- `lib/canopy/audit.ts` - `recordChange`, `getEntityAuditTrail`, `getRecentChanges`. Best-effort writer (DB outage logs to console but does not throw)
- `lib/actions/canopy-settings.ts` - Server Actions: `setCanopyToggle`, `setMonthlyBudget`, `resetCurrentPeriodCounter`, `setBranding`. Each requires `session.user.isAdmin`, writes to `canopy_audit_log`, and `revalidatePath`s `/admin` + `/admin/canopy` (no `revalidateTag` because Next 16 changed the signature to require a profile arg; matches existing repo pattern in `lib/actions/contacts.ts`)
- `app/admin/canopy/page.tsx` - Server Component, palette `stone`, reads settings + recent changes. Renders the controls client island and a setting-changes audit feed
- `app/admin/canopy/CanopyControlsClient.tsx` - Client Component with Pathlight master kill (color-coded pill), per-feature toggles list, monthly budget editor with reset-counter button, notifications toggle, white-label form. Optimistic UI with rollback on Server Action failure
- `app/admin/layout.tsx` - added "Canopy controls" item (Sliders icon, palette stone) to the Account nav group, above "Audit log"
- `lib/admin/page-themes.ts` - added `/admin/canopy` → `stone` palette mapping

### What is intentionally NOT in the working tree

- Deals architecture (Phase 1 of the plan). 7+ file change touching dashboard rollups + contact detail panel + new /admin/deals routes; deferred to next session for a clean focused commit.
- The `error_events` and `canopy_*` migrations have NOT been applied to prod Neon. `npm run lint` and `npx tsc --noEmit` both clean against the working tree, but until the migrations run, every read returns DEFAULTS / empty (the helpers handle this gracefully) and the Pathlight gate denies all scans (which is the correct safe default).

### Acceptance signals (what the user verifies after committing + applying migrations)

- After `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/023_error_events.sql`: trigger a runtime error in any browser session (e.g. `throw new Error("test")` from devtools) → row appears in `error_events` and `/admin/errors` shows it within ~15s
- After `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/024_canopy_settings_and_audit.sql`: `/admin/canopy` renders the controls page, master kill toggles flip with audit log rows appearing below
- `npx tsc --noEmit` and `npm run lint` clean (verified)
- `git status` shows the diff above

### Next recommended task

**Phase 1 - Deals Architecture pivot.** Per `docs/ai/canopy-build-plan.md`. Migration 025_deals.sql (with idempotent backfill from contacts.status into one open or one closed deal per contact), `lib/services/deals.ts`, `lib/actions/deals.ts`, new `/admin/deals` Kanban + `/admin/deals/[id]` detail page, three rollup tiles on the dashboard (Weighted Pipeline / Unweighted / Closed-Won This Month), Deals panel on contact detail page, banner on `/admin/relationships/pipeline` pointing to the new deal board.

---

## Prior state (preserved below for continuity) -- Phase 2 shipped + audited at `b9a1833`

### Phase 1 shipped (commit `7f9ea05`, docs `76925b7`)

`feat(admin/visitors): chart-driven analytics with hero chart, metric
tiles, and breakdown panels`. Production deployment Ready. No 500s
in `vercel logs --status-code 500 --since 5m`.

### Phase 2 shipped (commit `9fb9e01`, docs `d09f49a`)

`feat(admin/crm): contacts, pipeline, and unified timeline with
Pathlight integration`. Production deployment Ready. Migration 022
applied to prod Neon (verified via direct table introspection: both
`contacts` and `contact_notes` exist, all five expected indexes are
present, no redundant idx_contacts_email).

### Phase 2 post-deploy audit fixes (commit `b9a1833`)

`fix(admin/crm): correct kanban revalidatePath + normalize email case
across scan-side joins`. Two real bugs surfaced from the audit:

1. Server Actions revalidated `/admin/pipeline` (the Inngest pipeline
   page) instead of `/admin/relationships/pipeline` (the CRM kanban).
   Status changes from kanban cards now refresh the kanban as
   intended.
2. `scans.email` is stored as-typed by users (the scan submit route
   does not lowercase before insert), but `contacts.email` is always
   normalized to `lower(trim(...))` on write. Every LATERAL touchpoint
   count and every timeline CTE that joined against scans now wraps
   the comparison in `LOWER(TRIM(...))` so the join survives casing
   inconsistencies. `contact_submissions.email` is already lowercased
   on write so its joins are unaffected.

### Production verification

- Migration 022 applied cleanly: `contacts` (14 cols) +
  `contact_notes` (6 cols), all five expected indexes
  (`contacts_pkey`, `contacts_email_key`, `idx_contacts_status`,
  `idx_contacts_follow_up`, `contact_notes_pkey`,
  `idx_contact_notes_contact`).
- Two production deployments Ready in Vercel (Phase 1 build, Phase 2
  build). Audit-fix deployment building.
- `vercel logs --status-code 500 --since 5m` returns no logs (no
  500 errors).
- `curl -I` against `/admin`, `/admin/visitors`, `/admin/contacts`,
  `/admin/relationships/pipeline` all return 307 (auth redirect),
  confirming routes compile and middleware works. No 500s, no
  RSC-boundary failures.

### Manual follow-up (still pending Joshua's hands)

After the audit-fix deploy completes, click "Sync contacts" on
`/admin/contacts` once to backfill from existing leads /
contact_submissions / clients. The function is idempotent so running
later or running twice is safe.

### Multi-popover stuck-open fix (commit `7e9c164`)

After the hover-loop fix landed, Joshua spotted a follow-on bug: a
prior popover would stay open after hovering a different card. The
`relatedTarget` guards from the previous fix matched ANY card or ANY
popover, so when the cursor crossed Card-A-popover -> Card-B, the
Card A popover saw the cursor entering "a card" and skipped its
close. Both popovers stayed visible.

Fix: tag each popover with `data-card-preview-of=<href>` and compare
the exact href value in both the card's pointerleave guard
(`data-card-preview-of` matches the card's `href`) and the popover's
pointerleave guard (`data-card-id` matches this popover's
originating href). Same specificity added to CardPreview's outside-
click handler so a click on a different card no longer pins the
current popover open. The 140ms scheduleClose grace stays as the
transition window between popovers; outside that grace, only one
popover is ever open at a time.

### Dashboard hover popover feedback-loop fix (commit `e74c37c`)

Joshua reported the floating CardPreview popover glitched hard when
hovering the upper portion of a dashboard card while behaving
perfectly when hovering the always-visible KPI footer at the bottom.
Root cause: the card's outer `motion.div` had a spring `y: -3` lift
on hover. The spring could overshoot, and the lift moved the card
bounds under the cursor. Near any card edge the cursor would
oscillate inside / outside the moving bounds, framer's hover-end
fired, the close timer started, framer's hover-start fired again,
`openPreview` recaptured a fresh `anchorRect`, the popover
repositioned, repeat. The lower KPI footer happened not to glitch
because the popover anchored on the opposite side of the cursor
there, so the feedback loop never reached a re-entry edge.

Fix: dropped the y-lift, swapped the outer motion.div for a plain
div with native `onPointerEnter` / `onPointerLeave`, and added
`relatedTarget` guards on both the card and the popover so a
cursor crossing card -> popover (or popover -> card) never schedules
a close in the first place. The 140ms scheduleClose grace remains
as a fallback. Inner motion.span animations (icon scale, arrow
reveal) are preserved so the hover affordance still feels alive.
Also: `openPreview` now captures `anchorRect` only on the first
open (`!previewOpen` guard) to prevent position jitter from
redundant rect captures during edge-case hover cycling.

CRM integration into Canopy. Migration 022 plus the Contacts /
Pipeline pages, sidebar group, dashboard card, and auto-creation
wiring across the scan pipeline, contact form route, and client
invitation flow. Files:

- **`lib/db/migrations/022_contacts_crm.sql`** (new): contacts and
  contact_notes tables. Email is `TEXT UNIQUE NOT NULL` so the unique
  index from the constraint is the only email index needed (no
  redundant idx_contacts_email partial). Indexes on status and a
  partial index on follow_up_date WHERE NOT NULL.
- **`lib/services/contacts.ts`** (new): list / detail / timeline /
  mutation reads. Touchpoint counts on the list view come from
  LATERAL subqueries against scans / contact_submissions / email_events
  and are returned per-row in the same query (NO N+1). Timeline is a
  per-source CTE-with-LIMIT pattern so the page_views table is never
  fully scanned. Includes upsertContactFromScan / Form / Client
  helpers used by the auto-creation wiring.
- **`lib/actions/contacts.ts`** (new): every Phase 2 mutation as a
  Server Action (createContact, updateContact, addNote, deleteNote,
  changeStatus, sync). Auth-gated, revalidates the relevant paths.
  No new API routes.
- **`app/admin/contacts/page.tsx`** + **`ContactsList.tsx`** (new):
  server-rendered list page with filter chips + search + Sync /
  New buttons; client component drives the URL filter state.
- **`app/admin/contacts/[id]/page.tsx`** + **`ContactHeader.tsx`** +
  **`ContactNotes.tsx`** (new): two-column header (inline-editable
  fields + Pathlight scan card on the right when one exists), unified
  timeline below, notes input + manual-note delete affordances.
  Pathlight card is admin-only and surfaces score + estimated monthly
  impact (no internals leak per Pathlight rules).
- **`app/admin/relationships/pipeline/page.tsx`** + **`PipelineBoard.tsx`**
  (new): six-column kanban (New / Contacted / Qualified / Proposal /
  Won / Lost), per-card status dropdown (NO drag-and-drop). Routed
  under /admin/relationships/pipeline because /admin/pipeline is the
  Inngest pipeline page.
- **`app/admin/layout.tsx`** (modified): RELATIONSHIPS sidebar group
  inserted between Acquisition and Operations. Contacts row carries a
  red overdue badge when getContactsDashboardSummary().overdue > 0.
- **`app/admin/page.tsx`** (modified): Relationships card added to
  the TODAY column.
- **`app/admin/DashboardCard.tsx`** (modified): ClipboardList icon
  registered in the icon map.
- **`lib/admin/page-themes.ts`** (modified): rose palette added,
  /admin/contacts -> pink and /admin/relationships/pipeline -> rose
  registered in PAGE_PALETTE.
- **`lib/services/dashboard-kpis.ts`** (modified): relationshipsKpi
  added, mapped to /admin/contacts. Rest line shows overdue / new
  this week / "All caught up". Hover detail shows status breakdown,
  14d sparkline of new-contacts/day, and 3 most-recent timeline
  events across all contacts.
- **`lib/inngest/functions.ts`** (modified): scan finalize step now
  upserts a contact from the scan email (best-effort try/catch; never
  blocks the pipeline).
- **`app/(marketing)/api/contact/route.ts`** (modified): contact
  form route upserts a contact from the form email after the durable
  insert (best-effort).
- **`lib/auth/users.ts`** (modified): client invitation accept flow
  upserts a contact with source=client_import + status=won (best-
  effort).

### Phase 2 verification

- `npx tsc --noEmit` clean
- `npm run lint` clean
- em-dash grep across all Phase 2 changed files returns empty
- legacy-email grep across all Phase 2 changed files returns empty
- migration 022 SQL reads back syntactically valid (CREATE TABLE +
  CREATE INDEX statements only)
- Phase 1 RSC boundary post-deploy check still pending in
  `vercel logs --status-code 500`
- Phase 2 RSC boundary post-deploy check needs the same after
  authorized push

### Phase 2 NOT YET DEPLOYED -- migration 022 must be applied

Migration 022 is staged on disk and tracked in git but has NOT been
applied to the production Neon DB. Before the CRM pages will hydrate
in production:

1. Apply migration 022 to prod Neon. Run from the project root:
   `npx tsx lib/db/setup.ts`
2. Verify contacts and contact_notes tables exist.
3. Open /admin/contacts and click "Sync contacts" to backfill from
   existing leads / contact_submissions / clients.

Without step 1, every contacts read returns the empty default (the
service wraps every query in try/catch by design) and the new pages
render the empty state.

### Phase 1 -- Visitors page upgrade (PostHog/Vercel Analytics level)

`/admin/visitors` is upgraded from a stat-card + table layout to a
chart-driven analytics page. The recent visitors table at the bottom
is preserved exactly as-is. Files added/modified:

- **`lib/services/analytics.ts`** (modified, +500 lines): new
  `getVisitorsDashboardData({ range } | { from, to })` that runs all
  required queries in parallel via `Promise.all` with per-section
  try/catch so one failed query does not blank the whole page.
  Returns `{ series, comparisonSeries, metrics, topPages, topSources,
  devices, engagement, topCities }` with `previous*` companion values
  on every metric for delta computation. If the comparison window has
  fewer than 3 daily data points, `comparisonSeries` is `[]` and all
  `previous*` are null so the frontend can hide the ghost line and the
  trend deltas. Internal helpers: `fetchDailyVisitors`,
  `fetchAggregateMetricsWithComparison` (one round-trip CTE for both
  windows), `fetchTopPagesRange`, `fetchTopSourcesRange`,
  `fetchDevicesRange`, `fetchEngagementRange` (engaged/light/none/
  likelyBot via dwell >= 30s OR scroll >= 50% threshold per session),
  `fetchTopCitiesRange`. Includes `prettifyPath()` and `fillDailySeries()`
  utilities so the chart renders a continuous x-axis even when
  no-traffic days exist.
- **`app/admin/api/visitors-data/route.ts`** (new): force-dynamic
  endpoint that accepts `range=7d|14d|30d|90d` OR `from=YYYY-MM-DD&
  to=YYYY-MM-DD`. Auth gated by middleware.ts (admin session required
  for /admin/*). No-store cache headers.
- **`app/admin/visitors/VisitorsDashboard.tsx`** (new): single
  client component owning the date range state and rendering the hero
  Recharts area chart (with comparison ghost line and custom glass-
  card tooltip), the summary line, the 6 metric tiles
  (Visitors / Sessions / Page Views / Bounce Rate / Pages per Session
  / Conversions, with bounce rate color-inverted), 3 breakdown panels
  (Top Pages / Top Sources / Devices+Engagement, all styled-div bars,
  no chart library), and an optional Top Cities geography panel.
  Range selector is `7D | 14D | 30D | 90D` plus a calendar icon that
  reveals inline From/To date inputs. State is in React only and does
  NOT update URL params (avoids conflicting with the table's
  `?before=` cursor). Subtle opacity pulse on the chart during fetch.
  All Framer Motion respects `useReducedMotion()` (Recharts
  `isAnimationActive={false}` when reduced).
- **`app/admin/visitors/page.tsx`** (modified): the four-card
  overview grid (24h / 7d / 30d / Custom) is removed. The old
  Top pages / Top sources / Geography / Devices tables below the
  recent visitors table are removed (now replaced by the visual
  breakdown panels above). The Live header is tightened from
  `Live (last 5 minutes) -- N visitors` to `Live · N active
  visitor[s]`. The DefinitionsPanel moves from above the live
  section to the very bottom of the page. The recent visitors table
  is COMPLETELY UNCHANGED (structure, columns, engagement column,
  bot heuristic, pages-visited chips, filter chips, expandable
  rows, CSV export, `?before_v=` pagination cursor). Two paginators
  (`?before=` page-views, `?before_v=` visitors) still operate
  independently.
- **`package.json`**: added `recharts ^3.8.1`.

### Phase 1 verification at staging

- `npx tsc --noEmit` clean
- `npm run lint` clean (one round of useMemo dependency tightening)
- `grep -l $'\xe2\x80\x94' <changed files>` empty
- legacy-email grep across changed files returns empty
- Local dev server starts; the admin route compiles. Note: middleware
  redirects unauth requests to /signin before the page compiles, so
  the bulletproof RSC-boundary check is a post-deploy
  `vercel logs --status-code 500 --since 5m` against the production
  URL after the user authorizes the push. This is the verification
  pattern locked in by the `feedback_rsc_boundary_runtime` memory
  (commit a28cd80 was the original incident).

### Phase 2 (CRM) NOT YET STARTED

Phase 2 ships in its own commit. Includes: migration 022 for contacts
+ contact_notes, lib/services/contacts.ts, lib/actions/contacts.ts,
sidebar Relationships group between Acquisition and Operations, /admin/
contacts list page, /admin/contacts/[id] detail page, /admin/pipeline
kanban page, dashboard Relationships card, and auto-creation wiring
in the scan pipeline + contact form + client invite flow.

### Most recent committed history (top of `origin main`)

- `5d6fa2e` docs: update session-handoff with b10428f commit hash
- `b10428f` feat(admin): floating CardPreview popover + sparklines + recent activity on /admin cards
- `8ad516c` feat(admin): always-visible KPIs + richer hover details on /admin cards
- `451d126` feat(admin): self-service /admin/config status board + .env.example completed
- `ff416e4` feat(canopy admin): sidebar nav items inherit each destination page's palette color
- `abaadeb` fix(canopy admin): force nested cell descendants to inherit column color
- `70681ec` chore(canopy): replace canopy-logo.webp with refined dashboard logo
- `7146feb` feat(canopy admin): coordinated table styling, every column tinted, every row striped, on every admin page via .canopy-table CSS
- `cc529a0` feat(canopy admin): all 18 admin pages now wear their palette via shared PageHeader (chip pill + stripe + colored eyebrow); per-column color rotation in every data table via .canopy-table CSS rules (8-hue rotation)
- `98e4071` feat(canopy admin): CSV export, custom date-range overview card, beefier page accents, Excel-style row striping
- `7944e06` fix(admin): use the actual Canopy logo file in the admin shell
- `a37289e` feat(canopy admin): per-card palette system (18 hues), Canopy wordmark, Recurring users page + dashboard card + KPI, search + filter chips on visitor tables
- `5d9a126` feat(admin): per-visitor view with self-disclosed identity, full timeline, and definitions panel on /admin/visitors
- `a28cd80` fix(admin): pass icon name as string across RSC boundary
- `cdeeb13` feat(admin): redesign dashboard with column color themes, hover KPIs, and Framer Motion animation; fix visitors recent feed sort and add cursor pagination
- `20bc0a4` perf(marketing): cut Lighthouse-flagged paint and main-thread cost on /about, /services, /pricing, /work

Working tree clean. All changes pushed to `origin main`. Vercel auto-deploys
from main. See `history/2026-05-01.md` for the multi-thousand-word breakdown
of every change above.

### Themes shipped May 1 (one-line each)

- **Floating CardPreview popover for the /admin dashboard.** Each card on
  /admin now opens a portaled, viewport-anchored preview panel on hover
  (and on tap-the-chevron for touch devices). The preview shows the icon
  tile, title, status pill, primary KPI, a 14-day SVG sparkline of the
  primary metric (no chart library, pure 100x36 viewBox, area + line +
  last-point dot, currentColor-driven hue), an At-a-glance details column,
  and a Recent activity column (last 5 page views / scans / leads / email
  events / audit entries / pipeline runs / deploys / sentry issues / infra
  checks depending on the card). Auto-flips above/below based on viewport
  space; horizontally clamps to viewport with a 16px gutter. Closes on
  Escape, outside click, X button. The card structure was refactored from
  `<Link>`-wraps-everything to the standard "absolute-fill Link + sibling
  content + sibling chevron button" pattern so the touch-only chevron can
  open the popover without navigating. Also fixed three latent bugs in the
  pre-existing dashboard-kpis aggregates that were silently failing via the
  `safe()` fallback: `actor_email`/`action` should have been `email`/`event`
  in admin_audit_log, `created_at` should have been `occurred_at` in
  api_usage_events, and `function_name` should have been `function_id` in
  inngest_runs. The audit / costs / pipeline cards were quietly returning
  zero before this commit; they show real numbers now.
- **Marketing-site Lighthouse perf sprint.** /about hero quality cut, per-word
  scroll reveal removed, /services hero halos collapsed to a static gradient,
  card box-shadow stacks reduced from 4 to 2 layers across pricing/services/work.
- **/admin redesigned as the Canopy product prototype.** 18 admin pages now
  share one design system: per-card palette (sky/cyan/teal/blue/violet/indigo/
  fuchsia/purple/pink/amber/orange/yellow/stone/emerald/green/red/lime/zinc),
  shared PageHeader component (stripe + colored chip pill + h1 + description),
  Canopy wordmark in the sidebar, Framer Motion hover on dashboard cards, live
  KPIs on hover, color-coded sidebar nav links, and an 18-hue palette system in
  `lib/admin/page-themes.ts` that's a single source of truth.
- **Per-visitor view + Recurring users page.** /admin/visitors now leads with
  one-row-per-person, click-to-expand timeline grouped by session, identity
  resolved via form-submission joins, search box + filter chips + CSV export,
  sticky header, and pagination. /admin/recurring shows the same view filtered
  to `session_count > 1`, sorted by visit count.
- **Excel-style table system in CSS.** `.canopy-table` rules in globals.css
  drive column-tinted cell text (8-hue rotation, header AND cell match), row
  striping, palette-aware row hover, and column separators on hover. Applied
  to ~30 tables across all admin pages with one sed pass plus the CSS file.
- **CSV export + custom date-range overview card** on /admin/visitors and
  /admin/recurring.
- **RSC boundary fix.** Lucide icons can't cross the Server -> Client prop
  boundary; pass icon name as string and resolve inside the client component.
  This is now a saved feedback memory so it never bites again.

### Durable lessons saved to memory this session

- `feedback_rsc_boundary_runtime.md`. tsc + lint clean does not validate the
  Server -> Client prop boundary; functions cannot serialize across.
- `feedback_honest_skip_recommendations.md`. When asked "should we build X?",
  default to honest skip; Joshua's bar is "very valuable + durable."
- `project_canopy_brand.md` updated. /admin is the design prototype for the
  Canopy product; Canopy UI work mirrors /admin patterns.

### Latest work landed (May 1 evening): always-visible KPIs + richer hover details on /admin

Joshua: "I want the data to be live data that always shows without hovering
action. Also, if anything else should show that could enhance the value of
it to the user when they do hover, after the current hover data is already
shown, add that to it."

The dashboard cards on /admin previously showed a small zinc dash at rest
and faded the primary KPI in only on hover. Inverted that: primary +
secondary are now always visible, and a richer details panel slides in
on hover beneath them.

- **`lib/services/dashboard-kpis.ts`** -- new `KpiDetail = { label, value,
  tone? }` type and `details?: KpiDetail[]` field on `CardKpi`. Every
  one of the 18 card-level KPI functions enriched with 2-4 detail items
  drawn from data already being fetched (or one extra cheap query):
  - **Visitors:** Sessions/Visitors/Bounce/7d views.
  - **Monitor:** info/warn/error breakdown.
  - **Scans:** 7d total, 7d success rate, 7d failed.
  - **Leads:** 24h velocity, 7d split.
  - **Funnel:** scan->complete %, scans started, scans completed,
    session->contact %.
  - **Search:** CTR, avg position, 28d impressions.
  - **RUM:** INP p75, CLS p75, LCP p50.
  - **Email:** complaint rate, bounced/failed/sent (7d).
  - **Costs:** 7d total + per-provider 7d totals.
  - **Database:** sessions, page views, leads, contact submissions.
  - **Clients:** total clients, active projects, completed projects.
  - **Audit:** last hour count, distinct actors, denied count.
  - **Pipeline:** running now, avg duration, failed (24h).
  - **Platform:** production hostname, last deploy age, building now,
    failed (24h).
  - **Errors:** top issue title + count + level, fatal count, error
    count, total events.
  - **Infrastructure:** closest TLS expiry domain + days, passing/
    warning/failing counts.
  - **Recurring:** 30d count, growth.
  - **Users:** active, disabled, DB total, bootstrap allowlist size.
- **`app/admin/DashboardCard.tsx`** -- removed the fade-in-on-hover
  primary; the dot + primary + secondary now render at rest. New
  details panel renders under the primary on hover (2-column grid,
  label + value, tone-colored values). Reduced-motion users see the
  same panel without the slide animation.

Files: 2 changed.

### Latest work landed (May 1 evening): admin dashboard wiring audit + /admin/config

After the visitors-page Engagement column shipped, Joshua asked for a full
audit of every admin page to ensure data is wired correctly. The audit
confirmed there are no code-level wiring bugs; every page resolves its
imports, every service degrades safely (returns null/[] with a console.warn)
when env vars are absent, and every snapshot/import is wired to an Inngest
cron. The gaps are all ops-side: 7 pages render empty until env vars are
set in Vercel and two webhooks are registered. Surfaced the gaps as a
self-service status board so future-you never has to grep again.

- **`.env.example`** updated with every admin-side var that was previously
  undocumented: `ANALYTICS_IP_SALT_BASE`, `ADMIN_EMAILS`,
  `ANTHROPIC_ADMIN_KEY`, `ANTHROPIC_MONTHLY_BUDGET_USD`, `SENTRY_AUTH_TOKEN`,
  `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, `VERCEL_API_TOKEN`,
  `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`, `VERCEL_WEBHOOK_SECRET`,
  `INNGEST_WEBHOOK_SECRET`, `GOOGLE_SC_CREDENTIALS_JSON`,
  `GOOGLE_SC_SITE_URL`, plus the optional ElevenLabs + Vercel Blob group.
  Grouped by purpose with whereToGet inline.
- **`lib/admin/env-config.ts`** new declarative catalog: every admin env
  var with name + group + requirement (required/recommended/optional) +
  description + whereToGet + affectedPages + isPublic. Plus
  `ADMIN_WEBHOOKS` (Vercel + Inngest + Resend) with endpoint, registerAt,
  events, secret. Plus `checkEnvVarStatuses()` server-only helper that
  reads process.env and returns booleans only. Values are never read or
  rendered.
- **`/admin/config`** new page (palette: teal, section: Account). Topline
  4-stat panel (total set, required missing, recommended missing,
  optional missing). Red banner if any required vars are missing. One
  grouped table per feature area. Webhooks table at the bottom with the
  two registrations needed in Vercel + Inngest dashboards.
- **Sidebar nav** updated: new "Config" item under Account with the
  Settings (gear) icon, palette teal.

What still needs Joshua's hands (the /admin/config page lists this live):

1. Set in Vercel -> Project -> Settings -> Environment Variables (Production):
   - `ANALYTICS_IP_SALT_BASE` (privacy; `openssl rand -hex 32`)
   - `ANTHROPIC_ADMIN_KEY` + `ANTHROPIC_MONTHLY_BUDGET_USD` -> /admin/costs
   - `SENTRY_AUTH_TOKEN` + `SENTRY_ORG_SLUG` + `SENTRY_PROJECT_SLUG` -> /admin/errors
   - `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` + optional `VERCEL_TEAM_ID` + `VERCEL_WEBHOOK_SECRET` -> /admin/platform
   - `INNGEST_WEBHOOK_SECRET` -> /admin/pipeline realtime
   - `GOOGLE_SC_CREDENTIALS_JSON` + `GOOGLE_SC_SITE_URL` -> /admin/search
2. Register two webhooks once the matching secrets are set:
   - `https://dbjtechnologies.com/api/webhooks/vercel` in Vercel project
     Webhooks settings, all `deployment.*` events, secret matches
     `VERCEL_WEBHOOK_SECRET`.
   - `https://dbjtechnologies.com/api/webhooks/inngest` in the Inngest
     dashboard, all run-lifecycle events, secret matches
     `INNGEST_WEBHOOK_SECRET`.

### Unresolved / next session

- **Sessions index page** (per-session sortable view) was scoped during the
  /admin sprint and skipped; the per-row "view session" link from
  RecentVisitorsTable plus the existing `/admin/visitors/sessions/[id]` detail
  page already cover the use case. Re-evaluate only if a real workflow gap
  shows up.
- **CLAUDE.md backlog items unchanged** since April 30 (HeroCinema phase
  system, Navbar/Footer inline SVG logos, contact form react-hook-form bundle).
- **Lighthouse cron at 04:00 UTC** will re-evaluate the marketing perf changes
  from `20bc0a4`. Watch /admin/monitor for the new scores.

### Verification at end of session

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `vercel logs --status-code 500 --since 5m` returns no errors.
- All commits pushed to `origin main`. Latest deploy `Ready` in production.
