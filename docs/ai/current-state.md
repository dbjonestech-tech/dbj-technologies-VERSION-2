# Current State

Last updated: April 29, 2026 (late, post-Canopy expansion)

## Canopy (productized engagement, April 28; renamed from Operations Cockpit later same day; expanded to 9-section product April 29)

The internal admin dashboard is now positioned publicly as a productized engagement called **Canopy**, "Starting at $25,000," 4-8 week delivery. Pitched as a consolidation of 5-7 SaaS subscriptions into one stack the buyer owns: first-party analytics, real-user performance, deliverability monitoring, infrastructure watchers, error tracking, pipeline observability, cost telemetry. Same architecture I run for DBJ.

### First install LIVE: Star Auto Service

`https://ops.thestarautoservice.com/admin` is live behind Google sign-in. Test users: `joshua@dbjtechnologies.com` and `thestarautoservice1@gmail.com`. Neon Postgres provisioned and migrated (7 migrations). Cloudflare DNS resolves; SSL valid; auto-redirect to `/signin?callbackUrl=/admin` works. Vercel project `starauto-ops` on the `dbjonestech-9249s-projects` team. CanopyBeacon component mounted in Star Auto's main repo (`github.com/dbjonestech-tech/star-auto-service`, `src/app/layout.tsx` line ~12 with Suspense wrap), endpoint `https://ops.thestarautoservice.com`. CORS allow-list `CANOPY_ALLOWED_ORIGINS` covers both apex and www. Cookies `cnp_vid`/`cnp_sid` set with `Secure; SameSite=None` for cross-origin handshake.

### Canopy product surface (9 admin sections, April 29 expansion)

All routes under `/admin/*`, gated by Auth.js Google sign-in + `ADMIN_EMAILS` allow-list:
- `/admin` (Dashboard): 8 headline stat cards with sparklines + trend deltas, worst-of-status banner, recent deploys/errors/sessions feeds, infrastructure summary
- `/admin/visitors`: top pages, top referrers, UTM sources, devices, average engagement, live-presence card, 25-row recent sessions table
- `/admin/performance/rum`: 5 Web Vital cards with thresholded color (LCP/INP/CLS/TTFB/FCP), 14d trend sparklines, by-page table, by-device card
- `/admin/platform`: deploy outcomes, 14d cadence, function p95, recent 12 deploys, hot 10 functions table
- `/admin/infrastructure`: per-domain check grid (TLS/WHOIS/MX/SPF/DKIM/DMARC), TLS expiry countdown, auth posture bars
- `/admin/email`: delivery rate, bounce rate, top bouncing recipients, 30d send/delivery/bounce trend, recent webhook events
- `/admin/monitor`: per-host uptime + latency + recent incidents (last 7 days)
- `/admin/errors`: grouped-by-fingerprint with affected user counts, by-source breakdown, 24h hourly volume
- `/admin/audit`: signin/signout/denied log with top actors and recent activity feed

Sidebar grouped Today / Acquisition / Health / Engagement / Security with section icons + Canopy logomark chip + signed-in chip.

### Canopy DBJ marketing surfaces (unchanged from earlier session)

Surfaces (all on the marketing site, no admin internals exposed):
- **About page**: section "Built for Myself First" (eyebrow "The Stack Behind the Studio") between Operating Principles and the CTA. 6-tile glass-card capability grid; dual CTAs to `/pricing/canopy` (primary) and `/contact?topic=canopy` (private walkthrough).
- **Pricing page**: "Specialty Engagement" section between the 3-tier grid and the Add-Ons grid. Single full-width feature card with $25,000 price block linking to the detail page.
- **Detail page** at `/pricing/canopy`: rendered by existing `[slug]/page.tsx` from a `slug: "canopy"` entry in `PRICING_DETAILS` (`lib/pricing-data.ts`). Hero, idealFor, three sections, four FAQs.
- **Contact form**: `topic=canopy` query param prefills budget `$25,000+`, projectType `Other`, and a scoping-context message; renders a Gauge-icon topic card above the form. Legacy `topic=operations-cockpit` still routes through the same prefill for transition safety.
- **Redirect**: `/pricing/operations` 308-redirects to `/pricing/canopy` (configured in `next.config.mjs`).

Sitemap auto-includes via `getPricingSlugs()`. No new env vars on the DBJ marketing site. No new migrations. Public copy is outcome-led; no Pathlight internals (model names, function IDs, vertical database) leak through.

### Canopy starter repo (separate codebase)

Productized template lives at `github.com/dbjonestech-tech/canopy` (private). Local working directory is `/Users/doulosjones/Desktop/operations-cockpit/`. Vercel project `starauto-ops` is the Star Auto deployment instance, linked to that repo, **deployed and serving traffic at `ops.thestarautoservice.com`**. Latest deploy (April 29, late) ships 9 admin sections + chart primitives (`lib/ui/`) + time-bucket helpers (`lib/services/time-buckets.ts`) + 2 new migrations (006_audit_log, 007_error_events) + Auth.js audit log writer.

### 4th DBJ case study live: Canopy

`lib/work-data.ts` now has 4 entries (Pathlight, Star Auto Service, Soil Depot, Canopy). Canopy uses a new `category: "Productized Engagement"` (third category alongside "Internal Product" and "Client Project"). 5 sections, 5 tech detail cards. `liveUrl` -> `/pricing/canopy` since the Star Auto install is auth-walled. `ctaHref` -> `/contact?topic=canopy`. Image path `/images/case-studies/canopy-dashboard.webp` is a placeholder; needs Joshua to capture the live dashboard screenshot and drop into `public/images/case-studies/`. `/work` page now renders 4 cards (2x2 on desktop). `/work/canopy` detail page auto-generated from PROJECT_DETAILS via existing slug routing.

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

Contact form persistence: `app/(marketing)/api/contact/route.ts` writes to `contact_submissions` (migration 011) on every path and now also returns the inserted id so the route can attach it to the originating session for funnel attribution.

## DBJ Technologies Site (dbjtechnologies.com)

### Working and Deployed
- ~24 unique URLs live (18 page.tsx files plus dynamic [slug] expansions), deployed on Vercel via GitHub `dbj-technologies-VERSION-2` (origin main)
- Lighthouse baseline: Performance 99-100, Accessibility 100, Best Practices 100, SEO 100
- Homepage: HeroCinema phase-based animation (blueprint -> build -> reveal -> complete), "Architect The Impossible." headline with period. Initial-load gap (between CSS-paint and HeroCinema's ssr:false chunk arriving) covered by a static dark fallback div rendered in app/layout.tsx (id="hero-cinema-fallback", inline-styled position:fixed z:100 #06060a, only emitted on /) which HeroCinema removes from the DOM in its mount useEffect so its own animated overlay takes the slot seamlessly.
- About page: dark hero section, split layout with joshua-jones.webp (true alpha-channel transparent PNG; new "Joshua Profile Headshot" source converted via cwebp -q 90 -alpha_q 100; 640 KB, 6400x4263, RGBA preserved). Photo column enlarged for desktop: w-80 mobile, lg:w-[600px], xl:w-[720px], with the hero container widened to xl:max-w-7xl so the text column doesn't get crushed. Headline capped at md:text-6xl lg:text-5xl to prevent character-level mid-word wrap once the photo column grows. No maskImage; subject silhouette floats directly over the dark page bg. Clip-path reveal animation, floating geometric accents, character-level headline animation, story sections ("Why I Work This Way", "What You Actually Get", "How I Build", "Who This Is For"), personal sign-off, gradient divider, values cards with hover glow.
- Work page: 3 case studies (Star Auto Service, Pathlight, Soil Depot) with real screenshots, comprehensive detail pages, metrics rows, tech stacks, "View Case Study" + "Live Site" links. Below the case-study row, the **Design Briefs** section: 8 vertical reference architectures (Dental Practice, Med Spa, Upscale Restaurant, Financial Advisor, Personal Injury Law, Luxury Real Estate, Luxury Home Builder, HVAC Contractor) presented as full-width project-style cards (md:grid-cols-2, h-52 preview WebP, accent-tinted vertical badge, headline, 3-sentence DFW-aware description, 3-up "Key Surfaces" tile grid, accent-tinted "In the Brief" callout, single "Read the Design Brief" CTA). Each card preview is a real screenshot of the corresponding template, stored at `public/design-briefs/{slug}.webp` (cwebp -q 92, ~25MB PNG -> ~2.2MB WebP). Each deep-dive page at `/work/design-briefs/[slug]` shows the same screenshot as a framed full-width hero (border + accent-tinted shadow), followed by the markdown body from `docs/design-briefs/{slug}.md`. Live HTML templates remain on disk under `/public/templates/` but are no longer linked from any UI surface. Old `/work/blueprints/[slug]` URLs 308-redirect to `/work/design-briefs/[slug]` via next.config.mjs.
- Services: 6 dedicated service pages (frontend-architecture, backend-systems, cloud-infrastructure, interface-engineering, ecommerce-platforms, web-performance)
- Pricing: Starter $4,500, Professional $9,500, Enterprise custom (price: null, scoped during paid discovery). Maintenance $299/month. Hourly consulting $175/hour. Each tier now has a dedicated detail page at /pricing/{slug} with 5 slugs total (starter, professional, enterprise, maintenance, consulting). Detail layout: hero with name/price/timeline + per-tier inline CTA, Ideal For paragraph, three-section breakdown (heading + body), tier-filtered Add-Ons section (only starter/professional/enterprise), tier FAQ accordion, standard CTASection. Add-ons live in a single global ADD_ONS array in lib/pricing-data.ts with a tiers[] field per entry; getAddOnsByTier(slug) filters at render time. Schema for PRICING_DETAILS was refactored from the old whatsIncluded/addOns/timeline/revisions/support shape to the new sections/idealFor/ctaText/ctaHref shape; layout component PricingDetailLayout.tsx was rewritten to match. The legacy /maintenance-support page (which had its own 3-tier $299/$599/$999 plan grid) was deleted; a 308 permanent redirect from /maintenance-support to /pricing/maintenance is now configured in next.config.mjs. Footer SUPPORT_LINKS, sitemap, addon card hrefs on the main /pricing page, and the "See maintenance & support plans" link in PricingContent.tsx all point at /pricing/maintenance now.
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

## Star Auto Service (thestarautoservice.com)
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
