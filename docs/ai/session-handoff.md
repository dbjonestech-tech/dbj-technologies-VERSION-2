# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-28.md`](history/2026-04-28.md), which holds the
verbatim record of every session entry that was below this header before
archive.

## Most Recent Session: April 29, 2026 -- Luxury Residential design brief rebuilt as image-anchored deep dive

### What shipped

The `/work/design-briefs/real-estate` brief (the Lauren Prescott Luxury Residential template) was a 3-section analytical essay (How buyers use an agent's website / What most agent sites get wrong / What your agent site actually needs). Joshua wants the eight design-brief deep dives restructured so screenshots anchor each section's prose. This session shipped the schema/parser/renderer change that makes inline section images possible across all eight briefs, plus the full rewrite of the Luxury Residential brief as the first proof-of-concept (8 image-anchored sections, one screenshot per section).

### Files changed (4 + 8 new images)

- **`lib/design-briefs.ts`**: `DesignBriefSection` interface gained an optional `image?: { src: string; alt: string }` field. `parseBody` updated to recognize markdown image syntax (`![alt](src)`) inside section bodies and extract them onto the `image` field. Backward-compatible: any section that omits an image renders exactly as before.
- **`app/(marketing)/work/design-briefs/[slug]/page.tsx`**: section renderer now renders the image (when present) in a framed container between the heading and the paragraphs, with the same accent-tinted border and shadow treatment as the page-top hero preview.
- **`docs/design-briefs/real-estate.md`**: full content rewrite. 8 sections (A Practice Not a Brokerage Template / Currently Representing / A Public Ledger of Recent Closings / Trust Built on Specifics / Recognition Dated / The Private List / A Quiet Conversation / A Footer That Does the Compliance Work Quietly), each anchored by a markdown image referencing the matching screenshot. Headline updated from "What Luxury Residential Agents Need Online" to "The Architecture of a Luxury Residential Practice". Summary refreshed.
- **`public/design-briefs/real-estate.webp`**: replaced with the new clean hero screenshot (1800px wide, q=84, 185 KB, down from 588 KB).
- **`public/design-briefs/real-estate/`** (new directory, 8 files): `02-meet.webp` through `09-footer.webp`, all 1600px wide, q=82, 27-100 KB each. One inline image per body section.

### Voice and rules adherence

- Zero em dashes across all changed files (audited).
- First-person "I" used sparingly in the architect voice ("I built this surface to read like a working ledger...", "I treat this as the most valuable form...", "I did not put a form here..."); no studio-voice "we"/"our".
- Two "we"/"our" hits in the brand-voice scan are both inside quoted material (the agent's "shared in our first conversation" pull-quote and a client testimonial from the Sutton family). Acceptable.
- Substantial copy per section per the luxury-means-substantial rule.

### Pattern established for the remaining 7 briefs

The schema and renderer are now generic. To do the next brief (e.g. dental-practice, med-spa, upscale-restaurant, financial-advisor, pi-law, luxury-home-builder, hvac-contractor), Joshua provides the screenshots, I save them under `public/design-briefs/<slug>/` with numeric prefixes, and I rewrite the matching `docs/design-briefs/<slug>.md` with `![alt](path)` lines under each `## Heading`. The slug page renders without further code changes.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash audit on all 3 changed code/content files: 0.
- Brand-voice audit: only quoted material contains we/our (correct).

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/work/design-briefs/real-estate` and confirm: (1) the new hero preview renders cleanly at the page top, (2) each of the 8 body sections shows its anchor screenshot in a framed container between the heading and the prose, (3) the visual rhythm reads (heading > image > 3 paragraphs > next section) without the page feeling top-heavy or image-drowned, (4) the image alt text is descriptive enough for screen readers, (5) the page card preview on `/work` still picks up the right metadata. Once approved, hand me the screenshots for the next brief and I will repeat the pattern.

### Final state (post-commit)

Will populate after this commit lands.

---

## Previous Session: April 29, 2026 -- Soil Depot case study deep-dive comprehensively rewritten

### What shipped

The `/work/soil-depot` case study read like a technical SEO audit (8 sections heavy on JSON-LD, NAICS codes, entity wiring, TDPSA mechanics). Joshua asked for a wholesome, broad rewrite that opens with the zero-visibility framing, walks through the build at the right altitude (without enumerating every micro-enhancement), and closes with the AI-search validation anecdote (a major commercial developer found Soil Depot through an AI search engine, not Google, and reached out for a real-money project). Rewrote it end to end into 10 sections at a comfortable narrative altitude.

### Files changed (1)

- **`lib/work-data.ts`**: Full rewrite of the `soil-depot` `ProjectDetail` entry. Refreshed `description`, `notable`, `heroDescription`, `timeline`. Replaced the 8-section `sections[]` array (Client / Challenge / Structured Data / GBP / City Targeting / Compliance / Tech SEO / Outcome) with 10 sections at broader altitude: The Client / Zero Visibility Before This Build / The Goal / The Foundation / City-Level Search Architecture / The Soil Calculator / The Regional Team, Surfaced / An Ongoing Engagement / AI Search Validated the Architecture / The Result. `techDetails[]` collapsed from 7 SEO-jargon entries (Rank Math, Schema.org, GBP, Google Maps API, Bing Webmaster Tools, Google Search Console as separate items) to 5 broader entries: WordPress / Custom Soil Calculator / Schema.org (JSON-LD) / Google Business Profile + Maps / Technical SEO Foundation. `techStack` simplified from 6 SEO-tool labels to 4 broader items: WordPress, Custom Soil Calculator, Schema.org (JSON-LD), Google Business Profile. `slug`, `name`, `category`, `gradient`, `liveUrl`, `metrics`, `image`, `ctaText`, `ctaHref` all preserved.

### Voice and rules adherence

- Zero em dashes (audited).
- First-person "I" used sparingly ("I built", "Tyler now refers other Texas businesses to me organically..."); no "we"/"our".
- Tyler named once where it adds warmth; "the team" / "the operation" elsewhere for client-side third-person.
- "Zero visibility before DBJ Technologies" is explicit in section 2 per Joshua's instruction.
- AI search anecdote phrased as "a major commercial developer" (no scale or industry name claim) for credibility without overclaiming.
- Wholesome and broad per Joshua's explicit ask: not too specific on any one enhancement, healthy overview throughout.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash audit on `lib/work-data.ts`: 0.
- Brand-voice audit: no stray "we"/"our"/"us" outside word-boundary false positives (audited via word-boundary grep with the standard ignore list plus business/customer/use/etc).

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/work/soil-depot` and confirm: (1) all 10 sections render in order with proper headings, (2) the new `techStack` (4 items) and `techDetails` (5 items) display correctly on the right rail without breaking the visual rhythm of the page, (3) the new `description` populates the card preview correctly on `/work`, (4) the metrics stay 5/5/TDPSA (kept intact), (5) the AI Search Validated section reads as credible and not over-claiming. If Joshua wants to expand the AI-search section with more specifics about the developer or the project, that is a content edit available now that the foundation is in place.

### Final state (post-commit)

- Feature commit: `e31c14d` -- feat(work): rewrite Soil Depot case study as a wholesome, broad deep dive. 2 files changed, 73 insertions, 41 deletions.
- Pushed to `origin main` (`093dd88..e31c14d main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 29, 2026 -- Star Auto case study deep-dive comprehensively rewritten

### What shipped

The `/work/star-auto-service` case study on the DBJ marketing site was a 4-section, ~325-word generic write-up that didn't reflect the scope of what's actually been built on the Star Auto site over the last several weeks (six service-area pages, twelve service pages, five resource guides, sitewide reviews chip, desktop call modal fix, cinematic hero entrance, sitewide mobile optimization pass). Rewrote it end to end into a 12-section, ~1,800-word comprehensive deep dive that opens with the two real load-bearing problems (Google visibility gap; desktop tel: link silently failing for years) and walks through every layer of the rebuild that addressed them.

### Files changed (1)

- **`lib/work-data.ts`**: Full rewrite of the `star-auto-service` `ProjectDetail` entry. Refreshed `description`, `notable`, `heroDescription`, `timeline`. Replaced the 4-section `sections[]` array with 12 sections: The Client / The Visibility Problem / The Phone That Did Not Ring / The Foundation / The Service Area Network / The Service Pages / The Resources Hub / Bilingual, Warranty, and Trust Signal / The Phone, Fixed / Real Photography, Real Motion / Mobile, Down to 360px / The Result. `techDetails[]` refreshed from 6 entries to 7, replacing Google Analytics with TypeScript, broadening JSON-LD entry to "JSON-LD (LocalBusiness, Service, FAQPage)", adding Google Maps + GBP entity-wiring entry. `techStack` updated from `["Next.js 16", "Tailwind CSS 4", "Resend", "Google Analytics"]` to `["Next.js 16", "TypeScript", "Tailwind CSS", "Resend"]`. `slug`, `name`, `category`, `gradient`, `liveUrl`, `metrics`, `image`, `ctaText`, `ctaHref` all preserved.

### Voice and rules adherence

- Zero em dashes (audited; CLAUDE.md non-negotiable).
- First-person "I" used sparingly and naturally ("I rebuilt the site from zero..."); no "we"/"our" referring to the studio.
- Third-person "the team" / "the shop" used for Miguel's side; "Miguel" named at the top and where it adds warmth.
- No DBJ commodity-agency framing; case study reads as principal-architect work, not deliverables list.
- Substantial copy per the luxury-means-substantial rule (~1,800 words vs prior ~325).

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash audit on `lib/work-data.ts`: 0.
- Brand-voice audit on `lib/work-data.ts`: no stray "we"/"our"/"us" outside word-boundary false positives (audited via word-boundary grep with the standard ignore list).

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/work/star-auto-service` and confirm: (1) all 12 sections render in order with proper headings, (2) the new `techStack` and `techDetails` show on the right rail, (3) the new `description` populates the card preview correctly on `/work`, (4) the metrics stay 100/100/100 (kept intact), (5) the page still scores well on Lighthouse despite the substantially longer copy. If the page feels too long visually, candidates to merge are "Real Photography, Real Motion" + "Mobile, Down to 360px" into a single "The Polish Layer" section, or to split "The Phone That Did Not Ring" + "The Phone, Fixed" if the narrative tension across them reads forced.

### Final state (post-commit)

- Feature commit: `3cc63bd` -- feat(work): rewrite Star Auto case study as a comprehensive deep dive. 2 files changed, 96 insertions, 24 deletions.
- Pushed to `origin main` (`8ebb0cb..3cc63bd main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 29, 2026 -- Star Auto work-card hero refreshed to include "4.8 · 136 REVIEWS" pill in nav

### What shipped

Second image swap of the same day. The earlier 12:38 PM screenshot didn't include the "4.8 · 136 REVIEWS" social-proof pill that Star Auto's nav now shows next to "BOOK SERVICE". Joshua provided a current 1:05 PM screenshot capturing the pill. Replaced the webp asset in place again.

### Files changed (1)

- **`public/images/case-studies/star-auto-desktop.webp`**: replaced. Source PNG 3020x1896 (3.48 MB). Resized to 1600px wide (1600x1005, native aspect preserved) and re-encoded as webp at q=82 via `cwebp`. Final size 82 KB. Filename and path identical, so no code change.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- `magick identify` on the new file: `WEBP 1600x1005 8-bit sRGB 82006B`.

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/work` and confirm the Star Auto card preview now shows the "4.8 · 136 REVIEWS" gold star pill in the upper right of the nav strip. Hover scale should still play cleanly.

### Final state (post-commit)

- Feature commit: `f5fa36f` -- chore(work): refresh Star Auto card preview to capture new reviews pill.
- Pushed to `origin main` (`e6f2e8e..f5fa36f main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 29, 2026 -- Star Auto work-card hero swapped to current "Expert auto repair, done right" screenshot

### What shipped

The Work page card for Star Auto Service was using an older desktop screenshot. Joshua provided the current hero shot (the gold-on-dark "Expert auto repair, done right." headline with the NAPA AutoCare badge in the upper right and the shop's actual storefront photo as the bg). Replaced the existing webp asset in place so no code or data changed.

### Files changed (1)

- **`public/images/case-studies/star-auto-desktop.webp`**: replaced. Source was a 3022x1896 PNG screenshot (3.46 MB). Resized to 1600px wide (1600x1004, preserving native aspect) and re-encoded as webp at q=82 via `cwebp`. Final size 81 KB (down from the prior 86 KB at 1600x882). Filename and path identical, so `lib/work-data.ts:122` (the `image` field on the `star-auto-service` `ProjectDetail`) needed no edit.

### Why no aspect/code changes

The Work-page card renders the image inside `aspect-[3/2]` with `object-cover object-top` (`app/(marketing)/work/WorkContent.tsx:71-78`). The new image's native aspect is ~1.594 (closer to 3:2 than the prior 1.814), so object-cover crops a slightly narrower band off the bottom than before -- the hero headline, NAPA badge, and "Book a Service" / "Call" buttons all stay visible. The bottom stats band (28 / 4.8 / ASE / NAPA banner) gets cropped at the card edge, which is consistent with how the prior screenshot behaved.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- `magick identify` on the new file: `WEBP 1600x1004 8-bit sRGB 81174B`.

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load `/work` and confirm: (1) the Star Auto card preview shows the gold "Expert auto repair, done right." headline, (2) the NAPA AutoCare badge is visible in the upper right of the card, (3) the image isn't visibly stretched or letterboxed, (4) the card hover scale animation still plays cleanly. If the bottom-of-screenshot stats band feels too cropped, regenerate the webp from the same source PNG with a taller crop (or output at 1600x1066 -- 3:2 exact -- via `cwebp -crop` before resize) and re-replace.

### Final state (post-commit)

- Feature commit: `b36a9fa` -- chore(work): swap Star Auto card preview to current hero screenshot. 2 files changed, 31 insertions, 1 deletion (the binary image swap shows as 0/0 in `--stat` and the +31/-1 reflects the handoff entry).
- Pushed to `origin main` (`38307ef..b36a9fa main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 28, 2026 -- "Operations Cockpit" rebranded to "Canopy"; surgical rename across DBJ marketing site + new Canopy starter repo

### What shipped

Productized engagement renamed from "Operations Cockpit" to **Canopy**. Same product, same scope, same $25K starting price. Single proprietary product name, no brand qualifier needed. Naming exercise covered roughly 25 candidates across 6 brainstorm rounds; full disqualifier list and shape-of-the-right-answer rule captured in `docs/ai/decision-log.md`.

### What changed in the DBJ marketing site

- `lib/pricing-data.ts`: `slug: "operations" -> "canopy"`, `name: "Operations Cockpit" -> "Canopy"`, `ctaHref: "/contact?topic=operations-cockpit" -> "/contact?topic=canopy"`, hero/FAQ copy updated. URL becomes `/pricing/canopy`.
- `app/(marketing)/about/AboutContent.tsx`: both CTA hrefs updated (primary -> `/pricing/canopy`, secondary -> `/contact?topic=canopy`).
- `app/(marketing)/pricing/PricingContent.tsx`: SectionHeading title `"Operations Cockpit" -> "Canopy"`, card link href updated.
- `app/(marketing)/contact/ContactContent.tsx`: `OPERATIONS_COCKPIT_DEFAULTS` renamed to `CANOPY_DEFAULTS`, topic detection accepts both `topic=canopy` (canonical) and `topic=operations-cockpit` (legacy, transition safety), topic card title `"Operations Cockpit scoping" -> "Canopy scoping"`, message text updated.
- `next.config.mjs`: added 308 redirect from `/pricing/operations` to `/pricing/canopy`.

### What changed in the Canopy starter repo (separate codebase)

Repo `dbjonestech-tech/operations-cockpit` renamed to `dbjonestech-tech/canopy` via `gh repo rename`. Local remote URL updated. Internal renames:
- Component `OpsBeacon.tsx` -> `CanopyBeacon.tsx` (file + export)
- Cookies `ops_vid/ops_sid` -> `cnp_vid/cnp_sid`
- Env vars `OPS_ALLOWED_ORIGINS` -> `CANOPY_ALLOWED_ORIGINS`, `NEXT_PUBLIC_OPS_BEACON_URL` -> `NEXT_PUBLIC_CANOPY_URL`
- Admin sidebar + signin page heading -> "Canopy"
- `package.json` name -> `canopy`
- README, install runbook, engagement-owner runbook all rewritten

Vercel env updated: `OPS_ALLOWED_ORIGINS` removed, `CANOPY_ALLOWED_ORIGINS` added with same value (`https://thestarautoservice.com,https://www.thestarautoservice.com`). Vercel project name kept as `starauto-ops` (internal label, not customer-facing). Local working directory `/Users/doulosjones/Desktop/operations-cockpit/` will be renamed to `/canopy/` post-session; pre-session disk-name drift is a known artifact.

### Star Auto first install: status

Round 2 in progress. Done: cockpit repo + GitHub + Vercel project + 5 env vars (NEXTAUTH_SECRET, ANALYTICS_IP_SALT_BASE, NEXTAUTH_URL, CANOPY_ALLOWED_ORIGINS, ADMIN_EMAILS). Star Auto owner (Miguel) consented to the case study and beacon integration; admin email is `thestarautoservice1@gmail.com` (personal Gmail). Blocked on:
1. Joshua to set up Google OAuth client (Google Cloud Console, ~5 min) and paste back GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
2. Joshua to provision Neon Postgres (Vercel dashboard -> Storage -> Neon, auto-injects POSTGRES_URL)
3. Joshua to add Cloudflare DNS record (CNAME `ops` -> `cname.vercel-dns.com`, grey cloud)

After those three, next steps autonomous: run migrations, deploy, clone Star Auto repo via gh, integrate `<CanopyBeacon />` into Star Auto's root layout, smoke-test, then add Star Auto Canopy as the 4th Work case study on the DBJ site.

### Verification

- Cockpit repo: `npx tsc --noEmit` clean post-rename
- DBJ marketing site: typecheck + lint TBD this commit (pending below)
- Memory updated: `MEMORY.md` index + new `project_canopy_brand.md` entry capture the brand decision so future sessions do not relitigate

### Final state (post-commit)

Will populate after this commit lands.

---

## Previous Session: April 28, 2026 -- Tyler Dirks (Soil Depot) added as second testimonial; band rebuilt as dual-quote layout

### What shipped

The slim testimonial band now shows two real Google reviews side by side: Miguel Ibarra (Star Auto Service, Richardson) and Tyler Dirks (Soil Depot, Plano). Different verticals on purpose, so the band reads as breadth (auto service + commercial soil brokerage) rather than a single happy customer. Tyler's "Google Local Guide · 45 reviews · 17 photos" credential is surfaced as a small italic line under his attribution; Miguel doesn't have one and the asymmetry is honest, not awkward.

### Files changed (2)

- **`lib/constants.ts`**: Added Tyler's testimonial entry. Extended the `Testimonial` interface with an optional `credential?: string` field for verified-reviewer signals. Tyler's quote was lightly cleaned of two clear typos from the source Google review ("on his much people" -> "on how much people", "money will spent" -> "money well spent"); voice and meaning preserved verbatim otherwise.
- **`components/sections/TestimonialBand.tsx`**: Refactored from single-quote to dual-quote layout. Extracted `StarRow` and `Quote` helpers. Outer grid is `grid-cols-1 md:grid-cols-2` with `md:divide-x md:divide-accent-blue/15` for the vertical hairline between columns on desktop; each column gets `md:px-8 lg:px-10` so content breathes off the divider. On mobile the columns stack and a small horizontal hairline (`w-32`) sits between them. Quote font slightly reduced (`text-base md:text-lg`) so two columns read at a comfortable density. Each `Quote` motion gets a staggered delay (`index * 0.08`) so they fade in one after the other.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash check on changed files: 0 introduced.
- Tyler quote typo cleanup is conservative; revert to verbatim with: `git show HEAD:lib/constants.ts` for the cleaned version (or paste verbatim text and I'll swap).

### Next recommended task

After Vercel rebuild settles, incognito-load the homepage and confirm: (1) two columns sit side by side on desktop with a thin vertical hairline between them, (2) on mobile both stack with a small horizontal hairline between them, (3) Tyler's "Google Local Guide · 45 reviews · 17 photos" italic line renders below his attribution and Miguel's column doesn't have an awkward gap where the same line would have been, (4) both "View live site" links open the correct site (thestarautoservice.com + soil-depot.com) in new tabs, (5) the staggered fade-in plays cleanly on first scroll, (6) columns don't visually weigh too unevenly despite Tyler's quote being ~3x longer than Miguel's.

### Final state (post-commit)

- Feature commit: `2b9ac31` -- feat(homepage): add Tyler Dirks (Soil Depot) testimonial; band -> dual quote. 3 files changed, 130 insertions, 59 deletions.
- Pushed to `origin main` (`c76fa23..2b9ac31 main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 28, 2026 -- Testimonial promoted to slim band between Hero and PathlightCTA

### What shipped

The single testimonial that landed earlier today as a buried section on the light marketing background (where the dark glass card I designed disappeared into the bg) is now a slim refined band sitting directly between Hero and PathlightCTA. Validates the studio claim from the hero before the prospect is asked to do anything.

**Files changed (3 + 1 deleted):**
- **Created** `components/sections/TestimonialBand.tsx`: light-bg-aware slim band. Top + bottom hairline gradient dividers (`bg-gradient-to-r from-transparent via-accent-blue/25 to-transparent`), centered figure with 5 small gold stars (h-4), `font-display text-lg md:text-xl` blockquote, `Name, Title · Business · Location` attribution row, mono uppercase `GOOGLE REVIEW · View live site →` micro-row. No card border (so it works on either light or dark backgrounds without needing to know the neighbor section's bg). `print-hidden`. Framer Motion entrance `initial={{ opacity: 0, y: 16 }} whileInView` matching other homepage sections, `viewport={{ once: true, margin: "-60px" }}`.
- **Modified** `app/(marketing)/page.tsx`: added `<TestimonialBand />` between `<Hero />` and `<PathlightCTA />`. Removed the old `<TestimonialsSection />` import + render entirely (it was rendering nothing useful in the new placement model).
- **Deleted** `components/sections/Testimonials.tsx`: deprecated. The dark glass card it shipped didn't read on the light marketing bg. When a second testimonial lands, either extend the band into a small carousel or build a new section component fresh against whichever bg it sits on. Old file is in git history (`8ca63ea`) for reference.

### Design rationale

A slim band on the light bg, immediately after the hero, does three things at once: (1) caps off the studio's pitch with social proof before any other narrative, (2) doesn't compete with the HeroCinema's "Architect The Impossible" message because it sits below the fold of the cinema, (3) primes the prospect for the dark Pathlight section that follows. The hairline gradient dividers give it editorial gravitas without adding a card border that would have to track the neighbor section's bg.

### Lesson recorded

Always verify the actual rendered background of the destination section before styling a new component. The earlier dark-glass styling for the SoloTestimonial assumed dark bg without checking; on the light marketing background the border + fill disappeared and the card looked unstyled. Going forward: a card design that needs to work in multiple page positions should either drop the card border entirely (like this band) or be explicitly bg-aware.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (exit 0).
- Em-dash check on changed files: 0.
- No stale `TestimonialsSection` references anywhere.

### Next recommended task

After Vercel rebuild settles (1-3 min), incognito-load the homepage and confirm: (1) the band sits cleanly between the Hero's "SCROLL ⌄" chevron and the dark Pathlight section, (2) the top + bottom hairline dividers fade in/out cleanly, (3) the 5 gold stars are visible against the light bg, (4) the quote reads at a comfortable size, (5) the attribution and source row wrap naturally on mobile, (6) "View live site" opens thestarautoservice.com in a new tab, (7) the section's vertical padding doesn't crush against PathlightCTA's top edge.

### Final state (post-commit)

- Feature commit: `ed51823` -- feat(homepage): promote testimonial to slim band between Hero and Pathlight. 4 files changed, 127 insertions, 100 deletions.
- Pushed to `origin main` (`309a61d..ed51823 main -> main`).
- Working tree clean apart from this snapshot amendment.

---

## Previous Session: April 28, 2026 -- First real testimonial on homepage + hyphen sweep across user-facing copy

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
