# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-01.md`](history/2026-05-01.md), which holds the verbatim
record of every May 1 entry that was below this header before this reset.

## Current state (end of May 1, 2026)

### Most recent commits (top of `origin main`)

- (this commit) docs: archive 34 KB session-handoff to history/2026-05-01.md and reset live handoff to a compact summary
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

- `feedback_rsc_boundary_runtime.md` — tsc + lint clean does not validate the
  Server -> Client prop boundary; functions cannot serialize across.
- `feedback_honest_skip_recommendations.md` — when asked "should we build X?",
  default to honest skip; Joshua's bar is "very valuable + durable."
- `project_canopy_brand.md` updated — /admin is the design prototype for the
  Canopy product; Canopy UI work mirrors /admin patterns.

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
