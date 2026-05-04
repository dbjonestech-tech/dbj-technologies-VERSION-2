# Canopy Rules

Canopy and Pathlight are two separate products in this repo with two separate marketing surfaces and two separate rule files. Canopy rules (this file, `.claude/rules/canopy.md`) govern `/admin/*`, `/showcase/canopy/*`, the `/pricing/canopy` detail page, the About-page Canopy capability section, the `/work` Canopy entry, and `lib/canopy/*`. Pathlight rules (`.claude/rules/pathlight.md`) govern `/(grade)/*`, the Pathlight scan pipeline, and `lib/services/claude-analysis.ts`. Apply the right file to the right code path. The two products share a Postgres database and a Vercel deployment, but the public copy, the locks, and the safety invariants do not transfer between them.

## Public Presentation
- Canopy is described publicly by outcomes ("one dashboard, one auth wall, one source of truth on the buyer's domain"), not by internal architecture.
- Do NOT reveal: lead-score component names or weights, audit_log column shape, Inngest function IDs, migration numbers, prompt structure, vertical-lookup tier logic, prospecting candidate scoring, attribution beacon protocol, RBAC enum values, or the canopy_settings / pathlight-gate column names, function signatures, or per-layer order in source-rendered detail.
- The EXISTENCE of gate guardrails (manual-only triggers, monthly budget cap, per-feature toggles) IS public-OK and is a sales feature. Buyers should know Canopy has guardrails; the implementation specifics are what stays private.
- Public language focuses on: ownership, consolidation of SaaS sprawl, first-party data joined to business outcomes, hosted on the buyer's domain, behind the buyer's auth, in the buyer's database.
- Canopy is positioned as a productized engagement starting at $25,000, 4-8 week delivery. Not a self-serve product. Not a SaaS subscription.
- The /admin surface in this repo is the canonical Canopy. The starter at github.com/dbjonestech-tech/canopy and the live install at ops.thestarautoservice.com are FROZEN and will be rebuilt from this codebase after the build plan completes.

## Lead-score component names (NEVER publish)

The internal LeadScoreComponents interface in lib/canopy/lead-scoring.ts contains six weighted signals. None of these strings may appear as a deliberate enumeration in any public-rendered copy, marketing page, About page, /work entry, /pricing/canopy detail page, /showcase/canopy tour, blog post, or rules-file commentary that could be pasted into a prospect-facing context:

- pathlight
- engagement
- recency
- touchpoints
- deal_value
- source

This rule covers deliberate public-rendered enumeration of the six fields, not the raw words. `source` and `deal_value` are common-English tokens; phrases like "source of truth," "source attribution," "deal value," and "source code" are unaffected. Scan by looking for phrases like "Canopy weights pathlight, engagement, recency..." not by token presence.

Public-OK framing: "Canopy weights multiple signals into a single 0-100 lead score, with weights configurable per install." Do NOT enumerate the signals. Do NOT describe what each signal measures. Do NOT reference SOURCE_BASE_SCORE values, normalization formulas, or the weighted-sum math.

## The three-layer Pathlight lock (never bypass)

Every Pathlight scan or external API call billable to DBJ must pass three independent checks before firing. Any one failing aborts with a user-facing reason.

- Layer 1, feature toggle: a canopy_settings row holds boolean flags per integration. All default false.
- Layer 2, manual trigger: no background job auto-fires a scan. Crons only flag candidates and surface them as actionable items in the dashboard. A scan only fires from an explicit user click that calls a Server Action.
- Layer 3, budget cap: a monthly counter (monthly_scan_budget, scans_used_this_period, period_resets_at) blocks any scan that would exceed the cap. Default 0 (hard off until configured).

The gate lives at lib/canopy/pathlight-gate.ts and exports canFireScan(kind). Every Pathlight entrypoint, existing and new, routes through it. Do NOT add a Pathlight call site that bypasses the gate. Do NOT weaken any of the three layers without an explicit decision-log entry.

## CRM Architecture Invariants
- Auth.js Google sign-in plus ADMIN_EMAILS allow-list gates every /admin/* route. Do NOT add a public /admin/* page. This is a security invariant.
- Deals are the primary pipeline-stage entity. contacts.status is a denormalized mirror of the contact's primary deal stage for backward compatibility, not the source of truth.
- One contact can have many deals over time. Do NOT collapse this back to a contact-stage model.
- The Relationships pipeline kanban (/admin/relationships/pipeline) is contact-stage and remains. The /admin/deals kanban is deal-stage and is the primary board.
- NO drag-and-drop on the contact kanban. Per-card status dropdown only. (Per do-not-break.md and decision-log.)
- Server Actions for all mutations (lib/actions/*). RSC for reads. No client-side fetch + mutate against API routes for first-party CRM operations.
- Every mutation that touches contacts, deals, activities, settings, or audit-relevant entities writes to audit_log via lib/canopy/audit.ts.
- Drizzle/Neon raw SQL via getDb(). No new ORM layer.

## Vendor Posture
- Canopy CONSOLIDATES some categories of SaaS (visitor analytics, RUM, deployment health, infrastructure watchers, error tracking, deliverability monitoring) into one owned dashboard. Generic public framing of what Canopy replaces is "5-7 SaaS subscriptions"; the specific list is illustrative.
- Sentry is still wired in production for client-side and server-side errors. The /admin/errors first-party pipeline is hybridized with Sentry as the secondary view, not a replacement. Do NOT describe Canopy as "replacing Sentry."
- Cloudflare Turnstile is the captcha on the Pathlight scan form. It is unrelated to Canopy and does NOT belong in any "Canopy replaces..." list.
- Resend remains the outbound transactional email path for the contact form and Pathlight reports. The Phase 4 Gmail integration is for two-way CRM sync of per-user authenticated email; it does NOT replace Resend. Do NOT reintroduce Gmail SMTP for transactional sends.

## Migrations and Schema
- All migrations live in lib/db/migrations/0XX_*.sql. Sequential numbering. Idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING).
- Always check `ls lib/db/migrations/ | tail -3` for the next free number. Do NOT trust reserved numbers in the build plan; they are stale.
- Apply to prod Neon AFTER Joshua's review per phase. Migration runner: `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/<file>.sql`.
- Helpers must fall open to safe defaults if a table is missing. Render paths must be robust against an unapplied migration (empty state, banner, or all-OFF settings).

## Phase Discipline
- The build plan in docs/ai/canopy-build-plan.md sequences Phases 0 through 9. Phases 0 through 9 are the agreed scope.
- Phase 0 (locks) and Phase 6 (basic manual Pathlight flow) must remain battle-tested before any future expansion of Phase 9 (heavy automated paths).
- Net-new phases require a build-plan amendment and a decision-log entry. Do NOT freelance new phases inside an unrelated commit.
- Any new Pathlight-billable feature ships through canFireScan first. No exceptions.
- Implementation prompts end with: "Report what you changed. Do NOT commit yet." Joshua approves commits.

## Frozen Codebases
- /Users/doulosjones/Desktop/operations-cockpit/ is FROZEN. Do not edit, do not import from.
- github.com/dbjonestech-tech/canopy is FROZEN. Do not push to it.
- Do not deploy this repo to the `starauto-ops` Vercel project. That project is locked to the frozen canopy starter and serves ops.thestarautoservice.com. The rebuild from this canonical Canopy will be a deliberate scheduled migration, not a stray push.
- The Star Auto site code at github.com/dbjonestech-tech/star-auto-service is a SEPARATE repo. CanopyBeacon is mounted there; do not move that file into this repo.

## UI Conventions
- Use existing primitives only: PageHeader, Sparkline, DashboardCard, canopy-table, palette tokens from lib/admin/page-themes.ts. Do NOT introduce a parallel design system.
- Sidebar source of truth is lib/admin/nav-config.ts buildAdminNavGroups(). Do NOT hardcode sidebar items elsewhere or restate the grouping in code or copy.
- Showcase tour at /showcase/canopy is fixture-only. Do NOT wire it to live data. Do NOT cross-import between /admin and /showcase.

## Legacy Names / Migration Shims
- The product is now "Canopy." It was previously "Operations Cockpit." Marketing copy uses "Canopy" only; legacy `topic=operations-cockpit` query-param routing on the contact form stays for transition safety only and is not a current name.
- The /pricing/operations slug 308-redirects to /pricing/canopy in next.config.mjs. Keep the redirect; do not remove it.

## Brand Chrome
- First-person "I" copy across all Canopy public surfaces. Never "we."
- No em dashes anywhere in Canopy copy. Use commas, periods, or restructured sentences.
- The product name is "Canopy." Standalone, no qualifier in headings. Inline references can disambiguate ("the Canopy dashboard," "a Canopy install") when context demands. Do NOT use "Operations Cockpit" or "operations dashboard" as the product name in marketing copy.
- Pricing reference is "Starting at $25,000." Do NOT publish a fixed price; engagements scope per buyer.

## Testing
- After any Canopy code change: `npx tsc --noEmit` clean, `npm run lint` clean.
- After any pathlight-gate or canFireScan touch: manually verify each of the three layers blocks correctly (master kill on, budget exhausted, per-feature toggle off) before commit.
- After any audit_log writer change: verify a sample mutation produces a row with before/after JSONB and the right actor.
- Do NOT run `npx next build` locally as a verification step. Use tsc + lint. Vercel handles the real build.
