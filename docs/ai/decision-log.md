# Decision Log

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
