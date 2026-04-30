# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-29-to-2026-04-30.md`](history/2026-04-29-to-2026-04-30.md),
which holds the verbatim record of every session entry that was below this
header before the April 30 reset.

## Current state (end of April 30, 2026)

### Most recent commits (top of `origin main`)

- (this commit) docs: update session-handoff with afa4958 commit hash
- `afa4958` feat(strategy): make Pathlight diagnoses, DBJ fixes the homepage's organizing principle
- `25a71bd` docs: update session-handoff with f68c756 commit hash
- `f68c756` feat(contact + services): surface email/phone on contact, fix services capability stack on mobile
- `6b1e0a3` fix(pricing): align CTAs and feature dividers across the three tier cards
- `0c4cbaa` revert: pathlight logo changes
- `72be7f0` fix(work/canopy): video occupies hero, no misleading 'live' caption, more copy sanitization

Working tree clean. All changes pushed to `origin main`. Vercel auto-deploys from main.

### What landed in the last code sprint (April 30 evening, post-audit response)

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

1. **NAP consistency (Dallas vs Royse City)** — escalated to Google directly on 2026-04-30, Joshua awaiting reply. Site brands as "Dallas, TX" (`SITE.address`, contact Location card, CLAUDE.md identity). GBP shows physical address `5073 Co Rd 2656, Royse City, TX 75189`, service area `Hunt County, Texas`, phone `(682) 325-8324`, 5.0 / 2 reviews, profile strength "Looks good!". Google's local algorithm treats the two as different NAP strings, which dilutes local-pack signal. Two clean fixes are still on the table while we wait: (a) hide GBP physical address and broaden service area to "Dallas-Fort Worth Metroplex" (lower-effort, keeps home address private), or (b) widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex". Hold all local-SEO work until Google's response lands.
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
