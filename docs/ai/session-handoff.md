# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-01.md`](history/2026-05-01.md), which holds the verbatim
record of every May 1 entry that was below this header before this reset.

## Current state (May 1, 2026 -- Phase 1 shipped at `7f9ea05`)

### Phase 1 shipped (commit `7f9ea05`)

`feat(admin/visitors): chart-driven analytics with hero chart, metric
tiles, and breakdown panels`. Pushed to `origin main`. Vercel
auto-deploys. Working tree clean before Phase 2 begins.

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
