# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-29-to-2026-04-30.md`](history/2026-04-29-to-2026-04-30.md),
which holds the verbatim record of every session entry that was below this
header before the April 30 reset.

## Current state (end of May 1, 2026)

### Most recent commits (top of `origin main`)

- (this commit) docs: update session-handoff with the visitors-page paths column
- `feat(admin/visitors): per-visitor "Pages visited" column with clean labels` (this sprint)
- `cc529a0` feat(canopy admin): all 18 admin pages now wear their palette via shared PageHeader (chip pill + stripe + colored eyebrow); per-column color rotation in every data table via .canopy-table CSS rules (8-hue rotation)
- `20bc0a4` perf(marketing): cut Lighthouse-flagged paint and main-thread cost on /about, /services, /pricing, /work

Working tree clean. All changes pushed to `origin main`. Vercel auto-deploys
from main. Next 04:00 UTC Lighthouse cron will re-evaluate.

### What landed in this session: per-visitor "Pages visited" column

Joshua noticed the /admin/visitors table showed sessions and page-view counts
but did not show *which* pages each visitor hit unless you expanded the row.
Added a new "Pages visited" column rendered as small pill chips with clean
labels (Home, Work, Pricing, etc.) so the journey reads at a glance.

- **`lib/services/analytics.ts`** -- added a `paths_visited` CTE to both
  `getRecentVisitors` and `getRecurringVisitors`. Returns the distinct paths
  per visitor in chronological order (ordered by first-visit timestamp),
  capped at 50 paths per visitor to keep the row size sane. Added
  `pathsVisited: string[]` to the `RecentVisitorRow` shape; both query
  result-row types and mappers updated.
- **`app/admin/visitors/RecentVisitorsTable.tsx`** -- new `prettifyPath()`
  helper maps `/` -> "Home", `/about` -> "About", `/work/canopy` ->
  "Work / Canopy", `/pathlight/<scanId>` -> "Pathlight Report", etc.
  New `PagesVisitedChips` component renders up to 4 chips with a "+N more"
  overflow indicator (full path tooltip on hover). New "Pages visited"
  column inserted between Device and Sessions; table min-width bumped
  from 920px to 1080px. Search filter now also matches against pretty
  labels so typing "Pricing" finds anyone who hit `/pricing`. CSV export
  gets a new `paths_visited` column with paths joined by ` | `.
- **/admin/recurring** automatically picks up the new column because it
  reuses the same `RecentVisitorsTable` component.

Files touched: 2 modified.

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- Live verification deferred until Vercel deploys.

### What landed in this session: marketing-site Lighthouse perf sprint

The /admin Monitor dashboard surfaced 12 `lighthouse.regression` errors at the
04:00 UTC cron run; the daily Lighthouse cron flagged every marketing page
below the 90 floor. Worst offenders before this sprint: `/pricing` desktop 48,
`/services` desktop 56, `/contact` mobile 62, `/about` mobile 66. Diagnosed
from source (no traces) and fixed the high-confidence wins. **Commit `20bc0a4`,
4 source files + 2 doc files modified.**

- **`/about` hero photo: `quality={95}` removed.** `AboutContent.tsx` was loading
  `/images/joshua-jones.webp` (640KB source) at quality 95 with `priority` and
  `sizes` up to 720px. Default Next.js quality 75 cuts the served image roughly
  in half without visible loss. This was almost certainly the LCP offender on
  /about mobile.
- **`/about` per-word scroll-reveal removed.** `ScrollRevealText` previously wrapped
  every word in 4 chapter bodies in a `motion.span` subscribed to
  `useTransform(scrollYProgress, ...)`. Across the four chapters that was ~400
  active MotionValue subscriptions firing on every scroll frame. Replaced with
  a single `motion.p` whileInView fade. Reading flow identical, no per-word
  illumination cue. The orphaned `ScrollWordBatch` function and unused
  `MotionValue` import were removed.
- **`/about` per-character H1 reveal collapsed to a single fade.** The headline
  was animating each character via its own `motion.span` (35+ on mount, each
  with its own delay). Replaced with one `motion.span` block fade.
- **`/about` ambient particle count: 16 → 6.** Each particle is a CSS-animated
  div with `willChange: transform`, so it pays a compositor layer + main-thread
  cost forever. Six well-spaced particles read the same as sixteen at the
  page's scale.
- **`/services` hero halos: two infinite-loop `blur-3xl` motion.divs replaced with
  one static gradient.** `ServicesContent.tsx:416-446` previously composited a
  ~600px-wide animated blur region every frame on desktop. Single biggest cause
  of /services desktop = 56. Now a single static blurred gradient at opacity 25.
- **Card box-shadow stacks reduced from 4–5 layers to 2 layers** across pricing
  tiers + addons + Fix Sprint card (`PricingContent.tsx`), services capability
  rows + capability container (`ServicesContent.tsx`), work project cards +
  design-brief cards (`WorkContent.tsx`), and About ops capability cards
  (`AboutContent.tsx`). The dropped layers were small `0 1px 2px rgba(0,0,0,.04)`
  hairlines and 80–112px-blur 2nd-tier shadows; the visible glow stays.

### What did NOT change (deliberately)

- HeroCinema phase system on `/` (frontend.md says do not touch without explicit
  permission).
- `Navbar` / `Footer` inline SVG logos, `react-hook-form + zod` on `/contact`,
  `useSearchParams` on `/contact`. Each is a real perf cost (~25KB inline SVG
  per page, ~30-40KB form-library JS, opt-out of static rendering) but
  represents a riskier refactor. Listed in backlog.

### Expected impact on tomorrow's 04:00 UTC cron

- `/pricing` desktop 48 → mid-70s+ (shadow-stack reduction is the lever; cards
  paint cheaper on desktop's multi-column grid).
- `/services` desktop 56 → mid-70s+ (removing two infinite blur halos was the
  biggest single fix on this page).
- `/about` mobile 66 → low-80s+ (image weight + per-word reveal removal).
- `/about` desktop 78 → low-90s+.
- `/contact`, `/work` likely unchanged this round (untouched).

The `lighthouse.regression` floor stays at 90 so cron will still fire alerts
until the remaining backlog items land. RUM data from the analytics beacon is
the actual source of truth; Lighthouse is a synthetic check.

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- Visual smoke not yet run; recommend Joshua eyeballs `/about`, `/services`,
  `/pricing`, `/work` in incognito after Vercel deploys.



### Most recent commits (top of `origin main`)

- (this commit) docs: update session-handoff with 98e4071 commit hash
- `98e4071` feat(canopy admin): CSV export, custom date-range overview card, beefier page accents (h-1.5 w-24 stripe + colored pill chip eyebrow), Excel-style row striping (bumped from /50 opacity to bg-zinc-100/70 with palette-tinted hover)
- `9746a77` docs: update session-handoff with 7944e06 commit hash
- `7944e06` fix(admin): use the actual Canopy logo file (canopy-logo.webp) in the admin shell instead of the typographic substitute
- `0681486` docs: update session-handoff with a37289e commit hash
- `a37289e` feat(canopy admin): per-card palette system (18 hues), Canopy wordmark across admin shell, Recurring users page + dashboard card + KPI, Excel-style striped rows, search + filter chips on visitor tables
- `6902697` docs: update session-handoff with 5d9a126 commit hash
- `5d9a126` feat(admin): per-visitor view with self-disclosed identity, full timeline, and definitions panel on /admin/visitors
- `37d65b8` docs: update session-handoff with a28cd80 commit hash
- `a28cd80` fix(admin): pass icon name as string across RSC boundary (the Server -> Client function-prop crash that surfaced as "Application error: a client-side exception has occurred" on dbjtechnologies.com/admin in production)
- `5d531cc` docs: update session-handoff with cdeeb13 commit hash
- `cdeeb13` feat(admin): redesign dashboard with column color themes, hover KPIs, and Framer Motion animation; fix visitors recent feed sort and add cursor pagination
- `4cad739` docs: update session-handoff with fe3cb59 commit hash
- `fe3cb59` feat(positioning): remove AI self-claims sitewide; reposition Pathlight as a "diagnostic" instead of "AI-powered analysis"
- `bdd76bf` docs: update session-handoff with 247bda1 commit hash
- `247bda1` feat(pricing): add Fix Sprint as the post-Pathlight-scan engagement tier
- `63b7d29` docs: capture post-deploy verification + Google NAP escalation in session-handoff
- `f1bfa23` docs: update session-handoff with afa4958 commit hash
- `afa4958` feat(strategy): make Pathlight diagnoses, DBJ fixes the homepage's organizing principle
- `25a71bd` docs: update session-handoff with f68c756 commit hash
- `f68c756` feat(contact + services): surface email/phone on contact, fix services capability stack on mobile
- `6b1e0a3` fix(pricing): align CTAs and feature dividers across the three tier cards
- `0c4cbaa` revert: pathlight logo changes
- `72be7f0` fix(work/canopy): video occupies hero, no misleading 'live' caption, more copy sanitization

Working tree clean. All changes pushed to `origin main`. Vercel auto-deploys from main.

### What landed in the latest code sprint (April 30 late evening, /admin cockpit redesign)

The /admin landing page is now a real cockpit instead of a uniform card grid. This is the structural foundation for what becomes the Canopy product UI later. **Files touched: 5 modified, 2 added.**

- **Per-column color theme.** Each card now inherits a color from its column: cyan (Today), violet (Acquisition), amber (Operations), emerald (Health), zinc (Account). The theme drives the card's top accent stripe, icon tile gradient, hover halo, hover border, hover overlay wash, and KPI value color. Column headers carry a small dot in their theme so the mapping is visible without relying on the cards alone.
- **Larger icon block.** Bumped from `h-9 w-9` / `h-4 w-4` to `h-12 w-12` / `h-6 w-6`, with a soft gradient tile (`from-{color}-50 to-{color}-100`), inset ring, and inset shadow. Icon scales `1.08` and rotates `-3deg` on hover.
- **Framer Motion hover.** Card lifts `y: -3` (spring), icon scales + rotates, an arrow indicator slides in from the left of the right edge with `x` + opacity transitions, top stripe brightens from 60% → 100%, and a subtle diagonal gradient overlay (`from-{color}-50/0 via-{color}-50/50 to-{color}-50/0`) fades in across the card. All motion respects `useReducedMotion()`. Keyboard focus mirrors hover via shared `hovered` state (onFocus/onBlur on the wrapper).
- **Live KPIs on hover.** A new `lib/services/dashboard-kpis.ts` aggregates 17 KPIs in parallel via `Promise.all`, each individually wrapped in a `safe()` helper so one failing service (Sentry, Vercel API, infra checks) cannot blank the whole dashboard. The dashboard fetches the KPI map server-side alongside `auth()` and `getDashboardStatus()`. Each card receives its KPI by `card.href` lookup. KPI line lives in a fixed-height slot at the bottom of every card (no layout shift across hover) and fades + slides up on hover, with a tone-driven accent dot (positive/warning/danger/neutral) and a `secondary` line for context.
- **Plainer-English descriptions.** Funnel, Search, RUM, Pipeline rewritten to lead with what the page tells the user, not the underlying mechanism. Operational pages (Monitor, Costs, Database, Audit log, Infrastructure) keep precision-loaded copy because the technical terms ARE the value.

**Visitors page recent-feed bug fix and pagination.**

- **Sort fix.** `getRecentPageViews` was sorting by `id DESC` (BIGSERIAL). With backfilled or replayed rows, id and created_at can drift, which surfaced as "1d ago" rows interleaved with "2m ago" rows. Switched to `ORDER BY created_at DESC, id DESC` (id as a stable tiebreaker). The SSE live tail still uses `id ASC` cursor since that's the correct semantics for "tail new rows."
- **Cursor pagination.** Added optional `beforeIso` parameter to `getRecentPageViews` plus a "Load older →" button that bumps a `?before=<iso>` query param. Server validates the cursor through `Date.parse` and re-emits canonical ISO before interpolating into SQL. "← Back to latest" link resets the cursor.
- **Per-row session links.** Added `sessionId` to `RecentPageViewRow` and to the SSE wire format. Every row in the recent feed now has a "view →" link to `/admin/visitors/sessions/{sessionId}` so any visitor's full path is one click away.

**New / changed files**

- **NEW:** `lib/services/dashboard-kpis.ts` — 17-card KPI aggregator with per-card try/catch via `safe()`. Returns `Record<href, CardKpi>`. KPIs cover visitors, monitor, scans, leads, funnel, search, RUM, email, costs, database, clients, audit, pipeline, platform, errors, infrastructure, users.
- **NEW:** `app/admin/DashboardCard.tsx` — client component, per-column theme tokens, Framer Motion animations, hover-revealed KPI footer with tone-driven accent.
- **MODIFIED:** `app/admin/page.tsx` — wires `getDashboardKpis` into the existing parallel fetch, attaches a `CardTheme` to each column, replaces the old inline `CardLink` with `DashboardCard`. Adds colored dots to column headers.
- **MODIFIED:** `lib/services/analytics.ts` — `getRecentPageViews` now sorts by `created_at DESC, id DESC` and accepts an optional `beforeIso` cursor; both query branches now select `session_id`. `RecentPageViewRow` extended with `sessionId`. `getPageViewsAfterId` updated to select session_id. `RecentPageViewRowDb` type extended.
- **MODIFIED:** `app/admin/visitors/page.tsx` — accepts `searchParams: Promise<...>`, parses `?before=` cursor, passes it to `getRecentPageViews`, renders a `RecentPaginator` with "Back to latest" / "Load older" / "End of feed" states. RecentTable now has a "Session" column with a "view →" link per row.
- **MODIFIED:** `app/admin/visitors/api/stream/route.ts` — wire format now includes `session_id`.
- **MODIFIED:** `app/admin/visitors/VisitorsLive.tsx` — `StreamEvent` type extended with `session_id`.

**Verification**

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- No em dashes in any changed file.
- No leaked `dbjonestech@gmail.com` references.
- Tailwind colored utility classes (`hover:shadow-cyan-500/20`, `from-violet-50/0`, etc.) appear as full string literals in the `THEMES` const so the JIT scanner picks them up.

**What this unblocks**

- Joshua now has a real cockpit on /admin: hover any card to see live state without navigating.
- The visitors recent feed no longer interleaves old rows mid-list.
- Per-row session drill-in from the recent feed and live tail.

**Suggested next moves**

- Sessions index page (group page_views by session_id, show entry → exit path, dwell, geo, conversion) was scoped during this session but not built. Would replace "view → session" being only available row-by-row with a sortable, filterable index.
- The KPI aggregator queries Sentry, Vercel API, Anthropic budget, etc. on every dashboard render. If page load latency becomes noticeable, wrap `getDashboardKpis()` in `unstable_cache` with a 30-60s TTL.

### What landed in the latest code sprint (April 30 late late evening, AI language removal)

- **AI self-claims removed sitewide.** Strategic call by Joshua: cultural read of "AI" has flipped negative for the SMB ICP (auto repair, dental, contractors, law firms). The buzzword now reads as "low-effort generative slop" rather than "premium tech." Pathlight repositioned as a **"diagnostic"** rather than "AI-powered analysis" so it reads as principal-architect rigor instead of a ChatGPT wrapper.
- **Categorized sweep across 6 files, 14 inserts / 14 deletes.**
  - **Removed (customer-facing self-claims):**
    - `app/(grade)/layout.tsx` — Pathlight section meta description
    - `app/(grade)/pathlight/page.tsx` — page title, canonical description, OG title + description, Twitter title + description (6 metadata strings; "Free AI Website Analysis" → "Free Website Diagnostic", "AI powered website intelligence" → "website diagnostic", etc.)
    - `app/(grade)/pathlight/[scanId]/page.tsx` — per-scan-result meta description
    - `app/(grade)/pathlight/[scanId]/ScanStatus.tsx:427` — "with AI vision" replaced with "at the pixel level" (stronger concrete claim than the original)
    - `lib/work-data.ts:62, 81` — Pathlight case study description and heroDescription ("AI platform" → "diagnostic platform"; "AI powered analysis, when properly engineered" → "proper engineering, not template scoring")
  - **Softened (methodology disclosures):**
    - `app/(grade)/pathlight/[scanId]/ScanStatus.tsx:1365` — methodology disclaimer "AI analysis" → "systematic analysis"
    - `lib/siteContent.ts:383` (`ABOUT_STORY.howIBuild`) — "AI is part of my workflow, not a shortcut" line rewritten to "I use the best modern tools to go deeper, move faster, and catch what I'd otherwise miss" (preserves the spirit, drops the trigger word)
- **Replacement vocabulary used (priority order):** "diagnostic" > "analysis" > "automated" / "systematic" / "computational." Avoided "intelligent" (almost as overused as AI).
- **Strategic positioning preserved (kept by design, not oversights):**
  - `app/(grade)/pathlight/[scanId]/ScanStatus.tsx:411` — "When you ask ChatGPT, Gemini, or any chatbot..." (just the word "AI" removed before "chatbot"). This line USES the negative AI association in your favor, positioning Pathlight as the not-generic alternative. Keeping it is strategically correct.
  - `lib/work-data.ts:241, 257, 260, 295, 296, 300, 317` — Soil Depot case study "AI search" references (7 mentions). These are AI search engines as a discovery CHANNEL (ChatGPT, Perplexity), documenting a real lead that came in through them. Market-trend reference, not a self-claim. Keep.
  - `lib/prompts/pathlight-chat.ts:85` — internal LLM system prompt, never user-facing.
  - `lib/prompts/audio-summary.ts:63` — explicit internal instruction NOT to mention AI (already aligned with the new direction).
  - `app/admin/database/page.tsx:31` — admin-only page, internal.
- **SDK code untouched.** `lib/services/claude-analysis.ts`, `lib/services/voice.ts`, `app/(grade)/api/chat/route.ts`, `lib/services/health-status.ts` all import `@anthropic-ai/sdk` or use Anthropic SDK types. Functional code, not user-facing copy. Anthropic stays under the hood; the cards on top no longer mention it.
- **Verification:** `npx tsc --noEmit` clean, `npm run lint` clean, em-dash sweep clean (only pre-existing comment headers), forbidden-email grep clean, post-edit re-grep confirms zero customer-facing AI self-claims remain.

### What landed in the prior code sprint (April 30 late evening, Fix Sprint tier)

- **Fix Sprint pricing tier added at $2,995, 2-week timeline.** Closes the audit's "no Pathlight-to-engagement bridge" gap. Pathlight stays free; Fix Sprint is the paid post-scan engagement that takes the top 3 issues from a Pathlight report and ships the fixes in two weeks, fixed price.
  - **Price reasoning:** $175/hr Joshua-rate × ~14h scope = ~$2,450 hourly equivalent. $2,995 charm-prices just under the $3K SMB self-approve threshold, gives healthy fixed-price margin, premium-position-coherent for a principal-architect studio, and clearly differentiated from $4,500 Starter (which is a full new-build, not a fix engagement).
  - **Detail page:** New `fix-sprint` entry as the first item in `PRICING_DETAILS` (`lib/pricing-data.ts`), giving a full `/pricing/fix-sprint` page with its own hero, 3 sections (What Gets Fixed / How It Works / What You Get at the End), 3 FAQ entries. Auto-generates `Offer` JSON-LD + `BreadcrumbList` schema via `/pricing/[slug]/page.tsx`. Auto-listed in sitemap via `getPricingSlugs()`. CTA goes to `/contact`.
  - **/pricing callout:** New `FIX_SPRINT` export in `lib/siteContent.ts` (re-exported via `lib/constants.ts`) drives a distinct callout section in `app/(marketing)/pricing/PricingContent.tsx` between the hero and the existing "Three Tiers" deep-dive section. ChapterHeader pattern matching the rest of the page, amber accent color (PAGE_ACCENT), "What's Included" feature list with 8 bullets, $2,995 price block, "Start a Fix Sprint" CTA to `/contact`. `id="fix-sprint"` so deep-links work. Visually distinct treatment intentional: Fix Sprint is a different engagement category (fix-what's-broken) from the 3 full-build tiers (Starter / Professional / Enterprise) below it.
  - **Pathlight page closing CTA:** PathlightContent.tsx Section 6 now has a secondary "See the Fix Sprint" link pointing to `/pricing#fix-sprint` alongside the primary "Run Free Scan" CTA. Closes the Pathlight-to-engagement loop.
  - **Project type select:** "Pathlight Fix Sprint" added as the first option in `PROJECT_TYPE_OPTIONS` so contact-form submissions originating from a Fix Sprint inquiry can be tagged.
  - **Build configurator (`/pricing/build`):** Intentionally NOT updated. Fix Sprint is a fix engagement, not a build, and BuildContent.tsx hardcodes only starter/professional/enterprise.
  - **Coherence audit done before commit:** Fixed two cross-file inconsistencies. Price aligned at $2,995 in both PRICING_DETAILS and FIX_SPRINT.price (initially split $2,500/$2,995). Post-launch support aligned at "30 days" everywhere (initially split "14 days" in FIX_SPRINT.features and "30 days" in detail page; harmonized to 30 to match Joshua's "I don't disappear" brand voice and every other tier's support window).

### What landed in the earlier code sprint (April 30 evening, post-audit response)

- **Homepage strategy refactor**: The diagnose-fix-grow model is now the homepage's organizing principle (the audit's central recommendation, accepted).
  - `HERO_CONTENT.subheading` rewritten to state the model explicitly: *"Pathlight scans your website and shows you exactly where it's losing trust, leads, and revenue. I fix the highest-impact issues first. Fixed price. Full ownership. No retainer."* Headline ("Architect The Impossible") unchanged - master-brand identity stays separate from the product-tagline pitch underneath.
  - New `DIAGNOSE_FIX_GROW` data export in `lib/siteContent.ts` (re-exported via `lib/constants.ts`) feeding a new `components/sections/DiagnoseFixGrow.tsx` section: 3-card grid (Diagnose / Fix / Grow) + gradient primary CTA to `/pathlight#scan-form` and secondary "See How I Fix What Pathlight Finds" link to `/services`. Inset highlight + soft cyan/blue glow boxshadow stack for the substantial-not-minimalist look. Section rendered in `app/(marketing)/page.tsx` directly between `TestimonialBand` and `PathlightCTA`.
  - `PATHLIGHT_CTA_CONTENT` rewritten: eyebrow `"Free tool"` -> `"Step 1 / The Diagnostic"`, tagline reframed around quiet lead-loss and fix valuation, button label `"Scan My Website"` -> `"Run Free Scan"`, button href `/pathlight` -> `/pathlight#scan-form` to match the hero primary CTA and skip the marketing fold.
  - `TechStackSection` removed from the homepage render order (still exists as a component, just not surfaced on `/`). The home flow is now Hero -> TestimonialBand -> DiagnoseFixGrow -> PathlightCTA -> ClientLogos -> ServicesSection -> Stats -> Process -> CTASection. Goal: fewer technical stacks visible on the cold-traffic path, more strategy.
  - Homepage metadata rewritten in `app/(marketing)/page.tsx`: title now `"Find Where Your Website Loses Leads. Fix It. | DBJ Technologies"`, description now leads with the Pathlight scan + DBJ fix promise.
- **robots.txt**: Removed `Disallow: /pathlight/` from `app/robots.ts`. Per Google's docs, combining a robots disallow with a `noindex` meta tag prevents the meta from being read (the bot can't crawl the page to see the tag). The Pathlight scan report pages at `/pathlight/[scanId]` already carry `robots: { index: false, follow: false }` in their metadata, which is the correct deindexing signal once crawling is allowed. The marketing page at `/pathlight` was never blocked by the trailing-slash disallow per spec, but removing the line eliminates ambiguity for any crawler that interpreted it loosely.
- **Service slug rename**: 6 developer-jargon slugs renamed to buyer-friendly equivalents in `lib/siteContent.ts` (SERVICES) and `lib/service-data.ts` (SERVICE_DETAILS + relatedSlugs):
  - frontend-architecture -> website-design
  - backend-systems -> business-systems
  - cloud-infrastructure -> hosting
  - interface-engineering -> user-experience
  - ecommerce-platforms -> ecommerce
  - web-performance -> speed-and-search
  Six permanent 301 redirects added to `next.config.mjs` so prior inbound links and crawl equity are preserved. The Footer renders service links from `SERVICES.slice(0, 6).map(s => /services/${s.slug})` so it picks up the new slugs automatically. Sitemap pulls from `getServiceSlugs()`, also auto-updates. No hardcoded slug strings exist outside the two data files (verified via grep).
- **Footer contact**: Added Email + Phone list items above the existing MapPin/address row in `components/layout/Footer.tsx`. Email is `mailto:joshua@dbjtechnologies.com`. Phone displays as `682-DBJ-TECH` (lettered for `\d{3}-\d{3}-\d{4}` scrape resistance), `tel:` link uses the decoded `+16823258324`. Both pull from the existing `SITE.email` / `SITE.phoneDisplay` / `SITE.phoneTel` constants. Now visible on every page (Footer is rendered globally), matching the existing Contact page sidebar pattern.

### Triggering audit context (for the next session)

Joshua received a third-party "triple-checked live audit" of the site on April 30. Reviewed against actual repo state, the audit's strongest claims with verified evidence were: (a) `/pathlight/` in robots.txt looked like an unforced error (partially correct - resolved as above), (b) old developer-jargon service slugs in URLs (correct - resolved as above), (c) phone/email missing from footer (correct - resolved as above). Several other audit claims were either overstated (Pathlight marketing page indexability, hero CTA framing) or out of scope per CLAUDE.md "do not rewrite working sections" (hero headline rewrite, pricing funnel restructure, Pathlight bridge copy across services/pricing, sample report PDF). Those broader strategic items are deferred to Joshua's explicit direction.

### What landed in the prior code sprint (April 30 afternoon)

- **Contact page**: Email + Phone cards added to the silver sidebar above Location and Response Time. Email is `mailto:joshua@dbjtechnologies.com`. Phone displayed as `682-DBJ-TECH` (lettered for `\d{3}-\d{3}-\d{4}` scrape resistance), `tel:` link uses decoded `+16823258324`. Constants live at `SITE.phoneDisplay` / `SITE.phoneTel` in `lib/constants.ts`. This re-introduces a publicly displayed email after the silver scale-back removed it earlier in the day; Joshua's reasoning was that legitimacy and accessibility for warm leads outweigh the spam-curb logic on a low-volume marketing site.
- **Services page**: CapabilityStack mobile fix. Row alignment `items-center` -> `items-start lg:items-center`, tagline `truncate` -> `line-clamp-2 lg:truncate`, trailing `01`-`06` number badge hidden below `sm:`, outer card `p-6 lg:p-8` -> `p-4 sm:p-6 lg:p-8`, per-row padding tightened on mobile. Process / Pricing render fine at the same h1 clamp because their right-column shapes differ; the issue was specific to the CapabilityStack with 6 long service titles wrapping under `items-center`.
- **Pricing page**: CTA + feature-divider horizontal alignment via `lg:min-h-[5rem]` on tier descriptions and `lg:min-h-[7rem]` on price blocks. Professional card retains `lg:-mt-4 lg:mb-4` elevation by design (recommended-tier visual anchor); Joshua confirmed this is intentional, not drift.
- **Work / Canopy detail**: video now occupies the hero, "live" caption removed (Star Auto Canopy install is auth-walled, so "live" was misleading). Project CTA row wraps on narrow viewports.
- **Pathlight**: logo revert reapplied.

### Open questions Joshua needs to resolve

1. **NAP consistency (Dallas vs Royse City)**, escalated to Google directly on 2026-04-30, Joshua awaiting reply. Site brands as "Dallas, TX" (`SITE.address`, contact Location card, CLAUDE.md identity). GBP shows physical address `5073 Co Rd 2656, Royse City, TX 75189`, service area `Hunt County, Texas`, phone `(682) 325-8324`, 5.0 / 2 reviews, profile strength "Looks good!". Google's local algorithm treats the two as different NAP strings, which dilutes local-pack signal. Two clean fixes are still on the table while we wait: (a) hide GBP physical address and broaden service area to "Dallas-Fort Worth Metroplex" (lower-effort, keeps home address private), or (b) widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex". Hold all local-SEO work until Google's response lands.
2. **Pathlight intermittent banner.** "Some analysis steps could not be completed" still triggers occasionally. Traced April 27 to s6 finalize on non-transient Anthropic responses (schema validation failures after one retry, or benchmark research timeouts on cold cache). No mitigation shipped yet.

### Post-deploy verification status (2026-04-30 evening)

- **Footer Email + Phone**: Joshua confirmed working in production. Mailto and tel: handlers fire correctly.
- **Sitemap resubmission**: Joshua resubmitting `https://dbjtechnologies.com/sitemap.xml` in Google Search Console at the close of this session.
- **GBP / NAP issue**: Joshua has opened the Dallas vs Royse City question with Google directly, awaiting Google's reply. No further site-side action until they respond.

### Next recommended task

In ~2 weeks (around 2026-05-14), verify the SEO + slug-rename soak in Google Search Console:
1. Confirm the 6 new service URLs (`/services/website-design`, `/services/business-systems`, `/services/hosting`, `/services/user-experience`, `/services/ecommerce`, `/services/speed-and-search`) are indexed.
2. Confirm the 6 old slugs (`/services/frontend-architecture`, `/services/backend-systems`, `/services/cloud-infrastructure`, `/services/interface-engineering`, `/services/ecommerce-platforms`, `/services/web-performance`) show as redirected (not crawl errors) in the Coverage / Pages report.
3. Confirm `/pathlight` (marketing page) is indexed and `/pathlight/<scanId>` (per-user reports) are not.
4. If Google has replied on the GBP/NAP question by then, execute whichever resolution they recommend.

### Durable lessons from this sprint (worth keeping)

- **Same h1 clamp can render fine on Pricing / Process and broken on Services.** The diagnostic is the right-column shape, not the h1. Process's PhaseLadder uses `items-start` with shorter copy and no trailing badge. Services's CapabilityStack used `items-center` with 6 long service titles and an `01`-`06` trailing badge. Long titles wrapping under `items-center` against a fixed-position trailing badge is the "renders poorly on mobile" signature.
- **NAP consistency is upstream of any local SEO work.** Mismatched city strings (Dallas vs Royse City) dilute local-pack signal regardless of how much on-page schema or keyword work ships later. Resolve the address question first.
- **Public HTML scrape-resistance is one channel only.** Lettered phone (`682-DBJ-TECH`) on the site, numeric phone on validated channels (GBP, Schema.org JSON-LD if added, email signature). Both reconcile to the same E.164 (`+16823258324`) so Google sees one number for NAP.
- **Pricing-tier CTA misalignment is solved with `lg:min-h-[5rem]` + `lg:min-h-[7rem]` row floors.** The Professional `lg:-mt-4` elevation is a deliberate UI pattern (recommended-tier anchor), not a bug.
