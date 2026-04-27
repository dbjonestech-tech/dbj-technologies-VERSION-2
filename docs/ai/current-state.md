# Current State

Last updated: April 25, 2026

## DBJ Technologies Site (dbjtechnologies.com)

### Working and Deployed
- ~24 unique URLs live (18 page.tsx files plus dynamic [slug] expansions), deployed on Vercel via GitHub `dbj-technologies-VERSION-2` (origin main)
- Lighthouse baseline: Performance 99-100, Accessibility 100, Best Practices 100, SEO 100
- Homepage: HeroCinema phase-based animation (blueprint -> build -> reveal -> complete), "Architect The Impossible." headline with period. Initial-load gap (between CSS-paint and HeroCinema's ssr:false chunk arriving) covered by a static dark fallback div rendered in app/layout.tsx (id="hero-cinema-fallback", inline-styled position:fixed z:100 #06060a, only emitted on /) which HeroCinema removes from the DOM in its mount useEffect so its own animated overlay takes the slot seamlessly.
- About page: dark hero section, split layout with joshua-jones.webp (true alpha-channel transparent PNG; new "Joshua Profile Headshot" source converted via cwebp -q 90 -alpha_q 100; 640 KB, 6400x4263, RGBA preserved). Photo column enlarged for desktop: w-80 mobile, lg:w-[600px], xl:w-[720px], with the hero container widened to xl:max-w-7xl so the text column doesn't get crushed. Headline capped at md:text-6xl lg:text-5xl to prevent character-level mid-word wrap once the photo column grows. No maskImage; subject silhouette floats directly over the dark page bg. Clip-path reveal animation, floating geometric accents, character-level headline animation, story sections ("Why I Work This Way", "What You Actually Get", "How I Build", "Who This Is For"), personal sign-off, gradient divider, values cards with hover glow.
- Work page: 3 case studies (Star Auto Service, Pathlight, Soil Depot) with real screenshots, comprehensive detail pages, metrics rows, tech stacks, "View Case Study" + "Live Site" links
- Services: 6 dedicated service pages (frontend-architecture, backend-systems, cloud-infrastructure, interface-engineering, ecommerce-platforms, web-performance)
- Pricing: Starter $4,500, Professional $9,500, Enterprise custom (price: null, scoped during paid discovery). Maintenance $299/month. Hourly consulting $175/hour. Each tier now has a dedicated detail page at /pricing/{slug} with 5 slugs total (starter, professional, enterprise, maintenance, consulting). Detail layout: hero with name/price/timeline + per-tier inline CTA, Ideal For paragraph, three-section breakdown (heading + body), tier-filtered Add-Ons section (only starter/professional/enterprise), tier FAQ accordion, standard CTASection. Add-ons live in a single global ADD_ONS array in lib/pricing-data.ts with a tiers[] field per entry; getAddOnsByTier(slug) filters at render time. Schema for PRICING_DETAILS was refactored from the old whatsIncluded/addOns/timeline/revisions/support shape to the new sections/idealFor/ctaText/ctaHref shape; layout component PricingDetailLayout.tsx was rewritten to match. The legacy /maintenance-support page (which had its own 3-tier $299/$599/$999 plan grid) was deleted; a 308 permanent redirect from /maintenance-support to /pricing/maintenance is now configured in next.config.mjs. Footer SUPPORT_LINKS, sitemap, addon card hrefs on the main /pricing page, and the "See maintenance & support plans" link in PricingContent.tsx all point at /pricing/maintenance now.
- Package configurator at /pricing/build (server shell + client BuildContent). Three-step flow: pick base tier (Starter, Professional, Enterprise - Maintenance and Consulting deliberately excluded as service relationships), toggle relevant add-ons (filtered by ADD_ONS[].tiers), and see a sticky bottom-bar summary with running total. Per-unit add-ons (Additional Pages, Content Writing) get an inline +/- quantity stepper (range 1-20) with a calculated line total. Switching tiers automatically deselects incompatible add-ons. Request a Quote button links to /contact?package=...&addons=...&qty_<slug>=...&estimate=... and the contact form reads those params (via useSearchParams behind a Suspense boundary in app/(marketing)/contact/page.tsx) to render a "Your Selected Package" summary card above the form and pre-fill the Message field with a first-person sentence. AddOn interface in lib/pricing-data.ts gained slug, priceValue (number), perUnit, and unitLabel fields plus a getAddOnBySlug helper. The main /pricing page got a new "Not sure which package? Build a custom package →" CTA button between the hero subheading and the tier cards, linking to /pricing/build.
- Contact form: Resend integration, sends to joshua@dbjtechnologies.com, phone field included
- Footer: LinkedIn company page + GitHub social icons with proper aria-labels
- Schema.org: JSON-LD with sameAs for social profiles
- Professional email: joshua@dbjtechnologies.com (Google Workspace, SPF/DKIM/DMARC verified)
- Pathlight landing page (overhauled April 25): hero tagline updated to "Find where your website is losing trust, leads, and revenue." with subtext "Free. No credit card. Results in minutes." DBJ emblem + "by DBJ Technologies" link under wordmark. Form unchanged (id="scan-form" added as anchor target). New server-rendered sections below the form via app/(grade)/pathlight/PathlightContent.tsx: (3) "What Your Report Includes" 2x2 dark glass card grid covering Pathlight Score, Revenue Impact Estimate, Top 3 Priority Fixes, Full Desktop & Mobile Screenshots; (4) "Most audits check code. Pathlight checks the experience." three-paragraph differentiator; (5) "Built for businesses where one lead matters" audience flow line; (6) Secondary CTA card with "Scan My Website Free" anchor + "Book a Strategy Call" link to /contact; (7) "Powered by DBJ Technologies" footer line. PathlightBackdrop (fixed inset-0) continues to span behind all sections as user scrolls.

### Active Bugs Being Fixed (April 25)
- About page: ScrollWordBatch component has words running together (inline-block whitespace collapse). CC prompt actively executing fix.
- About page: Headline "The Anti-Agency" wraps mid-word at certain viewport widths. Fix in same CC prompt.
- Homepage white flash: Multiple fix attempts (CSS class, !important, inline script). May still be occurring on first visit. Anti-flicker script in layout.tsx sets dark background before paint on homepage only.

### Known Gaps (Not Blocking Launch)
- No email capture or lead magnets anywhere on the site
- No blog or SEO content surface
- No Google Voice business line (signature has no phone number)
- No Google Business Profile set up yet
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

### Lockdown (April 27, working tree, NOT YET COMMITTED)
Pathlight internals stripped from public surfaces. Specifically: `/api/scan/[scanId]` no longer returns `businessScale`, `screenshotHealth`, or `industryBenchmark` fields (replaced with computed `isOutOfScope`/`outOfScopeLabel`/`screenshotNotice`). Chat stream errors return generic copy. Chat system prompt no longer receives `inferredVertical`/`businessModel`/benchmark `source`; new GUARDRAILS block refuses all internals via a fixed "Pathlight uses proprietary analysis methods" response. Inngest step IDs renamed to opaque s1/s2/s3/s4/a1/a2/a3/a4/s5/s6/e1/e2/e3/e4/w1/w2/w3 (any in-flight follow-up jobs at deploy time will break, expected). Pathlight landing report items + differentiator paragraph rewritten in outcome language. Work case study (lib/work-data.ts) Pathlight entry: `AI Pipeline Stages 5` + `Curated Verticals 206` metrics replaced with $0/scan-time/delivery; `AI/LLM Integration` removed from techStack; pipeline-architecture body text neutralized. Report-delivery email outcome rewrite (no more "Lighthouse performance scores, AI-powered design analysis, conversion psychology evaluation"). `productionBrowserSourceMaps: false` made explicit in next.config.mjs. Full audit + Phase 2 verification + Phase 3 feasibility doc shipped under docs/ai/.

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
