# Decision Log

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
