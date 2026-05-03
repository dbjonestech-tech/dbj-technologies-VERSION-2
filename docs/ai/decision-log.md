# Decision Log

## May 3, 2026 -- Pathlight Stage 2 shipped: HTML capture as the foundation, forms audit as the proof

Decision: Ship Stage 2 of the Pathlight enhancement project (HTML body capture, full-page screenshots, form audit) BEFORE Stage 1 (the bundled richer design audit). Stage 0's audit recommended this ordering and this session implements it end-to-end.

Reason: Stage 2 is the foundation every later text-side analysis depends on. The Browserless capture function previously returned only a base64 JPEG; without HTML, Stages 3-6 each need a parallel fetch path. Extending the existing capture function once (Option A: in-browser DOM walk for forms, plus `await page.content()` for body HTML) gives every downstream stage the same payload off one Browserless call. Doing the smaller, lower-risk infrastructure change first means Stage 1's bundled vision call can later be informed by both the screenshots AND the extracted body copy, materially improving the model's grounding compared to landing the vision call against screenshots alone.

Implementation choices:
- **HTML capture truncated at 256KB at the Browserless boundary.** Mirrors the change-monitoring fetch cap and bounds the JSONB column at a predictable upper limit. The truncation point is recorded so downstream readers can detect it.
- **Full-page screenshots are a SEPARATE Browserless call path.** A new `captureFullPageScreenshot` and a small `SCREENSHOT_FULLPAGE_FUNCTION` body live alongside (not inside) the AtF capture function. The AtF function stays focused on its known failure modes; the do-not-break.md screenshot pipeline keeps its known shape. The two pairs run in parallel as `Promise.allSettled` so a slow full-page capture cannot poison the AtF pair, and vice versa.
- **Forms extracted in-browser, not server-side.** The DOM walk runs inside Browserless's Chromium where every form attribute is natively available. Server-side parsing would have required pulling in cheerio or jsdom (neither in package.json today) and would have re-derived facts the browser already knows.
- **Forms-audit step is post-finalize, mirroring the audio step.** Inserted as `f1` between `a5` (audio) and `e1` (report email). Failure is swallowed: the report finalizes, the email fires, the section just does not render. Per-call timeout is 30s (vs the 90s default) so a stuck forms-audit cannot consume the function's 420s budget.
- **Two-phase forms_audit write.** The capture step writes the `extracted` half immediately so the report has something to render the moment the user opens it. The post-finalize forms-audit step writes the `analysis` half via a `jsonb_set` at the `analysis` key, preserving the `extracted` half on conflict.
- **Forms_audit failure does NOT mark a scan partial.** Same posture as audio. The partial-failure cascade in the finalize step is unchanged. `LABEL_TO_STAGE` carries the new `forms-audit` entry as forward-compatibility scaffolding only.
- **No design-audit schema changes.** The `visionAuditSchema` at `lib/services/claude-analysis.ts` is untouched. The only change to claude-analysis.ts is adding `export` to `callClaudeWithJsonSchema` (so the new forms-audit service can reuse the retry/schema-repair pattern instead of duplicating it) and adding a third per-operation timeout bucket (`FORMS_AUDIT_CALL_TIMEOUT_MS = 30_000`).
- **The HTML snapshot is server-side only.** It does not flow through the public scan API. Render-side consumers see only `screenshotsFullPage` and `formsAudit` (extracted descriptors plus optional analysis). Surfacing the body HTML to the client would expose a working set of source material that downstream stages will analyze; keeping it server-side preserves option value.
- **Migration 034 committed and pushed independently.** Three additive nullable JSONB columns (`html_snapshot`, `screenshots_fullpage`, `forms_audit`). Idempotent ALTER TABLE statements. Applied to prod Neon before code committed so any column-shape mismatches surface at migration time, not at first scan.

What this stage explicitly does NOT do:
- Stage 1's bundled richer design audit. Stage 1 is a separate, larger commit and lands on Joshua's authorization. The Stage 2 HTML payload becomes available to it.
- Stage 3 (tone analysis, per-vertical checklist, tech health). Same posture: each stage authorizes separately.
- A `.claude/rules/pathlight-enhancements.md` file. Per the Stage 0 audit, that is Stage 1's deliverable since Stage 1 introduces the public-presentation rules around new finding sections.
- Updates to `do-not-break.md`. Wait for at least one real scan in production to confirm the Stage 2 pieces work before declaring them load-bearing.

## May 1, 2026 (latest) -- Canopy v2 Phase 1: deal-centric CRM pivot

Decision: Add a `deals` table alongside `contacts`. The Kanban moves DEALS now, not contacts. One contact can have many deals over time. The legacy `contacts.status` column stays as a denormalized "primary deal stage" mirror so the existing `/admin/relationships/pipeline` kanban keeps working without a hard cutover. A banner on the legacy kanban points operators to `/admin/deals` as the new primary board.

Reason: The Phase 2 lightweight CRM (May 1, earlier) tracked one contact through one stage. Real CRMs track deals through stages with people attached. The single-stage-per-contact model breaks the moment a customer has a closed-won engagement and a new opportunity in flight at the same time. It also makes pipeline value forecasting impossible (you cannot weighted-pipeline-sum a status enum). Phase 1 of the Canopy v2 build is this pivot, the foundation every later phase (sequences, automation, analytics, attribution) builds on.

Implementation choices:
- **Backfill creates one deal per existing contact** so the new Kanban hydrates with real data on first load. The backfill is idempotent: it skips any contact already having a deal so re-running the migration is safe.
- **Probability rule on stage change: never decrease.** When operator moves a deal from "qualified" (which they had at 65% custom) to "proposal" (default 70%), the probability raises to 70%. But if they had set qualified at 80% (high confidence) and move to proposal, the probability stays at 80%. Stage changes raise probability to the default if higher; never drop. Won is always 100, Lost is always 0.
- **Won and Lost are NOT settable from the kanban dropdown.** Closing a deal as won captures a final value (which may differ from the original); closing as lost requires a reason. Both flows live on the deal detail page so the outcome and loss reason are properly captured. The kanban dropdown disables those options with a "use Close button on detail" hint.
- **Mirror rule:** every stage change updates the linked contact's `contacts.status` to match the contact's most-recently-updated open deal (or the most recent closed deal if no open deals remain). This keeps the legacy contact-stage kanban consistent without forcing a hard cutover.
- **Owner is denormalized:** schema has `owner_user_id` (TEXT, for Phase 8 RBAC) AND `owner_email`. New deals get `owner_email` from the session; backfilled deals get NULL.
- **Kanban tinting reuses the contact pipeline's color scheme** (blue/amber/violet/cyan/emerald/zinc) so the visual language is consistent across the two boards. The deals page itself uses `violet` palette.
- **Audit log on every change.** Create, update, stage change, close, reopen all write to `canopy_audit_log` with before/after JSONB. The deal detail page renders an audit feed so operators see every change to a deal.
- **No drag-and-drop on the new kanban**, mirroring the existing decision on the contact pipeline. Status dropdown is the right interaction at low deal volumes; revisit at scale.

## May 1, 2026 (later) -- Canopy v2 build started: source-of-truth flip + Pathlight lock architecture

Decision: Two coupled decisions taken together. (1) DBJ `/admin` in this repo is now the canonical source of truth for Canopy as a product. The previously productized starter at `github.com/dbjonestech-tech/canopy` and Star Auto's live install at `ops.thestarautoservice.com` (working dir `/Users/doulosjones/Desktop/operations-cockpit/`) are **frozen**: no new features land there until the DBJ Canopy is perfected; Star Auto will then be rebuilt from the perfected source. (2) All future Pathlight automation in Canopy passes through a three-layer lock - feature toggles + manual click-driven trigger + monthly budget cap. Default state on install is locked-shut.

Reason: Two real reasons. First, DBJ `/admin` already has 22+ admin sections versus operations-cockpit's 8; OC was a productized derivative built on a more constrained surface area, and continuing to maintain both forks doubled the work without commensurate value. Auditing OC against DBJ identified three small deltas worth porting back (first-party error capture pipeline, exportable beacon snippet, bootstrap/seed scripts) and confirmed everything else worth keeping was already richer in DBJ. Second, the next phase of Canopy adds Pathlight-driven prospecting, competitive intel, and continuous monitoring - features that have real per-scan API cost. A productized $25K engagement cannot ship with implicit auto-scan behavior; the operator must consciously enable each integration and consciously fund its budget. The three-layer lock makes that consent explicit at three independent gates so a forgotten toggle never compounds into a billing surprise.

Implementation choices:
- **Source of truth flip is documented but not destructive.** OC and the canopy starter remain on disk and on GitHub. Once perfected DBJ Canopy is ready to rebuild Star Auto from, OC and the canopy starter get archived rather than deleted.
- **First-party error pipeline is the first port.** Migration 023 + `/api/track/error` + `ErrorBeacon` + a rewritten `/admin/errors` that hybridizes first-party `error_events` (primary) with the existing Sentry view (secondary). This means future Canopy clients can have error monitoring without a paid Sentry seat.
- **`canopy_audit_log` is a NEW table, not an extension of `admin_audit_log`.** Auth/access events stay in `admin_audit_log` (existing). Entity-change events live in `canopy_audit_log` (new). Different shapes, different query patterns, different consumers. Combining them was tempting but wrong.
- **Default to BLOCKED, not OPEN.** Migration 024 seeds `canopy_settings` with every Pathlight toggle FALSE and `monthly_scan_budget = 0`. The settings reader falls open to those same DEFAULTS if the table is missing. There is no execution path where a scan can fire without a deliberate operator click into `/admin/canopy` to enable it.
- **The full plan lives in `docs/ai/canopy-build-plan.md`** as 9 phases (0 - Settings/Audit/Locks, 1 - Deals architecture, 2 - Activities/Tasks, 3 - Custom Fields/Tags/Segments, 4 - Email Integration, 5 - Sequences/Workflow/Bulk, 6 - Pathlight manual integrations, 7 - Analytics/Digest, 8 - Multi-User Enterprise, 9 - Pathlight advanced - prospecting/monitoring/competitive/attribution). Phases 0 + the error pipeline are staged uncommitted; everything else is on the roadmap.
- **Out of scope, explicitly:** replacing the contact form's Resend send path (do-not-break), optimizing Lighthouse 400/400, touching HeroCinema or ScanStatus or vertical-lookup or Pathlight pipeline order, crossing route-group import boundaries.

The plan respects existing decisions: NO drag-and-drop on the existing `/admin/relationships/pipeline` (the new deals kanban can revisit), NO pipeline-value-sum on the existing contacts kanban (deals layer adds its own weighted/unweighted rollups separately), Server Actions for mutations (matches Phase 2 contacts pattern), LATERAL subqueries for counts where applicable.

## May 1, 2026 (late) -- Lightweight CRM integrated into Canopy (Phase 2 of two-phase build)

Decision: Phase 2 of the visitors-page-upgrade build adds a lightweight
relationship-management layer to Canopy: contacts table unified by
email, contact_notes for the activity audit trail, three new admin
pages (`/admin/contacts`, `/admin/contacts/[id]`,
`/admin/relationships/pipeline`), a Relationships sidebar group with
an overdue-follow-up badge, a Relationships dashboard card, and
auto-creation wiring across the scan pipeline + contact form route +
client invitation accept flow.

Reason: Until this build, the CRM-style information was scattered:
leads in the Pathlight signups tab, prospects in contact_submissions,
clients in clients, and any per-person notes only in Joshua's head.
With three real install-zero candidates in flight (Star Auto already
live, two more being scoped), a single per-person view with lifecycle
tracking, follow-up dates, and a unified timeline is the difference
between "I think we talked about that in March" and "Tyler's last
contact was a contact-form submission on Apr 28; status=qualified;
follow-up Apr 30 with the proposal walkthrough." The CRM also makes
Canopy itself more buyable: a Canopy install includes "leads
captured + lifecycle tracked + Pathlight scans alongside" instead of
just "analytics tables."

Implementation choices:
- **Email is the unifying key.** No anonymous visitors are imported
  into contacts. The CRM is exclusively for people you can actually
  follow up with. Anonymous visitors stay on /admin/visitors. The
  contacts.email column is `TEXT UNIQUE NOT NULL`; the unique index
  from the constraint is the only email index needed.
- **Server Actions instead of new API routes for mutations.** Phase 1
  added one API route for the visitors dashboard polling. Phase 2's
  six mutations (createContact, updateContact, addNote, deleteNote,
  changeStatus, sync) all go through `lib/actions/contacts.ts` with
  per-action `revalidatePath` calls. Server Actions keep auth and
  invalidation co-located with the call site, removing the need for
  six small route handlers.
- **Touchpoint counts via LATERAL, not N+1.** The list view shows
  "1 scan, 2 forms, 3 emails" per contact. Computing those counts
  in three LATERAL subqueries inside `getContacts` keeps the page
  load to a single round trip; per-row count queries would be
  ~90 round trips per page at 30 contacts.
- **Page-view "visits" deliberately omitted from touchpoints.** Page
  views require an email to visitor_id linkage chain that's
  unstable. Listing "5 visits" without that linkage would mean
  scanning every contact's potential page_views which is O(N x
  page_views), and the dashed visit-count would mislead anyway. The
  detail-page timeline still shows page views (grouped by
  session_id from migration 014) for contacts whose visitor_id is
  resolvable.
- **NO drag-and-drop on the kanban.** Per-card status dropdown.
  Drag-and-drop adds significant complexity (drag libraries, drop
  targets, mobile touch support, optimistic reorder) for minimal
  UX gain at low contact volumes. A click-to-change dropdown is
  the right interaction for this version. Revisit when contact
  count exceeds 100 and dragging starts to feel faster than
  clicking.
- **NO pipeline-value sum.** The Pathlight `estimatedMonthlyLoss`
  is the client's revenue leakage, not the DBJ deal value. Showing
  a pipeline-value total based on it would lie about the studio's
  forecast. If deal value tracking is needed later, add an optional
  manual `deal_value` field to contacts.
- **Route is `/admin/relationships/pipeline`, NOT `/admin/pipeline`.**
  The latter is the existing Inngest pipeline health page and
  cannot be repurposed. The user-facing label "Pipeline" stays the
  same.
- **Auto-creation upserts are best-effort.** Each upsert lives
  inside try/catch and never blocks the parent flow. A scan
  pipeline failure must not fail because the CRM upsert hit a
  unique-constraint race. Same for the contact form route and the
  client invitation accept flow.
- **Pathlight scan card on the contact detail page** shows the
  most recent scan's score, business name, and estimated monthly
  impact. This is admin-only so the Pathlight rule about not
  exposing internals on public surfaces does not apply, but the
  card stays outcome-led (no model names, no pipeline detail).

Migration 022 must be applied to prod Neon before the contacts pages
hydrate in production. Until then, all reads return the empty
default and the new pages render the empty state. Apply via
`npx tsx lib/db/setup.ts`.

## May 1, 2026 (late) -- /admin/visitors upgraded to PostHog/Vercel-Analytics-level chart-driven page (Phase 1 of two-phase build)

Decision: The `/admin/visitors` page was upgraded from a four-card stat
grid + four flat tables to a chart-driven analytics page anchored by a
hero time-series chart, six period-over-period metric tiles, and three
visual breakdown panels (top pages, top sources, devices+engagement),
plus a stretch top-cities panel. The recent visitors table at the
bottom is preserved EXACTLY as-is (it is already at PostHog quality
for per-visitor views). The Live presence section and DefinitionsPanel
move into the new layout.

Reason: The visitors page is the most-used /admin surface and the
strongest proof-of-craft for Canopy (it is the first thing operators
see when proving "this dashboard is worth $25K"). The four
stat-cards-plus-tables layout read as a competent admin page, not as a
$25K productized analytics product. PostHog and Vercel Analytics both
lead with a chart hero with period-over-period comparison and tiled
metrics; that pattern is the table-stakes shape for a buyer to read
the page as serious. The recent-visitors table below the new section
is the proprietary differentiator (per-visitor identity, full timeline,
engagement column, bot heuristic, CSV export) so it stays untouched.

Implementation choices:
- **Recharts** chosen over a hand-rolled SVG chart for the hero
  because the tooltip + comparison line + responsive resizing require
  a real charting library; the breakdown bars stayed as styled divs
  because they are simpler and faster to render at small sizes.
- **State in React, NOT in URL.** Range pill clicks (7D / 14D / 30D /
  90D / custom) trigger a client-side fetch to a new
  `/admin/api/visitors-data` API route. This intentionally does NOT
  push to the URL because the recent-visitors table below already
  uses `?before_v=` and `?before=` for its two paginators, and
  conflating them would break the back/forward behaviour. Trade-off:
  the chart range is not bookmarkable. Acceptable because the table
  pagination integrity matters more than chart-range deep links.
- **Comparison-history threshold of 3 daily points.** When the
  comparison window has fewer than 3 daily data points, the API
  returns `comparisonSeries=[]` and `previous*=null`. The frontend
  hides the ghost line and the trend deltas in that case. Three
  points is the minimum that produces a non-degenerate comparison
  shape; below that, the ghost line is visual noise.
- **Bounce rate trend color is INVERTED.** Lower bounce = green
  arrow, higher bounce = red. Every other metric uses the natural
  direction.
- **No `unstable_cache`.** Next 16 deprecates it; the Cache
  Components / `'use cache'` directive is the forward path. For now
  the route is `force-dynamic`. If the page is noticeably slow
  (>2s), follow up with `'use cache'` per-section.

Per the prerequisite: the dashboard floating-preview / sparkline work
(commit b10428f) had to land first because Phase 2's CRM dashboard
card depends on the same KPI infrastructure. Phase 2 (CRM integration)
ships in its own commit.

## April 30, 2026 -- Canopy pulled from public pricing surface (premature to sell with one install); repositioned on Work page as proof-of-craft

Decision: Less than 24 hours after the first Canopy install went live for Star Auto Service, Joshua flagged that listing Canopy as a $25,000 "Productized Engagement" on the public `/pricing` page was premature and amateurish. With one install (live for hours, audit log still empty, real beacon traffic not yet verified end-to-end, no testimonials, no proven case studies across multiple verticals, ICP still being validated), public pricing was selling something that did not yet exist as a true productized offering.

Pulled from public sale:
- `lib/pricing-data.ts`: Canopy entry removed from PRICING_DETAILS. The full markup is preserved in git history for restoration once 2-3 installs prove the playbook out. The slug is no longer derived by `getPricingSlugs()`, so `/pricing/canopy` is no longer generated as a static page.
- `app/(marketing)/pricing/PricingContent.tsx`: removed the "Specialty Engagement / Canopy." section between the 3-tier grid and the Add-Ons grid (the full-width feature card with $25,000 price block, Canopy logo plaque, and "See What's Included" CTA). Cleaned up now-unused `Gauge` and `Image` imports.
- `app/(marketing)/about/AboutContent.tsx`: the "Built for Myself First / The Stack Behind the Studio" section CTAs were repointed from `/pricing/canopy` (primary) and `/contact?topic=canopy` (secondary) to `/work/canopy` (primary, "See What Was Built") and `/contact` (secondary, "Get in Touch"). The supporting paragraph rewritten to acknowledge "the first install is live for a client; once the playbook proves out across more verticals, it becomes a productized engagement."
- `next.config.mjs`: legacy `/pricing/operations -> /pricing/canopy` redirect updated to `/pricing/operations -> /work/canopy`. Added new `/pricing/canopy -> /work/canopy` redirect so any bookmarks or external links land on the case study instead of 404.
- `app/(marketing)/contact/ContactContent.tsx`: `topic=canopy` query parameter still recognized for backward compatibility (so any inbound from saved /pricing/canopy URLs still routes through a sensible prefill), but the prefill message reframed from "I'd like to scope a Canopy engagement" to "I saw the Canopy build on the Work page and want to talk about a custom version for my business." The `$25,000+` budget pre-fill removed since pricing is no longer being advertised.

Repositioned as proof-of-craft on `/work/canopy`:
- `lib/work-data.ts`: category changed from `"Productized Engagement"` to `"Internal Tooling"`. Metrics changed from `9 SECTIONS / 4 to 8 WEEKS / Starting at $25,000` to `9 SECTIONS / Live Install: Star Auto / Built In: Two days` (proof-of-craft framing instead of sale framing). CTA changed from `"Scope Your Canopy Engagement" -> /contact?topic=canopy` to `"Get in Touch" -> /contact`. liveUrl changed from `/pricing/canopy` (now-dead) to `/work/canopy` (self-reference, since the install itself is auth-walled and the marketing page no longer exists).
- Hero description rewritten to acknowledge install zero status: "An operations dashboard built first for the studio that ships it, then deployed as install zero for a real client. Star Auto Service in Richardson, TX is the first external Canopy. Not yet a productized offering for sale. Live as a working install, on the way to becoming one once the playbook proves out across more verticals."
- "The Engagement" section retitled to "What Comes Next" and rewritten to describe the path from install zero to productized engagement (need a tech-forward business with SaaS sprawl, an operations team that wants funnel attribution, at least one install with a year of data behind it). Removed the four-to-eight-weeks-and-$25K sale framing.
- `logoImage` field removed from the Canopy entry. The custom Canopy brand mark works on the dark Canopy app sidebar (where it has cyan ambient glow against a dark surface) but fights DBJ's font-display typographic voice on the light Work-page hero. Reverted to the standard text title in font-display, which is DBJ's voice.

Reason: The honest move when a productized offering has only one install is to call it what it is: a working build, not a buyable service. Selling something that does not yet have multiple proven installs, defined ICP, or testimonials hurts the studio's credibility more than waiting hurts the offering's momentum. Build first, sell later. The case study still earns its place on the Work page (real install, real client, real architecture) but stops pretending to be a productized engagement until it actually is one. Plan for restoration: 2-3 additional installs across distinct verticals, at least 30 days of real flowing data per install, and one client willing to be a referenceable testimonial.

Also sanitized in the same change set (separately tracked but pushed together): the public Canopy case study description previously leaked specific implementation recipes (3-layer bot detection signature, CanopyBeacon component name + CORS allow-list pattern, sha256+daily-salt IP hashing recipe, materialized-view orchestration, github.com/dbjonestech-tech/canopy private repo URL). All replaced with outcome-language that sells value without giving blueprint.

## April 29, 2026 (late) -- Canopy expanded from 6-section thin slice to 9-section operations cockpit; shipped as DBJ's 4th case study under a new "Productized Engagement" category

Decision: After the first Canopy install (Star Auto Service) went live but before the marketing case study went up, Joshua flagged that the Canopy product itself was thin -- 5 of the 6 admin pages were `[Stubbed: ...]` placeholders, with only the headline dashboard rendering 4 zero-stat cards. For a $25K productized offering pitched as "the same architecture I run for the studio," the in-product experience didn't match the price point. Decision: invest a single concentrated session to bring the Canopy product up to parity with the marketing claim before the case study went live, then ship the case study with screenshots that actually look like a $25K product.

Scope of the expansion (executed this session):
1. Built a chart-primitives library in `lib/ui/` (Sparkline, MiniBars, TrendArrow with signed % delta, HealthPill with status dot, StatCard, SectionCard, EmptyHint). Pure SVG, no chart library, fully server-renderable.
2. Added `lib/services/time-buckets.ts` with `bucketize`, `percentile`, Web Vitals threshold helpers (`lcpStatus`/`inpStatus`/`clsStatus`/`ttfbStatus`/`fcpStatus`), `relativeTime`, `fmtMs`, `fmtBytes`.
3. Two new migrations: `006_audit_log.sql` (admin signin/signout/denied with IP hash + UA), `007_error_events.sql` (uncaught client/server errors with fingerprint grouping). Both applied to Star Auto's production Neon DB.
4. Auth.js callback (`lib/auth/auth.ts`) now writes signin / signout / denied events to `audit_log` via the `events` callback; failure swallowed after `console.error` so a Postgres outage cannot lock everyone out of the dashboard.
5. Replaced all 5 stub admin pages with substantial implementations: Visitors (top pages, top referrers, UTM sources, devices, live presence, 25-row recent sessions table), Real-User Performance (5 vital cards thresholded with 14d trend sparklines + by-page table + by-device card), Platform (deploy outcomes, 14d cadence, function p95, recent deploys, hot functions table), Infrastructure (per-domain check grid for TLS/WHOIS/MX/SPF/DKIM/DMARC + TLS expiry countdown + auth posture bars), Email (delivery rate, bounce rate, top bouncing recipients, send/delivery/bounce 30d trend, recent webhook events).
6. Built 3 new admin sections from scratch: Monitor (per-host uptime + latency + recent incidents), Errors (grouped by fingerprint with affected-user counts + by-source + 24h hourly volume), Audit (top actors, recent activity feed with action icons + outcome health pills).
7. Rebuilt the headline Dashboard (`/admin`) as a comprehensive worst-of-status page: 8 stat cards each with trend delta vs prior period and sparkline, "needs attention" banner that surfaces failed deploys + spiking errors + failing infra + email bounces, 3 info cards (recent deploys, recent errors, infrastructure summary), live visitors feed at bottom.
8. Sidebar redesign with section icons + a small Canopy logomark chip (gradient blue -> cyan, Zap glyph) + signed-in chip showing the active admin email above the Sign-out button.
9. Added the 4th case study to `lib/work-data.ts` under the new `category: "Productized Engagement"` (a third category alongside "Internal Product" and "Client Project"). Slug `canopy`, gradient cyan -> blue, 5 sections (Problem / Solution / What the Star Auto install includes / How it is different / The Engagement), 5 tech detail cards. `liveUrl` -> `/pricing/canopy` (since the actual install is auth-walled, the marketing page is the public proof point). Image path placeholder: `/images/case-studies/canopy-dashboard.webp` -- needs Joshua to capture the screenshot from the live install once real traffic flows or the seed script lands.

Reason: A productized engagement's case study is its primary sales tool. Shipping a thin product as the case study would actively undermine sales (visitors browsing /work expect to see something impressive, and a 5-page placeholder dashboard would communicate "this is unfinished"). The right sequence was: harden the product first, then write the case study from the now-impressive product, not the other way around. The 9-section, primitive-driven, thresholded-color, sparkline-everywhere version of Canopy reads as a $25K product instead of a personal-side-project. Each section is now also a clean re-deployable template for the next client install (e.g. the Errors page is identical for any client; only the data source differs), so this session also hardened Canopy's per-install delivery story.

What deliberately got NOT shipped this session, to avoid sprawl:
- A logomark/brand identity exercise. Currently "Canopy" is set in the same font-display weight everywhere (sidebar, signin, /pricing/canopy hero) plus the small Zap-icon chip. That's a serviceable wordmark treatment but not a proper brand mark. Brand identity work benefits from sketches and decision space, same as the naming round did; bashing through a logo at 9pm would produce a placeholder.
- A demo-data seed script. Would let the dashboard look populated immediately for case-study screenshots without waiting for organic traffic to accumulate. Punted to a future session because a thoughtful seeder must produce realistic data shapes (visitor IDs, session boundaries, plausible CWV distributions per device, plausible error frequencies) and rushing it would either pollute the production DB with junk or produce data that looks fake on screenshots.
- Vercel webhook ingestion endpoints (`/api/webhooks/vercel`, `/api/webhooks/resend`) and the daily cron handlers themselves. The dashboard pages query the tables those endpoints would populate; the tables are migrated and ready, but the actual ingestion routes are next-session work. The case study correctly describes them as part of the install.

The meta-pattern this session validated: when a productized offering's case study is being written, audit the product against what the case study claims FIRST. The case study is the spec; the product must meet it.

## April 28, 2026 -- "Operations Cockpit" rebranded to "Canopy" (single proprietary product name)

Decision: The productized engagement is renamed from "Operations Cockpit" to **Canopy**. Same product, same scope, same $25K starting price, same delivery model. Repo `dbjonestech-tech/operations-cockpit` renamed to `dbjonestech-tech/canopy`. Marketing-site detail page slug `/pricing/operations` renamed to `/pricing/canopy` with 308 redirect from the old path. Contact-form topic param `topic=operations-cockpit` migrated to `topic=canopy`; the legacy param still routes to the same prefill for transition safety. Beacon component renamed `OpsBeacon -> CanopyBeacon`; cookie names `ops_vid/ops_sid -> cnp_vid/cnp_sid`; env vars `OPS_ALLOWED_ORIGINS -> CANOPY_ALLOWED_ORIGINS` and `NEXT_PUBLIC_OPS_BEACON_URL -> NEXT_PUBLIC_CANOPY_URL`.

Reason: Cockpit on its own had a meaningful collision with Red Hat Cockpit (open-source server admin tool) that would have required brand-qualifier disambiguation ("DBJ Cockpit") in formal copy, which dilutes the punch of a single-word brand. Joshua flagged this directly: "Having to enhance it or caveat it with DBJ Technologies in any way loses the punch and lightning of it." After evaluating roughly 25 alternative candidates across 6 brainstorm rounds (Commande, Ocular, Lair, Total, Cercle, Cartography, Cartographie, Paquet, Barricade, Carnet, Navire, Helm, Tower, Mesa, Vista, Spire, Loft, Argus, Sigil, Trellis, Steere, Avis, Compas, Cenda, Tretis, Detection, Canopy), Canopy was the only candidate that cleared every structural constraint: 3 syllables but easy flow, English-pronounceable, spellable from sound, premium architectural feel, and a SaaS namespace where the only adjacent uses (Canopy Tax in legaltech, Citi Canopy in fintech) are in non-competing categories. The metaphor lands cleanly: top layer of the forest, vantage and cover at once. Brand fit with the principal-architect studio identity is stronger than Cockpit's pilot/aviation framing because architects build structures and Canopy *is* a structure.

Disqualifiers learned along the way (preserved here so future naming exercises do not relitigate the same dead ends):
- French loanwords (Commande, Cercle, Cartographie, Paquet, Carnet, Navire) all died on pronunciation friction in spoken English referrals; high-trust solo-studio engagements travel by word of mouth, so any name a referrer cannot say cleanly is broken.
- Abstract category nouns (Total, Detection) read as descriptors rather than proprietary product names, and "Detection" specifically collides with the security-vendor namespace (Sentry, Wiz, CrowdStrike).
- Names with strong existing brand associations (Vista = Microsoft's failed OS, Mesa = Southwest dinnerware, Avis = car rental, Sigil = D&D/occult/Game of Thrones) carried baggage too dense to overcome with marketing.
- Alternate-spelling words (Steere, Compas) had spelling friction that hurt SEO and referral search.
- Invented words with no metaphor anchor (Cenda, Tretis) provided uniqueness but no semantic hook for the buyer.

The naming round established a meta-rule for any future productized offerings: the right shape is two-to-three syllables, English-native, concrete metaphor that maps directly to the product, dead-or-empty SaaS namespace in the relevant category, and zero need for a brand qualifier.

## April 28, 2026 -- Admin dashboard productized as "Operations Cockpit," sold as a $25K+ Specialty Engagement, About page is the showcase

Decision: The internal admin/operations dashboard is productized publicly under the name **Operations Cockpit** at "Starting at $25,000" with a 4-8 week delivery window, positioned as a "Specialty Engagement" sister to the three website-build tiers (not as an add-on). Public surfaces: a new "Built for Myself First" section on the About page (between Operating Principles and the CTA), a new feature card on the main `/pricing` page (between the 3-tier grid and the Add-Ons grid), a new detail page at `/pricing/operations` that renders from a new `PRICING_DETAILS` entry, and a new `topic=operations-cockpit` branch on the contact form. CTA into the detail page on the About section is paired with a "Request a Private Walkthrough" secondary CTA that routes to the contact form for the highest-intent buyer.

Reason: The admin dashboard is a $30,000-$80,000 replacement-cost asset (consultancy build estimate). It is also internal tooling that, until today, did nothing for revenue. Productizing it as an engagement turns a sunk-cost asset into a sales lever and a portfolio differentiator: very few solo studios can show a working in-house analytics + RUM + deliverability + infrastructure-watch stack as proof of capability. The $25,000 floor was chosen over $30,000 because it stays under the typical board-approval threshold for SMB and lower-mid-market buyers (the actual target demographic, who are spending $15K-$60K/year on SaaS sprawl already). "Starting at" framing matches the existing Enterprise tier ("Starting at $15,000") and leaves explicit upward room (target ceiling around $60K for fully integrated multi-property builds) without forcing a tiered SKU table that would signal "off-the-shelf."

Naming: "Operations Cockpit" was chosen over "Operations Dashboard." Reasons: (1) "Dashboard" is what every SaaS calls its UI, so the noun is commoditized; (2) "Cockpit" implies the operator pilots the business from inside the system, which maps to the buyer's self-image; (3) the language was already battle-tested in internal docs (`current-state.md` literally read "Admin portal (operations cockpit, expanded April 28)") so productizing under the same name is consistent. SEO weight on "operations dashboard" is irrelevant here because the buyer arrives via referral, About-page proof, or direct outreach -- not search.

Placement: The Specialty Engagement card sits between the 3-tier grid and the Add-Ons section, NOT below the Add-Ons. Reason: a $25,000 engagement is at tier-level cost and deserves to sit near the tiers, not be buried below $200-$1,500 add-ons. The "Specialty Engagement" label is enough to signal it is a different category (operational, not project-build). It does NOT join the configurator (`/pricing/build`), the homepage, or the `/services` page yet. Those expansions are deferred until the offering produces leads, to avoid diluting the website-build narrative on the homepage and the technical-discipline framing on `/services`.

No-screenshot rule: The About page section uses words and capability tiles only. No screenshots of the actual admin dashboard appear on any public surface. Even non-Pathlight panels would inevitably leak function IDs, scan counts, or vertical names. Buyers who want to see the real product get a private walkthrough via the secondary CTA.

## April 28, 2026 -- Admin headquarters: in-house first-party analytics alongside GA, not replacing it

Decision: The admin dashboard now owns first-party measurement of every page view, session, and Core Web Vital. Two cookies (`dbj_vid`, `dbj_sid`) tie views into sessions; sessions stitch to scans and contact submissions for funnel cohort math; CWV is collected via a self-contained PerformanceObserver beacon (no `web-vitals` package). GA continues to ship through the existing consent banner unchanged.
Reason: GA gives aggregates I do not own and cannot join to the scans / contact_submissions tables. The point of measuring acquisition for this business is "of N visitors from referrer X, how many ran a Pathlight scan and how many submitted the contact form". That question is one SQL view away from sessions + scans + contact_submissions, but is impossible to answer with GA alone. Keeping GA in place preserves the longer-running historical view and the operator habits already built around it; first-party adds the join, the proprietary feel, and the ability to drill from any session row into a Pathlight scan or contact submission. Privacy posture is tightened relative to GA: raw IP is never persisted, only sha256(ip || daily_salt). Daily salt rotation prevents anyone with raw DB access from correlating visitors across days by IP. Raw page_views retained 90 days; aggregated sessions retained 13 months. The privacy policy was updated to disclose all of this in the Cookies and Analytics sections.

## April 28, 2026 -- Admin Login removed from public Navbar; Client Portal stays

Decision: The "Admin Login" link is removed from both the desktop and mobile navbars. It already existed in the Footer; `/signin` is `noindex`. The "Client Portal" outlined pill remains in the Navbar.
Reason: There is no buyer reason for admin tooling to sit next to public CTAs. Staff/admin login lives in the footer at Stripe, Linear, and GitHub for a reason: it is internal infrastructure, not a value proposition. Client Portal, by contrast, is a trust signal that DBJ runs a real client delivery system with file access and scan history; that one stays visible. This is the second half of the auth-surface split shipped earlier today.

## April 28, 2026 -- Status bar is worst-of, not aggregate

Decision: The new admin-landing status bar is computed as the worst-of every signal (deployment state, pipeline failure rate, budget headroom, infrastructure expiry, error volume, mobile RUM LCP). Each contributing signal that is not green is shown beneath the bar with its area label and message.
Reason: Aggregate "health scores" smear over the one signal that actually matters and tend to read green even when something is on fire. Worst-of is an honest status: any one red signal turns the bar red, and the operator sees exactly which signal triggered it. Trade-off: a long-tail noisy yellow signal can feel alarming. The areas chosen are deliberately load-bearing (a yellow there is real), and yellow shows the message inline so the operator can decide whether it warrants action.

## April 28, 2026 -- Auth surfaces split: /signin = admin-only, /portal-access = public client entry, footer hosts admin login

Decision: The single `/signin` page is split into two purpose-built entries. `/signin` reverts to its original simple Google-button-only state and is rebranded "Studio admin": admin tooling only, navbar surface removed, accessible via a small text link in the Footer bottom bar reading "Admin login" (next to Privacy Policy and Terms of Service). A new public route `/portal-access` is the client-facing entry: heading "Client Portal", same two-track layout that `/signin` briefly held (Google sign-in card + "Need access?" request-access card linking to `/contact?topic=portal-access`). Default callbackUrl: `/admin` for /signin, `/portal` for /portal-access. The Navbar's outlined "Client Portal" pill now points at `/portal-access`, the prior "Sign in" text link is removed, and downstream auth touchpoints (`app/portal/layout.tsx` redirect destination, `app/invite/[token]/page.tsx` "Go to sign-in" link) follow the new client entry. `/portal-access` is indexable; `/signin` stays noindex.
Reason: A unified two-track `/signin` mixed admin tooling into the public navbar and forced one page to serve two semantically different audiences. The industry convention is admin login in the footer (Stripe, Linear, GitHub all hide staff/admin login there) so the public navbar stays focused on the client/customer flow. Splitting the routes lets each page do exactly one thing well: `/signin` becomes a clean Google-button-only admin entry like it was originally, and `/portal-access` becomes a marketing-quality client portal door with both an existing-client sign-in path and a prospect request-access path side by side. The route name `/portal-access` is descriptive (not abbreviated, not collision-prone with the auth-gated `/portal` namespace) and the trailing-slash form `/portal/` in `app/robots.ts` does not block it.

## April 28, 2026 -- "Blueprint" renamed to "Design Brief" across the Work surface

Decision: The vertical reference-architecture section on `/work` no longer uses the word "Blueprint" anywhere user-facing. The replacement noun is "Design Brief" (capital D, capital B). Routes moved from `/work/blueprints/[slug]` to `/work/design-briefs/[slug]` with permanent redirects from the old paths. Module renamed `lib/blueprints.ts` -> `lib/design-briefs.ts`, docs folder renamed `docs/blueprints/` -> `docs/design-briefs/`. Section H2 changed from "Reference architectures for eight verticals." to "Reference architectures.". Pill changed from "Vertical Blueprints" to "Design Briefs". Detail-page eyebrow changed from "Vertical Blueprint" to "Design Brief". Call-to-action "Read Blueprint" became "Read the Design Brief".
Reason: "Blueprint" reads as construction shorthand and pattern-matches to template-marketplace vocabulary (Webflow blueprints, etc.). The studio is positioned as a principal architect, and "Design Brief" lands closer to how an actual practice or partner-track agency would talk about a curated dossier per vertical. "Brief" alone was considered but is too short for the card label and feels generic. "Dossier" was considered but reads as archival/journalistic rather than commissioning. "Edition" was considered but reads as a published series, not a working architectural specification. "Design Brief" pairs cleanly with the new "Reference architectures." H2 (no word repetition) and works for service categories (HVAC, restaurant) just as cleanly as for white-collar practices (dental, PI law, financial). The HeroCinema phase string "blueprint" and the Pathlight chat process-language "blueprint" are unrelated to the vertical section and were left untouched.

## April 28, 2026 -- Live Template links de-surfaced; screenshot becomes the preview

Decision: The "Live Template" / "Open the Template" external link is removed from every UI surface (the Work-page card, the deep-dive hero CTA, and the deep-dive bottom CTA). The static HTML templates remain on disk at `/public/templates/` but no link from the marketing site points to them. Each Design Brief card now uses a real WebP screenshot of the corresponding template as its preview, and the same screenshot is shown as a full-width framed hero at the top of the deep-dive page.
Reason: The HTML templates were intentionally blocked from search indexing while the proof set was being assembled, and exposing them as live links surfaced an unfinished asset. Screenshots communicate the look-and-feel of each architecture immediately and let the deep-dive prose carry the substance. Both placements (card thumbnail + deep-dive hero) reuse the exact same WebP file, so there is one source of truth per vertical. The trailing `## See the proof` paragraph was removed from each markdown for the same reason.

## April 28, 2026 -- Design Brief card matches "What I've Built" project-card structure

Decision: The 8 Design Brief cards on `/work` now use the same `md:grid-cols-2`, `h-52` preview, `glass-card-hover`, badge -> headline -> 3-sentence description -> 3-up tile grid -> accent-tinted callout -> single CTA structure as the "What I've Built" project cards above them. The 3-up tile grid surfaces three "Key Surfaces" per vertical (load-bearing architectural elements) in place of project metrics. The accent-tinted callout uses each vertical's `paletteAccent` color, surfaces the brief's `summary` field, and is labeled "In the Brief" (parallel to the projects' "Notable" callout).
Reason: Joshua's directive was that each Design Brief link be "the same size with a detailed description just like the three items under What I've Built". A 4-column dense thumbnail grid was visually distinct from the project cards and made the briefs feel secondary. Matching the project-card structure makes the section read as parallel work artifacts rather than a separate, lesser shelf. The 3-up tile grid keeps the visual rhythm of the metrics row above without forcing a numerical metric onto a content artifact.

## April 27, 2026 -- "Sign in" navbar link renamed to "Client Portal" + two-track /signin page

Decision: The `/signin` link in `components/layout/Navbar.tsx` now reads "Client Portal" on both desktop and mobile, and the `/signin` page is a two-track layout: a Google sign-in card for existing clients on top, and a "Need access?" card linking to `/contact?topic=portal-access` for prospects below. The contact form prefills `budget=Not sure yet`, `projectType=Other`, and a stock first-person message when `topic=portal-access` is present, and surfaces a "Topic: Client portal access" badge above the form.
Reason: A prospect who lands on the site does not click "Sign in" because the wording reads as a closed door. They have no visible path to engage when the portal is invitation-only, so they bounce. "Client Portal" is inviting to a curious prospect AND instantly recognizable to a returning client. The /signin page being two-track means the same single navbar link serves both audiences without a public sign-up form (portal stays invitation-only) and without a separate marketing route. The /contact form is the existing intake channel, so no new submission infrastructure is added; the topic param just routes the request through the same Resend pipeline with clear triage signal in the prefilled message.

## April 27, 2026 -- JSON-schema repair prompt threads the actual parse error

Decision: `callClaudeWithJsonSchema` now passes the specific `firstAttempt.error` (parse-fail message or Zod schema-validation message) to Claude in the repair prompt instead of a generic "your previous response was not valid JSON."
Reason: The intermittent "Some analysis steps could not be completed" banner on the report page was traced to non-transient Anthropic responses where the JSON parsed but failed Zod validation (wrong field type, missing required key). The generic repair message gave Claude no signal about which field was wrong, so the second attempt produced the same shape of failure. Threading the specific error gives the second attempt a target. No new attempts, no new branches, no cost increase. Total Claude calls per JSON step still capped at 2.

## April 22, 2026 -- Revenue Computation Architecture

Decision: estimatedMonthlyLoss is computed server-side from Claude's assumption fields, not generated as a headline number by Claude.
Reason: Letting Claude generate a headline number independently from its own assumption fields caused internal contradictions. Server-side computation eliminates narrative-vs-headline mismatches.

## April 22, 2026 -- Temperature 0 on All Claude Calls

Decision: All three Claude Sonnet calls (vision, remediation, revenue) use temperature 0.
Reason: Score drift from non-zero temperature cascaded into revenue variance across identical scans. Temperature 0 makes output deterministic given the same inputs.

## April 22, 2026 -- "Findability" Renamed to "Search Visibility"

Decision: The fourth pillar is now called "Search Visibility" throughout the codebase.
Reason: "Findability" sounded juvenile and unprofessional. "Search Visibility" sits well alongside Design, Performance, and Positioning. Backward compatibility maintained via read-time alias in coercePillarScores.

## April 23, 2026 -- B2B Source Rejection

Decision: Benchmark research prompt explicitly rejects HomeAdvisor, Angi, Thumbtack, Fixr, HomeGuide, Houzz, CostHelper for B2B businesses.
Reason: A commercial soil brokerage (Soil Depot) received a $400 deal value from residential sources. The real deal value is $2,000-$15,000+.

## April 23, 2026 -- Curated Vertical Database as Tier 1 Lookup

Decision: 206-entry curated vertical database at lib/data/verticals.ts is checked before web research. High/medium confidence entries (51) skip the Claude API benchmark call entirely.
Reason: Web search produces different results each run, causing scan-to-scan variance. Curated data is deterministic and validated.

## April 23, 2026 -- Google Workspace over Zoho/Other

Decision: Professional email runs on Google Workspace ($8.40/month) as joshua@dbjtechnologies.com.
Reason: GBP integration, Calendar/Meet for prospect calls, one ecosystem. The $8.40 is justified even before revenue.

## April 24, 2026 -- Contact Form Migrated to Resend

Decision: Contact form sends via Resend instead of Gmail SMTP.
Reason: Gmail SMTP rewrites the From header to the authenticated Gmail account. Resend sends from the verified dbjtechnologies.com domain cleanly.

## April 24, 2026 -- Pathlight Internals Redacted from Public Site

Decision: All vendor names (Claude, Inngest, Browserless, Upstash, Neon), model versions, matching algorithms, pipeline details, cost per scan, and vertical database specifics removed from the Pathlight case study and public pages.
Reason: Detailed technical specs on a public site are a competitor blueprint. Prospects need to know Pathlight exists and works, not how to rebuild it.

## April 24, 2026 -- Soil Depot NOT Showcased Initially, Then Added

Decision: Initially excluded Soil Depot from /work page because it's WordPress (contradicts Next.js positioning). Later added as a case study at Josh's insistence, with limited tech detail. Tyler's names removed from public copy until explicit permission.
Reason: Two case studies looked thin. Soil Depot demonstrates SEO, schema, GBP wiring, and client work breadth.

## April 24, 2026 -- Two Projects is Enough (Before Soil Depot Addition)

Decision: "Selected Work" framing with Star Auto + Pathlight implies curation, not scarcity.
Reason: Agencies show volume. Architects show depth. Two deep case studies with real metrics are more credible than eight gradient thumbnails.

## April 24, 2026 -- No Photo Circular Crop

Decision: About page photo uses rounded-2xl rectangle, not circular crop.
Reason: 160px circle made Josh look like a LinkedIn avatar. Larger rounded rectangle with shadow looks like a founder portrait.

## April 24, 2026 -- About Page Dark Hero

Decision: About page hero section uses the site's dark background (#06060a) matching the homepage brand. Light sections below.
Reason: White About page felt like a different site from the dark homepage. Dark hero creates visual continuity.

## April 24, 2026 -- LinkedIn Position Update Over Launch Post

Decision: Update LinkedIn profile to show Founder & Principal Architect at DBJ Technologies, let the position update hit feeds organically. Save the "launch post" for when there's something specific to announce (project shipped, testimonial, Pathlight result).
Reason: More natural. Avoids generic "excited to announce" energy. When the post comes later, it has substance.

## April 24, 2026 -- Pathlight Landing Tagline

Decision: "Find the problems. Find the money drain. Find the fix." with subtext "Free. No credit card. Results in minutes."
Reason: Nine words, three beats, each maps to what Pathlight does. Previous versions were too long or too vague.

## April 25, 2026 -- Repo-Native AI Memory System

Decision: Build .md files inside the repo (CLAUDE.md, AGENTS.md, docs/ai/*) as the primary memory system for Claude Code, instead of relying on uploaded Word docs in the Claude web project.
Reason: Repo files are loaded at session start, version-controlled, and stay in sync with the code. Uploaded docs create a second source of truth that drifts.
