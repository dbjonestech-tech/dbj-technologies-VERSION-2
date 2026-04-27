# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-27.md`](history/2026-04-27.md), which holds the
verbatim record of every session entry that was below this one before
archive.

## Last Session: April 27, 2026 -- Pathlight partial-banner mitigation (schema-repair prompt)

### What shipped

`lib/services/claude-analysis.ts` `callClaudeWithJsonSchema` repair prompt
now threads the specific `firstAttempt.error` (parse failure or Zod
validation message) back to Claude, instead of the generic "your
previous response was not valid JSON." Targets the dominant remaining
trigger of the report-page "Some analysis steps could not be completed"
banner: schema-validation failures where the JSON parsed but a field
type/shape was wrong, and the second attempt repeated the same failure
because Claude had no signal about what to fix.

No new attempts, no extra branches, no cost increase. Total Claude
calls per JSON step still capped at 2 (initial plus 1 repair). 5xx/429
network retries via `callWithRetry` (3 attempts, 15s/30s backoff)
unchanged.

### Verified visually before this fix

Joshy confirmed in incognito browser that the three April 25 active-fix
items are working:

- About-page ScrollWordBatch word spacing renders correctly (no more
  "smartdecisions" word collisions).
- About headline does not wrap mid-word at any breakpoint.
- Homepage shows no white flash on first or repeat visits.

Code for all three was already shipped; this was browser-side
verification only.

### Manual post-deploy verification (per .claude/rules/pathlight.md)

1. Re-scan `dbjtechnologies.com` once the new Vercel deploy lands.
   Score, revenue estimate, source attribution, and chatbot responses
   should match the prior baseline (Pathlight Score 78/100, low
   confidence revenue, honest methodology disclaimer).
2. Watch Sentry for any new `ClaudeAnalysisError: ${label}: could not
   parse a valid JSON response after one retry` traces over the next
   week. Expectation: drop in frequency, since the repair attempt now
   has actionable signal.

### Files changed (1 modified, 2 docs)

- `lib/services/claude-analysis.ts` -- repair prompt threads
  `firstAttempt.error` instead of generic copy. Added a 4-line WHY
  comment per project rules.
- `docs/ai/decision-log.md` -- new dated entry recording the decision
  and reasoning.
- `docs/ai/session-handoff.md` -- this entry.

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- 0 em-dashes in changed range of `claude-analysis.ts`.

### Final state

- Committed and pushed to `origin main` as `217c262`
  (`fix(pathlight): JSON-schema repair prompt threads the actual parse
  error`). Snapshot follow-up `e26e914`.
- Working tree was clean; this archive pass is the next commit.
- Vercel auto-deploys 1-3 min after push.

### Note on parallel work

A separate session shipped the Voice Report Delivery feature (commit
`4f199c5`) and a follow-up ElevenLabs cost-gap closure during this
window. Those commits and their docs are preserved untouched. The
schema-repair fix here is independent of voice and ships cleanly on
top.

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

## Unresolved Issues

- Pathlight "Some analysis steps could not be completed" banner: schema-repair mitigation shipped April 27 (`217c262`). Watch Sentry over the next week for `ClaudeAnalysisError: ... could not parse a valid JSON response after one retry` frequency. Drop = fix is working; flat = there's another root cause (likely schema mismatch in benchmark or screenshot health steps) and we revisit.
- Sample report screenshot still missing from Pathlight landing. Visual proof is the next gap, doubly urgent now that the homepage leads with PathlightCTA.
- Pathlight product error messages in `app/(grade)/pathlight/**` still use "we"/"our" (6 instances at `page.tsx:45`, `ScanStatus.tsx:330/337/347/350`, `unsubscribe/route.ts:85`). Deliberately left as system voice; pending Joshy's call.
- JSX comments containing "we" in `WhyDBJContent.tsx:137`, `ProcessContent.tsx:216`, `global-error.tsx:21`. Internal only, not customer-facing.
- **Migrations `005_dedupe_index.sql`, `006_resend_webhook_events.sql`, `007_api_usage_events.sql`, `008_audio_summary.sql`** all queued; check via `lib/db/setup.ts` whether prod Neon is current. Idempotent runner picks up every numbered `.sql` in order.
- **Manual Vercel dashboard step:** `www.dbjtechnologies.com` now attached per Joshy (April 27). After the deploy lands, verify `curl -I https://www.dbjtechnologies.com/` returns 301 -> apex, and `curl https://dbjtechnologies.com/robots.txt` shows the disallow list from `app/robots.ts` (not the prior permissive one-liner).

## Future Surface (not pending, just enumerated)

Additional Pathlight technical surface beyond the twelve pitfalls, captured for future sessions: PSI quota fallback, no auth on `/pathlight/[scanId]` report URL, 420s pipeline finish ceiling, frozen 206-entry vertical DB with no freshness signal, fixed 3s polling cadence with no exponential backoff, no aggregated telemetry on cache hit rate / screenshot health / vertical-match score histogram, no per-chat-session turn cap. (Resend bounce/complaint webhook and cost monitoring + alerting both shipped in April 27 sessions; see archive.)

## Next Recommended Tasks

1. Re-scan `dbjtechnologies.com` to verify the schema-repair fix did not regress the pipeline. Score, revenue estimate, source attribution, and chatbot responses should match the prior baseline.
2. Apply any pending DB migrations to production Neon (`005`-`008`). Idempotent script: `npx tsx lib/db/setup.ts`.
3. Add sample report screenshot(s) to Pathlight landing.
4. Screenshot all eight portfolio templates at desktop (1440px) and mobile (768px) widths (`pi-law.html`, `luxury-builders.html`, `dental-practice.html`, `med-spa.html`, `hvac-contractor.html`, `real-estate.html`, `financial-advisor.html`, `restaurant.html`) and wire them into `lib/work-data.ts`.
5. Decide on Pathlight product error message voice (system "we" vs studio "I"; leaning toward system voice per SaaS convention).
6. Follow up with Tyler on testimonial request.
7. Run the Gemini Deep Research prompt for DFW competitive landscape and keyword research.
8. Set up Google Voice for business phone number ($10/month Google Workspace add-on). Then add `telephone` to `Organization` and `LocalBusiness` JSON-LD in `components/layout/JsonLd.tsx`.

## Current Git Status

`main` is at `e26e914` (chore: update session-handoff snapshot for 217c262), confirmed pushed to `origin main`. Working tree clean (this archive commit is the next change). Recent chain (most recent first): `e26e914` (snapshot for 217c262) -> `217c262` (Pathlight JSON-schema repair prompt threads actual parse error) -> `ad45de5` (other-tab work) -> `cd423fc` (snapshot for 4f199c5) -> `4f199c5` (Voice Report Delivery, ElevenLabs Adam) -> `365c6ad` (snapshot for 9434ff7) -> `9434ff7` (SEO/a11y/canonical fixes: unblock app/robots.ts, www->apex redirect, hide loader chrome from a11y) -> earlier chain elided in archive.
