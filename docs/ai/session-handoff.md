# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-01.md`](history/2026-05-01.md), which holds the verbatim
record of every May 1 entry that was below this header before this reset.

## Current state (end of May 1, 2026)

### Most recent commits (top of `origin main`)

- (this commit) feat(admin): floating CardPreview popover + sparklines + recent activity on /admin cards
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
  primary metric (no chart library — pure 100x36 viewBox, area + line +
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
