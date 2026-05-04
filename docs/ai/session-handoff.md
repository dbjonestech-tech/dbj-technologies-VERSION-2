# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-02.md`](history/2026-05-02.md).

## Current state (May 3, 2026 -- Inngest cron registration A-E shipped; canopy.md rules file shipped at `5d17cbd`; Phase 1 Canopy marketing rewrite unblocked)

### Anchor block

HEAD: `5d17cbd` -- adds `.claude/rules/canopy.md`, the canonical Canopy rules file. Unblocks Track 2 (Phase 1 Canopy marketing rewrite). `git log -1` is authoritative.

Recent commits (newest first):
- `5d17cbd` (this commit) -- `docs(rules): add .claude/rules/canopy.md`. New 92-line rules file modeled on pathlight.md / deployment.md / frontend.md. Sections: top-level disambiguation block (literally names both `.claude/rules/canopy.md` and `.claude/rules/pathlight.md` with their respective code paths), Public Presentation, the six lead-score component names as forbidden public enumerations with a token-vs-enumeration clarifier, the three-layer Pathlight lock invariant, CRM Architecture Invariants (auth gate moved here as a security invariant, deals-as-primary-stage), Vendor Posture (Sentry stays wired and is NOT a Canopy replacement, Turnstile unrelated, Resend stays for transactional), Migrations, Phase Discipline (durable directive form, not state declaration), Frozen Codebases (operations-cockpit, canopy starter, starauto-ops Vercel project), UI Conventions, Legacy Names / Migration Shims (operations-cockpit query-param transition shim), Brand Chrome, Testing. All 10 self-review tightenings applied; Joshua reviewed and stamped accept-all before commit. Zero em dashes. Marketing-rewrite-scope note logged: the Phase 1 prompt must include the `lib/work-data.ts:375` Sentry-cleanup (drop Sentry from the "excellent products" replaceable-vendor example list) in the same commit so canopy.md does not ship with a rule the repo violates.
- `2b2b54e` -- `docs: fill aff8118 hash for Stage 3a in handoff` (handoff hash-fill)
- `aff8118` -- Pathlight Stage 3a, social-share preview side-step (migration 037, OG-preview parser, OgPreviewSection on report page)
- `4ab7a65` -- `docs: fill 29545c0 hash for screenshotHealth fix in handoff` (handoff hash-fill)
- `29545c0` -- Pathlight vision-audit screenshotHealth tightening (eliminates false-positive `loading-or-skeleton` on sparse-by-design pages)
- Commit E (`796bcfa`) -- wire `infrastructure-check-daily` in serve handler. Fires daily at 08:00 UTC. WHOIS / TLS / DNS-auth expiry checks for every DBJ-managed domain. `retries: 0` is intentional (slow probes; retrying amplifies budget envelope).
- `77583c5` -- Commit D: wire `search-console-daily` (06:00 UTC). Bundled an unrelated print-fix change to `ScanStatus.tsx` and `globals.css` that had been staged in the working tree (Joshua's pending print/PDF stylesheet work). The cron edit and the print fix are independent and both intentional, just landed in the same commit by accident of staging timing.
- `141856c` -- Commit C: wire `anthropic-budget-hourly` (`:20`). `snapshotAnthropicBudget` falls back to local `api_usage_events` when Admin API yields nothing.
- `95d1dcd` -- standalone session-handoff doc update (branch protection blocked the amend force-push for Commit B, so this followed as a separate commit per CLAUDE.md fallback).
- `8420b34` -- Commit B: wire `vercel-telemetry-hourly` (`:10`). Registered, visible in Inngest dashboard.
- `b637ca3` -- Commit A: wire `inngest-health-hourly` (`:15`), `funnel-refresh-hourly` (`:05`), `email-kpi-refresh-hourly` (`:25`). **Verified green** in Inngest dashboard with multiple successful runs at 0% failure rate before B shipped.
- `acc2bce` -- Pathlight reliability hardening (send-time email integrity gate, vision desktop-only support, Browserless 429 exponential backoff, report CTA gate, migration 036)

Working tree: clean. Pushed to origin main confirmed.

### Cron registration progress (staged plan A through E -- COMPLETE)

The seven Inngest cron exports added in commit `1173bc2` (April 28) were never registered in the serve handler. Staged registration is now complete, one risk-tier per commit:

- **Commit A** (`b637ca3`, shipped): `inngest-health-hourly`, `funnel-refresh-hourly`, `email-kpi-refresh-hourly`. **Verified green.**
- **Commit B** (`8420b34`, shipped): `vercel-telemetry-hourly`. Registered and visible in dashboard. Awaits first scheduled `:10` UTC fire (~30 min after deploy).
- **Commit C** (`141856c`, shipped): `anthropic-budget-hourly`. Defensively coded with local-event fallback. Awaits first `:20` UTC fire.
- **Commit D** (`77583c5`, shipped): `search-console-daily` (06:00 UTC). Awaits first daily fire OR a manual Inngest dashboard invoke for faster verification. **Outstanding risk:** the function will return 403 on first run if the GSC service account does not have access to the GSC property. Fix is a Google Cloud Console permissions grant, not a code change.
- **Commit E** (this commit): `infrastructure-check-daily` (08:00 UTC). No new env vars. `retries: 0` is intentional. Awaits first daily fire OR a manual dashboard invoke.

### Next session priorities

1. **Verify the four daily/hourly first runs in the Inngest dashboard.** B and C will fire automatically within the next hour; D and E require either patience until tomorrow morning UTC or manual dashboard invocation. For D specifically, click Invoke first, watch for 403, then resolve the GSC permission grant in the Google Cloud Console if needed.
2. **Track 2 (Canopy marketing rewrite) is now UNBLOCKED.** `.claude/rules/canopy.md` shipped at `5d17cbd` with all 10 self-review tightenings applied. Joshua to issue the Phase 1 marketing rewrite prompt next. Scope: rewrite of the `lib/work-data.ts` Canopy entry, productized-engagement softenings on `/about` and `/work/canopy`, the `OPS_CAPABILITIES` to `CANOPY_CAPABILITIES` rename in `AboutContent.tsx`, the `/showcase/canopy/layout.tsx` banner softening, stale work-page metric updates, and the `lib/work-data.ts:375` Sentry-cleanup (drop Sentry from the "excellent products" replaceable-vendor example list per the new Vendor Posture rule, must ship in the same commit so canopy.md does not land with a rule the repo violates). Same-commit `current-state.md` update per CLAUDE.md.

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

### Post-reliability-hardening micro-edits (May 3 evening)

- **Hero-video unstuck + media-error fallback cleanup (HEAD `2775118`).** Wingert rescan #4 (May 04 03:26:50 UTC, scan id `10a977be-15bf-4b9c-96a7-1b63d7e055bf`) confirmed the prompt update from `2178178` shipped (the heroObservation now opens with `"The nav reads 'Wingert | Real Estate Company' and the hero subline confirms 'Commercial Real Estate Company.' -- so the business category is clear."`). But the screenshot capture STILL surfaced the broken-video error overlay plus the raw `xstatic.com/.../1080p/mp4/file.mp4` URL bleeding through as text. Removing the blanket media-abort was not sufficient on its own: the underlying video file still fails in headless Chromium for reasons we cannot fix from our side (Showit CDN UA filtering, missing proprietary codec support in the Browserless Chromium build, or a combination). Two layered remediations added to BOTH `SCREENSHOT_FUNCTION` and `SCREENSHOT_FULLPAGE_FUNCTION`:
  1. **Explicit `.play()` on every `<video>` element** with `muted = true` set first. Many sites only fail because of the autoplay policy; an explicit JS `.play()` call satisfies the user-gesture requirement when the element is muted. Sites where this is the only block now show real video frames in the screenshot.
  2. **CSS-hide any text whose content matches typical media-error fallback patterns.** Defensive cleanup for the case where the video genuinely cannot play. The site's own error fallback (which often includes the literal browser error string and the raw video URL as debug text) is hidden via per-text-node parent `display: none` / `visibility: hidden`. The screenshot then shows the site's intended dark hero card on the site's default body background, rather than diagnostic strings that no real visitor sees.
  - Patterns: `/format\(s\) not supported|source\(s\) not found|your browser does not support/i` plus a media-URL pattern `/^[\w.-]+\.[a-z]{2,}\/[\w/-]+\.(mp4|webm|mov|m4v|ogv)\b/i` that hides raw video URLs surfaced as text.
  - Inserted between cookie-banner dismissal and `document.fonts.ready` in the AtF capture; same posture (after navigation, before settle) in the full-page capture. 800ms post-play settle to let the first frame render before the larger settle window.
  - Trade-offs: hiding error-fallback text could in principle hide a site's intentional "your browser is unsupported" warning. That is the trade we want -- those warnings only render when the browser cannot do something, which means a real visitor in a real browser would not see them. Keeping them in the screenshot would systematically mis-represent every site whose prefers-reduced-motion fallback or CDN check happens to fire in our headless capture.

- **Capture + analysis truthfulness fix (HEAD `2178178`).** Two compounding artifacts on the wingert rescans were producing a "the site is broken" finding that was actually a Pathlight self-inflicted screenshot artifact, not a real defect on the prospect's site. Joshua confirmed via direct browser inspection that wingertrealestate.com renders a clean hero card on top of a Dallas-skyline drone background video that plays correctly. Two surgical fixes:
  1. **`lib/services/browserless.ts`** -- removed the blanket `if (type === 'media') return req.abort();` in BOTH `SCREENSHOT_FUNCTION` and `SCREENSHOT_FULLPAGE_FUNCTION`. The original justification was "media adds nothing to the screenshot but blocks the page from settling" -- but that is wrong for the common pattern of hero background videos. Aborting the video request causes the `<video>` element to fire its `error` event, which on many sites renders a visible "Format(s) not supported or source(s) not found" overlay plus the raw file path on the page. We were screenshotting that overlay and the vision audit was honestly reporting "your hero is broken" against a defect that does not exist on the live site. The 2.5s primary settle window (or 6s fallback) does not wait for the entire video to download; the browser starts playing and we capture whatever frame is current. The `BLOCKED_HOSTS` list (analytics, chat widgets, video embeds known to never render usefully) still aborts those.
  2. **Page-critique + vision-audit prompts updated to read the page as a composition, not as isolated elements.** A site whose nav says "Wingert | Real Estate Company" and whose hero subline says "Commercial Real Estate Company." HAS told the visitor what the business is; the prior prompts treated only the hero card and concluded "no clue what this business does," which fed wrong service_clarity (4/10) and value_proposition (5/10) sub-scores. New prompt language: read (a) the navigation brand mark plus tagline, (b) the hero card, and (c) the visible CTAs as one composition. Score what the composition communicates, not what any single element communicates in isolation. If the nav names brand + category and the hero reinforces it, do not penalize for "the page never says what they do." A second paragraph in both prompts explicitly addresses background-video hero patterns: do not classify the page as broken because of imagery behind a hero card; only flag broken video when the screenshot literally shows an error string AND the page text gives no other signal the imagery is intentional.
  - Files: `lib/services/browserless.ts`, `lib/services/page-critique.ts`, `lib/services/claude-analysis.ts`. No schema changes, no migration.
  - Verification will be a fresh wingert rescan: expect (a) the desktop screenshot to capture a real video frame from the Dallas skyline drone footage rather than the broken-video error overlay, (b) the heroObservation to describe the nav-to-hero composition rather than asserting the business is unidentifiable, and (c) the top-3 fixes to drop the "broken hero video" item entirely.

- **Print/PDF stylesheet fix (shipped inside HEAD `77583c5`, the Commit D cron commit).** The wingert PDF showed a blank page 3 followed by a giant overflowing full-page screenshot bleeding across pages 4 and 5. The fix files were in the working tree when Joshua ran `git add` for Commit D, so two unrelated changes landed in that commit alongside the search-console-daily registration; the print fix is live in production regardless. Two changes:
  - `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` -- the Desktop full-page panel now sets `printBreakBefore` (Mobile already did). Each full-page capture now starts on its own print page deliberately.
  - `app/globals.css` -- added `max-width: 100% !important` to the `.print-break-before img` rule. Without it, an oversized full-page screenshot rendered at its natural intrinsic width (1440px) and overflowed Letter page width (8.5in @ 96dpi = 816px), defeating the existing 80vh height cap.
  - Net effect: full-page captures now scale to the page (max 80vh tall, max 100% wide) and start on dedicated pages, eliminating the blank-page artifact.

- **Pathlight Stage 3a: social-share preview (HEAD `aff8118`).** Adds a "When someone shares your site" section to the report that renders a Facebook/LinkedIn-style card simulation showing the prospect what their link looks like in a feed today, plus a list of severity-tagged structural problems detected in the OG/Twitter meta tags. Pure HTML parser of `html_snapshot.html` (already captured by Stage 2); no AI call, no external network, no marginal per-scan cost. Mirrors the Stage 1/2 post-finalize side-step posture (gated, swallowed-on-failure, never marks a scan partial).
  - **Migration 037** -- one additive nullable JSONB column `og_preview` on `scan_results`. Applied to prod Neon successfully before the code commit.
  - **`lib/services/og-preview.ts`** (new) -- `extractOgPreview(html, scannedUrl)` regex-extracts every `<meta property=og:*>` and `<meta name=twitter:*>` tag, the `<title>`, the meta description, and the canonical link. Resolves relative og:image / og:url against the scanned URL. Returns `{ meta, pageTitle, pageDescription, problems[] }`. Detects 5 problem classes (no og:image, no share title, no share description, twitter:card variant, missing og:url / canonical, missing og:image:alt) with severity tags.
  - **`lib/inngest/functions.ts`** -- new step `o1` inserted between `c1` (page critique) and `w1` (first follow-up sleep). Gated on `html_snapshot` present. Persists via `updateScanOgPreview`. Failure swallowed. Tracked via `track("og-preview.generated"|"og-preview.failed")`.
  - **`lib/db/queries.ts`** -- new writer `updateScanOgPreview`, new reader `getOgPreviewInput`, three new coercion helpers (`coerceOgPreviewMeta`, `coerceOgPreviewProblem`, `coerceOgPreview`). `getFullScanReport` surfaces `ogPreview`. `loadScanWithResults` SELECT extended.
  - **`lib/types/scan.ts`** -- new types `OgPreviewProblemSeverity`, `OgPreviewProblem`, `OgPreviewMeta`, `OgPreviewResult`. `PathlightReport.ogPreview` added.
  - **`app/(grade)/api/scan/[scanId]/route.ts`** -- `ogPreview` field surfaced.
  - **`app/(grade)/pathlight/[scanId]/OgPreviewSection.tsx`** (new) -- renders the Facebook/LinkedIn card simulation, an optional Twitter card simulation when distinct twitter:* metadata is present, and the severity-tagged problems list. First-person copy, no em dashes, no internals.
  - **`app/(grade)/pathlight/[scanId]/ScanStatus.tsx`** -- imports + renders `OgPreviewSection` between `FormsAuditSection` and `ScreenshotsSection`. `ApiReport` extended with `ogPreview`. Polling logic extended: `postFinalizeFieldsLanded` now waits for `ogPreview` to settle alongside audio, forms, page critique.
  - **`lib/services/pathlight-health.ts`** -- `og-preview` added to `PATHLIGHT_STAGES` and `LABEL_TO_STAGE` (forward-compat scaffolding; failures are swallowed today and never surface in error_message).
- **Vision-prompt screenshotHealth tightening (HEAD `29545c0`).** Two fresh wingert rescans both rendered as comprehensive reports (score 52 then 49, full pillar breakdown, top-3 fixes, page critique, revenue impact with reasoning), but BOTH carried a yellow `screenshotNotice` banner saying "the page was in a pre-render or loading state, treat scores as low-confidence." That banner contradicted the substantive analysis above it and was a false positive: wingert's hero IS rendered (small hero card, "A PEOPLE FIRST" text, three styled red buttons, brand logo, broken-video error overlay), it is just sparse and broken by design. The vision-audit model was misclassifying screenshotHealth as "loading-or-skeleton" because the prior prompt's catch-all phrase `"a near-empty page that the page text suggests should have content"` collapsed two distinct cases (mid-render vs sparse-by-design) into one. Fix is in `lib/services/claude-analysis.ts` SCREENSHOT HEALTH section + the IMPORTANT note below GUIDELINES:
  - `loading-or-skeleton` now requires concrete evidence (visible spinner icon, gray skeleton placeholder boxes, explicit "Loading..." text, or unstyled raw HTML with no CSS).
  - Explicitly states that small-hero-on-empty-background, broken-media-error overlays, and "looks under-designed" are NOT loading states; they are real rendered output and the design sub-scores already capture the sparseness.
  - The `clean` classification is now the explicit default; any other value requires the model to point to a specific concrete signal.
  - No false negatives introduced: every previous trigger for `loading-or-skeleton` (spinners, skeleton boxes, unstyled HTML) is preserved verbatim. Only the false-positive trigger is removed.

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
