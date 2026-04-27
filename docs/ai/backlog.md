# Backlog

## Priority 1: Revenue-Generating Actions (Not Code)

- [ ] Follow up with Tyler on client referrals (he was texted, awaiting response)
- [ ] Ask Tyler for a one-sentence testimonial for the homepage/about page
- [ ] Build inbound lead response process: response template (acknowledge within 2 hours, 2-3 qualifying questions), discovery call structure (15-20 min), rough proposal format
- [ ] Set up Google Voice for Workspace ($10/month, dedicated business line, add to email signature)
- [ ] Run the Gemini Deep Research prompt for DFW competitive landscape, keyword research, and 90-day content plan
- [ ] Set up Google Business Profile (no physical storefront -- service area business setup)

## Priority 2: Site Polish (Quick Wins)

- [ ] Verify About page word spacing and headline fix deployed correctly
- [ ] Verify homepage white flash is resolved (hard refresh test)
- [ ] Add Tyler's testimonial to homepage or about page once received
- [ ] Verify all ~24 pages look correct (full visual audit -- Chrome MCP couldn't complete this due to scroll-triggered animations)
- [ ] **Manual: register `www.dbjtechnologies.com` as an alias domain in the Vercel dashboard so the new vercel.json www-host redirect actually fires.** Without the domain attached to the project, requests to www never reach Vercel's routing layer. After adding, verify `curl -I https://www.dbjtechnologies.com/` returns `301` to `https://dbjtechnologies.com/`.
- [ ] Audit found AboutContent.tsx ScrollWordBatch (line 129) does not honor `prefers-reduced-motion`. Text still transitions opacity 0.3->1 plus color #4b5563->#d1d5db on scroll for users who set the OS preference. Final scrolled-past state is fully readable; pre-scroll state at 30% opacity gray-600 on near-black is the audit's "extremely faded" complaint. Low priority; leave alone unless explicitly asked since AboutContent is fragile.
- [ ] (Optional) After confirming www->apex 301 in Vercel, drop `https://www.dbjtechnologies.com` from the contact-form `allowedOrigins` allowlist in `app/(marketing)/api/contact/route.ts:60-62`. Currently kept as a defensive belt-and-suspenders entry.

## Context Pack Maintenance (recurring)

- [ ] Watch for the `dbjcontext` "session-handoff.md > 30 KB" warning. When it fires, archive older session entries to docs/ai/history/.
- [ ] When the script flags new em dashes, replace with hyphens or restructure. Internal docs feed the chat that writes copy, so drift here propagates.
- [ ] When new long-lived docs are added under docs/ai/ or .claude/rules/, add them to the FILES array in scripts/dbj-context.sh.

## Priority 3: Pathlight Hardening

- [ ] Investigate intermittent "Some analysis steps could not be completed" banner (root cause traced April 27 to `s6` finalize: triggered when ANY of vision/remediation/revenue/score steps fail while audit + screenshots succeed; retry logic handles most cases, root cause for remaining occurrences still unknown)
- [ ] Pathlight admin dashboard for viewing captured lead data (scan data already persists to Postgres, just no UI to view it)
- [ ] Revenue confidence bands on reports (show range instead of single precise number)
- [ ] Input validation gate v2: extend lib/services/url.ts to also reject social media URLs (facebook/instagram/twitter/linkedin/youtube/tiktok), Google Docs/Sheets/Drive links, file:// and data:// schemes, and known parked-domain patterns (godaddysites.com, wixsite.com holding pages). Today the gate only blocks private IPs, embedded credentials, and sensitive query params.
- [x] Rate limiting per email/IP -- DONE (emailLimiter 3/24h + ipLimiter 5/24h enforced in app/(grade)/api/scan/route.ts:71-85; verified April 27)
- [ ] Pathlight landing page: add sample report screenshots (textual rewrite shipped April 25; remaining gap is visual proof of the report itself)
- [x] Resend bounce/complaint webhook -- DONE April 27. Endpoint at `/api/webhooks/resend` (Svix signature verification via `svix` package). Migration 006 extends `email_events.status` with `delivered`/`delivery_delayed`/`bounced`/`complained` plus a partial unique index `(resend_id, status)` for idempotent ingestion. Outgoing emails now carry `scan_id` and `email_type` tags so webhook events correlate even if the resend_id lookup misses. Hard bounce or spam complaint auto-marks the recipient unsubscribed via `markUnsubscribed`. 7-day bounce-rate monitor fires Sentry warning at 2% / error at 5% (skipping windows below 20 sends). **Two manual steps remaining**: (1) set `RESEND_WEBHOOK_SECRET` in Vercel from the Resend dashboard webhook config, (2) apply migration 006 to prod Neon via `lib/db/setup.ts`.
- [x] Voice report delivery -- DONE April 27. New post-finalize Inngest step `a5` generates a 60-90 second audio summary of each scan via Haiku 4.5 (script) + ElevenLabs `eleven_turbo_v2_5` Adam voice (TTS) + Vercel Blob (MP3 hosting). Best-effort: failures silent, report still ships. Migration 008 adds `audio_summary_url` + `audio_summary_script` columns to `scan_results` and extends `api_usage_events.provider` enum with `elevenlabs`. Audio player anchored at `#summary` on the report page; report email gets a "Listen to your 60-second summary" link. Skipped for out-of-scope (national/global) brands and scans with no remediation items. ~$0.20/scan marginal cost; ~$22/mo flat at Creator plan volume. **Manual deploy gates**: (1) apply migration 008 to prod Neon, (2) set `ELEVENLABS_API_KEY` in Vercel, (3) set `BLOB_READ_WRITE_TOKEN` in Vercel (create a Blob store first if needed).
- [x] PDF report download -- DONE April 27. New GET endpoint at `/api/scan/[scanId]/pdf` calls Browserless v2's `/pdf` with `emulateMediaType: "print"` so the existing print stylesheet drives the layout. Filename format: `Pathlight-Report-{hostname-slug}-{YYYY-MM-DD}.pdf`. Download button on the report sits next to Print, with idle/loading/error states. Generation logged to `api_usage_events` as `provider=browserless` / `operation=pdf-report` so cost rolls into the dashboard. Inherits the report page's UUID-only auth posture (no extra gate, by design).
- [x] Cost monitoring instrumentation -- DONE April 27. Migration 007 adds `api_usage_events` table (provider/operation/model/tokens/cost_usd/duration_ms/status/attempt). `lib/services/api-usage.ts` recorders log every individual call attempt including retries, with cost computed at log time from a per-model pricing table (Anthropic Sonnet 4.6 + Haiku 4.5). Wrapped call sites: `claude-analysis.ts` (vision-audit, remediation-plan, revenue-impact, benchmark-research), `chat/route.ts` (chat via stream.finalMessage), `browserless.ts` (screenshot-desktop / screenshot-mobile), `pagespeed.ts` (lighthouse). Browserless and PSI rows track call count + duration only since neither has a deterministic per-call dollar cost in our plans. Daily Inngest cron `pathlight-cost-alert-daily` runs 9am America/Chicago; warns Sentry at $10/day default (override via `COST_DAILY_ALERT_USD`), errors at 2x. Server-component dashboard at `/internal/cost?pin=...` (gated by `INTERNAL_ADMIN_PIN` env var, returns 404 on mismatch) shows today/7d/30d totals broken down by provider, operation, and top scans by spend. **Manual deploy gates**: (1) apply migration 007 to prod Neon, (2) set `INTERNAL_ADMIN_PIN` and (optionally) `COST_DAILY_ALERT_USD` in Vercel.
- [ ] Pipeline 420s ceiling worst-case analysis: typical scan ~335s under ceiling, but worst-case (every Anthropic call hitting full retry chain) sums to ~1100s+. Steps would not run if cumulative time exceeds 420s. Consider raising ceiling to 600-720s OR moving the 4 Claude calls behind a deferred post-finalize event so report delivery is never blocked.

## Priority 4: Content and SEO

- [ ] Blog infrastructure (no blog exists yet)
- [ ] Email capture / lead magnets
- [ ] SEO content strategy (after Gemini Deep Research results come back)
- [ ] Content targeting underserved DFW industries

## Priority 5: Pathlight V1.5 Features (After Funnel Proves Itself)

- [ ] SERP rank tracking
- [ ] GBP audit integration
- [ ] Keyword volume analysis
- [ ] Competitor comparison scans
- [ ] Historical score tracking (recurring scans)
- [ ] White-label reports

## Completed (Remove from Lists)

- [x] Star Auto DNS migration to Cloudflare -- DONE
- [x] Pricing inconsistencies ($2,500 vs $4,500, $299 vs $499) -- FIXED, live site shows correct numbers
- [x] ParticleField RAF optimization -- DROPPED (not worth the effort, no business impact)
- [x] Logo rebuild -- PAUSED (current logo works fine)
- [x] Contact form gmail -> Resend migration -- DONE
- [x] Social links (LinkedIn + GitHub) in footer -- DONE
- [x] dbjonestech@gmail.com -> joshua@dbjtechnologies.com everywhere -- DONE
- [x] "Findability" -> "Search Visibility" rename -- DONE (type system, DB alias in coercePillarScores, and public case study copy in lib/work-data.ts)
- [x] Curated vertical database integration -- DONE (206 entries, 51 high/medium skip API)
- [x] All five pipeline hardening phases -- DONE
- [x] Retry logic (Anthropic + PSI) -- DONE
- [x] Mobile screenshot emulation -- DONE
- [x] Lighthouse scores on report + chat -- DONE
- [x] Work page with real case studies -- DONE
- [x] About page redesign -- SHIPPED (bugs being fixed)
- [x] Pathlight landing page cleanup (cards removed, tagline, logo) -- DONE
- [x] Soil Depot case study -- DONE
