# Backlog

## Priority 0: Canopy v2 build (May 1+, source-of-truth flipped to DBJ /admin)

Plan: `docs/ai/canopy-build-plan.md` (9 phases).

### Phase 1 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 1: Deals architecture pivot.** Migration `025_deals.sql` (deals table + idempotent backfill from contacts.status), `lib/services/deals.ts` (kanban + rollups), `lib/actions/deals.ts` (six audit-logged Server Actions with the probability-never-decreases rule and contact-status mirror rule), `/admin/deals` page with rollup tiles + kanban, `/admin/deals/[id]` detail with inline editors and per-entity audit log, dashboard gains Pipeline rollup section + Deals card, contact detail gains Deals panel, sidebar gains Deals item, relationships pipeline gains a banner pointing to /admin/deals.

### Manual follow-ups for Phase 1

- [ ] Apply migration 025 to prod Neon: `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/025_deals.sql`. The backfill creates one deal per existing contact mirroring its current status; idempotent on re-run.
- [ ] Open `/admin/deals` and confirm the kanban hydrates with backfilled deals. Move a card; confirm contacts.status mirrors the new stage.
- [ ] Close a deal as Won with a final value; confirm dashboard "Closed-Won this month" tile updates.
- [ ] Close another deal as Lost with a reason; confirm reason persists on the deal detail page.

### Done in working tree (uncommitted as of May 1 late)

- [x] Source-of-truth decision: DBJ `/admin` is canonical Canopy; `ops.thestarautoservice.com` install + `github.com/dbjonestech-tech/canopy` repo + `/Users/doulosjones/Desktop/operations-cockpit/` working dir are FROZEN.
- [x] Audit of operations-cockpit identified three real deltas vs DBJ: error capture pipeline (ported), CanopyBeacon export snippet (deferred), bootstrap/seed scripts (deferred).
- [x] First-party error capture pipeline ported. Migration 023 (`error_events` table with fingerprint grouping), `/api/track/error` endpoint, `ErrorBeacon` component mounted in root layout, `lib/services/errors.ts`, rewritten `/admin/errors` page with first-party + Sentry hybrid view.
- [x] Phase 0: Settings, Audit, Pathlight Locks. Migration 024 (`canopy_settings`, `canopy_audit_log`, `canopy_feature_flags`), `lib/canopy/{settings,pathlight-gate,audit}.ts`, `lib/actions/canopy-settings.ts`, `/admin/canopy` page with controls + audit feed, sidebar nav entry under Account.

### Manual follow-ups to land working-tree changes

- [ ] Apply migration 023 to prod Neon: `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/023_error_events.sql`. Until applied, `/admin/errors` first-party section renders an empty state with a hint card telling Joshua to run the migration.
- [ ] Apply migration 024 to prod Neon: `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/024_canopy_settings_and_audit.sql`. Until applied, `/admin/canopy` renders with default OFF settings (correct safe state) and the audit feed is empty.
- [ ] Verify `/admin/errors` first-party row count goes up after a deliberate browser-thrown error from devtools.
- [ ] Verify `/admin/canopy` master-kill toggle round-trips: flip OFF, audit row appears in feed; flip ON, audit row appears.
- [ ] After committing: `vercel logs --status-code 500 --since 5m` to confirm no RSC boundary failures (per `feedback_rsc_boundary_runtime`).

### Phase 5 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 5: Automation - Sequences, Workflow Rules, Bulk Actions.** Migration `029_automation.sql` (APPLIED to prod Neon) adds sequences, sequence_steps, sequence_enrollments, workflow_rules, workflow_evaluations. `lib/canopy/automation/{sequences,workflow-rules,actions,engine}.ts` services. Two Inngest crons: canopySequenceAdvance (5 min) and canopyWorkflowEvaluate (2 min, polls audit log). `lib/actions/{sequences,workflow-rules,bulk-contacts}.ts` audit-logged Server Actions. `/admin/sequences` + `/admin/sequences/[id]` step editor. `/admin/automations` rule list + create form. BulkActionsBar on /admin/contacts list (tag, untag, enroll, export CSV, delete). Email steps + send_email action are stubbed cleanly until Phase 4 Gmail OAuth ships.

### Phase 7 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 7: Analytics & Narrative Digest.** No new migration; Phase 0 already provisioned the digest schedule fields on canopy_settings. `lib/analytics/{pipeline,contact,digest}.ts` read-only aggregations. `lib/email-templates/canopy-digest.ts` Gmail-safe HTML + text template. `canopyDigestHourly` Inngest cron self-gates on `shouldFireDigest` against settings.timezone. `lib/actions/canopy-settings.ts` adds `setDigestSchedule` + `sendTestDigestNow` audit-logged actions. `/admin/analytics/pipeline` page with Recharts. EngagementSparkline + NextBestAction on contact detail. DigestSection (day/hour/timezone editor + preview + send-now buttons) on /admin/canopy. Sidebar Analytics group with Pipeline link.

### Phase 6 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 6: Pathlight Manual Integrations.** Migration `028_pathlight_integrations.sql` (APPLIED to prod Neon) adds pathlight_scans_log, ai_search_checks, lead_scores. `lib/canopy/{pathlight-client,lead-scoring}.ts` services. `lib/actions/{pathlight-rescan,ai-search-checks,lead-scoring}.ts` audit-logged Server Actions. Per-contact UI: RescanButton (gate-aware), AISearchCheckPanel, LeadScoreBadge with component breakdown. Phase 0's three-layer Pathlight lock now gates real functionality.

### Phase 3 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 3: Custom Fields, Tags, Segments.** Migration `027_customization.sql` (APPLIED to prod Neon) adds custom_field_definitions, custom_fields JSONB and tags TEXT[] columns on contacts/deals (with GIN tag indexes), saved_segments. `lib/canopy/{custom-fields,tags,segments,entity-extras}.ts` services. `lib/actions/{custom-fields,tags,segments}.ts` audit-logged Server Actions. UI: Custom Fields manager on /admin/canopy, TagsBar + CustomFieldsPanel on contact and deal detail pages.

### Phase 2 done in working tree (uncommitted as of May 1 latest)

- [x] **Phase 2: Activities & Tasks.** Migration `026_activities.sql` (APPLIED to prod Neon: activities table with type discriminator, payload JSONB, due_at/completed_at/priority for tasks, five indexes). `lib/services/activities.ts` (read APIs + title/detail formatters). `lib/services/tasks.ts` (filter-aware getTasks + getTodayTasksSummary). `lib/actions/activities.ts` (eight audit-logged Server Actions). ActivityComposer + ActivityFeed components. /admin/tasks page with scope/status/priority filters. Dashboard Today's Tasks card. Sidebar Tasks item under Operations. Contact and deal detail pages now host the composer + feed.

### Next phase queued

- [ ] **Phase 4: Email Integration (deferred).** Migration `030_email_sync.sql` for email_messages, email_templates, oauth_tokens. Google OAuth flow with send + readonly + modify scopes (requires GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET provisioned in Google Cloud Console + Vercel env). Inngest cron pulling inbound Gmail messages every 5 min. Compose modal on contact and deal pages with merge-field substitution and live preview. Open + click tracking via `/api/email/pixel/[messageId]` and `/api/email/click/[messageId]`. **Out of scope:** the contact form's Resend send path remains untouched. **Note:** Phase 7's weekly digest already uses Resend; this is the per-contact 1:1 send/receive layer. Once it ships, replace the Phase 5 send_email stub with the Gmail dispatcher and add a sequence.exit-on-reply Inngest function that consumes inbound message events.

- [ ] **Stage history table (refinement).** The current Phase 7 `getApproxTimeInStage` is a created-to-now or to-close approximation because no `deal_stage_history` table exists. A small migration adding `deal_stage_history (id, deal_id, stage, entered_at, exited_at)` plus a trigger or Server-Action hook on stage changes would let us compute true Markovian dwell time per stage. Low priority but worth doing before pitching the analytics page externally.

### Net new gaps to port (deferred, lower value than the build phases)

- [ ] Exportable `CanopyBeacon.tsx` snippet (separate from DBJ's `AnalyticsBeacon`). Phase 9 dependency. Configurable endpoint URL prop so client sites can embed pointing at their Canopy install.
- [ ] Bootstrap + seed scripts (`scripts/bootstrap.ts`, `seed-demo.ts`, `seed-extras.ts`) adapted to DBJ migration set. Required when productization actually starts; not blocking for the build phases.

## Priority 1: Revenue-Generating Actions (Not Code)

- [ ] Follow up with Tyler on client referrals (he was texted, awaiting response)
- [ ] Ask Tyler for a one-sentence testimonial for the homepage/about page
- [ ] Build inbound lead response process: response template (acknowledge within 2 hours, 2-3 qualifying questions), discovery call structure (15-20 min), rough proposal format
- [ ] Set up Google Voice for Workspace ($10/month, dedicated business line, add to email signature)
- [ ] Run the Gemini Deep Research prompt for DFW competitive landscape, keyword research, and 90-day content plan
- [x] Set up Google Business Profile (no physical storefront -- service area business setup) -- DONE 2026-04-30: GBP verified + active. Address Royse City TX 75189, service area Hunt County, phone (682) 325-8324, 5.0 / 2 reviews. Open NAP question: site brands as "Dallas, TX" but GBP shows Royse City -- decide whether to hide GBP address and broaden service area to "Dallas-Fort Worth Metroplex" OR widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex".

## Priority 2: Canopy / Admin Polish (May 1+)

- [x] **/admin/visitors PostHog/Vercel-Analytics rewrite (Phase 1).** Hero
  Recharts area chart with previous-period ghost line, 6 metric tiles
  with period-over-period deltas (bounce rate inverted), 3 breakdown
  panels (top pages / top sources / devices+engagement) as styled-div
  bars, stretch top-cities panel, range selector (7D/14D/30D/90D/custom)
  driving a new `/admin/api/visitors-data` endpoint. Recent visitors
  table preserved as-is. Phase 1 staged for review on May 1, 2026.
- [x] **CRM integration into Canopy (Phase 2).** Migration 022 for
  `contacts` + `contact_notes`, `lib/services/contacts.ts` with LATERAL
  touchpoint counts (NOT visits, since page_views requires a visitor-id
  linkage chain), Server Actions in `lib/actions/contacts.ts` (no API
  routes for these), sidebar Relationships group between Acquisition
  and Operations, `/admin/contacts` list, `/admin/contacts/[id]`
  detail with Pathlight scan card, `/admin/relationships/pipeline`
  kanban (the route is `/admin/relationships/pipeline` because the
  existing `/admin/pipeline` is for the Inngest pipeline page),
  Dashboard Relationships card, auto-creation wiring in scan finalize
  + contact form route + client invitation accept flow. Phase 2
  staged for commit on May 1.
- [ ] **Apply migration 022 to prod Neon.** `npx tsx lib/db/setup.ts`.
  Until applied, `/admin/contacts` and `/admin/relationships/pipeline`
  render their empty state because every contacts read returns the
  empty default (each query is wrapped in try/catch).
- [ ] **After applying migration 022, click "Sync contacts" on
  /admin/contacts** to backfill from existing leads /
  contact_submissions / clients (idempotent: running twice with no
  new data returns 0/0).
- [ ] After Phase 1 ships: run `vercel logs --status-code 500 --since 5m`
  against the deployment URL to confirm RSC boundary is clean (this is
  the only check that catches production-build-only RSC failures per
  `feedback_rsc_boundary_runtime`).

## Priority 2.1: Site Polish (Quick Wins)

- [ ] Add Tyler's testimonial to homepage or about page once received
- [ ] Verify all ~24 pages look correct (full visual audit -- Chrome MCP couldn't complete this due to scroll-triggered animations)
- [ ] **Manual: register `www.dbjtechnologies.com` as an alias domain in the Vercel dashboard so the new vercel.json www-host redirect actually fires.** Without the domain attached to the project, requests to www never reach Vercel's routing layer. After adding, verify `curl -I https://www.dbjtechnologies.com/` returns `301` to `https://dbjtechnologies.com/`.
- [x] AboutContent.tsx ScrollWordBatch reduce-motion concern -- RESOLVED 2026-05-01 by removing the per-word scroll-reveal entirely as part of the Lighthouse perf sprint. Replaced with a single `motion.p` whileInView fade.
- [ ] (Optional) After confirming www->apex 301 in Vercel, drop `https://www.dbjtechnologies.com` from the contact-form `allowedOrigins` allowlist in `app/(marketing)/api/contact/route.ts:60-62`. Currently kept as a defensive belt-and-suspenders entry.
- [ ] (Perf, deferred from May 1 sprint) Hybridize `Navbar`: server-render the inline DBJ wordmark SVG + nav link list, keep only the mobile-menu toggle and scroll-detect as a tiny client island. Currently the entire navbar (framer-motion + lucide + AnimatePresence) hydrates on every page just to track `scrolled` and toggle the mobile menu.
- [ ] (Perf, deferred from May 1 sprint) Move the duplicate inline DBJ wordmark SVG out of `Navbar.tsx:63-89` and `Footer.tsx:27-52` into a single shared `<symbol>` reference (or a single component using `<Image>`). Currently ~25KB of identical SVG path data ships in every HTML response.
- [ ] (Perf, deferred from May 1 sprint) `/contact`: drop `react-hook-form + @hookform/resolvers + zod` (~30-40KB minified gzip) for native HTML5 validation, OR keep them but `dynamic()` import the form behind a client island.
- [ ] (Perf, deferred from May 1 sprint) `/contact`: remove `useSearchParams` if the package-selection feature can be moved to URL hash or to a client-only widget. Currently `useSearchParams` opts the entire page out of static rendering on every visit.

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
