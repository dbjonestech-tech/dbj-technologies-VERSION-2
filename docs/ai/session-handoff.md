# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-03-to-2026-05-04.md`](history/2026-05-03-to-2026-05-04.md),
which covers the May 3 Inngest-cron + Pathlight reliability arc and the
May 4 Canopy showcase swap.

## Current state (May 6, 2026, late morning)

Pathlight reliability + report-credibility arc closed for the
bshaccounting.com Brian-prep pass. HEAD authoritative via
`git rev-parse --short HEAD`.

Tonight / this morning:

- `69960ef` median-of-3 PSI runs (kill single-sample noise)
- `8b8836e` write medianized values back into Lighthouse raw
- `a31981b` compact no-og-image card state (replaced full-aspect
  placeholder with one-line "No preview image set" strip)
- `f1c4c16` read CLS from `numericValue`, not Lighthouse audit
  `score` (the actual user-facing CLS bug fix)
- `7a385f5` docs: queue interactive revenue calculator in
  Priority 5 backlog (working-tree sweep)
- `e8e37f6` fix(pathlight): align no-og-image problem
  severity and copy with platform reality. Drops severity from
  `high` to `medium` and rewrites detail to match LinkedIn Post
  Inspector ground truth (LinkedIn shows title + URL only;
  Slack richer). Memory file `feedback_verify_social_share_rendering.md`
  saved so per-platform claims get verified against the platform's
  own debugger going forward.

Working tree at session close: clean (after this commit lands).
Push status: pushed to `origin main`.

Next concrete action when Joshua picks back up: rescan
bshaccounting.com from `/admin/scans/new` and confirm the report
reads cleanly end-to-end before sending to Brian.

## Prior state (May 5, 2026, very late)

`git log -1` is authoritative for the actual HEAD. After the Phase 5
page-system commit `a70d3c6` landed earlier today, nine security
audit follow-ups closed in sequence on top of it across three waves:

- Wave 1 (mid-late): `2ac6f54` (security.txt), `14fc13c` (Pathlight
  gate atomic check-and-reserve), `def65bf` (DNS-rebinding pin in
  validateUrl).
- Wave 2 (late-very-late): `bacaa1f` (email actions to admin role),
  `262067c` (scan submitter URL boundary validation), `883821a`
  (client-upload extension allowlist), `de717a9` (CI workflow
  SHA-pin).
- Wave 3 (very-late): `ecac6a7` (beacon endpoint server-side
  hardening: rate limit + payload cap), `9d2e406` (HMAC tokens on
  email tracking endpoints).

All five planned page-system archetypes are also live: Editorial,
Reference Dense, Local Lander, Service Deep-Dive, and Industry
Vertical, with five validation pages shipped
(`/resources/core-web-vitals-explained`,
`/resources/agency-vs-studio-vs-freelancer`, `/dallas-web-design`,
`/services/nextjs-development`, `/industries/auto-service`). Previous
handoff anchor commits: `d7f2de1` (Phases 1+2), `2696989` (Phase 3),
`b3ca460` (Phase 4). Joshua's parallel Canopy track shipped at
`5437174` between Phase 4 and Phase 5; that scaffold is unrelated to
the page-system arc.

### Security audit follow-ups wave 3: F3 server-side, F7 (May 5, very late)

Final two items from `/tmp/dbj-audit-2026-05-04.md` closed in two
independent commits.

- **Audit F3, beacon server-side hardening** (`ecac6a7`). Two new
  Upstash limiters (60/min/IP and 600/hour/contactId) plus an 8 KB
  raw-body cap, all wired into `app/api/canopy/beacon/[contactId]/
  route.ts`. The body is read with `req.text()` first so the size
  cap fires before the JSON parser. Both limiters fail open if
  Upstash is unreachable; the master toggle
  (`attribution_beacon_enabled`, default false) remains the primary
  gate. The snippet-side half (per-contact opaque token in the
  generated beacon snippet) stays deferred because it requires a
  snippet refresh on every deployed install (Tyler's Star Auto site
  today, future Canopy installs later).
- **Audit F7, HMAC tokens on email tracking** (`9d2e406`). New
  `lib/canopy/email/tracking-token.ts` exports
  `computeEmailTrackingToken(messageId)` and
  `verifyEmailTrackingToken(messageId, token)` using HMAC-SHA256 over
  `"email-tracking:" + messageId` keyed on `AUTH_SECRET` (no new env
  var needed; namespace prefix prevents cross-purpose token replay).
  16-char hex prefix, constant-time comparison. `wrapWithTracking`
  in `lib/actions/email.ts` appends `?t=<token>` to both the pixel
  src and every linkified anchor; the pixel and click endpoints
  validate before recording. Mismatched / missing tokens still serve
  the gif and still 302-redirect, so the recipient experience is
  unaffected; only the DB record is skipped. Trade-off: messages
  sent before this rollout will silently stop reporting opens /
  clicks (analytics integrity over historical continuity).

**Audit posture across May 4 + May 5:** every Critical / High / Medium
finding plus every Low finding except snippet-side beacon hardening
is closed. Tally against `/tmp/dbj-audit-2026-05-04.md`: 10 fully
closed (F1, F2, F4, F5, F6, F7, F8, F9, F10, F11), 1 partial (F3
server-side closed, per-contact opaque token in the snippet deferred
because it requires a snippet refresh on Tyler's deployed install
plus every future Canopy install), and 6 Info-severity items
reviewed with no action required (F12 explicit Inngest signing-key
passthrough, F13 Sentry DSN is public-by-design, F14 git-log secret
references are variable names not values, F15 dbjonestech@gmail.com
references are guards not violations, F16 change-monitoring cron
SSRF guard is future-conditional, F17 CSP is clean). Pathlight
SDLC posture is materially tighter than the May 4 snapshot.

### Security audit follow-ups wave 2: F11, F6, F8, F9 (May 5, very late)

Four more items from `/tmp/dbj-audit-2026-05-04.md` closed in
sequence. Each is its own commit + Vercel deploy.

- **Audit F11, email actions to admin role** (`bacaa1f`). Replaced
  `if (!session)` with `await requireRole("admin")` across all five
  exported actions in `lib/actions/email.ts`. Matches the pattern in
  team.ts, api-tokens.ts, webhooks.ts. Removes the dependency on
  upstream guards (signIn callback, middleware) holding for the
  defense-in-depth tier.
- **Audit F6, scan submitter URL boundary validation** (`262067c`).
  Public scan API at `app/(grade)/api/scan/route.ts` now calls
  `normalizeUrl` and `hostnameResolvesPublic` at the boundary, so
  bad protocols / private hosts / localhost get a 400 before any
  DB write. The Inngest pipeline still does the same checks plus
  the HEAD probe as defense in depth. The HEAD probe is deliberately
  NOT run at the boundary so the API stays sub-second.
  `hostnameResolvesPublic` is now exported from
  `lib/services/url.ts` so the boundary check shares the same IP
  range coverage validateUrl uses.
- **Audit F8, client-upload extension allowlist** (`883821a`). The
  download proxy at `/portal/files/[id]/download` already forces
  Content-Disposition: attachment, which closes the immediate
  stored-XSS vector when an admin uploads .html. This adds an
  explicit extension allowlist at the upload boundary in
  `app/admin/clients/actions.ts` (PDF, raster images, Office docs,
  zip, mp4 / mov / webm, AI / EPS / PSD / .sketch / .fig). SVG is
  deliberately excluded. Defense-in-depth so a future weakening of
  the proxy disposition cannot reintroduce the vector.
- **Audit F9, CI workflow SHA-pin** (`de717a9`). Pinned the three
  GitHub Actions used in `.github/workflows/lighthouse-gate.yml` to
  full 40-char commit SHAs (with `# v4.x.y` comments for review):
  `actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5` (v4.3.1),
  `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0),
  `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02`
  (v4.6.2). Trigger is pull_request (not pull_request_target) so
  blast radius is bounded to CI; this hardens that bound. Newer
  majors exist (v6 / v6 / v7); upgrading those is on the backlog
  as a separate task.

**Audit posture across May 4 + May 5:** 11 of 17 audit findings
closed (F1, F2, F3 eslint, F4 eslint-config-next, F5 axios, plus
audit-numbering F1, F2, F4, F5, F10 wave 1, then F11, F6, F8, F9
wave 2; the audit-doc and yesterday's session-handoff use
overlapping numbering; `/tmp/dbj-audit-2026-05-04.md` is the
canonical source). Remaining: F3 beacon hardening, F7 email
tracking IDs (both deferred this session: F3 because the snippet
generator change affects Tyler's deployed install, F7 because it
needs a schema migration that wants Joshua review).

### Security audit follow-ups F10, F5, F4 (May 5, late)

Three Medium / Low items from `/tmp/dbj-audit-2026-05-04.md` closed
in three independent commits. Each shipped its own Vercel deploy.

### Security audit follow-ups F10, F5, F4 (May 5, late)

Three Medium / Low items from `/tmp/dbj-audit-2026-05-04.md` closed
in three independent commits. Each shipped its own Vercel deploy.

- **Audit F10, security.txt** (`2ac6f54`). Added
  `public/.well-known/security.txt` per RFC 9116 with mailto contact,
  ISO 8601 Expires (2027-05-05), Preferred-Languages, and Canonical
  pinned to the production host. Researchers now have a documented
  disclosure channel.
- **Audit F5, Pathlight gate atomic check-and-reserve** (`14fc13c`).
  Replaced the `canFireScan` + `incrementScanUsage` TOCTOU pattern
  with a single atomic UPDATE that increments only when all three
  layers pass. New `tryReserveScan(kind, count)` and
  `releaseScanReservation(count)` in `lib/canopy/pathlight-gate.ts`.
  Migrated four firing call sites: `triggerRescanForContact`,
  `rescanByScanIdAction`, `scanProspectCandidateAction`, and the
  batch case `scanCompetitorsAction` (which uses `tryReserveScan(N)`
  + try/finally refund for partial-fire). Read-only sites
  (`/admin/contacts/[id]` UI, `automation/actions.ts` early-fail)
  stay on `canFireScan`. `incrementScanUsage` removed (zero callers
  after migration). Two concurrent admin clicks at remaining=1 can
  no longer both pass.
- **Audit F4, DNS rebinding pin in validateUrl** (`def65bf`). The
  HEAD probe used to do two DNS lookups (one in
  `hostnameResolvesPublic` and one inside `fetch` at connect time);
  attacker-controlled DNS could return public for the first lookup
  and 169.254.169.254 for the second. New `resolveToPublicIp` does
  one lookup and returns the IP the connector should use; new
  `pinnedAgent` returns an undici Agent whose `connect.lookup`
  always returns that exact IP regardless of subsequent DNS. TLS
  SNI and Host header continue to use the URL hostname so HTTPS
  certs validate normally. Re-pinning happens per redirect hop;
  agents close in finally. `undici@^8.2.0` added as an explicit
  runtime dep (Node bundles its own at runtime; explicit install
  gives types and version determinism).

**Verification gates passed (this round):**

- `npx tsc --noEmit` clean after each of F10, F5, F4
- `npm run lint` clean
- `npm run build` succeeds; only the pre-existing edge-runtime
  advisory remains (unrelated, predates this work)
- 0 em dashes added in any changed source file
- All three Vercel deploys confirmed (F10 Ready, F5 Ready, F4
  Building at handoff write)
- Surgical staging throughout: Joshua's parallel `page-system` and
  `industries` working-tree files were deliberately NOT included in
  any of the three security commits

Audit posture after this round: 7 of 17 audit findings closed across
the May 4 + May 5 sessions. Remaining: F3 beacon hardening, F6 public
scan URL validation, F7 email tracking IDs, F8 file upload allowlist,
F9 CI SHA pinning, F11 email actions auth narrow.

### Industry Vertical archetype + Auto Service page (May 5, mid, phase 5)

After Phase 4, Joshua said "Continue with the fifth archetype." Phase 5
brings the fifth and final planned archetype online and ships
`/industries/auto-service` as the validation slice. After Phase 5,
the page-system architecture is complete: every remaining page in
the 65-page plan is content-only work, not architecture work.

**One new section primitive** under `components/sections/`:

- `RegulatoryCallout.tsx` (server). Takes a `kind`
  (legal / medical / accessibility / privacy / trust), a title, a
  body, and an optional source citation. Used inline within Industry
  sections to surface compliance, accessibility, or trust framing
  without breaking the prose flow. The validation page uses two
  callouts: WCAG 2.2 accessibility framing in the design-principles
  section, and a "do not fake what you can prove" trust callout in
  the trust section.

**New: `components/templates/IndustryVerticalLayout.tsx`** (client).
The fifth archetype, distinct from the four already live:

- Photo hero by default (split-grid with the validation page using a
  real screenshot of the Star Auto production site as the hero
  image). No other archetype uses a photo hero, which gives the
  Industry pages immediate visual identity.
- Per-section break vocabulary expanded to include `image` (full-bleed
  image break with optional caption). Validation page uses one
  full-bleed image break mid-page reinforcing the Star Auto proof.
- Inline `RegulatoryCallout` slots inside any section so vertical-
  specific compliance framing stays attached to the surrounding
  argument rather than floating as an aside.
- A dedicated "proof" block after the main sections, rendered as
  numbered section, with an optional link to the full case study at
  `/work/[slug]`.
- Same FAQ + accent-anchored CTA + Sources + Author block tail as
  every other archetype.

**Updated: `lib/page-system/registry.ts`**. Added the
auto-service entry. Tokens chosen to maximize visual difference
from the four prior live pages: blue accent (matches Dallas, but
totally different archetype with photo hero), photo hero, rule
breaks plus one image break, clean texture, full-color image
treatment.

**New page route:** `app/(marketing)/industries/auto-service/`:

- `page.tsx` (server). Reads from registry for `generateMetadata`,
  returns the client content. No collision with `/work/[slug]` or
  any other dynamic segment; `/industries` is a brand-new top-level
  segment.
- `AutoServiceContent.tsx` (client, ~340 lines). ~1,950 words across
  4 narrative sections (buyer reality, common failure patterns,
  design principles that convert, trust signals) plus the proof
  block centered on Star Auto Service. 7 buyer FAQs (rebuild vs
  redesign, custom vs templated, local pack ranking, bilingual
  content, cost, shop management integration, post-launch
  maintenance). CTA points to /contact as primary and /pathlight as
  secondary, framed honestly as "first call is diagnostic" plus
  "free Pathlight scan for a fast first read."

**Walking-the-talk anchor:** the proof block leans hard on Star Auto
Service in Richardson (Miguel Ibarra, twenty-eight years on Belt
Line Road, ASE-Certified, NAPA Auto Care, bilingual, 4.8 across
136+ Google reviews, live at thestarautoservice.com). Hero image
is the actual production site screenshot. This is the strongest
walking-the-talk anchor available in the entire 65-page plan,
which is why auto-service was the right validation page for this
archetype.

**6 verified citations:**
1. Pew Research Center: Mobile Fact Sheet (97% cellphone, 91%
   smartphone ownership)
2. U.S. Bureau of Labor Statistics: Occupational Outlook Handbook,
   Automotive Service Technicians and Mechanics
3. ASE: National Institute for Automotive Service Excellence
4. NAPA Auto Care Center program
5. Google Search Central: local search ranking systems
6. W3C: WCAG 2.2 (target size and accessibility floor)

**New research notes file:** `docs/ai/research/local-cluster-sources.md`.
Captures the verified primary-source URLs for the 18 city pages in
the planned local cluster, drawn from a Gemini deep-research pass
that surfaced real EDC, Chamber, BLS, and Census endpoints. The
file lists per-city sources, a verification protocol, and an
explicit list of what was discarded from the Gemini output (SEO
marketing blogs, vendor-bias TCO tables, unverifiable specific
percentages, em-dashed prose). Saves a research pass per city when
the local cluster build begins.

**Brand and accuracy gates passed (phase 5):**
- `npx tsc --noEmit` clean for all Phase 5 files. (Project-wide tsc
  surfaces 4 unrelated errors in `lib/services/url.ts`, which is
  Joshua's parallel Pathlight work in flight, NOT staged in this
  commit.)
- `npm run lint` clean.
- Zero em or en dashes in any Phase 5 file. Caught and fixed two
  pre-existing en dashes in author blocks of
  `IndustryVerticalLayout.tsx` and the prior-shipped
  `ServiceDeepDiveLayout.tsx` ("Dallas–Fort Worth" → "Dallas-Fort
  Worth metro") during the triple-check pass.
- Caught and fixed four em dashes that crept into the
  `local-cluster-sources.md` research notes file before commit.
- Banned-phrase scan clean.
- First-person voice throughout. Caught and fixed one collaborative-
  "we" instance in the FAQ ("we confirm" → "I confirm") during the
  triple-check pass.
- Pathlight described by outcomes only.
- Honest "skip" framing applied: page recommends a templated path
  for shops firmly under $25K budget instead of pushing custom
  Next.js as universally correct.
- Star Auto facts cross-checked against `lib/work-data.ts` (Miguel
  Ibarra, Richardson, ASE-Certified, NAPA Auto Care Center,
  bilingual, twenty-eight years on Belt Line Road, 4.8 stars across
  136+ Google reviews, live at thestarautoservice.com). All facts
  match the canonical work-data file; no fabrication.

**Cumulative state after Phase 5:**

- **5 archetypes live**: Editorial, Reference, Local Lander, Service,
  Industry.
- **5 validation pages live** (one per archetype).
- **9 section primitives total**: StatCallout, PullQuote, SidebarTOC,
  Sources, ComparisonTable, DecisionCriteria, ProcessTimeline,
  EngagementScope, RegulatoryCallout.
- **65-page architecture work is COMPLETE.** The remaining 60 pages
  are pure content + registry-entry work. Every remaining page maps
  to one of the five archetypes and its tokens are a registry
  decision, not an architecture decision.

**Suggested next session:** browser-verify all five validation pages
side-by-side at the live Vercel deploy to confirm the visual
variation reads cleanly across the full archetype set. If the
variation passes, the next phase is content batch work, prioritized
roughly:
1. The remaining 5 service deep-dives and 3 industry pages (pure
   content; tokens decided in registry).
2. The local-SEO hub page (`/resources/local-seo-for-dallas-service-businesses`)
   to anchor the local cluster before any city pages ship.
3. The 18 city pages, each with at least 350 words of city-unique
   substance to clear the doorway-page protection.
4. The remaining decision and educational pages.

### Canopy work-page Phase 1 + 2 + 3 all complete (May 5 to May 6, parallel track culminating at `c435bc7`)

Three-layer Canopy work-page funnel: Layer 1 case study (shipped at
`c58a8a8`), Layer 2 in-page architectural toggle (scaffold at
`5437174`, content at `f4787cc`, polish-and-prominence pass at
`73d0600` + `4674460`), Layer 3 dedicated deep-dive pages at
`/work/canopy/[slug]` (routing scaffold at `0a1e826`, six bodies
populated at `c435bc7`).

The full funnel is now live: Layer 1 narrative, Layer 2 in-page pill
with ambient halo + chevron micro-bounce, Layer 3 dedicated
1,500-1,700-word architectural deep-dive pages activated for all six
substantive sections (Analytics & Performance, Pipeline &
Relationships, Automation, Operations & Health, Pathlight Integration,
Architecture & Ownership). The Layer 2 "Read the full architecture
of {heading}" link surface lights up across the whole case study
atomically with `c435bc7`.

Phase 2 split into two commits to keep the surface decisions
reviewable independently of the copy decisions:

- `5437174` (scaffold). Adds `deepDive?: string` and
  `deepDivePageSlug?: string` to `ProjectSection`, builds
  `components/work/CanopyDeepDive.tsx` (framer-motion AnimatePresence
  height-auto, `useReducedMotion` gating, `useId`-keyed
  `aria-expanded`/`aria-controls`, ChevronDown 180-degree rotate,
  accent hex via prop, `print:hidden` on the screen panel +
  `print:block` sibling rendering the body unconditionally so PDFs
  read complete), wires it conditionally between section image and
  live link in `ProjectDetailLayout.tsx`. Inert until content lands.
- `f4787cc` (content). Populates `deepDive` on the six substantive
  Canopy sections (Analytics & Performance, Pipeline & Relationships,
  Automation, Operations & Health, Pathlight Integration,
  Architecture & Ownership) at ~250 words each. Sections 1, 2, 9
  stay narrative-only by design. Each body follows the rhythm
  question-that-drove-the-design / considered-and-rejected /
  load-bearing-mechanism / operational-consequence. Voice is
  first-person to match the existing Canopy chrome; zero em dashes;
  zero forbidden enumerations from canopy.md (verified against
  three independent regex categories: lead-score signal names as a
  deliberate list, internal-identifier leakage including
  audit_log/canopy_settings/pathlight-gate column names and function
  signatures, model and Inngest function and step IDs).

The Pathlight body deliberately surfaces the three-gate guardrail
(per-install capability toggle, manual-or-rules-bounded triggers,
monthly budget cap with atomic check-and-reserve) because canopy.md
explicitly carves the EXISTENCE of the guardrails out as public-OK
and a sales feature. The Architecture & Ownership body echoes the
Layer 1 "if I get hit by a bus" close as a deliberate refrain.

Phase 3 content shipped at `c435bc7`. Despite Joshua's earlier
framing of Phase 3 as not-delegable-to-a-single-prompt, the May 6
session delegated all six bodies in one atomic commit after his
explicit go-ahead. Each body is structured around a single
architectural question, the standard alternative I rejected, the
load-bearing mechanism, the failure modes guarded against, and the
operational consequence. Voice is first-person, zero em dashes, four
canopy.md compliance regex categories all returned zero hits before
push (lead-score signal enumeration, internal-identifier leakage,
model and Inngest function and step IDs, JSONB and column-shape
leakage).

Next on this track: eyes-on the deploy preview for the six new pages
(`/work/canopy/{analytics,pipeline,automation,operations,pathlight,architecture}`).
The dynamic route, layout component, sitemap inclusion, and Layer 2
link surface are all wired; this is purely visual confirmation that
the rendered hero halos, entrance staggers, max-w-3xl prose density,
and tail-CTA layout read at the same standard as the parent case
study. If any body needs editing for voice or compliance, single-line
fixes against `lib/canopy-deep-dives.ts`. The 12-18k-word "1-2 week
focused effort" framing in the original Phase 3 brief turned out to
overshoot what one focused drafting pass could produce; the actual
ship was about 10k words across one extended session.

### Service Deep-Dive archetype + Next.js Development page (May 5, early — phase 4)

After Phase 3 landed, Joshua said "Continue with the fourth
archetype." Phase 4 brings the fourth of five archetypes online and
ships `/services/nextjs-development` as the validation slice.

**Two new section primitives** under `components/sections/`:

- `ProcessTimeline.tsx` (server). Numbered ordered list with a
  vertical accent-rail, per-step duration eyebrow, and per-step
  body copy. Used as the centerpiece of every Service Deep-Dive
  page. Five steps on the validation page covering Discovery,
  Architecture, Design, Implementation, Launch.
- `EngagementScope.tsx` (server). Three-column scope card
  (Timeline, Investment, Engagement) with a deliverables grid and
  optional CTA pill. Becomes the conversion-focused element of
  every Service Deep-Dive page. Pricing intentionally framed as
  "Starting at $25,000" plus a per-engagement-quote note, matching
  the Canopy positioning.

**New: `components/templates/ServiceDeepDiveLayout.tsx`** (client).
The fourth archetype, distinct from the existing
`ServicePageLayout` (which stays in place for the data-driven
catalog at `/services/[slug]`). Key visual signature:

- Narrative hero with eyebrow + large display title + lede,
  back-link to `/services` above. No oversized stat hero (that is
  Editorial's), no compact eyebrow-only hero (that is
  Reference's), no geo-typographic hero (that is Local Lander's).
- Numbered section eyebrows ("01 / Definition", "02 / Fit", etc.)
  that match the design-brief cadence the rest of the site uses.
- Process timeline + Engagement scope render as their own
  numbered sections, automatically continuing the section count
  past the body sections.
- Same FAQ + accent-anchored CTA + Sources + Author block tail as
  the other archetypes.

**Updated: `lib/page-system/registry.ts`**. Added the
nextjs-development entry. Tokens chosen for distinctness from the
other three live pages: cyan accent (different archetype than the
cyan Core Web Vitals page so visual confusion is unlikely),
typographic hero, gradient-rule breaks, clean texture, no images.

**New page route:**
`app/(marketing)/services/nextjs-development/`:

- `page.tsx` (server). Reads from registry for `generateMetadata`,
  returns the client content. Static segment takes precedence over
  the existing `/services/[slug]` dynamic route at build time, so
  this page does NOT collide with the data-driven service catalog.
  Verified `nextjs-development` is not a slug in `lib/service-data.ts`.
- `NextjsDevelopmentContent.tsx` (client, ~310 lines). ~1,800 words
  across 4 narrative sections (definition, fit, why-this-stack,
  tradeoffs) plus the Process and Scope sections. 7 buyer FAQs
  (Next.js for SMB, vs WordPress, outgrowth, hosting, code
  ownership, dependency updates, CMS later). CTA points to /contact
  since this is engagement-intent. 6 verified sources:
  1. Next.js documentation (App Router and Server Components)
  2. Google Search Central blog: page experience update April 2021
  3. web.dev/case-studies/vodafone: 31% LCP improvement, 8% sales,
     15% lead rate increase
  4. State of JS 2024 (Devographics): meta-frameworks results
  5. HTTP Archive Web Almanac 2024 (Jamstack chapter)
  6. Vercel platform documentation

**Walking-the-talk anchor:** the page explicitly cites `package.json`
shipping Next.js 16.2.4, references that this site itself runs on
the stack, and cross-links to `/pathlight` and
`/resources/agency-vs-studio-vs-freelancer` to tie the cluster
together.

**Brand and accuracy gates passed (phase 4):**
- `npx tsc --noEmit` clean
- `npm run lint` clean (no `<a>` tag violations this round; all
  internal links use `<Link>` from the start)
- Zero em dashes / en dashes (grep `$'\xe2\x80\x94\|\xe2\x80\x93'` empty)
- Banned-phrase scan clean (no leverage / robust solution / etc.)
- First-person voice throughout. Two collaborative-"we" instances
  caught and rephrased to "you" or restructured before commit, per
  the strict no-"we" rule.
- Pathlight described by outcomes only ("website intelligence
  product I built"); no model names, pipeline, scoring formulas, or
  vertical-database internals exposed.
- Honest "skip" framing applied: page explicitly recommends
  Squarespace/Wix/Astro for the wrong-fit cases instead of
  defending Next.js as universally correct.

**Cumulative state:** four archetypes shipped, one remaining
(Industry Vertical for the 4 industry pages). Foundation pages
live in main:
`/resources` (cluster index), `/resources/core-web-vitals-explained`,
`/resources/agency-vs-studio-vs-freelancer`, `/dallas-web-design`,
`/services/nextjs-development`.

**Suggested next session:** browser-verify the Service Deep-Dive
page at `/services/nextjs-development` against the existing
`/services/[slug]` catalog pages to confirm visual differentiation
reads as intentional rather than inconsistent. Then ship the fifth
archetype (Industry Vertical) against `/industries/auto-service`
since Star Auto is the strongest existing production proof point.
After all five archetypes exist, the remaining 60 pages become a
content build, not an architecture build.

### Local Lander archetype + Dallas city page (May 4, late evening — phase 3)

Joshua said "continue" after the Phase 2 commit landed. Phase 3
brings the third archetype online and ships the highest-leverage
city page (Dallas) as the validation slice. The Dallas page is
also the geographic-pillar page for the planned 18-page local
cluster.

**New: `components/templates/LocalLanderLayout.tsx`** (client). The
third archetype, distinct from both Editorial and Reference:

- Hero is geo-typographic: city name rendered as a massive
  gradient-clipped wordmark ("Dallas, Texas" at clamp 3rem to 7rem),
  with optional coordinate caption in mono uppercase tracking-wide
  ("32.7767° N, 96.7970° W"). The dot-grid background overlay is
  reused from the existing site primitives so the local-lander hero
  has its own visual signature distinct from Editorial's
  data-driven hero and Reference's compact eyebrow-led hero.
- No sidebar TOC. Local pages are short enough that the
  scroll-spy TOC would feel over-engineered.
- Numbered section eyebrows ("01" through "05") with a thin gradient
  rule, more restrained than Editorial's "Section 01 / 08" treatment.
- Same FAQ accordion + accent-anchored CTA + Sources block tail
  as the other archetypes so the reader experience across all three
  archetypes feels like one body of work.
- Uses `editorial-prose` body styling so authoring is consistent.

**Updated: `lib/page-system/registry.ts`**. Added the
dallas-web-design entry. Tokens: blue / typographic / rule / clean
/ standard / none. Deliberately distinct from the previous two
pages: cyan + grain (Core Web Vitals), violet + clean (Agency vs
Studio), now blue + clean with typographic geo-anchor. Three pages,
three accent dominances, three hero variants, three section-break
treatments.

**New: `app/(marketing)/dallas-web-design/`**:

- `page.tsx` (server). Reads from registry for
  `generateMetadata`, returns the client content.
- `DallasContent.tsx` (client). ~1,150 words across 5 body
  sections: who I work with in Dallas (Park Cities, Uptown, Preston
  Hollow, Bishop Arts, Richardson, Rockwall, Knox-Henderson, Lower
  Greenville, Las Colinas, Plano named); how my model differs from
  Dallas's agency market (Built In, Clutch, Deep Ellum, Telecom
  Corridor named); local proof (Star Auto in Richardson, Design
  Briefs cluster, Pathlight); engagement model and pricing;
  honest "where I am based" section that handles the
  Royse-City-legal-vs-Dallas-brand duality openly. 6 buyer FAQs.
  CTA points to /contact since this is engagement-intent. 4
  sources (Census x2, BLS, Federal Reserve Bank of Dallas).

**Doorway-page protection**: per the master prompt's protection
rule for local pages, the Dallas page must contain at least 350
words of substance unique to Dallas that could not appear on any
other city page. Counted: easily over that threshold given the
named neighborhoods, the agency-market context, the local proof,
and the explicit Royse-City-vs-Dallas geographic story. When the
remaining 17 city pages get built, each will need its own
locally-specific substance, never templated.

**Brand and accuracy gates passed (phase 3):**
- `npx tsc --noEmit` clean
- `npm run lint` clean (after fixing 3 raw `<a>` tags in body to
  `<Link>` from next/link, caught by the @next/next ESLint rule
  pre-commit; the runtime-only RSC-boundary memory continues to
  apply but does not block this slice)
- Zero em dashes in any new file
- First-person "I" voice throughout
- Pathlight described by outcomes only ("AI-powered website
  intelligence product"); no model names, pipeline, scoring
  formulas, or vertical-database internals exposed
- Banned phrases avoided
- Royse-City-vs-Dallas brand-versus-legal duality acknowledged
  honestly in the page rather than papered over

**Three archetypes shipped, two remaining:**
- Service Deep-Dive (for the 6 service pages; can generalize the
  existing `ServicePageLayout` rather than build from scratch)
- Industry Vertical (for the 4 industry pages; closest to
  `ProjectDetailLayout` patterns)

**Suggested next session:** browser-verify all three city / pillar
pages side-by-side at the live Vercel deploy. If the visual
variation reads cleanly across the three, ship the fourth
archetype (Service Deep-Dive against `/services/nextjs-development`
or `/services/website-performance-audit`). The remaining 17 city
pages stay deferred until the archetype set is fully validated;
batching them after all 5 archetypes exist avoids retrofit risk.



### Reference Dense archetype + decision-cluster validation slice (May 4, evening — phase 2)

After the Editorial archetype + Core Web Vitals validation page
landed cleanly (tsc/lint/no-em-dashes all clean), the build
continued into the second archetype: Reference Dense, used by all
14 decision-and-comparison pages in the 65-page plan. The
validation slice is page #34, agency-vs-studio-vs-freelancer.

**New section primitives** under `components/sections/`:

- `ComparisonTable.tsx` (server). N-column comparison with one
  optionally-highlighted column. Real `<table>` with proper
  `<th scope="col">` / `<th scope="row">` semantics at md+, then
  collapses to one stacked card per column at sm. Highlighted
  column gets accent-tinted header + cell background plus an
  outer accent ring. Caption + source citation in the figcaption.
  Used 1x on the validation page (3 columns × 8 rows: agency,
  studio, freelancer × hourly rate, project budget, who you talk
  to, time-to-start, decision velocity, senior judgment in
  delivery, post-launch maintenance, project size fit).
- `DecisionCriteria.tsx` (server). Three-up grid of "Choose X
  if..." cards with optionally-highlighted cards (the studio card
  is highlighted on the validation page). Auto-collapses to
  two-up at sm. Used 1x on the validation page.

**New: `components/templates/ReferenceLayout.tsx`** (client). The
second archetype. Compact hero (no oversized stat callout, ~half
the editorial hero's vertical), sticky TOC always visible at lg+,
denser section padding, smaller H2 type scale. Reuses StatCallout
and PullQuote for in-section breaks (so the Reference layout can
still surface stat/quote interstitials when an author chooses).
Same FAQ/CTA/Sources tail as Editorial so the reader experience
across archetypes feels like one body of work.

**Updated: `lib/page-system/registry.ts`**. Added the
agency-vs-studio-vs-freelancer entry. Tokens chosen to deliberately
contrast the Core Web Vitals page so visual variation across the
65-page set is real, not theoretical:

- Core Web Vitals: cyan / data-driven hero / stat breaks / grain / duotone
- Agency-vs-Studio: violet / typographic hero / gradient-rule breaks / clean / no images

Same underlying type system, same brand grammar, visibly different
page on every variation knob.

**New page route:** `app/(marketing)/resources/agency-vs-studio-vs-freelancer/`:

- `page.tsx` (server). Exports `generateMetadata` from the
  registry, returns the client content component.
- `AgencyStudioFreelancerContent.tsx` (client, ~640 lines).
  ~3,000 words across 7 body sections: three buyer profiles in
  plain language, what you actually pay for at each tier, what
  you give up at each tier, the side-by-side ComparisonTable,
  DecisionCriteria picker, common failure modes per vendor type,
  honest closer ("what I would tell my own family"). One
  in-section StatCallout break ($130K, sourced to Stack Overflow
  Developer Survey 2024 verified live via WebFetch). 7 FAQs
  covering the actual buyer questions (real-vs-fake studios,
  realistic budgets, hourly-rate sticker shock, why pick studio
  over agency, offshore agency math, bait-and-switch defense,
  freelancer Next.js capability). CTA points to /contact since
  this is engagement-intent, not Pathlight-funnel-intent.

**Citations**: 6 verified sources covering the claims in the page
(originally drafted with 7; HubSpot State of Marketing Report
dropped during the pre-commit polish pass because the specific
agency-churn claim attributed to it could not be verified to a
particular HubSpot finding. Replaced with a first-person field
observation, which is more honest):
1. Stack Overflow Developer Survey 2024 (verified live: 49,390
   professional respondents, $130K US median)
2. Stack Overflow 2024 Methodology
3. BLS OOH Web Developers (SOC 15-1254, U.S. Department of Labor)
4. Clutch B2B services / web developers directory
5. GoodFirms web development companies directory
6. Upwork hire-side cost guides

The decision-page minimum per the master research prompt is 7
sources; this page lands at 6 because dropping an unsupportable
citation matters more than hitting a numeric target. Trade-off
documented.

**Updated: `app/(marketing)/resources/page.tsx`**. Cluster index
extended to render BOTH educational and decision clusters, each in
its own labeled section with its own tagline. New `ResourceCard`
helper applies per-page accent colors to the eyebrow / hover-state /
CTA arrow so the index visually previews each page's accent
identity. CSS-variable trick (`--card-accent`) used to thread the
accent into a Tailwind hover state without inline JS.

**Brand and accuracy gates passed (phase 2):**
- `npx tsc --noEmit` clean
- `npm run lint` clean
- 0 em dashes in any new file (grep $'\xe2\x80\x94' empty)
- First-person "I" voice throughout body copy
- Honest "skip studio, hire freelancer" framing where applicable
  (matches the "default to honest skip" guidance in user memory)
- Pathlight not mentioned on this page; no internal-exposure risk
- Banned phrases avoided
- Every numeric or factual claim has an inline source citation

**Cumulative state (working tree):** 18 new files, 3 edited
(`globals.css`, `lib/page-system/registry.ts`,
`app/(marketing)/resources/page.tsx`), 1 docs file edited
(this file).

Phase 1 + Phase 2 file inventory:
- `lib/page-system/` (5): tokens.ts, types.ts, accent-map.ts,
  registry.ts, resolve.ts
- `components/sections/` (6 new): StatCallout.tsx, PullQuote.tsx,
  SidebarTOC.tsx, Sources.tsx, ComparisonTable.tsx,
  DecisionCriteria.tsx
- `components/templates/` (2 new): EditorialLayout.tsx,
  ReferenceLayout.tsx
- `app/(marketing)/resources/` (5 new): page.tsx,
  core-web-vitals-explained/page.tsx + content,
  agency-vs-studio-vs-freelancer/page.tsx + content

Two archetypes shipped. Three remaining: Local Lander (18 city
pages), Service (6 service deep-dives), Industry (4 vertical pages).

**Suggested next session:** browser-verify both pages
(`/resources/core-web-vitals-explained` and
`/resources/agency-vs-studio-vs-freelancer`) side-by-side to
confirm the visual variation actually works at the page level
(different hero feel, different accent, different break treatment,
different density). If both pass, commit the cumulative
phase-1-plus-phase-2 work as one focused commit, then build the
third archetype (Local Lander, since the 18 city pages are the
biggest cluster and unlock the largest geographic SEO investment).

### Page-system foundation + Editorial vertical slice (May 4, evening)

Joshua greenlit a 65-page SEO content build over a strategic
back-and-forth this session. Before any content page ships, the
codebase needed a small layout system so 65 pages can vary in feel
while staying brand-coherent. This commit lays that foundation and
ships one validated end-to-end vertical slice (page #46, Core Web
Vitals Explained) as the gold-standard template.

**New: `lib/page-system/`** (5 files, the token registry):

- `tokens.ts` defines the variation token unions:
  `LayoutArchetype` (5: editorial, reference, local-lander, service,
  industry), `AccentDominance` (3: blue, cyan, violet), `HeroVariant`
  (5), `SectionBreak` (5), `Texture` (4), `Density` (3),
  `ImageTreatment` (4). Six knobs × three accents gives enough
  combinatorial space that no two of the planned 65 pages will feel
  identical while the underlying grammar stays inviolable.
- `types.ts` defines `PageConfig` (the per-page metadata schema,
  including cluster, pillar, lastReviewed, nextReviewDue,
  sourcesCount) and `SourceEntry` (the citation shape for educational
  pages). Every future page exports a `PageConfig` keyed by slug.
- `accent-map.ts` exposes both Tailwind class strings and raw hex
  values per accent so components can choose whichever fits
  (existing design-brief components use hex inline-style, newer
  layout primitives use class strings).
- `registry.ts` is the typed registry mapping every page slug to
  its `PageConfig`. Initialized with one entry today (the Core Web
  Vitals page); grows to 65 as the build progresses. Centralizing
  the cadence decision (which page gets which accent + token combo)
  here means visual rhythm across the cluster is intentional, not
  random.
- `resolve.ts` exposes `getPageConfig(slug)` and
  `listPagesByCluster(cluster)` so route handlers and the resources
  index can read from the same source of truth.

**New: 4 section primitives** under `components/sections/`:

- `StatCallout.tsx` (client). Two variants: hero (oversized
  numeric for DATA_DRIVEN hero variant) and break (mid-size numeric
  for SectionBreak STAT). Accent-driven gradient border, halo
  glow, source citation in the footer. Reused 4x on the Core Web
  Vitals page (1 hero + 3 section breaks).
- `PullQuote.tsx` (server). Used when SectionBreak token is QUOTE.
  Centered figure with gradient rule above and below, oversized
  quote glyphs in accent color. Not used by page #46 but built so
  the EditorialLayout supports the QUOTE break out of the box.
- `SidebarTOC.tsx` (client). Sticky TOC with IntersectionObserver
  scroll-spy. Active section gets accent-colored text + a small
  accent-colored tick on the left rail. Hidden below `lg`
  breakpoint per the design-brief pattern.
- `Sources.tsx` (server). Numbered list of `SourceEntry` items
  with optional authors / org / publication / DOI / URL. Renders
  at the very bottom of educational pages. Used here for 11
  citations on Core Web Vitals.

**New: `components/templates/EditorialLayout.tsx`** (client). The
first of five planned archetypes. Takes a `PageConfig` plus
structured hero / sections / faq / cta / sources content and
renders the full editorial spread: accent-anchored hero with
optional DATA_DRIVEN stat callout, sticky TOC + sectioned body
with per-section break interstitials, FAQ via the existing
`Accordion`, accent-anchored CTA, sources block. Consumes accent
hex via inline style (matches the design-brief pattern). Honors
`useReducedMotion` for every framer-motion variant.

**Edited: `app/globals.css`** (additive, no removals). Three new
class blocks:

- `.page-texture-geometric` and `.page-texture-tinted` (the
  optional per-page additive textures keyed off the `texture`
  token; `grain` is a no-op since the global grain overlay
  already runs in marketing layout, `clean` is a no-op).
- `.editorial-prose` (the body-content style scope: paragraph
  rhythm, code spans, horizontal-rule list bullets, H3 styling).
  Scoped so it never affects unrelated copy. Replaces the need
  for content authors to repeat utility classes on every `<p>`.

**New: `app/(marketing)/resources/page.tsx`**. Minimal index page
that lists every educational-cluster entry from the registry as a
glass-card grid. Currently shows one entry; auto-grows as more
pages register. Anchors the cluster so `/resources` doesn't 404.

**New: `app/(marketing)/resources/core-web-vitals-explained/page.tsx`** +
`CoreWebVitalsContent.tsx`. The validation page. Server-component
route file exports `generateMetadata` from the registry; the
client content component composes `EditorialLayout` with:

- Hero stat: 53% mobile abandonment over 3s, sourced to Daniel An's
  2017 Think with Google analysis (URL verified)
- 8 body sections covering definition, history, conversion impact,
  LCP / INP / CLS individually, measurement methodology, and
  field-grade common mistakes
- 4 stat-break interstitials at 75%, 8.4%, 200ms, 28
- 7 real-buyer FAQ questions (rankings, good thresholds, Lighthouse
  vs PSI, FID-to-INP, CrUX latency, service-business relevance,
  WordPress)
- CTA positioned as Pathlight shortcut ("ninety seconds vs four
  hours") with a /contact secondary
- 11 verified citations: web.dev articles for the four metrics
  (LCP good threshold of 2.5s confirmed via WebFetch against
  https://web.dev/articles/vitals), Sullivan & Viscomi's INP
  announcement, Akamai 2017 retail performance report, Deloitte
  2020 Milliseconds Make Millions, HTTP Archive Web Almanac 2024,
  Google Search Central page experience update

**Brand and accuracy gates passed:**
- `npx tsc --noEmit` clean
- `npm run lint` clean
- 0 em dashes in any new file (verified via grep $'\xe2\x80\x94')
- First-person "I" voice throughout body copy
- Pathlight described by outcomes only ("scored report",
  "prioritized fixes"); no model names, pipeline stages, scoring
  formulas, or vertical-database internals exposed
- Banned phrases avoided ("in conclusion", "let's dive in",
  "leverage", "robust solution", "in today's fast-paced", etc.)
- Every numeric claim cites a source with year inline

**What this slice did NOT do, deliberately:**
- The other 4 archetypes (Reference, Local Lander, Service,
  Industry). They will be built one at a time as the first page
  in each cluster ships.
- The other 64 pages. The registry has one entry; expanding to 65
  is a deliberate per-cluster build, not a bulk wire-up.
- Schema.org JSON-LD. Mentioned in the strategic plan but
  intentionally deferred to keep this slice tight; the existing
  `JsonLd` layout component is the integration point.
- A FullBleedImage section primitive, EngagementScope,
  RegulatoryCallout, ComparisonTable. Built when the archetype
  that needs them ships.

**Suggested next session:** browser-verify the page at
`/resources/core-web-vitals-explained` (run `npm run dev`,
navigate, spot-check hero, TOC scroll-spy, stat breaks, FAQ
accordion, CTA, sources). If the visual passes, commit the slice
as one focused commit, then either (a) write a second editorial
page under different tokens to validate visual variation, or (b)
build the second archetype (Reference Dense for the 14 decision
pages, since that's the next-highest-leverage cluster).

### Pathlight capture-confidence layer + OG image proxy (May 4, late)

### Pathlight capture-confidence layer + OG image proxy (May 4, late)

After the May 3 video-artifact arc (commits `2178178`, `2775118`,
`38f8760`, `e5d30af`, `b2bc9e4`, `4556911`, `c9d9e23`, `c8240e0`,
`915a163`) eliminated every false-positive "broken video" pathway in
the model prompts, the screenshot capture itself can still legitimately
fail to render hero videos when codec / CDN / autoplay-policy
constraints stack against headless Chrome. Pretending capture is
always perfect is the failure mode that kills credibility on any
report. Joshua's directive was to make Pathlight transparent about
what it can and cannot verify, then ship anything else worth
hardening.

This commit adds:

1. **Migration `038_capture_caveats.sql`.** One additive nullable
   `capture_caveats` JSONB column on `scan_results`. Applied to prod
   Neon successfully before the code commit.
2. **Capture-confidence layer.**
   - `lib/types/scan.ts` adds `CaptureCaveatKind` (3 values:
     `hero-video-may-render-for-visitors`,
     `og-image-blocked-from-render`, `mobile-capture-degraded`),
     `CaptureCaveatSeverity`, `CaptureCaveat`. Adds
     `captureCaveats: CaptureCaveat[] | null` to `PathlightReport`.
   - `lib/services/capture-caveats.ts` (new). Pure function
     `computeCaptureCaveats` plus a `probeOgImageReachable` HEAD
     fetch with realistic UA, originating-site Referer, 4s timeout,
     graceful fallback to GET on HEAD-rejecting CDNs. Each detector
     has a tight failure-mode posture: returns null on
     uncertainty so transient probe failures cannot defame the
     scanned site.
   - `lib/inngest/functions.ts` adds the `cv1` step inserted
     between `o1` and the `w1` follow-up sleep. Reads from the
     persisted scan, computes caveats, persists them. Always
     writes (even when the array is empty) so the polling loop can
     distinguish "ran, nothing to surface" from "still running."
     Failure path persists `[]` and emits a `capture-caveats.failed`
     monitoring event; never marks the scan partial.
   - `lib/db/queries.ts` adds `updateScanCaptureCaveats`,
     `getCaptureCaveatsInput`, the `coerceCaptureCaveats` /
     `coerceCaptureCaveat` pair, the `capture_caveats` SELECT
     extension, and the `getFullScanReport` surface field.
     `coerceCaptureCaveats` deliberately preserves the empty-array
     vs null distinction (empty = ran, nothing to surface; null =
     not run yet) so the polling loop can settle correctly.
   - `lib/services/pathlight-health.ts` adds `capture-caveats` to
     `PATHLIGHT_STAGES` + `LABEL_TO_STAGE`. Forward-compat
     scaffolding; failures are swallowed today and never surface
     in `error_message`.
3. **Top-of-report "Notes on this analysis" notice.**
   - `app/(grade)/pathlight/[scanId]/CaptureCaveatsNotice.tsx`
     (new). Renders only when caveats are present. Subtle slate
     palette, professional non-apologetic tone. Print-safe via
     `print-avoid-break`. Suppressed for the empty / null cases so
     the report renders identically to before for clean scans.
   - `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` extends
     `ApiReport` with `captureCaveats`, threads it through
     `<CaptureCaveatsNotice>` between the partial / screenshot
     notices and the score hero. Polling loop's
     `postFinalizeFieldsLanded` now waits for
     `captureCaveats !== null` to settle so the notice always
     hydrates inside the fresh-scan window without a manual
     refresh.
   - `app/(grade)/api/scan/[scanId]/route.ts` surfaces the
     `captureCaveats` field on the API response.
4. **OG image proxy: `/api/og-image-proxy`.**
   - `app/(grade)/api/og-image-proxy/route.ts` (new). Server-side
     image proxy bound to a known scan: query params are `scanId`
     (UUID) and `url`; the URL must match the scan's
     `og_preview.meta.image` or `og_preview.meta.twitterImage`
     server-side or the request returns the placeholder. Defenses:
     UUID shape check, http/https only, private / loopback host
     rejection, 4MB hard size cap, 8s timeout, realistic UA +
     originating-site Referer, per-IP rate limit (200 / 24h).
     Failures all return a transparent 1x1 PNG with a 5-minute
     cache so a broken upstream does not break the report visually.
   - `lib/rate-limit.ts` adds the `proxyImageLimiter` (sliding
     window 200 / 24h, fail-open in dev when Upstash env is
     missing).
   - `app/(grade)/pathlight/[scanId]/OgPreviewSection.tsx` swaps
     direct `<img src=>` for `proxyImageSrc(scanId, originalUrl)`
     and adds an `onLoad` 1x1 detector + `onError` handler so the
     transparent-placeholder failure path renders a graceful
     "could not load outside your site" panel instead of a dark
     rectangle.
5. **Chatbot caveat awareness (audit-phase finding).**
   - `lib/prompts/pathlight-chat.ts` adds a `Capture caveats` block
     into the system prompt's scan context (rendering only the
     user-safe `detail` strings, never the internal `kind` enum)
     plus a new `# CAPTURE CAVEATS` guidance section in front of
     `# METHODOLOGY TRANSPARENCY`. Tells the chat to defer to
     caveats: do not insist a video is broken when the caveat says
     it likely plays for real visitors, do not penalize design
     observations whose underlying capture was disclaimed, never
     describe a caveat as a "bug" or as Pathlight being broken.
     This closes the gap where a prospect challenging the chat
     ("is the broken video really broken?") could otherwise
     receive a confidently-wrong defense.

### Verification gates passed

- `npx tsc --noEmit` clean
- `npm run lint` clean
- 0 em dashes added across all changed files (the three I
  introduced in JSDoc were rewritten to colons / commas before the
  commit)
- Migration 038 applied to prod Neon successfully before the code
  commit
- Real-HTML smoke check: `detectHeroVideo` against the captured
  wingertrealestate.com html_snapshot returns `true` (the
  `<video autoplay>` lives at byte ~166K, past the head section
  but the regex now scans the full document)
- Proxy security review: SSRF mitigations layered (scan binding +
  private-host regex + http/https only), size + timeout caps in
  place, rate limit added

### What still needs to happen next

1. **Verification scan against wingertrealestate.com** once Vercel
   finishes deploying. Expect the OG preview card to render the real
   share image (Wix-hosted) via the proxy. Expect the "Notes on this
   analysis" section at the top of the report when the hero-video
   caveat fires (heroHasVideo true + photography_quality scored low).
2. **Watch `/admin/monitor` for `capture-caveats.generated` events**
   accumulating. The kinds list in the event body lets us see which
   caveat surfaces most often across real scans without any
   per-scan inspection.
3. **Optional follow-up: hex / octal IP literal SSRF defense.** The
   proxy's private-host regex covers decimal IPv4 + bracketed IPv6,
   but not exotic literal forms like `0177.0.0.1` (octal for
   127.0.0.1). The scan-binding control closes the practical attack
   path (the URL must match a previously-extracted og:image), but
   adding a `net.isIP()` check would be belt-and-suspenders.
   Deferred; not a Joshua-blocking gap.

The session arc this round was a security audit + the three follow-ups
the audit surfaced. Five Claude commits landed, interleaved with three
of Joshua's Pathlight video-artifact fixes:

- **F1, gate-bypass fix** (`3caf31b`). `lib/actions/pathlight-rescan.ts`
  `rescanByScanIdAction` now passes through `canFireScan("rescan")`
  before queueing the Inngest event, mirroring
  `lib/canopy/pathlight-client.ts` and the other rescan siblings. Calls
  `incrementScanUsage(1)` after `inngest.send`. Closes audit High F1
  (every Pathlight-billable code path must route through the gate).
- **F2, Next.js patch bump** (`ceba6dd`). `next ^16.2.2 -> ^16.2.4`
  closes GHSA-q4gf-8mx6-v5v3 (Server Components DoS). Same minor,
  two-patch bump. No code changes outside the lockfile + package.json.
- **F3, middleware -> proxy rename** (`aafea4e`). Cleared the Next 16
  deprecation warning. `git mv middleware.ts proxy.ts` plus 7 stale
  cross-file comment updates. Functional no-op.
- **F4, eslint major bump** (`8df4dae`). `eslint-config-next 15 -> 16`
  forced a chained `eslint 8 -> 9` upgrade and `.eslintrc.json` ->
  `eslint.config.mjs` flat-config migration. The `core-web-vitals`
  preset is imported directly from `eslint-config-next/core-web-vitals`
  (it ships as a flat array, no FlatCompat needed). The new
  `react-hooks` v7 / React Compiler diagnostics rule family
  (`set-state-in-effect`, `static-components`, `refs`, `immutability`,
  `error-boundaries`, `purity`, `preserve-manual-memoization`) is
  disabled with comments pending the dedicated audit on the backlog.
- **F5, drop unused wait-on** (`0c08585`). `wait-on@9.0.5` was the only
  parent of `axios@1.15.1` (GHSA-3w6x-2g7m-8v23 + GHSA-q8qp-cvcw-x6jj).
  Verified zero references; removed entirely. `npm audit --audit-level
  =high` now returns 0 high (was 1).

The full audit report lives at `/tmp/dbj-audit-2026-05-04.md` (kept
outside the repo intentionally; references findings F1-F17). The two
High items (F1, F2) and the three follow-ups (F3, F4, F5) are all
shipped. Eight Medium / Low / Info findings remain documented but
deliberately not actioned this session.

## Verification gates passed (this session)

- `npx tsc --noEmit` clean after each of F1, F3, F4, F5 (F2 was a
  pure dep bump)
- `npm run lint` clean on the new ESLint 9 / flat-config setup
- `npm run build` completes successfully; only the pre-existing
  `Using edge runtime on a page currently disables static generation`
  warning remains (unrelated, predates this work)
- `npm audit --audit-level=high`: 0 high, 7 moderate, 3 low
- 0 em dashes added in any changed source file (pre-existing em dashes
  in `app/layout.tsx:156` and `app/(grade)/pathlight/[scanId]/ScanStatus.tsx:155`
  noted but out of scope; flag for a future copy pass)

## Next recommended tasks

1. Pick one of the deferred audit findings off `/tmp/dbj-audit-2026-05-04.md`.
   Top candidates: F3 (beacon endpoint rate-limit + opaque token), F4
   (DNS-rebinding TOCTOU in `validateUrl`), F5 (Pathlight gate budget
   TOCTOU under concurrent admin clicks), F8 (file-upload content-type
   allowlist). All Medium; pick by appetite.
2. Backlog item: walk the disabled `react-hooks` v7 rule family. Most
   findings are the documented `setMounted(true)` SSR-safety pattern;
   a few are real refactor opportunities (`ServicePageLayout.tsx:55`
   Icon-in-render, `TaskRowClient.tsx:27` impure-during-render,
   `AskPathlight.tsx:177` memoization). See backlog entry under
   "Priority 3: Pathlight Hardening."
3. Carryover from the prior arc: outstanding Inngest cron first-fire
   verifications (search-console-daily 06:00 UTC and
   infrastructure-check-daily 08:00 UTC). Search Console may 403 on
   first run if the GSC service account lacks property access; that
   is a Google Cloud Console permissions grant, not a code change.

## Pointers

- Last archived session detail: `docs/ai/history/2026-05-03-to-2026-05-04.md`
- Live deployment + working state per phase: `docs/ai/current-state.md`
- Architectural and business decisions: `docs/ai/decision-log.md`
- Don't-touch invariants: `docs/ai/do-not-break.md`
- Outstanding work: `docs/ai/backlog.md`
- Today's full security audit: `/tmp/dbj-audit-2026-05-04.md`
