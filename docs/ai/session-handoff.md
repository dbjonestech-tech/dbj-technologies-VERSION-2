# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`).

## Last Session: April 27, 2026 (evening) -- Resend bounce/complaint webhook (Feature #11)

### What shipped

The biggest-win item from `docs/ai/pathlight-feature-feasibility.md`
landed: a verified Resend webhook receiver that closes the email
deliverability blind spot (bounced and spam-complaint events were
silently invisible until now, with no auto-suppression and no alert
when bounce rate climbed toward Resend's 5% suspension threshold).

- **Migration `lib/db/migrations/006_email_webhook_events.sql`.** Extends
  the `email_events.status` CHECK constraint to include `delivered`,
  `delivery_delayed`, `bounced`, `complained` alongside the existing
  `sent`/`skipped`/`failed`. Adds a partial unique index
  `uniq_email_event_resend_id_status ON email_events (resend_id, status)
  WHERE resend_id IS NOT NULL` for idempotent ingestion (Svix may
  redeliver the same event under network jitter or our own 5xx, and the
  same email progresses through several statuses naturally so the
  uniqueness must be on the pair, not the id alone). `lib/db/schema.sql`
  mirrored to match for fresh-DB setup.
- **`lib/services/email.ts`.** Outgoing sends now carry `tags: [{ name:
  "scan_id", value: scanId }, { name: "email_type", value: emailType }]`
  so every webhook event correlates back to a scan even when the
  resend_id lookup misses. New exported `handleResendWebhookEvent`
  validates the payload with Zod, maps event type to a status, looks
  up the scan/email_type from tags first and falls back to a
  `resend_id` lookup against the original `sent` row, inserts the new
  row with `ON CONFLICT (resend_id, status) DO NOTHING`, and on
  bounced/complained calls `markUnsubscribed(recipient)` (which writes
  to both `leads.unsubscribed_at` and `email_unsubscribes`). Returns
  `"ingested" | "ignored" | "uncorrelated"` so the route handler can
  surface the outcome. New private `checkBounceRateAlert` runs after
  every bounce: if 7-day window has at least 20 sends and bounce rate
  >=2%, fires `Sentry.captureMessage` at level `warning` (or `error`
  at >=5%, the actual Resend suspension threshold).
- **`app/(grade)/api/webhooks/resend/route.ts`.** New POST handler
  exposes `/api/webhooks/resend`. Checks `RESEND_WEBHOOK_SECRET` (returns
  503 if unset), reads `svix-id` / `svix-timestamp` / `svix-signature`
  headers (400 if missing), reads the raw body via `request.text()`
  (verification must run on the exact bytes that arrived, not on a
  reparsed JSON), and verifies via `svix`'s `Webhook.verify`. Bad
  signature returns 401. Handler errors return 200 so Resend does NOT
  retry-storm us (errors already captured to Sentry). GET returns 405
  with an `allow: POST` header.
- **`/api/` is already disallowed in `robots.ts`** so the webhook URL
  is not crawlable.

### Manual deploy steps (NOT automated)

These need to happen in this order after the next deploy fans out:

1. Apply migration 006 to prod Neon: `npx tsx lib/db/setup.ts`. The
   script picks up every numbered migration in
   `lib/db/migrations/` in order, idempotent. (Migration 005 from a
   prior session is also still pending per the prior handoff; the
   script handles both at once.)
2. In the Resend dashboard, add a webhook endpoint pointing at
   `https://dbjtechnologies.com/api/webhooks/resend`. Subscribe at
   minimum to `email.delivered`, `email.delivery_delayed`,
   `email.bounced`, and `email.complained`.
3. Copy the signing secret Resend gives you and set it in Vercel as
   `RESEND_WEBHOOK_SECRET` (Production + Preview). NOT added to
   `.env.example` per the project rule that forbids modifying that
   file in implementation prompts -- noted here for the user to add
   manually if desired.
4. Trigger a known-bad email (a `bounce@simulator.amazonses.com` or
   similar Resend test address works well) to confirm the row lands
   in `email_events` with `status = 'bounced'` and the address shows
   up in `email_unsubscribes`.

### Verification

- `npx tsc --noEmit` -- clean (exit 0)
- `npm run lint` -- clean
- Em-dash check on all four new/touched files (`route.ts`, `email.ts`,
  `schema.sql`, `006_*.sql`) -- 0 em-dashes total.
- `svix@1.90.0` and `resend@^6.12.2` already installed (no `npm install`
  required).

### Files changed (3 modified, 2 created)

- `lib/db/migrations/006_email_webhook_events.sql` (NEW)
- `lib/db/schema.sql` (mirror of 006: enum + partial unique index)
- `lib/services/email.ts` (Tag in dispatch + webhook handler suite)
- `app/(grade)/api/webhooks/resend/route.ts` (NEW route handler)
- `docs/ai/backlog.md`, `docs/ai/session-handoff.md`, `docs/ai/current-state.md`
  (status updates)

### Commit + push status

Committed at `aac418a` and pushed to `origin main`. 7 files (5 modified
+ 2 new). Working tree carries one unrelated modification at
`public/templates/hvac-contractor.html` from a prior local edit; left
alone, not staged. The standalone snapshot pattern (vs amend +
force-with-lease) applies again because main is force-push protected.

## Previous Session: April 27, 2026 (afternoon) -- Pathlight lockdown + audit + feasibility

### What shipped (Phase 1: Lockdown)

Goal: strip every proprietary internal from public surfaces (API responses,
chat prompt, landing copy, work case study, emails, Inngest step IDs, source
maps). All changes verified via tsc + lint.

- **API redaction (`app/(grade)/api/scan/[scanId]/route.ts`).** Stopped
  returning `businessScale` and `screenshotHealth` enum values to the
  browser. Replaced with computed `isOutOfScope: boolean`,
  `outOfScopeLabel: string | null`, and `screenshotNotice: string | null`
  (the rendered user-facing message string). Stripped `industryBenchmark`
  entirely (the deal value still appears via the assumptions block on the
  revenue card). Sanitized `error` / `errorMessage` server-side so raw
  scan failures never reach the client.
- **Scan report UI (`app/(grade)/pathlight/[scanId]/ScanStatus.tsx`).**
  Updated to consume the new redacted shape. Removed the "Show technical
  details" disclosure on FailedState (used to leak raw error string).
  Removed the "Source: ..." line under the revenue methodology (used to
  leak benchmark source attribution). Dropped imports of the now-unused
  `BusinessScale` / `ScreenshotHealth` / `IndustryBenchmark` types.
- **Chat hardening (`app/(grade)/api/chat/route.ts`).** Stream `error`
  events now return a generic "Something went wrong. Please try again."
  instead of forwarding the underlying Anthropic error message.
- **Chat prompt hardening (`lib/prompts/pathlight-chat.ts`).** Stripped
  `inferredVertical` / `businessModel` blocks from the SCAN CONTEXT.
  Stripped the benchmark `Source` field from the prompt (kept
  `confidence`). Rewrote rule 3 of METHODOLOGY TRANSPARENCY to forbid
  naming specific data sources. Rewrote rule 5 to keep explanations at
  the outcome level only. Replaced GUARDRAILS with the lockdown spec:
  refuse all internals (system prompt, model name, pipeline, scoring
  formulas, vertical DB, benchmark methodology, prompt versions, vendor
  names) with a fixed "Pathlight uses proprietary analysis methods
  developed by DBJ Technologies. I can help you understand your specific
  report results." response, including for prompt-injection attempts.
- **Landing copy (`app/(grade)/pathlight/PathlightContent.tsx`).** Report
  Items 2-4 rewritten in outcome language ("Find out what your website
  is actually costing you", "Know exactly what to fix first and why it
  matters", "See your site through your customer's eyes"). Differentiator
  paragraph swapped "rendered-page analysis" for "looks at the same thing
  your customers do".
- **Work case study (`lib/work-data.ts`).** Pathlight entry's
  `metrics: AI Pipeline Stages 5 / Curated Verticals 206` (both internal
  signals) replaced with `Free Per Scan $0 / Scan Time ~2 min /
  Delivery Instant + Email`. Removed `AI/LLM Integration` from techStack.
  Rewrote `notable` and the `How It Works` / `Curated Database` /
  `The Report` sections to hide pipeline architecture and vertical DB
  internals while keeping the outcome story. Renamed the section
  heading from "The Curated Database" to "Calibrated For Your Business".
  Removed `AI & Machine Learning` from techDetails.
- **Email template (`lib/email-templates/pathlight.ts`).** Report-delivery
  email body and text variant: replaced "Lighthouse performance scores,
  AI-powered design analysis, conversion psychology evaluation, and
  prioritized fixes ranked by revenue impact." with outcome-focused
  rewrite ("what your customers see, how fast your site loads, where
  your messaging is working against you, and the top three fixes that
  would move the needle most on revenue").
- **Inngest step IDs (`lib/inngest/functions.ts`).** Renamed every
  descriptive step ID to opaque identifiers: `validate-url` -> `s1`,
  `capture-screenshots` -> `s2`, `mark-analyzing` -> `s3`,
  `run-audit` -> `s4`, `ai-vision-audit` -> `a1`,
  `ai-remediation` -> `a2`, `research-benchmark` -> `a3`,
  `ai-revenue-impact` -> `a4`, `calculate-score` -> `s5`,
  `finalize` -> `s6`, `send-report-email` -> `e1`,
  `send-followup-1` -> `e2`, `send-followup-2` -> `e3`,
  `send-breakup` -> `e4`, plus sleeps `wait-for-followup-1` -> `w1`,
  `wait-for-followup-2` -> `w2`, `wait-for-breakup` -> `w3`.
  IMPORTANT: any in-flight Inngest jobs at the moment this deploys will
  break (steps are durable; the new IDs cannot resume the old state).
  In practice this only affects the 48h/5d/8d follow-up steps for scans
  in the last 8 days. The function id `pathlight-scan-requested` was
  intentionally kept (rebinding it would require re-registering the
  webhook). Internal log prefixes (`[research-benchmark]`, `[run-audit]`)
  were left as-is since they only appear in server-side console output,
  never in any client response or browser bundle.
- **Source maps (`next.config.mjs`).** Added explicit
  `productionBrowserSourceMaps: false`. Sentry continues to upload its
  own server-side maps via `withSentryConfig` for stack traces; nothing
  the browser can fetch.
- **Robots / print stylesheet.** Already secure. `robots.ts` already
  blocks `/api/`, `/monitoring`, `/pathlight/`, `/templates/`. Print
  stylesheet hides the chat panel + trigger and renders the visible
  report content; nothing screen-hidden becomes print-visible.

### What was already done (Phase 2: Verify)

- **2A industry_benchmark column.** Migration `004_industry_benchmark.sql`
  exists. `getFullScanReport` reads from it. Whether the migration has
  been applied to prod Neon is unknown from inside the repo; the
  `lib/db/setup.ts` script picks up every numbered .sql in
  `lib/db/migrations/` in order, idempotent. Same status as migration
  005 -- still flagged in the prior session-handoff as "needs apply".
- **2B rate limiting.** Enforced today.
  `app/(grade)/api/scan/route.ts:71-85` runs `emailLimiter`
  (3 scans / 24h sliding window) and `ipLimiter` (5 / 24h), returning
  HTTP 429 with a friendly message when exceeded. Upstash-backed.
- **2C input validation.** `lib/services/url.ts` rejects malformed URLs,
  unsupported protocols, embedded credentials, sensitive query
  parameters (`token`, `auth`, `api_key`, `jwt`, `session`, etc.),
  private/local IP ranges, and unreachable hostnames. NOT rejected
  today: social-media URLs, Google Docs/Drive/Sheets links, parked-domain
  patterns, file:// and data:// schemes (file:// is blocked implicitly
  by ALLOWED_PROTOCOLS but not with a friendly message). Tracked as a
  v2 task in backlog.
- **2D duplicate PSI.** Single PSI service at `lib/services/pagespeed.ts`.
  No `pagespeed-extra.ts` or duplicate fetch.
- **2E screenshot timing.** `captureScreenshot` waits for `networkidle0`
  on goto, then attempts to dismiss cookie banners (regex-matched click
  on accept/agree buttons), waits 600ms, awaits `document.fonts.ready`,
  then a 2500ms settle window before screenshot. Total ~3s of
  post-navigation wait.
- **2F revenue display.** Methodology disclaimer present at
  `ScanStatus.tsx`'s RevenueImpactBlock: "Pathlight uses AI analysis and
  conservative revenue modeling. Estimates are directional only and not
  a substitute for professional consultation." The dollar figure is a
  single rounded number, not a confidence band -- still tracked in
  backlog as a v2 idea.
- **2G scan progress (diagnostic only).** The polling endpoint returns
  generic status enum (`pending` / `scanning` / `analyzing` / etc.) only.
  The phase labels rendered to the user (`Capturing screenshots...`,
  `Analyzing design and positioning...`) are a CLIENT-SIDE timer in
  `ScanStatus.tsx` LoadingState that cycles through phases on a 4-second
  loop -- they don't reflect the real step. This is intentional
  obfuscation today, just worth knowing.
- **2H report URL auth (diagnostic only).** scanIds are
  `gen_random_uuid()` UUIDv4 (Postgres default). No auth on
  `/pathlight/[scanId]`. Risk: anyone with the UUID can view the
  report. Defended in part by the `robots.ts` disallow on
  `/pathlight/`. Not implementing auth this session.
- **2I CONTACT_EMAIL.** No `dbjonestech@gmail.com` in production code;
  only in two informational refs (`docs/ai/index.md`,
  `docs/ai/backlog.md`) noting the legacy address. Clean.
- **2J PathlightCTA copy.** Current homepage tagline ("Not sure your
  website is working for you? Pathlight scans your site and shows you
  where you may be losing trust, leads, and revenue. Free. Results in
  minutes.") is natural and outcome-focused. Left unchanged.
- **2K partial banner root cause (diagnostic only).** The "Some analysis
  steps could not be completed" notice in `ScanStatus.tsx` PartialNotice
  is rendered when `report.status === "partial"`. That status is set by
  the `s6` (finalize) step in `lib/inngest/functions.ts` when audit and
  screenshots succeeded but ANY of `visionStep` / `remediationStep` /
  `revenueStep` / `scoreStep` failed. Since `runRevenueImpact` is gated
  on `remediationStep.ok`, a single failed remediation cascades to a
  failed revenue step, which alone is enough to mark the scan partial.
  callWithRetry handles transient errors; the most likely root cause
  for the remaining intermittent occurrences is non-transient Anthropic
  responses (schema validation failures after one retry, or timeouts on
  cold cache benchmark research). Recommend instrumenting:
  in the `s6` finalize step, log a Sentry breadcrumb naming WHICH
  sub-steps failed so the field error distribution becomes visible.
  Not implemented this session.
- **2L Resend bounce webhook.** No webhook endpoint exists today.
  Bounced emails are silent. Tracked in backlog (Priority 3) and
  Phase 3 feasibility (feature 11).
- **2M pipeline 420s ceiling.** Typical case (no retries) sums to
  ~335s of step time, well under 420s. Worst case (every Anthropic
  call hitting full 90s timeout x 3 retry chain) sums to roughly
  1100s+, which would not finish within the ceiling. Recommend
  either raising the ceiling or moving the 4 Claude calls behind a
  post-finalize deferred event. Tracked in backlog.

### Phase 3: Feasibility doc

New file `docs/ai/pathlight-feature-feasibility.md` (one full pass over
all 12 candidate features with effort, monthly cost @100 scans, complexity,
dependencies, and a priority-ordered summary table at the top). Top-of-list
quick wins: bounce webhook (#11), cost dashboard (#12), QR codes (#8),
PDF download (#10).

### Files changed (9 modified, 1 created)

- `app/(grade)/api/chat/route.ts` (sanitized stream error responses)
- `app/(grade)/api/scan/[scanId]/route.ts` (redacted client-safe shape)
- `app/(grade)/pathlight/PathlightContent.tsx` (outcome-focused report items + differentiator)
- `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` (consumes redacted shape, removed technical-error disclosure, removed benchmark source line)
- `lib/email-templates/pathlight.ts` (report-delivery email outcome rewrite)
- `lib/inngest/functions.ts` (opaque step IDs s1/s2/s3/s4/a1/a2/a3/a4/s5/s6/e1/e2/e3/e4/w1/w2/w3)
- `lib/prompts/pathlight-chat.ts` (lockdown guardrails, removed source/business-model leakage)
- `lib/work-data.ts` (Pathlight case study redacted: metrics, techStack, techDetails, body sections)
- `next.config.mjs` (explicit productionBrowserSourceMaps: false)
- `docs/ai/pathlight-feature-feasibility.md` (new, Phase 3 feasibility analysis)

Plus this update to `docs/ai/session-handoff.md` and an update to
`docs/ai/backlog.md` reflecting Phase 2 findings.

### Verification

- `npx tsc --noEmit` -- clean (exit 0)
- `npm run lint` -- clean (no warnings or errors)
- Em-dash check on every changed file: 0 NEW em-dashes added.
  Pre-existing em-dashes left in 3 files (server-side log prefix in
  `inngest/functions.ts:263`, score-formatting separator in
  `pathlight-chat.ts:33+46`, code comment in `ScanStatus.tsx:92`)
  -- all internal/server, none in user-facing copy.
- `dbjonestech@gmail.com` check in production code: clean.

### Commit + push status

Committed at `e7f222d` and pushed to `origin main`. Working tree clean
after this handoff amend. 13 files in the commit (12 modified + 1 new
feasibility doc). The amend re-pushed via --force-with-lease.

## Previous Session: April 26-27, 2026

### Themes Shipped

- **upscale-restaurant vertical deep dive** (this commit). Second of 8 vertical-expertise deep dives at `docs/blueprints/upscale-restaurant.md`, companion to the restaurant template Pass 1 revision in this same commit. 798 words across four sections: how diners use a restaurant website (small-scope, high-stakes decision; what converts vs what loses the table); what most restaurant sites get wrong (PDF menus, single OpenTable link, bar program ignored despite ~40% of revenue, private dining buried, missing gift cards / pantry / preferred guest list / named GM); what a real site needs (split nav with Reserve as sticky CTA, on-page dated menu, separately branded bar with named bartender, real pantry shelf with prices, two-room private dining with named GM and per-guest pricing, dated recognition strip, day-by-day hours, preferred guest list, mobile tap-to-call); see-the-proof linking to `/templates/restaurant.html`. Voice: first-person "I", zero em dashes, zero we/our, zero fictional business name in body. Headline "What Upscale Restaurants Need Online", summary "How diners actually choose where to book, what most restaurant sites miss, and the architecture that fills tables."
- **restaurant Pass 1 revision** (this commit). Pass 1 of restaurant template based on competitive analysis against Perry's Steakhouse & Grille (Park District, Dallas) as the DFW reality reference. Goal: keep the existing editorial design language (espresso/burgundy/amber palette, Fraunces + Nunito Sans, ornament glyphs, cinematic letterbox hero, printed-menu CSS grid) intact and add the content infrastructure real upscale restaurants actually monetize.
  - **Section count 9 → 13.** Five new sections inserted; one rebranded; nav restructured; footer expanded.
  - **NEW: PROMO BAR** (espresso-deep, above sticky nav). Top-most strip with Mother's Day Brunch promo + Reserve + Gift Cards links. Not sticky; scrolls away while nav stays sticky.
  - **NAV RESTRUCTURE.** Added Bar, Pantry, Gift Cards. Reservations converted from text link to high-contrast burgundy CTA button (`Reserve`) inside `.nav-right .nav-cta`. Sticky nav preserved; Reserve button is dominant action across all scroll.
  - **REBRANDED: THE GARNET BAR** (replacing the old `.bar-strip` atmospheric band). Now a full section anchored at `#bar` with 2-column layout: left has the brand "The Garnet®" with Bar Director **Henry Ramos** named, atmospheric copy, and meta block (hours: open until 11pm Tue-Thu, until midnight Fri-Sat). Right has a Signature Cocktails card on paper-textured background: The Garnet Negroni $18, Smoked Mezcal Paloma $16, Aperitivo of the Week $14. Sup `<sup>®</sup>` after wordmark to signal separately registered concept (Perry's Bar 79® pattern).
  - **NEW: PANTRY / ONLINE MARKET** (paper background, anchored at `#pantry`). Opens with a Gift Cards strip anchored at `#gift-cards` (From $50 in any denomination, Buy a Gift Card CTA). Below: 4-card pantry grid with hover lift: Garnet Negroni Kit $48, House Granola $14, Chef Cole's Harissa $12, The Holiday Box $85. Each card has photo + name + description + price + Add to Cart link. Footer: "Looking for the cookbook? It is back in stock."
  - **EXPANDED: PRIVATE DINING.** Now a 2-room offering: The Vine Room (24 guests, $95/guest, three courses) and The Chef's Counter (8 guests, $185/guest, six-course tasting by Chef Cole personally). Room cards on espresso-soft background with amber accents. Below: named **Catherine Dao, General Manager** with personal commitment quote ("Every event is planned by me personally... I answer every inquiry within four business hours"). Meta row links: Dress Code Policy, Sample Menus (PDF), `events@emberandvine.com`, dedicated phone extension. CTA: "Inquire About Private Dining".
  - **CONVERTED: trust line → AWARDS strip.** Single trust-line at bottom of Press section replaced with proper dated 2-col grid: D Magazine 2025 (Best New Restaurant), Eater Dallas 2025 (38 Essential), OpenTable 2025 (Diners' Choice), Texas Monthly 2025 (Where to Eat Now), StarChefs 2024 (Rising Star, Chef Marcus Cole), Wine Spectator 2024 (Award of Excellence). Below: Google star strip (★★★★★ 4.8 on Google, based on 380+ guest reviews).
  - **EXPANDED: HOURS table.** Single-line meta in Reservation CTA replaced with day-by-day formatting: Tue-Thu Dinner 5pm-10pm + Bar until 11pm; Fri-Sat Dinner 5pm-11pm + Bar until midnight; Sunday Brunch 10am-2pm; Monday closed for service / private events only.
  - **NEW: PREFERRED GUEST LIST** (espresso-deep slim band before footer). Email capture with amber-bordered input + amber Submit button (HTML form, action="#preferred-guest" GET, no JS). Italic privacy line: "One thoughtful note a month, never shared. Unsubscribe in one click."
  - **FOOTER ENHANCED.** Hours line updated for Sunday brunch + Monday closed. Instagram social handle added. New rule + footer-meta line in italic amber: "Catherine Dao, General Manager · Texas Restaurant Association Member". Bottom strip now includes Accessibility + Privacy links alongside Website by DBJ Technologies.
  - **QA.** Zero em dashes, zero `<script>` tags, zero inline JS handlers (form uses standard HTML GET to self-anchor). HTML balance: 10 sections, 127 divs, 6 articles, 2 asides, 1 form. All 6 referenced images exist on disk (~2.7 MB). All 8 nav anchors resolve to real section IDs. Mobile breakpoints added for promo-bar, pantry-grid (4→2→1), gift-cards (3-col→stacked), rooms-grid (2→1), awards-list (2→1), hours-row, preferred-form. tsc + eslint clean.
  - **Known gaps (deferred to Pass 3 photography sweep).** Pantry items reuse existing restaurant-dish/bar/interior images; product photography (against linen, top-down) is the upgrade path. Bar background reuses the bartender hero photo; either rotate or accept the visual rhyme as intentional.
- **luxury-home-builder vertical deep dive** (4ee9171). New `docs/blueprints/luxury-home-builder.md` — first of 8 vertical-expertise deep dives that will populate the Work page once all 8 templates have been Pass-1 revised. 675 words across four sections: how custom home buyers use a builder website over a 6-18 month commission cycle, what most DFW builder sites get wrong (rendering-only heroes, missing Communities surface, no inventory, buried recognition, no journal), what a real builder site needs (nav without Get-a-Quote, Galleries + Communities + Available Homes + Studio + Journal + Contact, named principal with personal letter, TRCC + AIA + NARI compliance, direct contact path with two-business-day commitment), and a final "See the proof" section linking to `/templates/luxury-builders.html`. Frontmatter includes title/slug/template/headline/summary so future Work page integration can render cards directly. New convention: `docs/blueprints/{vertical-slug}.md` is content source; rendering infrastructure follows once all 8 exist. Voice: first-person "I", zero em dashes, zero we/our, zero fictional business name in body (template path only). Spec acceptance: 600-800 words, exactly 4 ## sections, all field/voice/em-dash checks green.
- **luxury-builders Pass 1 revision** (bc40c1a). Pass 1 of an 8-template content-infrastructure sweep based on competitive analysis against real DFW reference sites (Robert Elliott Custom Homes for builders). Goal: keep the existing editorial design language (warm-white + sage, Cormorant Garamond + DM Sans, drop caps, hairline rules, ledger pattern) intact and ADD the content surfaces real premium DFW builders expose. User directive: do each template separately, masterfully, and wait for explicit progression.
  - **Section count 9 → 13.** Three new sections inserted; one renamed; nav restructured; footer expanded.
  - **NEW: COMMUNITIES section** (warm-white, after Principal). 2x2 grid of named DFW neighborhoods (Highland Park, Preston Hollow, Volk Estates, Bluffview), each card uses the Robert Elliott overlay-panel pattern: full-bleed photo with `linear-gradient(180deg, transparent 55%, rgba(26,26,26,0.18) 100%)` foot shadow, plus a semi-opaque white panel (rgba 0.96) with 1px sage-pale border at bottom-left containing eyebrow + serif uppercase community name + 32px sage hairline + meta line about Ashworth & Foster's history in that neighborhood. Footer line `If you have a lot in mind, we are happy to walk it with you →`.
  - **NEW: AVAILABLE HOMES & LOTS section** (linen, after Galleries). 3-card inventory grid: spec home under construction (4321 Beverly Drive, Highland Park, 7,200 sf, Wilson Fuqua architect, Status: Under Construction · Spring 2026), spec coming Q3 2026 (5215 Park Lane, Preston Hollow, 9,800 sf, Stocker Hoesterey Montenegro, Status: Coming Q3 2026), available lot (3200 Drexel Drive, Highland Park, 0.42 acres, Status: Lot Available). Status indicator system uses three glyph variants: filled sage dot for under-construction, outlined sage dot for coming-soon, rotated 7px sage square for lot. Each card has neighborhood + sqft + acres in a tabular-numerals area row, descriptive paragraph, named-architect line in italic Cormorant, and `Inquire →` link with sage underline that darkens on hover. Footer microcopy commits to "answered personally by William or Daniel within two business days."
  - **NEW: RECOGNITION section** (off-white, between Studio and Testimonials). Publication marks strip with 6 publication wordmarks set typographically (no logos): Architectural Digest, Veranda, Luxe Interiors, D Home, Texas Architect, PaperCity. Mix of Cormorant italic 1.45rem and DM Sans small-caps 0.92rem to break visual monotony. Horizontal rule below divides into a Recent Honors 2-col grid: D Home Best Builders 2025 (Custom Residential), AIA Dallas Honor Award 2024 (Lakeside Residence with Robbie Fusch), NARI Contractor of the Year 2024 (Whole-Home Renovation), D Home Best Builders 2023 (Renovations). Honor years rendered in 1.4rem Cormorant 500 sage as visual anchors.
  - **NEW: JOURNAL section** (warm-white, between Testimonials and Process). 3 article preview cards with sage 1px top-rule (matches Studio card treatment for visual rhyme), date + category meta row, serif 1.55rem Cormorant titles, ~3-sentence excerpts in editorial voice. Articles: "On Cabinet Hardware, and Why It Matters More Than the Tile" (Mar 2026, Notes), "A Visit to a Forty-Year-Old Park Cities Home" (Feb 2026, A Site Visit), "When the Architect, the Builder, and the Owner Disagree" (Dec 2025, Practice). Each card has `Continue reading →` link; section foot has `Read the full journal →`.
  - **RENAMED: Portfolio → GALLERIES.** Section ID `#portfolio` → `#galleries`. Header rewritten ("Documented Projects, Organized by Residence."). Ledger footer link rewritten ("Open the full catalogue →"). Project image row converted to anchor-wrapped figures with hover state (`transform: translateY(-4px)` + `filter: brightness(0.97)` on img) and `View gallery →` microcopy added to the figcaption flexbox row.
  - **NAV RESTRUCTURE.** Removed the "Begin a Project" CTA button entirely from the nav row. The nav-row grid simplified from `1fr auto 1fr` 3-column to `flex justify-content: center`. Nav links reordered into a customer-journey funnel: Galleries → Communities → Available Homes → Studio → Journal → Contact (was Portfolio → Process → Studio → Journal → Contact + CTA). Added a sage-outlined circular monogram ("A" in italic Cormorant 1.2rem) inline-flex with the wordmark, 38px desktop / 32px mobile, gap 0.85rem. Wordmark itself unchanged.
  - **FOOTER ENHANCEMENT.** Three columns now have explicit subheads (Visit, Reach) using DM Sans small-caps in sage. Brand column adds an accreditation line: "AIA Dallas Member · NARI Member / Texas Residential Construction License #45821". Visit column adds field-visit availability ("Saturday mornings by arrangement") in italic warm-gray-light. New CSS classes: `.footer-subhead`, `.footer-affil`, `.footer-hours`.
  - **OTHER.** Hero CTA button text aligned with renamed section ("View Recent Galleries"). Section background rhythm preserved across all 13 sections (no two adjacent sections share a background): off → warm → off → linen → warm → off → warm → off → linen → warm → off → warm.
  - **QA.** Zero em dashes. Zero `<script>` tags. All 13 `<section>` open/close balanced. All 113 `<div>` balanced. All 13 `<article>` balanced. All 6 referenced images exist on disk (~1.8 MB total, all under `public/templates/images/`). All 6 nav `href="#..."` anchors resolve to real section IDs. Mobile breakpoints added at 960px (inventory-grid 3→2 col) and 768px (everything 1-col, smaller monogram, tightened paddings on every new component).
  - **Known gap (deferred to Pass 3 photography sweep).** COMMUNITIES and AVAILABLE HOMES reuse the existing 5 luxury-builders images rather than neighborhood-specific or address-specific photography. Structural pattern is locked; real photography sourcing happens across all 8 templates in a later pass.
  - **The other 7 templates remain at their c8f8b62 state.** User reviews each revised template before directing the next one.
- **Hero skeleton uniqueness across all 8 templates** (c8f8b62). Three template heroes shared structural skeletons with other templates: financial-advisor mirrored pi-law (55/45 split, person bleeding right), and both real-estate and restaurant mirrored hvac (full-bleed photo + dark overlay + text overlaid). Strip color, fonts, and images and the wireframes were near-identical. Fixed by rebuilding ONLY the hero on each of the 3 affected files; sections below the hero untouched on all 3, and the other 5 templates touched zero bytes (`git diff --stat` confirms). New hero skeletons: financial-advisor "stacked portrait reveal" (text-only hero with charcoal pinstripe, framed advisor portrait drops below the hero band into a parchment section, `margin-top: -120px` overlapping upward, name + title centered as small caption, portrait-over-the-mantle institutional feel); real-estate "contained gallery frame" (centered text block above, then a 70%-width 45vh photo presented inside a 1px copper border with dark space surrounding all four edges, gallery wall presentation, not wallpaper); restaurant "cinematic letterbox" (top espresso bar 18vh with the three-✦ amber ornament, then a 55vh horizontal photo band with dark overlay + centered text, then a bottom espresso bar 18vh with the gold rule + hours line, film-frame aspect-ratio constraint, photo does not fill viewport height). All 8 hero skeletons now genuinely distinct: pi-law (split, person right edge), builders (photo right behind floating left card), dental (50/50 split, person right at 85vh), med-spa (editorial whitespace, no hero photo), hvac (full-bleed person + dark overlay + text left), real-estate (centered text above contained gallery frame in dark space), financial (stacked text + framed portrait overlapping below), restaurant (cinematic letterbox between espresso bars). Verified zero em dashes, zero script tags, zero copy changes (financial's portrait name + title caption was explicitly required by the brief; real-estate's gallery frame is photo-only with no caption; restaurant's content reused existing copy verbatim).
- **Hero photo fixes for builders + real-estate** (9e5c1cc). The previous photo-first rebuild left both templates' heroes as CSS-only gradients while the other six templates (PI Law, Dental, Med Spa, HVAC, Real Estate's first attempt, Financial, Restaurant) all had photographic heroes. The builders and real-estate heroes therefore read as "missing image" next to the others. Fix re-wired the existing `images/luxury-builders-hero.jpg` (luxury home exterior) and `images/real-estate-hero.jpg` (luxury home interior) directly into both heroes via stacked `background:` layers and added a single `::before` overlay per file: builders uses a horizontal warm-white gradient (0.97 left to 0.05 right) so the white content card sits on a fully solid panel and the home photo shows through on the right; real-estate uses a 135deg dark gradient (0.88 top-left to 0.48 bottom-right) so the ivory copy stays crisp on the left while the warm interior shows through on the right. Builders `.hero-rule` got a 1px white halo via `box-shadow: 0 0 0 1px rgba(255,255,255,0.18)` to stay visible against the photo; `.hero-card` gained a deeper drop shadow (`0 12px 40px rgba(26,26,26,0.10)`) and a slightly more opaque background (0.96) for legibility. Z-index hierarchy explicit: `::before` (auto, paints after bg) → `.hero-rule` z-index 2 → `.hero-card` z-index 3. Other six templates verified untouched (`git diff --stat` reports zero changes on all six). Both files clean: zero em dashes, zero script tags, hero photo URL present.
- **Photo-first rebuild of all 8 portfolio templates** (752a626). Every template's nav, hero, and at least one custom moment rebuilt from scratch so PEOPLE and PHOTOGRAPHY dominate. 11 generated portraits prepared in `public/templates/images/people/` (sparkle watermarks cropped via Pillow, PNG to JPG at q85, max 1800px long edge, 11 files at 2.6 MB total). Eight parallel rebuild agents then took each template's existing copy/colors/fonts as input, threw away the old layout structure, and emitted a unique nav + hero + custom moment per template. Distinction guarantees enforced: no two templates share a nav structure, no two share a hero structure. The signatures:
  - `pi-law.html` (1274 lines): two-row nav with phone left + Free Consult right; 55/45 hero split with male attorney bleeding to the right viewport edge; female attorney portrait in Why Bauder using `margin-bottom:-60px` to overlap testimonials.
  - `luxury-builders.html` (1100 lines): centered wordmark + tagline above flanking links + right CTA; full-bleed warm-twilight CSS gradient hero with semi-transparent white card on left; "Meet the Principal" section with photo `margin-top:-120px` overlapping the dark stats band.
  - `dental-practice.html` (1080 lines): logo lockup + centered links + dual right CTAs; 50/50 photo-forward split with dentist on right at 85vh; full-bleed image break between Services and Timeline carrying the Velasquez family quote.
  - `med-spa.html` (1113 lines): centered split nav with 3 flanking links each side and extreme `0.32em` tracking on REVERIE; left-aligned editorial blush hero with absolute Bodoni "01" numeral; floating pull-quote card with `-80px / -80px` overlap between physician spread and treatments.
  - `hvac-contractor.html` (1094 lines): orange emergency strip ABOVE nav with GIANT raw orange phone right (no button); full-bleed technician photo behind steel overlay + blueprint dot grid; featured horizontal review card with technician portrait and "Lead Technician · 12 yrs" caption.
  - `real-estate.html` (877 lines): minimal LEFT wordmark + RIGHT links + full-width copper rule below; full-bleed dark CSS gradient hero evoking a luxury foyer (no photo); middle property card featured with `scale(1.06) + margin-top:-30px` + dark gradient bg breaking the warm-ivory row.
  - `financial-advisor.html` (1301 lines): stacked institutional nav with banker pinstripe; 55/45 hero with male advisor at mahogany desk on right at 88vh + AUM stats below CTAs; massive `$540,000,000` AUM lockup at `clamp(5rem, 12vw, 9rem)` as visual anchor.
  - `restaurant.html` (1323 lines): centered split nav with Menu/Wine | wordmark | Private Events/Reservations (no CTA); full-bleed bartender photo hero with 0.62-0.72 espresso overlay; three custom moments (chef magazine spread, paper-textured tomato-salad menu intermission, full-bleed bar strip).
  All 8 verified: zero em dashes, zero `<script>` tags, single Google Fonts `<link>` with `&display=swap`, robots noindex + viewport meta, DBJ footer credit linked, every img has descriptive alt text and explicit width/height. The financial-advisor-2 portrait had a London skyline behind her; cropping via `aspect-ratio: 4/5; overflow:hidden; object-position: center 30%;` clips the skyline so only her face/shoulders/blurred office show. Total page weight ~2 MB to 3 MB per template. Mockups still NOT wired into `lib/work-data.ts`; screenshot batch pending the next session.
- **Real photography integrated across all 8 portfolio templates** (497a6d1). Eight parallel agents downloaded curated Unsplash photography to `public/templates/images/` and integrated it into each template without altering any existing copy, color, font, spacing, or layout structure. 36 images total, 11 MB on disk. Per-template hero treatments use a heavy color overlay matching each template's primary dark token so signature ornaments (gold framing rules, vertical sage hairline, teal quarter-arc, Bodoni page numerals, blueprint dot grid, price-as-headline typography, banker pinstripe, sepia candlelight cast) all remain visible above the photographic base layer. Inline section placements are deliberately restrained: 4-5 images per template, never thumbnail-sized, never crowding the typographic hierarchy. Notable choices: pi-law uses one attorney portrait + two glyph placeholders to keep the institutional feel; med-spa replaces only the provider blockquote (drop cap and pull-quote sidebar untouched); real-estate adds 180px photo bands above price-as-headline cards so the price still dominates; luxury-builders project ledger gets a 3-column photo row tied to the first three ledger entries via italic Cormorant captions; financial layers a Dallas dusk skyline UNDER the banker pinstripe so the institutional pattern stays on top; restaurant inserts a 2-column dish row INSIDE the printed-menu section without breaking the dotted-leader grid; HVAC pairs a B&W Carrier rooftop hero with a service van transition strip before the footer. Verified across all 8: zero em dashes, zero `<script>` tags, all signature design elements preserved, all images carry descriptive alt text and explicit width/height attributes. Several seed Unsplash IDs 404'd (most heavily for HVAC); agents searched Unsplash and verified replacements visually. Page weight increase ~1.0-2.3 MB per template; acceptable for a portfolio mockup with `noindex,nofollow`.
- **Portfolio expanded to 8 perfected templates with locked design systems** (c737f91). All eight portfolio mockups in `public/templates/` rebuilt or built from scratch off perfected prompt specs in `docs/template-prompts/`. New `docs/template-prompts/` directory holds 9 files: `README.md` (distinction matrix + universal CSS quality bar) and one prompt per template (`01-pi-law.md` through `08-restaurant.md`). Every prompt locks a CSS-variable design token block, an explicit type scale via `clamp()`, a unique signature design element, and a "must NOT resemble" guardrail block restating the other seven templates' tokens. The 8 templates and their distinct lanes:
  - `pi-law.html` (rebuild): Bauder & Associates trial lawyers. Cool navy `#0B1628` + brass-gold `#C9A84C`, Playfair Display + DM Sans. Signature: tabular verdicts ledger with `'tnum'` figures and gold hairline rows. ~5400px tall.
  - `luxury-builders.html` (rebuild): Ashworth & Foster builders. Warm white `#FAF9F6` + muted sage `#7C856B`, Cormorant Garamond 300 + DM Sans. Signature: 5-column borderless project ledger, `::first-letter` Cormorant drop cap on the philosophy paragraph, single 70vh sage hairline as the only hero ornament. ~5500px tall.
  - `dental-practice.html` (rebuild): Ridgeview Dental. Clean white + cream + teal `#2A9D8F` + sparing coral `#E76F51`, DM Serif Display + DM Sans. Signature: 120vw teal quarter-arc hero ornament, numbered first-visit timeline of 56px white circles connected by a 2px teal hairline, 12px card radius (unique among the 8). ~4600px tall.
  - `med-spa.html` (new): Reverie Aesthetics. Soft blush + plum `#4A2545` + dusty rose `#C4918E`, Bodoni Moda + Outfit. Signature: faint 8rem Bodoni section numerals "01" through "06" at top-right, 4.6em Bodoni rose drop cap, 380px Bodoni italic pull-quote sidebar with 1px rose vertical rule. Magazine page layout. ~5400px tall.
  - `hvac-contractor.html` (new): Ironclad Air. Steel-blue `#1B2838` + vivid orange `#F97316`, Barlow Condensed 700/800 + Source Sans 3. Signature: full-width orange emergency strip ≥80px tall under hero, 22px blueprint dot grid layered with saturate(0.4) image, persistent ☎ phone in nav, 4-col DFW city pill grid with 20 cities. The loudest template in the portfolio. ~4100px tall.
  - `real-estate.html` (new): Lauren Prescott, Briggs Freeman Sotheby's. True black `#0A0A0A` + warm ivory `#F5F1EB` + copper `#B87333`, Libre Caslon Display + Karla. Signature: price-as-headline cards (no images, massive copper Libre Caslon prices with `'tnum','salt'`), extreme negative space, `clamp(5.5rem, 10vw, 8.5rem)` section padding (most spacious in portfolio). ~5300px tall.
  - `financial-advisor.html` (new): Beckett Wealth Partners RIA. Warm charcoal `#2D2926` + parchment `#F7F3EF` + forest green `#2D5F4A`, EB Garamond + Work Sans. Signature: CSS-only 135deg banker pinstripe pattern in hero (no image), centered AUM tabular lockup with three EB Garamond italic forest figures, EB Garamond italic press-band of six nameplates with forest middots, formal RIA disclosure footer with full registration language. ~5400px tall.
  - `restaurant.html` (new): Ember & Vine, Bishop Arts. Espresso `#1C1210` + burgundy `#7B2D3B` + warm amber `#C9A96E`, Fraunces (SOFT 50 axis) + Nunito Sans. Signature: split nav (centered wordmark with Menu/Wine flanking left, Private Events/Reservations flanking right, no CTA), printed-menu CSS grid with `border-bottom: 1px dotted` leaders connecting Fraunces italic dish names to amber `'tnum'` prices, three ✦ ✦ ✦ amber ornaments at the top of 7 sections, centered editorial footer (not column-grid). ~5600px tall.
  All eight: pure HTML + hand-written CSS, zero `<script>` tags verified, `noindex,nofollow` + viewport meta verified, single Google Fonts `<link>` with `&display=swap` per template (no `@import`), `font-feature-settings: 'kern','liga'` global plus per-template `'tnum'`/`'onum'`/`'salt'` directives, `prefers-reduced-motion` honored, `Website by DBJ Technologies` footer link to `https://dbjtechnologies.com` verified, **zero em dashes** verified across all eight files. Build was parallelized: 8 general-purpose subagents, one per spec, ran concurrently. Mockups are NOT yet wired into `lib/work-data.ts`; screenshot batch pending.
- **Memory-system reorg** (b5e1105). Live `session-handoff.md` archived to `docs/ai/history/2026-04-25.md` and replaced with a compact summary, since it had grown past the 30 KB `dbjcontext` audit threshold. New `docs/ai/history/index.md` is the chronological pointer; `docs/ai/history/` is intentionally excluded from the portal context pack. `docs/ai/index.md` and `scripts/dbj-context.sh` updated to describe the archive workflow. Pack 79 KB to 53 KB; live handoff 37 KB to 10 KB. Audit clean.
- **Service detail pages and pricing subtitle rewritten for business owners** (433fb82). All 6 service detail page heroes (eyebrow, H1, hero description, body paragraph) and CTA labels rewritten in plain business language; CTAs standardized to "Start a Project". The redundant Process section ("How I Deliver" four-phase framework, identical to homepage and `/process`) removed from the service layout, and the dead `process` field removed from the `ServiceDetail` interface and every entry in `lib/service-data.ts`. Related Services cards rewired to source title/tagline from `SERVICES` in `lib/siteContent.ts` instead of `SERVICE_DETAILS`, so future copy edits to `SERVICES` propagate automatically. Pricing page subtitle first sentence swapped from "Engineering-phase engagements with transparent pricing." to "Every project starts with a clear scope and a fixed price." (second sentence preserved). Hero secondary CTA, benefit cards, tech list, deliverables list, FAQ, and bottom CTASection deliberately untouched.
- **Schema.org coverage completed and robots tightened** (d1d2a1f). Detail pages now emit type-specific JSON-LD: `Service` on `/services/[slug]` (alongside existing `FAQPage`), `CreativeWork` on `/work/[slug]`, `Offer` on `/pricing/[slug]`. Each detail page also emits `BreadcrumbList`. `Organization` and `LocalBusiness` schemas gained `email: joshua@dbjtechnologies.com` via a new `SITE.email` field in `lib/constants.ts`. `robots.ts` disallow extended from `["/api/"]` to `["/api/", "/monitoring", "/pathlight/"]`; the trailing-slash form on `/pathlight/` blocks `/pathlight/[scanId]` reports while leaving the public `/pathlight` landing crawlable. `JsonLd` component now exports four additional types (`serviceItem`, `creativeWork`, `offer`, `breadcrumb`) plus a `parsePriceUSD` helper. Detail-page canonical hrefs switched to `${SITE.url}` for single-source consistency. Phone deferred until Google Voice lands.
- **Portfolio template mockups for Work page** (064f89e + add122b). Three self-contained HTML files in `public/templates/`, each visually distinct across palette, typography, density, and footer treatment so the trio demonstrates real range:
  - `pi-law.html` (064f89e): Mercer & Associates, fictional Dallas PI law firm. Dark navy `#0B1628` + brass-gold `#C9A84C`, Playfair Display + DM Sans, dense authority with courthouse texture overlay, six sections, ~2400px tall.
  - `luxury-builders.html` (064f89e): Whitmore Custom Homes, fictional DFW custom home builder. Warm white `#FAF9F6` + sage `#7C856B`, Cormorant Garamond + DM Sans, editorial restraint with desaturated home backdrop, asymmetric hero, single CTA, five sections, ~2600px tall.
  - `dental-practice.html` (add122b): Ridgeview Dental, fictional Plano dental practice. Bright white `#FFFFFF` + cream `#FDF8F4` + teal `#2A9D8F` (coral `#E76F51` reserved for the nav CTA only), DM Serif Display + DM Sans, warm clinical hospitality with dual decorative low-opacity circles in the hero, seven sections including a split insurance + teal CTA card, ~2800px tall.
  All three: pure HTML + hand-written CSS, zero JavaScript, noindex+nofollow meta, Google Fonts via `<link>`, unicode glyphs over Lucide for cross-browser monochrome rendering, DBJ credit linked in every footer. `robots.ts` disallow array extended in 064f89e to `["/api/", "/monitoring", "/pathlight/", "/templates/"]` so the mockups are blocked at the robots level too. Voice intentional: Mercer uses "we" (fictional firm team), Whitmore uses "I" (mirrors DBJ positioning), Ridgeview uses "we" (practice team). These will be screenshotted for the Work page; they are NOT yet wired into `lib/work-data.ts`. Live URLs (deployed but blocked from indexing): `dbjtechnologies.com/templates/{pi-law,luxury-builders,dental-practice}.html`.

### Notes for Future Edits

- The hero H1 on each service detail page is split across two fields: `heroTitle` is the lead-in, `heroHighlight` is the gradient highlight rendered after a `<br>`. When rewriting H1s, decide the split intentionally (the highlight should be the closing beat of the sentence).
- `SERVICES` (in `lib/siteContent.ts`) is the canonical source for service title + tagline as displayed on cards. `SERVICE_DETAILS` (in `lib/service-data.ts`) holds detail-page-only fields (hero, longDescription, benefits, technologies, deliverables, faq). After 433fb82, related-services cards and the page eyebrow both use the title from these two sources but they are intentionally aligned. If you change a card title, update both.
- Browser tab `<title>` per detail page comes from `service.title` via `generateMetadata` + the root `%s | DBJ Technologies` template. No separate metadata override per page.

## Previous Session: April 25, 2026

Full diagnostic trail: [`history/2026-04-25.md`](history/2026-04-25.md).
26 distinct work items; the headlines and durable lessons are below.

### Themes Shipped

- **Homepage hardening.** White-flash fix via `color-scheme:dark` on `<html>` for `/`, SSR dark fallback `<div id="hero-cinema-fallback">` rendered by `app/layout.tsx` and hidden by HeroCinema on mount. PageTransition no longer SSRs `opacity:0` on first mount. (6895b60, a670ae8)
- **About page text.** ScrollWordBatch wrapper switched to plain `inline` with single concatenated `{word + separator}` text child to fix word-collapse and the React-19 `insertBefore` hydration crash. Hero headline capped at `md:text-6xl` so "The Anti-Agency" can't break mid-word. (6895b60, ad3ab47)
- **Repo-native AI memory.** CLAUDE.md + AGENTS.md at root, docs/ai/* (8 files), .claude/rules/* (3 files). Auto-update + post-commit handoff rules added. (a238f74, 7dacb84, 1c09428, 3489139)
- **Pathlight landing overhaul.** New `PathlightContent.tsx` server sections (report preview 2x2, differentiator copy, audience flow, secondary CTA, footer line). Form gains `id="scan-form"` anchor. (d01895e)
- **Founder photo chain.** True alpha-transparent webp via `cwebp -q 90 -alpha_q 100`, mask removed, enlarged to `xl:w-[720px]`, hero container widened to `xl:max-w-7xl`. (96eba49 → 57d0001 → 115127d → baf8920)
- **Homepage strategic overhaul.** PathlightCTA moved from position 8 to position 2. Hero subheading + CTAs rewritten (`Run Free Scan` / `See What I Build`). All 6 SERVICES given business-owner titles + taglines, slugs preserved. New `PATHLIGHT_CTA_CONTENT` constant. (fceb83d, 1e74d92)
- **Service detail pages rewritten** for business owners; `description` + 6-feature `features` arrays in first-person outcome language. (c180dc2)
- **Brand-voice sweep.** First-person fix on Hero secondary CTA (cec8713), then 9-instance sweep across siteContent, Services heading, follow-up email templates, chatbot prompt. Family-life accuracy preserved. (8d75bca)
- **Google Translate guard.** `translate="no"` on `<html>` + `<meta name="google" content="notranslate">` defensive against text-mutation hydration crashes. (7001a87)
- **Pricing rebuild.** Enterprise card reframed (a2f888c). Path-B refactor of pricing detail pages: schema rewritten (sections/idealFor/ctaText/ctaHref), 5 tier pages, `/maintenance-support` deleted with 308 redirect to `/pricing/maintenance`. (b97c735)
- **Add-ons rewritten** in business language and made tier-aware via `ADD_ONS[].tiers` + `getAddOnsByTier(slug)`. 12 entries; per-tier counts: starter 9 / professional 11 / enterprise 5 / maintenance 0 / consulting 0. (b464694)
- **Package configurator at `/pricing/build`.** Three-step flow with sticky bottom-bar total. Per-unit add-ons get `+/-` quantity steppers. Contact form reads `?package=&addons=&qty_<slug>=&estimate=` query params and pre-fills the Message field. (9b83561)
- **Pathlight twelve-pitfall sweep** across five tiered commits. Tier 0 megabrand suppression via `VisionAuditResult.businessScale`; Tier 1 PII redaction in URLs + B2C deal-value floor $25 + visitor floor 50; Tier 2 benchmark cache via Upstash 30d TTL + nullable `searchVisibility` pillar with weight redistribution; Tier 3 `screenshotHealth` notice + fuzzy-match logging + remediation 8+/10 refusal rule; Tier 4 industry-inference fallback + followup email suppression rules + 24h scan dedupe. (ae3f2c3, 587f5f9, a62965c, 0a7494b, 3e96831)
- **Funnel realignment.** Hero CTA → "Run Free Scan" / "Book a Strategy Call". NAV_LINKS reordered with Pathlight first, Home removed. Process phase 1 names Pathlight by name. (3eaad36)
- **Pathlight product mockup on homepage.** Stripe/Linear-style browser-frame screenshot below PathlightCTA. Nav primary CTA "Start a Project" → "Run Free Scan" desktop + mobile. (ab74663)
- **DOM commit-phase crash fix.** PageTransition always renders `motion.div` (gates animation on `hasMounted && !prefersReducedMotion`). HeroCinema fallback hidden via `style.display = "none"` instead of `.remove()` so React's reconciler stays in sync. Resolved 13 Sentry issues across `/`, `/about`, `/contact`, `/pathlight`. (f66c602)
- **Three priority follow-ups.** Browserless cookie-banner dismissal + `document.fonts.ready` wait (e17d41c). Composite scan-dedupe index `idx_scans_email_url_created` (de103b9, **migration not yet applied to prod Neon**). Anthropic prompt caching across all four LLM call sites via `cache_control: ephemeral` on system prompts; templates stripped of dynamic placeholders so system content stays identical (68c7928).
- **Portal-chat context pack.** `scripts/dbj-context.sh` replaces the old zsh alias. 11 files in optimized order with audit warnings (missing files, handoff size, em-dash drift, deprecated email beyond baseline of 2).

## Durable Lessons (load-bearing for future sessions)

### ScrollWordBatch hydration constraint
`motion.span` animating per-word text MUST have a single text child per element: `{word + separator}`, not `{word}{separator}`. React 18's `<!-- -->` text-marker insertion is unreliable through framer-motion's forwardRef wrapper, so two-text-children produced an intermittent `NotFoundError: Failed to execute 'insertBefore'` SSR/client mismatch. Same constraint applies to any other `motion.*` element with per-token text. Component file documents this in a comment block; preserve it.

### Brand-voice rule (first-person "I", not "we")
Two slips in one session because user-supplied prompt copy was applied silently without flagging "we"/"our". Before any commit touching copy, run:
```
grep -rn '\bwe\b\|\bWe\b\|\bour\b\|\bOur\b' lib/ components/ app/\(marketing\)/ --include="*.ts" --include="*.tsx" | grep -vE '^\s*\*|^\s*//|\{/\*'
```
Word-boundary false positives to ignore: however, power, lower, newer, tower, shower, flower, answer, viewer, sewer, fewer, "the US". Captured in `feedback_brand_voice_first_person.md` memory.

### Founder photo alpha
Canva PNG export must be RGBA (`color_type 6`), not RGB (`color_type 2`). Convert with `cwebp -q 90 -alpha_q 100 input.png -o output.webp` to preserve alpha; verify with `identify` showing `channels srgba 4.0`. `sips` and most converters silently drop alpha.

### HeroCinema fallback removal
Never `.remove()` a node that was rendered by a server component (here: the dark fallback div in `app/layout.tsx`). React's reconciler still tracks it; removing it imperatively desyncs the tree and throws on cross-route navigation. Use `style.display = "none"` instead.

### Pricing schema is sections-based
`PRICING_DETAILS` uses `sections[]/idealFor/ctaText/ctaHref/name/price` (display string). The old `whatsIncluded[]/addOns[]/timeline/revisions/support/heroTitle/heroHighlight/tierName` shape was retired in b97c735. Per-tier add-ons live in a single global `ADD_ONS` array filtered by `getAddOnsByTier(slug)`; do not reintroduce per-tier add-on arrays.

### Pathlight pipeline boundaries
- `VisionAuditResult.businessScale` (`single-location | regional | national | global`) gates revenue: national/global short-circuit research-benchmark and ai-revenue-impact.
- `screenshotHealth` (`clean | cookie-banner-overlay | loading-or-skeleton | auth-wall | minimal-content`) drives the ScreenshotHealthNotice on the report.
- `PillarScores.searchVisibility` is nullable; when both Lighthouse SEO and Accessibility are missing, the pillar renders `n/a` and the composite Pathlight Score redistributes its 0.15 weight across the remaining three pillars.
- Benchmark cache: keyed by `(vertical, businessModel, parent)` in Upstash, 30-day TTL.
- Scan dedupe: same `(email, url)` within 24h returns existing `scanId` with `status: "deduped"`.

## Unresolved Issues

- Pathlight "Some analysis steps could not be completed" banner appears intermittently. Existing retry logic handles most cases; root cause for the remaining occurrences is unknown but infrequent.
- Sample report screenshot still missing from Pathlight landing. Visual proof is the next gap, doubly urgent now that the homepage leads with PathlightCTA.
- Pathlight product error messages in `app/(grade)/pathlight/**` still use "we"/"our" (6 instances at `page.tsx:45`, `ScanStatus.tsx:330/337/347/350`, `unsubscribe/route.ts:85`). Deliberately left as system voice; pending Joshua's call.
- JSX comments containing "we" in `WhyDBJContent.tsx:137`, `ProcessContent.tsx:216`, `global-error.tsx:21`. Internal only, not customer-facing.
- **Migration `005_dedupe_index.sql` (committed in de103b9) still needs to be applied to the production Neon DB** via `lib/db/setup.ts`. Idempotent; the script picks up every `.sql` in `lib/db/migrations/` in numeric order.

## Future Surface (not pending, just enumerated)

Additional Pathlight technical surface beyond the twelve pitfalls, captured for future sessions: PSI quota fallback, no auth on `/pathlight/[scanId]` report URL, no Resend bounce/complaint webhook handling, 420s pipeline finish ceiling, frozen 206-entry vertical DB with no freshness signal, fixed 3s polling cadence with no exponential backoff, no aggregated telemetry on cache hit rate / screenshot health / vertical-match score histogram, no per-chat-session turn cap.

## Next Recommended Tasks

1. Apply migration `005_dedupe_index.sql` to production Neon DB.
2. Add sample report screenshot(s) to Pathlight landing.
3. Screenshot all eight portfolio templates at desktop (1440px) and mobile (768px) widths (`pi-law.html`, `luxury-builders.html`, `dental-practice.html`, `med-spa.html`, `hvac-contractor.html`, `real-estate.html`, `financial-advisor.html`, `restaurant.html`) and wire the screenshots into `lib/work-data.ts` as case studies on the Work page. The full eight-template batch is the screenshot target; perfected prompts are preserved in `docs/template-prompts/` so any rebuild stays visually consistent.
4. Decide on Pathlight product error message voice (system "we" vs studio "I"; leaning toward system voice per SaaS convention).
5. Follow up with Tyler on testimonial request.
6. Run the Gemini Deep Research prompt for DFW competitive landscape and keyword research.
7. Set up Google Voice for business phone number ($10/month Google Workspace add-on). Then add `telephone` to `Organization` and `LocalBusiness` JSON-LD in `components/layout/JsonLd.tsx`.

## Current Git Status

`main` is at `569f147` (feat(templates): restaurant Pass 1 + upscale-restaurant blueprint), confirmed pushed to `origin main`. Working tree clean. Today's chain (most recent first): `569f147` (restaurant Pass 1 content infrastructure: PROMO BAR, sticky Reserve CTA, THE GARNET® bar branded with named Bar Director, PANTRY + Gift Cards strip, two-room PRIVATE DINING with named GM Catherine Dao, AWARDS strip, day-by-day HOURS table, PREFERRED GUEST LIST email capture, footer enhanced with GM + TRA membership; companion `docs/blueprints/upscale-restaurant.md` deep dive blueprint, second of 8) → `4ee9171` (luxury-home-builder vertical deep dive blueprint, first of 8) → `1d3f23c` (snapshot) → `bc40c1a` (luxury-builders Pass 1 content infrastructure: COMMUNITIES, AVAILABLE HOMES & LOTS, RECOGNITION, JOURNAL added; Portfolio renamed Galleries; nav CTA removed; monogram added; footer expanded with affiliations) → `5334ad2` (snapshot) → `c8f8b62` (unique hero skeletons for financial / real-estate / restaurant) → `e5e1d57` (snapshot) → `9e5c1cc` (hero photo fixes for builders + real-estate) → `83fef7f` (snapshot) → `752a626` (photo-first rebuild: 11 portraits in images/people/, every nav/hero/custom-moment rewritten) → `d42f118` (snapshot) → `497a6d1` (real photography integrated across all 8 templates, 36 images) → `f14410c` (snapshot) → `c737f91` (all 8 templates rebuilt to perfected specs + docs/template-prompts/) → `3c346c3` (snapshot) → `add122b` (dental template) → `f2c9b29` (snapshot) → `064f89e` (first two templates) → `a89d139` (snapshot) → `d1d2a1f` (schema + robots) → `4bc2bf9` (snapshot) → `433fb82` (service detail pages + pricing subtitle) → `5a97a26` (snapshot) → `b5e1105` (history archive + compact handoff).
