# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-28.md`](history/2026-04-28.md), which holds the
verbatim record of every session entry that was below this header before
archive.

## Most Recent Session: April 28, 2026 -- First real testimonial on homepage + hyphen sweep across user-facing copy

### What shipped

**Real client testimonial wired in:**
- `lib/constants.ts`: replaced the empty `TESTIMONIALS` stub with a typed `Testimonial` interface (`quote, name, title, business, location, url, rating, source`) and seeded it with Miguel Ibarra's first Google review for Star Auto Service ("Created an amazing business website for us! Very impressed and would highly recommend to anyone!"). 5 stars, source "Google", url thestarautoservice.com.
- `components/sections/Testimonials.tsx`: full rewrite. Inline 5-star SVG (no lucide for the rating, hand-rolled `Star` + `StarRow` helpers, `text-amber-400` filled / `opacity-20` unfilled, `sr-only` "5 out of 5 stars"). Single-quote layout (`SoloTestimonial`): centered `<motion.figure>` `max-w-3xl` with dark glass card (`border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-2xl`), star row, `font-display text-2xl md:text-3xl` blockquote, attribution figcaption with `Name, Title · Business · Location` mid-dot separators, source row showing "GOOGLE REVIEW · View live site →" (link `target="_blank" rel="noopener noreferrer"`). Render branch: `length === 1` only renders `SoloTestimonial`; `length === 0` early-returns null (preserved); `length >= 2` renders nothing (intentional, future multi-card branch deferred). Section gained `print-hidden`. SectionHeading kept `label="Testimonials"` and `title="What Clients Say"`; the plural-leaning `description` was dropped so the section reads cleanly with one quote.
- `app/(marketing)/page.tsx`: TestimonialsSection import + position untouched (static import preserved; no dynamic import existed despite the original prompt assuming one).

**Work-page copy rewrite:**
- `app/(marketing)/work/WorkContent.tsx`: replaced "A design brief for each of eight verticals I work in. Each one is a deep-dive on what the category actually needs online: how the customer chooses, what most sites get wrong, and the load-bearing surfaces that turn a search into a booking." with "Design briefs covering a selection of verticals I work in. Each one digs into what the category actually needs online: how the customer chooses, what most sites get wrong, and the surfaces that turn a search into a booking." Softens the "eight" rigidity, drops "deep-dive" and "load-bearing".

**Hyphen sweep across user-facing copy** (per Joshua: "us English speakers and writers just don't use them that much"):
- Dropped: production-grade, high-performance, long-term, custom-built, custom-designed, fixed-price, end-to-end, zero-downtime, zero-latency, cloud-native, component-driven, mobile-first contexts where natural, post-launch, mini-project, senior-level, multi-location, AI-powered, industry-specific, full-stack, Server-side, SEO-friendly, machine-readable, on-page, third-party (in soil-depot copy), entity-aligned, city-specific, city-level, TDPSA-compliant, Dallas-based, Dallas-area, Principal-level, cross-browser, Month-to-month, tap-to-call, live-answer, service-area; "multi-modal" -> "multimodal".
- Kept (standard usage / grammar / clarity required): in-house, real-time, first-party, JSON-LD, e-commerce, sub-second, 105-degree, 24/7, Dallas-Fort Worth (proper noun), 30-day / 13-month (number+unit modifiers).
- Files touched: `lib/constants.ts`, `lib/siteContent.ts`, `lib/work-data.ts`, `lib/pricing-data.ts`, `lib/design-briefs.ts`, `app/(marketing)/page.tsx`, `app/(marketing)/about/page.tsx`, `app/(marketing)/why-dbj/WhyDBJContent.tsx`, `app/(marketing)/services/page.tsx`, `app/(marketing)/services/ServicesContent.tsx`, `app/(marketing)/process/ProcessContent.tsx`, `app/(marketing)/pricing/build/BuildContent.tsx`, `app/(marketing)/work/WorkContent.tsx`, `app/(marketing)/work/design-briefs/[slug]/page.tsx`, `app/(grade)/layout.tsx`, `app/(grade)/pathlight/page.tsx`, `app/(grade)/pathlight/[scanId]/page.tsx`, `components/sections/Services.tsx`.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash check on changed files: 0 introduced (one pre-existing comment-header em dash on `lib/constants.ts:4` left alone, outside the dbjcontext pack).
- Not visually verified in-browser; user has known preference to validate from incognito after deploy.

### Next recommended task

After Vercel rebuild settles (1-3 min), open the deployed homepage in incognito and confirm: (1) Testimonials section renders below ProcessSteps and above TechStack, (2) 5 gold stars centered above the blockquote, (3) "Miguel Ibarra, Owner · Star Auto Service · Richardson, TX" line and "GOOGLE REVIEW · View live site →" row both render with mid-dots, (4) "View live site" opens thestarautoservice.com in a new tab, (5) scroll-trigger entrance fires once, (6) layout is clean on mobile (figcaption row uses `flex-wrap`). Then spot-check `/work`, `/services`, `/pricing/professional`, and `/why-dbj` to confirm the dehyphenated copy still reads naturally on retina + mobile.

### Final state (post-commit)

- Feature commit: `8ca63ea` -- feat(homepage): real Star Auto testimonial + hyphen sweep across copy. 20 files changed, 185 insertions, 88 deletions.
- Pushed to `origin main` (`9bdc8b5..8ca63ea  main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 28, 2026 -- Operations Cockpit productized as $25K Specialty Engagement on About + Pricing

### What shipped

The internal admin dashboard built earlier today is now positioned publicly as a productized engagement called **Operations Cockpit**, "Starting at $25,000," 4-8 week delivery, sister to the three website-build tiers. Public surfaces:

- **About page** (`app/(marketing)/about/AboutContent.tsx`): new "Built for Myself First" section between Operating Principles and the CTA. Eyebrow "The Stack Behind the Studio". Six glass-card capability tiles (first-party analytics, real-user performance, deliverability monitoring, infrastructure watchers, pipeline observability, cost telemetry) styled to match the existing Values grid. Dual CTAs: primary "See Pricing" -> `/pricing/operations`, secondary "Request a Private Walkthrough" -> `/contact?topic=operations-cockpit`.
- **Pricing page** (`app/(marketing)/pricing/PricingContent.tsx`): new "Specialty Engagement" section between the 3-tier grid and the Add-Ons grid. Single full-width feature card with "$25,000 / Starting at / Delivered in 4 to 8 weeks" right-column block linking to the detail page.
- **Detail page** (`/pricing/operations`): new entry in `PRICING_DETAILS` (`lib/pricing-data.ts`); rendered by the existing `[slug]/page.tsx` route with hero, idealFor, three sections (What Is Included / How It Works / What You Get at the End), four FAQs, and `ctaHref: "/contact?topic=operations-cockpit"`. Sitemap auto-includes via `getPricingSlugs()`.
- **Contact form** (`app/(marketing)/contact/ContactContent.tsx`): topic-prefill pattern extended for `topic=operations-cockpit`. New `OPERATIONS_COCKPIT_DEFAULTS` (budget `$25,000+`, projectType `Other`, scoping-context message). New Gauge-icon topic card mirroring the portal-access pattern.

No screenshots of the actual admin appear on any public surface; copy is outcome-led so no Pathlight internals leak through. First-person "I" throughout. No em dashes.

### Pricing rationale

Asset replacement cost: $30K-$80K. $25K floor positioned just above Enterprise ("Starting at $15,000"), under typical SMB board-approval thresholds. "Starting at" framing leaves explicit upward room (~$60K ceiling for fully integrated multi-property builds). FAQ acknowledges the price scaling so prospects do not feel ambushed. Naming "Operations Cockpit" chosen over "Operations Dashboard" because (1) "Dashboard" is commoditized SaaS vocabulary, (2) "Cockpit" maps to the buyer's self-image of piloting the business, (3) the language was already battle-tested in internal docs.

### Commit

`56ee1b2` -- feat(marketing): launch Operations Cockpit as $25K productized engagement. Pushed to `origin main`. Vercel auto-build in progress. Working tree clean.

### Files changed (4 code, 7 docs incl. archive cleanup the linter performed during the session)

- `lib/pricing-data.ts`
- `app/(marketing)/about/AboutContent.tsx`
- `app/(marketing)/pricing/PricingContent.tsx`
- `app/(marketing)/contact/ContactContent.tsx`
- `docs/ai/session-handoff.md` (this entry + archive condensation)
- `docs/ai/current-state.md` (Operations Cockpit section added at top)
- `docs/ai/decision-log.md` (productization decision entry)
- `docs/ai/backlog.md`, `docs/ai/index.md`, `docs/ai/history/index.md`, `docs/ai/history/2026-04-28.md` (archive cleanup)

### Verification

- `npx tsc --noEmit` exit 0
- `npm run lint` exit 0
- Em-dash audit across all changed files: 0
- `dbjonestech@gmail.com` in production code: 0 (only legitimate references in archived history docs)

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/pricing/operations` to confirm canonical URL, OG metadata, and breadcrumb JSON-LD render. Then a Lighthouse pass on `/about` to confirm the new section did not regress Performance/Accessibility. If the offering produces leads in the first 30 days, consider a one-line credibility callout on `/why-dbj` and a discreet capabilities mention in the homepage Services section.

---

## Previous Session: April 28, 2026 -- Admin headquarters expansion + prod migration application

### What shipped (condensed)

The admin dashboard is now the operations cockpit Joshua asked for. Eight new migrations (014-021) added: visitor analytics + page_view_engagement, funnel materialized views (`funnel_daily_v` + `funnel_cohort_weekly_v`), Vercel telemetry (`vercel_deployments` + `vercel_function_metrics`), Inngest run history (`inngest_runs`), infrastructure checks (`infra_checks`: TLS / WHOIS / MX / SPF / DKIM / DMARC), Anthropic budget snapshots (hourly), Search Console daily import, email KPI rollup (`email_kpi_daily_v`). All applied to prod Neon on April 28 via `npx tsx lib/db/setup.ts`. Pre-migration: 15 tables / 0 MVs. Post-migration: 25 tables / 3 MVs. All 21 read APIs smoke-tested against the migrated DB and returned without throwing; visitor analytics already capturing real beacon traffic.

The marketing site continues to ship Google Analytics through the consent banner; alongside it, a first-party measurement layer captures every page view, session, and Core Web Vital into Postgres. Two cookies (`dbj_vid` 13-month, `dbj_sid` 30-min idle) stitch sessions; the Pathlight scan endpoint and contact form attribute conversions back to the originating session so cohort math joins cleanly. Raw IP is never persisted (only `sha256(ip || daily_salt)`); raw page_views retained 90 days, aggregated sessions 13 months. Privacy policy was rewritten to disclose all of this.

The admin landing was reorganized into a three-column Today / Acquisition / Health-and-operations layout with a green/yellow/red worst-of status bar that rolls up signals across deployments, pipeline failure rate, budget headroom, infrastructure expiry, error volume, and mobile RUM LCP. Admin Login was removed from the public Navbar (footer-only now); navbar is Client Portal pill + Run Free Scan only.

Earlier in the same date range: Design Briefs rename (Blueprints -> Design Briefs across the Work surface, 8 template screenshots, project-card layout parity), auth surfaces split (`/signin` = admin-only + `/portal-access` = public client entry), middleware prefix-match fix so `/portal-access` is no longer swallowed by the `/portal` rule, Work-page mobile polish (3:2 card previews, mobile tile stack). Full diagnostic trail in `history/2026-04-28.md`.

### Final commit chain (most recent first)

`a842712` (chore(db): apply migrations 014-021 to prod + add schema/read-api smoke scripts) -> `da04239` (fix(admin): align card heights across rows with single auto-rows-fr grid) -> `7e6e159` (fix(admin): empty-state on missing tables + rebalance landing layout) -> `ea1ce1d` (snapshot for 1173bc2) -> `1173bc2` (feat(admin): expand dashboard into operations cockpit + move admin login to footer) -> `4e03df3` (snapshot for 5e7e86e) -> `5e7e86e` (fix(work): stack metric/surface tiles on mobile) -> `ccc5ab8` (snapshot for d7ee5cc) -> `d7ee5cc` (fix(work): card previews 3:2) -> earlier chain elided in archive.

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

### JSON-schema repair prompt
`callClaudeWithJsonSchema` (`lib/services/claude-analysis.ts:340`) threads the specific `firstAttempt.error` into the second-attempt user message. The second attempt has actionable signal about which field failed validation. Total calls per JSON step capped at 2; do not add a third without measuring cost impact and pipeline time budget against the 420s ceiling.

### Admin webhook prefix gating
The middleware `pathname.startsWith("/portal")` originally caught `/portal-access` and bounced the public client entry through the auth flow. Use `isPathOrSubpath()` (matches exact path or path with `/` separator) instead of `startsWith()` for any new admin/portal/internal route prefix. The same pattern applies to `app/robots.ts` disallow rules: trailing slash on `/portal/` keeps `/portal-access` crawlable.

### Migration runner
`npx tsx lib/db/setup.ts` is the migration runner against whatever DB `POSTGRES_URL` points at. After applying, run the new helper scripts under `scripts/`: `snapshot-schema.ts` (lists tables + MVs) and `smoke-test-reads.ts` (calls every dashboard read function and prints result counts).

## Unresolved Issues

- Pathlight "Some analysis steps could not be completed" banner: schema-repair mitigation shipped April 27 (`217c262`). Watch Sentry over the next week for `ClaudeAnalysisError: ... could not parse a valid JSON response after one retry` frequency. Drop = fix is working; flat = there's another root cause (likely schema mismatch in benchmark or screenshot health steps) and we revisit.
- Sample report screenshot still missing from Pathlight landing. Visual proof is the next gap, doubly urgent now that the homepage leads with PathlightCTA.
- Pathlight product error messages in `app/(grade)/pathlight/**` still use "we"/"our" (6 instances at `page.tsx:45`, `ScanStatus.tsx:330/337/347/350`, `unsubscribe/route.ts:85`). Deliberately left as system voice; pending Joshy's call.
- JSX comments containing "we" in `WhyDBJContent.tsx:137`, `ProcessContent.tsx:216`, `global-error.tsx:21`. Internal only, not customer-facing.
- **Manual Vercel dashboard step** (still pending verification): `www.dbjtechnologies.com` attached April 27. Verify `curl -I https://www.dbjtechnologies.com/` returns 301 -> apex, and `curl https://dbjtechnologies.com/robots.txt` shows the disallow list from `app/robots.ts`.
- **Admin headquarters env vars not yet set in Vercel:** `ANALYTICS_IP_SALT_BASE` (required for hashing to work), `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` + `VERCEL_WEBHOOK_SECRET`, `INNGEST_WEBHOOK_SECRET`, `ANTHROPIC_ADMIN_KEY` + `ANTHROPIC_MONTHLY_BUDGET_USD`, `GOOGLE_SC_CREDENTIALS_JSON` + `GOOGLE_SC_SITE_URL`, `SENTRY_AUTH_TOKEN` + `SENTRY_ORG_SLUG` + `SENTRY_PROJECT_SLUG`. Each module renders an empty-state hint until its env config arrives, so the deploy is safe; the dashboards just stay empty until the keys are set.
- **Webhooks not yet registered:** Vercel deployment webhook -> `/api/webhooks/vercel`, Inngest run-lifecycle webhook -> `/api/webhooks/inngest`. Both verified HMAC; secrets above.
- Committer identity is auto-set from hostname (`doulosjones@Joshuas-MacBook-Pro.local`). Joshua may want to set `git config --global user.email` for cleaner blame on future commits. CLAUDE.md prohibits the assistant from touching git config.

## Future Surface (not pending, just enumerated)

Additional Pathlight technical surface beyond the twelve pitfalls, captured for future sessions: PSI quota fallback, no auth on `/pathlight/[scanId]` report URL, 420s pipeline finish ceiling, frozen 206-entry vertical DB with no freshness signal, fixed 3s polling cadence with no exponential backoff, no aggregated telemetry on cache hit rate / screenshot health / vertical-match score histogram, no per-chat-session turn cap. (Resend bounce/complaint webhook and cost monitoring + alerting both shipped in April 27 sessions; see archive.)

V3 monitoring extensions worth queuing: deep end-to-end Pathlight canary scan (full pipeline) once daily, Lighthouse trend sparklines per page on the dashboard, public `/status` HTML page (the JSON endpoint is already shipped), lead-heat scoring layer on top of contact + scan + chat counts.

## Next Recommended Tasks

1. Set the 12 admin headquarters env vars in Vercel (list above) so the new dashboards hydrate. Each module fails closed to an empty-state card until its key arrives.
2. Register the Vercel deployment webhook (`/api/webhooks/vercel`) and the Inngest run-lifecycle webhook (`/api/webhooks/inngest`) in their respective dashboards.
3. Wait one full day after env vars + webhooks are live, then visit `/admin/funnel` and `/admin/performance/rum` to confirm the materialized views have hydrated with real traffic. RUM is the source of truth for the question of whether mobile LCP needs the perf optimization Joshua skipped earlier.
4. Onboard Tyler as the first real client portal customer. Create his client row + initial project + milestones in `/admin/clients`. Send invitation. Walk him through.
5. Add sample report screenshot(s) to Pathlight landing.
6. Decide on Pathlight product error message voice (system "we" vs studio "I"; leaning toward system voice per SaaS convention).
7. Follow up with Tyler on testimonial request.
8. Run the Gemini Deep Research prompt for DFW competitive landscape and keyword research.
9. Set up Google Voice for business phone number ($10/month Google Workspace add-on). Then add `telephone` to `Organization` and `LocalBusiness` JSON-LD in `components/layout/JsonLd.tsx`.

## Current Git Status

- Branch: `main`, working tree clean, up to date with `origin/main`.
- HEAD: `a842712` (chore(db): apply migrations 014-021 to prod + add schema/read-api smoke scripts).
- Most recent meaningful chain: `a842712` (db migrations applied) -> `da04239` (admin card-height fix) -> `7e6e159` (admin empty-state fix) -> `ea1ce1d` (snapshot) -> `1173bc2` (feat: admin operations cockpit + admin login moved to footer).
- Prod Neon: 25 tables, 3 materialized views. Visitor analytics live and ingesting. Pipeline / Platform / Errors / Email / Infrastructure / Search dashboards pending env vars.
