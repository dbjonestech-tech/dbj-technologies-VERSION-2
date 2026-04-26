# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`).

## Last Session: April 26, 2026

### Themes Shipped

- **Memory-system reorg** (b5e1105). Live `session-handoff.md` archived to `docs/ai/history/2026-04-25.md` and replaced with a compact summary, since it had grown past the 30 KB `dbjcontext` audit threshold. New `docs/ai/history/index.md` is the chronological pointer; `docs/ai/history/` is intentionally excluded from the portal context pack. `docs/ai/index.md` and `scripts/dbj-context.sh` updated to describe the archive workflow. Pack 79 KB to 53 KB; live handoff 37 KB to 10 KB. Audit clean.
- **Service detail pages and pricing subtitle rewritten for business owners** (433fb82). All 6 service detail page heroes (eyebrow, H1, hero description, body paragraph) and CTA labels rewritten in plain business language; CTAs standardized to "Start a Project". The redundant Process section ("How I Deliver" four-phase framework, identical to homepage and `/process`) removed from the service layout, and the dead `process` field removed from the `ServiceDetail` interface and every entry in `lib/service-data.ts`. Related Services cards rewired to source title/tagline from `SERVICES` in `lib/siteContent.ts` instead of `SERVICE_DETAILS`, so future copy edits to `SERVICES` propagate automatically. Pricing page subtitle first sentence swapped from "Engineering-phase engagements with transparent pricing." to "Every project starts with a clear scope and a fixed price." (second sentence preserved). Hero secondary CTA, benefit cards, tech list, deliverables list, FAQ, and bottom CTASection deliberately untouched.
- **Schema.org coverage completed and robots tightened** (d1d2a1f). Detail pages now emit type-specific JSON-LD: `Service` on `/services/[slug]` (alongside existing `FAQPage`), `CreativeWork` on `/work/[slug]`, `Offer` on `/pricing/[slug]`. Each detail page also emits `BreadcrumbList`. `Organization` and `LocalBusiness` schemas gained `email: joshua@dbjtechnologies.com` via a new `SITE.email` field in `lib/constants.ts`. `robots.ts` disallow extended from `["/api/"]` to `["/api/", "/monitoring", "/pathlight/"]`; the trailing-slash form on `/pathlight/` blocks `/pathlight/[scanId]` reports while leaving the public `/pathlight` landing crawlable. `JsonLd` component now exports four additional types (`serviceItem`, `creativeWork`, `offer`, `breadcrumb`) plus a `parsePriceUSD` helper. Detail-page canonical hrefs switched to `${SITE.url}` for single-source consistency. Phone deferred until Google Voice lands.

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
3. Decide on Pathlight product error message voice (system "we" vs studio "I"; leaning toward system voice per SaaS convention).
4. Follow up with Tyler on testimonial request.
5. Run the Gemini Deep Research prompt for DFW competitive landscape and keyword research.
6. Set up Google Voice for business phone number ($10/month Google Workspace add-on).

## Current Git Status

`main` is at `d1d2a1f` (feat: complete Schema.org coverage on detail pages and tighten robots.txt), pushed to `origin main`. Working tree clean after this snapshot follow-up commit. Today's chain: `5a97a26` (April 25 handoff snapshot) → `b5e1105` (history archive + compact handoff) → `4bc2bf9` (handoff snapshot for service-page rewrite) → `433fb82` (service detail pages + pricing subtitle) → `d1d2a1f` (schema + robots).
