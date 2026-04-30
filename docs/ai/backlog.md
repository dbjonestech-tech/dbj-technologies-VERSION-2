# Backlog

## Priority 1: Revenue-Generating Actions (Not Code)

- [ ] Follow up with Tyler on client referrals (he was texted, awaiting response)
- [ ] Ask Tyler for a one-sentence testimonial for the homepage/about page
- [ ] Build inbound lead response process: response template (acknowledge within 2 hours, 2-3 qualifying questions), discovery call structure (15-20 min), rough proposal format
- [ ] Set up Google Voice for Workspace ($10/month, dedicated business line, add to email signature)
- [ ] Run the Gemini Deep Research prompt for DFW competitive landscape, keyword research, and 90-day content plan
- [x] Set up Google Business Profile (no physical storefront -- service area business setup) -- DONE 2026-04-30: GBP verified + active. Address Royse City TX 75189, service area Hunt County, phone (682) 325-8324, 5.0 / 2 reviews. Open NAP question: site brands as "Dallas, TX" but GBP shows Royse City -- decide whether to hide GBP address and broaden service area to "Dallas-Fort Worth Metroplex" OR widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex".

## Priority 2: Site Polish (Quick Wins)

- [ ] Add Tyler's testimonial to homepage or about page once received
- [ ] Verify all ~24 pages look correct (full visual audit -- Chrome MCP couldn't complete this due to scroll-triggered animations)
- [ ] **Manual: register `www.dbjtechnologies.com` as an alias domain in the Vercel dashboard so the new vercel.json www-host redirect actually fires.** Without the domain attached to the project, requests to www never reach Vercel's routing layer. After adding, verify `curl -I https://www.dbjtechnologies.com/` returns `301` to `https://dbjtechnologies.com/`.
- [ ] Audit found AboutContent.tsx ScrollWordBatch (line 129) does not honor `prefers-reduced-motion`. Text still transitions opacity 0.3->1 plus color #4b5563->#d1d5db on scroll for users who set the OS preference. Final scrolled-past state is fully readable; pre-scroll state at 30% opacity gray-600 on near-black is the audit's "extremely faded" complaint. Low priority; leave alone unless explicitly asked since AboutContent is fragile.
- [ ] (Optional) After confirming www->apex 301 in Vercel, drop `https://www.dbjtechnologies.com` from the contact-form `allowedOrigins` allowlist in `app/(marketing)/api/contact/route.ts:60-62`. Currently kept as a defensive belt-and-suspenders entry.

## Context Pack Maintenance (recurring)

- [ ] Watch for the `dbjcontext` "session-handoff.md > 30 KB" warning. When it fires, archive older session entries to docs/ai/history/.
- [ ] When the script flags new em dashes, replace with hyphens or restructure. Internal docs feed the chat that writes copy, so drift here propagates.
- [ ] When new long-lived docs are added under docs/ai/ or .claude/rules/, add them to the FILES array in scripts/dbj-context.sh.

## Priority 2.5: Monitoring + Observability (Net New as of April 27)

- [x] In-house real-time monitoring dashboard at /internal/monitor -- DONE April 27. monitoring_events + lighthouse_history tables (migration 009 applied to prod), track() helper in lib/services/monitoring.ts, daily Lighthouse cron, 4-hourly synthetic canary cron, 30-day events purge cron, server-component dashboard with funnel/severity/Lighthouse/SSE-live-tail, per-scan drill-down at /internal/monitor/scan/[scanId], public /api/status JSON endpoint. Gated by INTERNAL_ADMIN_PIN. Optional env: MONITORING_LIGHTHOUSE_FLOOR (default 90), MONITORING_CANARY_URL (default thestarautoservice.com).
- [x] Admin headquarters expansion -- DONE April 28. First-party visitor analytics (visitors / sessions / page_views / page_view_engagement, migration 014), funnel cohort views (015), Vercel telemetry (016), Inngest run history (017), infrastructure watcher (018), Anthropic budget snapshots (019), Search Console daily import (020), email KPI rollup (021). Twelve admin surfaces total: Visitors / Funnel / Search / RUM / Monitor / Costs / Scans / Leads / Database / Pipeline / Platform / Errors / Email / Infrastructure / Audit / Users / Clients. Three-column landing with green/yellow/red worst-of status bar. Migrations + new env vars are listed in session-handoff.md and need to be set in Vercel before the dashboards hydrate.

### Open follow-ups for the dashboard expansion

- [x] Apply migrations 014-021 to production database -- DONE April 28. `npx tsx lib/db/setup.ts` applied cleanly. Pre-migration: 15 tables, 0 materialized views; post-migration: 25 tables, 3 materialized views. All 21 read APIs smoke-tested against the migrated DB; visitor analytics already capturing real beacon traffic.
- [ ] Set the new Vercel env vars: ANALYTICS_IP_SALT_BASE (required), VERCEL_API_TOKEN + VERCEL_PROJECT_ID + VERCEL_WEBHOOK_SECRET, INNGEST_WEBHOOK_SECRET, ANTHROPIC_ADMIN_KEY + ANTHROPIC_MONTHLY_BUDGET_USD, GOOGLE_SC_CREDENTIALS_JSON + GOOGLE_SC_SITE_URL, SENTRY_AUTH_TOKEN + SENTRY_ORG_SLUG + SENTRY_PROJECT_SLUG. Each is documented in the relevant service file's header comment.
- [ ] Register the Vercel deployment webhook in the Vercel dashboard at /api/webhooks/vercel.
- [ ] Register the Inngest run-lifecycle webhook in the Inngest dashboard at /api/webhooks/inngest.
- [ ] Wait one full day after deploy for the funnel + cohort + RUM views to accumulate enough data to be useful. The empty-state hints render in the meantime.
- [ ] After the first 24-48 hours of real-user CWV data, evaluate whether mobile LCP p75 needs the perf optimization Joshua skipped earlier. RUM is the source of truth, not Lighthouse.
- [ ] Consider extending MANAGED_DOMAINS in lib/services/infrastructure.ts when new client sites move to DBJ DNS.
- [ ] V3 monitoring extensions: deep end-to-end Pathlight canary scan (full pipeline) once daily, Lighthouse trend sparklines per page on the dashboard, public /status HTML page (vs the JSON endpoint already shipped), lead-heat scoring layer on top of contact + scan + chat counts.

## Priority 3: Pathlight Hardening

- [ ] Investigate intermittent "Some analysis steps could not be completed" banner (root cause traced April 27 to `s6` finalize: triggered when ANY of vision/remediation/revenue/score steps fail while audit + screenshots succeed; retry logic handles most cases, root cause for remaining occurrences still unknown)
- [x] Pathlight admin dashboard for viewing captured lead data -- DONE April 27. Stage 3 shipped /admin/scans (filterable scans table), /admin/leads (Pathlight signups + contact form submissions in a two-tab inbox), /admin/audit (admin_audit_log read view), /admin/database (row counts + recent activity per table). Migration 011 added contact_submissions table; the contact form now persists every submission alongside the Resend send (best-effort).
- [x] Client portal v1 -- DONE April 27. Migration 013 added clients + client_projects + client_files. /portal (home + files + scans + account) for clients; /admin/clients (list + detail with project + file management) for Joshy. Auth role split via lib/auth/access.ts; invitation email parameterized by role; acceptance redirects role-aware. See docs/ai/portal-strategy.md for the phased plan.

## Client portal follow-ups

- [ ] Onboard Tyler as the first real client. Create his client row + initial project + milestones in /admin/clients. Send invitation. Walk him through.
- [ ] v2: in-app messaging thread between client and Joshy (deferred from v1 per strategy doc).
- [ ] v2: scope-add request form on /portal that creates a draft change-order Joshy approves in /admin.
- [ ] v2: status-change notifications (email when phase advances). Currently silent.
- [ ] v2: file uploads larger than ~4MB via direct-to-Blob upload pattern.
- [ ] v3: Stripe billing portal, deposit pay, recurring retainer charges, invoice PDF download.
- [ ] Revenue confidence bands on reports (show range instead of single precise number)
- [ ] Input validation gate v2: extend lib/services/url.ts to also reject social media URLs (facebook/instagram/twitter/linkedin/youtube/tiktok), Google Docs/Sheets/Drive links, file:// and data:// schemes, and known parked-domain patterns (godaddysites.com, wixsite.com holding pages). Today the gate only blocks private IPs, embedded credentials, and sensitive query params.
- [x] Rate limiting per email/IP -- DONE (emailLimiter 3/24h + ipLimiter 5/24h enforced in app/(grade)/api/scan/route.ts:71-85; verified April 27)
- [ ] Pathlight landing page: add sample report screenshots (textual rewrite shipped April 25; remaining gap is visual proof of the report itself)
- [x] Resend bounce/complaint webhook -- DONE April 27. Endpoint at `/api/webhooks/resend` (Svix signature verification via `svix` package). Migration 006 extends `email_events.status` with `delivered`/`delivery_delayed`/`bounced`/`complained` plus a partial unique index `(resend_id, status)` for idempotent ingestion. Outgoing emails now carry `scan_id` and `email_type` tags so webhook events correlate even if the resend_id lookup misses. Hard bounce or spam complaint auto-marks the recipient unsubscribed via `markUnsubscribed`. 7-day bounce-rate monitor fires Sentry warning at 2% / error at 5% (skipping windows below 20 sends). Migration 006 applied to prod, `RESEND_WEBHOOK_SECRET` set, webhook URL registered. Boundary schema loosened April 27 after real Resend payloads rejected on `tags[].value: null` and `data.to: null`; validation failures now log the failing field path.
- [x] Voice report delivery -- DONE April 27. New post-finalize Inngest step `a5` generates a 60-90 second audio summary of each scan via Haiku 4.5 (script) + ElevenLabs `eleven_turbo_v2_5` Adam voice (TTS) + Vercel Blob (MP3 hosting). Best-effort: failures silent, report still ships. Migration 008 adds `audio_summary_url` + `audio_summary_script` columns to `scan_results` and extends `api_usage_events.provider` enum with `elevenlabs`. Audio player anchored at `#summary` on the report page; report email gets a "Listen to your 60-second summary" link. Skipped for out-of-scope (national/global) brands and scans with no remediation items. ~$0.20/scan marginal cost; ~$22/mo flat at Creator plan volume. Migration 008 applied to prod, `ELEVENLABS_API_KEY` and `BLOB_READ_WRITE_TOKEN` set in Vercel. **Gotcha:** the `pathlight-audio` Blob store MUST be public; a Private store fails the upload with `Cannot use public access on a private store` and the audio silently never persists (only ElevenLabs cost is incurred). Initial store was created Private and was recreated as Public on April 27.
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
- [x] Legacy email migration to joshua@dbjtechnologies.com everywhere -- DONE (verified clean in production code April 25)
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
