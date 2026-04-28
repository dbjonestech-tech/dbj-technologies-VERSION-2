# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-28.md`](history/2026-04-28.md), which holds the
verbatim record of every session entry that was below this header before
archive.

## Most Recent Session: April 28, 2026 -- Admin headquarters expansion + prod migration application

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
