# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-02.md`](history/2026-05-02.md).

## Current state (May 3, 2026 -- Inngest cron registration in flight; Commits A and B shipped)

### Anchor block

HEAD: `8420b34` (feat(inngest): wire Commit B cron `vercel-telemetry-hourly`; same-commit `current-state.md` update). `git log -1` is the authoritative source.

Recent commits (newest first):
- `8420b34` -- Commit B: wire `vercel-telemetry-hourly` in serve handler (this commit). Fires at `:10` past each hour, snapshots Vercel deployments via REST API into `vercel_deployments` for `/admin/platform`. All three Vercel env vars confirmed set in production.
- `b637ca3` -- Commit A: wire `inngest-health-hourly`, `funnel-refresh-hourly`, `email-kpi-refresh-hourly`. Verified green in Inngest dashboard with multiple successful runs at 0% failure rate before Commit B shipped.
- `acc2bce` -- Pathlight reliability hardening (send-time email integrity gate, vision desktop-only support, Browserless 429 exponential backoff, report CTA gate, migration 036)
- `ffd760a` -- Pathlight scan form business-name placeholder refreshed to "Mockingbird Optical"
- `688ec27` -- Stage 1: page critique side-step
- `0efae8e` -- migration 035 (page_critique JSONB column)

Working tree: clean. Pushed to origin main confirmed.

### Cron registration progress (staged plan A through E)

The seven Inngest cron exports added in commit `1173bc2` (April 28) were never registered in the serve handler. Staged registration in flight, one risk-tier per commit. Each commit deploys, we verify the cron's first scheduled fire (or manual Inngest invoke for the daily ones) in the Inngest dashboard, then proceed.

- **Commit A** (`b637ca3`): `inngest-health-hourly` (`:15`), `funnel-refresh-hourly` (`:05`), `email-kpi-refresh-hourly` (`:25`). Zero env-var deps. **Verified green** in Inngest dashboard (multiple successful runs, 0% failure rate).
- **Commit B** (`8420b34`, this commit): `vercel-telemetry-hourly` (`:10`). Requires `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (all confirmed set in Vercel production). **Awaiting first scheduled fire** at next `:10` UTC.
- **Commit C** (pending): `anthropic-budget-hourly` (`:20`). Requires `ANTHROPIC_ADMIN_KEY`, `ANTHROPIC_MONTHLY_BUDGET_USD` (both confirmed set).
- **Commit D** (pending): `search-console-daily` (06:00 UTC). Requires `GOOGLE_SC_CREDENTIALS_JSON`, `GOOGLE_SC_SITE_URL` (both confirmed set), plus GSC permissions UI grant for the service account.
- **Commit E** (pending): `infrastructure-check-daily` (08:00 UTC). No new env vars. Most operationally severe of the four pending, since it is the sole TLS / WHOIS / DNS-auth expiry warning channel.

Verify Commit B in the Inngest dashboard at https://app.inngest.com/env/production/functions/dbj-technologies-vercel-telemetry-hourly within ~60 minutes of this push. Green run = ship Commit C.

### What shipped this session: Pathlight reliability hardening (Phase 1 + Phase 2)

Triggered by a real production failure on `wingertrealestate.com` (scan id `43c0cf06-d6e9-46c0-a0d8-e731d09cb61b`, May 3 ~23:09 UTC) where a single Browserless 429 on the mobile screenshot cascaded into vision/remediation/revenue/score all skipping, and the report email then dispatched anyway with `PATHLIGHT SCORE: n/a/100` and `EST. MONTHLY REVENUE LOSS: a meaningful amount`. Fix is layered defense + structural decoupling.

**Migration:**
- `036_email_events_held_status.sql` -- extends `email_events_status_check` to allow the new `held` terminal status. Applied to prod Neon before the code commit.

**Phase 1 -- email integrity gate:**
- `lib/email-templates/pathlight.ts`:
  - `formatMoney(null)` now THROWS rather than returning the placeholder string `"a meaningful amount"`. Defense in depth: if the send-time gate ever leaks, the loud failure beats a customer email with placeholder copy.
  - `greeting()` always returns `Hi there,`. The Business Name field is a company name; "Hi {Company}," reads like a mail-merge bug.
- `lib/services/email.ts`:
  - New `held` status added to `EmailStatus` union.
  - `sendPathlightReport`: if `pathlightScore === null || revenueLoss === null`, log `held`, fire `track("email.report.held", ...)` and a Sentry warning, return without dispatch. The customer never gets the broken email; Joshua sees the held event and triggers a manual rescan.
  - `sendFollowUp`: same gate (uniform across the 48h/5d/8d chain even though only 48h and 8d embed revenue, because if the original report was held the followups should not arrive out of sequence).
- `lib/inngest/functions.ts` (e1 step): unchanged behavior on success; recognizes the new `held` return so the `email.report.sent` track event no longer fires for held emails.
- `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` (FinalCta): suppresses the closing "Ready to fix these?" CTA when the page has no remediation findings and is not out-of-scope. The CTA copy refers to specific items above it; without them it was selling against nothing.

**Phase 2 -- pipeline resilience:**
- `lib/services/browserless.ts`:
  - New `isRateLimitError` helper detects `(429)` response codes.
  - New `callWithRateLimitRetry` wrapper: exponential backoff `[1000ms, 2000ms, 4000ms]` (4 attempts total) on 429 specifically, no-op on other errors. Fits inside the per-attempt 55s `SCREENSHOT_TIMEOUT_MS` envelope.
  - `captureScreenshot` and `captureFullPageScreenshot` both wrap their primary AND fallback strategy attempts in `callWithRateLimitRetry`. The wingert incident's rate limit cleared in ~4s, so even the first 1s/2s tier would have saved that scan.
- `lib/inngest/functions.ts` (a1 vision step): vision now runs when EITHER desktop OR mobile screenshot is present. Previously hard-required both; a single transient browserless failure on one viewport wiped the entire AI pipeline.
- `lib/services/claude-analysis.ts` (`runVisionAudit`):
  - Signature widened from `string` to `string | null` for both `desktopScreenshot` and `mobileScreenshot`.
  - Throws if BOTH are null (defense in depth; the inngest gate enforces this).
  - User-message blocks are built conditionally: when one viewport is missing, an explicit text block tells the model to score `mobile_experience` (or the desktop-side findings) from the available image plus Lighthouse signals, rather than penalizing for the missing image.

### Verification gates passed

- `npx tsc --noEmit` clean
- `npm run lint` clean
- 0 em dashes added in new lines across all 6 changed files
- 0 internals leaked in any user-facing string (no model names, no step IDs, no provider names in held-email copy)
- Migration 036 applied to prod Neon successfully (`Migration applied successfully.`)

### What still needs to happen

1. **Re-scan `wingertrealestate.com` via /admin/monitor "Re-scan this URL" button.** The bad scan (`43c0cf06-d6e9-46c0-a0d8-e731d09cb61b`) is currently stored with null score and null revenue. After the new code deploys (~3 min), the rescan should produce a complete report and the original prospect (`emeraldoilean@gmail.com`) gets a clean email instead of the broken one. The 48h/5d/8d followup chain for the OLD scan ID will hit the new send-time gate when its sleeps fire and be held automatically (no bad emails will ship from that scan).
2. **Verify the gates with a fresh scan against any healthy site.** Confirm the report email lands with real numbers (no n/a, no placeholder revenue copy), the report page renders FinalCta correctly when remediation is present, and `/admin/monitor` shows no `email.report.held` events for normal scans.
3. **Phase 3 (deferred):** auto-rescan on transient browserless-attributable partial failures. Inngest `step.sleep(60s)` then re-run the pipeline; if the second pass succeeds, overwrite scan_results and let the (now-passing) gate ship the email. Discussed in this session, deliberately deferred to keep this commit's blast radius contained.

### do-not-break.md update posture

Per the standing bake-in discipline, hold do-not-break.md updates until at least one fresh real scan confirms the new gates fire correctly on a complete scan and stay quiet on a clean scan. Add entries after that for: the send-time email integrity gate, the vision desktop-only fallback path, and the Browserless 429 retry envelope.

### What shipped this session

Stage 1 of the Pathlight enhancement project. Per the Stage 0 audit's recommendation (and contrary to the original Item 1 framing), this was implemented as a SPLIT-call architecture rather than a bundled extension of the existing vision-audit call. The existing `visionAuditSchema` is unchanged; page critique is a separate artifact with its own Zod schema, its own retry, and its own report-rendering surface.

**Two commits:**

1. `0efae8e` -- migration 035 alone (one additive nullable JSONB column, `page_critique`). Applied to prod Neon successfully.
2. `688ec27` -- Stage 1 code + doc updates in one commit.

**Files changed in commit 2 (code):**

- `lib/services/page-critique.ts` (new) -- `runPageCritique` calls `callClaudeWithJsonSchema` with temperature 0 against the desktop AtF screenshot only, plus a small text context summarizing the existing design and positioning sub-scores so the model does not redundantly call out the same issues. Schema validates `{ heroObservation, headline { current, alternatives }, ctas[1..5] }`. Each CTA carries verbatim text + location + visibility 1-10 + observation + nextAction. Each alternative carries verbatim text + 1-2 sentence rationale.
- `lib/inngest/functions.ts` -- new step `c1` inserted between `e1` (report email) and `w1` (first follow-up sleep). Gated on `visionStep.ok && screenshots.desktop`. Reads from a new `getPageCritiqueInput` helper that pulls only the columns it needs. Persists via `updateScanPageCritique`. Failure is swallowed (matches the audio + forms-audit posture). Tracked via `track("page-critique.generated"|"page-critique.failed")`.
- `lib/db/queries.ts` -- new writer `updateScanPageCritique`, new reader `getPageCritiqueInput`, three new coercion helpers (`coercePageCta`, `coerceHeadlineAlternative`, `coercePageCritique`). `getFullScanReport` surfaces `pageCritique`. `loadScanWithResults` SELECT extended.
- `lib/types/scan.ts` -- new types `PageCtaLocation`, `PageCta`, `PageHeadlineAlternative`, `PageHeadline`, `PageCritiqueResult`. `PathlightReport.pageCritique` added.
- `lib/services/pathlight-health.ts` -- `page-critique` added to `PATHLIGHT_STAGES` and `LABEL_TO_STAGE` (forward-compat scaffolding; failures are swallowed today and never surface in error_message).
- `app/(grade)/api/scan/[scanId]/route.ts` -- new `pageCritique` field surfaced. `htmlSnapshot` continues to be server-side only.
- `app/(grade)/pathlight/[scanId]/HeroCritiqueSection.tsx` (new) -- renders three blocks under one "Above the fold" section heading: hero observation paragraph, headline rewrite block (current + alternatives with rationale), CTA cards (location label + visibility tone + observation + "Try this" callout). First-person copy, no internals, no em dashes. Returns null gracefully when `pageCritique` is null.
- `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` -- imports the new section + type. `ApiReport` extended with `pageCritique`. Insert HeroCritiqueSection between LighthouseBreakdown and FormsAuditSection. Polling logic rewritten: `postFinalizeFieldsLanded(report)` returns true when `audioSummaryUrl` (or out-of-scope), `formsAudit`, and `pageCritique` have all settled. Cap raised from 36s (12 polls) to 60s (20 polls) to cover the typical post-c1 delivery window.
- `lib/prompts/pathlight-chips.ts` -- two new finding-aware chips (`pageCritiqueChip`, `formsAuditChip`) inserted ahead of the generic pillar chip. Strip capped at 5 entries. The `generateSuggestedChips` signature now reads `pageCritique` and `formsAudit` from the report.
- `docs/ai/current-state.md`, `docs/ai/session-handoff.md`, `docs/ai/decision-log.md` -- doc updates.

### Verification gates passed

- `npx tsc --noEmit` clean
- `npm run lint` clean
- Em dashes in additions across the Stage 1 commits = 0
- Internals leak grep on rendered copy = 0 (no `claude/sonnet/haiku/opus/inngest/browserless/anthropic/gpt/llm`, no step-id leakage)
- `visionAuditSchema` unchanged
- `ScoreHero`, `PillarBreakdown`, `RevenueImpactBlock` unchanged
- Top-level Inngest function IDs unchanged; one new step ID (`c1`) added inside `pathlight-scan-requested`

### Operational items pending verification

The code shipped, but these still need browser eyes once the Vercel deploy completes:

1. **Run a real Pathlight scan.** Pick any public homepage. Confirm:
   - The report renders the existing hero, pillar, Lighthouse, screenshots, fixes, revenue sections as before.
   - "Above the fold" section appears between Lighthouse Scores and the forms section. A 3-5 sentence hero observation paragraph reads in first person ("I noticed..."). The headline block shows the current headline plus three alternatives with short rationales. CTA cards render with location label + visibility tone (Easy to find / Findable / Hard to find) + observation + "Try this" callout.
   - The section may not be visible immediately after status flips to complete; the polling loop now waits up to 60s for c1 to land. If it still does not appear, refresh once.
2. **Confirm scan_results writes.** `select scan_id, page_critique is not null as has_critique, forms_audit is not null as has_forms, html_snapshot is not null as has_html, screenshots_fullpage is not null as has_fp from scan_results order by created_at desc limit 1;` after a fresh scan. All five columns should be `t` for a successful scan against a site with at least one form.
3. **Pathlight Health dashboard** (`/admin/monitor`) should show a new operation `page-critique` in the per-provider rollup once data accumulates. The new stage `page-critique` appears in PATHLIGHT_STAGES (forward-compat; not surfaced in the partial breakdown today).
4. **Print/PDF output** should include the "Above the fold" section because the existing print stylesheet on `.pathlight-report` already covers any section that uses the standard cards / `print-avoid-break`. Spot-check by hitting the report's print button.

### Time budget note

Stage 1 adds one new vision-class call running post-email at the standard 90s timeout. Worst-case retry cascade is ~315s, but the placement (after e1 email, before w1 sleep) means a worst-case `c1` cannot block report delivery. If c1 retry-cascades, the function's 420s budget is consumed by `c1` before `w1` sleep starts; the user has the email and the report URL; the followup chain (e2/e3/e4) executes on schedule because Inngest's sleep-driven re-entry restarts the function timeout. If under realistic traffic c1 routinely consumes more than ~25s, lower its per-call timeout via a dedicated bucket (mirror the FORMS_AUDIT_CALL_TIMEOUT_MS pattern from Stage 2).

Per-scan token cost delta: roughly +50-60% of one existing vision-class call (one image + ~2KB output) added to the per-scan total. At Joshua's current scan volume this is well within the cost-monitor circuit breaker.

### Next recommended task (Joshua decides what ships next)

Verify the Stage 1 pieces with a real scan. If they hold up, Stage 3 (text-side analyses leveraging the captured HTML: tone-of-voice, NAP extract, OG/social-card preview, CTA destination trace, tech health beyond Lighthouse) is the natural follow-on. Stage 3 is purely additive (no schema changes anywhere) and reuses the post-finalize side-step posture established by Stages 1 and 2.

### Working tree

Clean.
