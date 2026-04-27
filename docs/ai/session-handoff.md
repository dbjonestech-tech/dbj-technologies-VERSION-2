# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-27.md`](history/2026-04-27.md), which holds the
verbatim record of every session entry that was below this one before
archive.

## Last Session: April 27, 2026 -- Admin login portal (Stages 1 + 2 = Tiers 0-2)

### What shipped

Auth foundation plus the operations surface lifted into a unified `/admin/*` shell. End-to-end Google OAuth sign-in works against the email allowlist, every protected route is gated by a JWT-cookie session, and the previously-orphaned monitor/cost dashboards now live inside the admin sidebar layout instead of rendering under the public marketing navbar.

**Stage 1 (Tier 0/1) -- auth foundation + security hygiene:**
- Auth.js v5 with Google provider, JWT 8h sessions, `prompt=select_account` on the OAuth call.
- Split-config pattern: `auth.config.ts` (edge-safe) imported by both middleware and the full instance; `auth.ts` adds Node-only events (audit log + new-device email).
- Email allowlist: `lib/auth/allowlist.ts` reads `ADMIN_EMAILS` env at module load, `isAdminEmail()` is O(1). signIn callback denies non-allowlist accounts and writes a `signin.denied` row to `admin_audit_log`.
- Audit log: migration `010_admin_audit.sql` (table + 4 indexes). `lib/auth/audit.ts` holds `writeAdminAudit()` (best-effort, swallows errors) + `isNewDevice()` (30d lookback) + `getRecentAuditEvents()`. `lib/auth/device.ts` builds a stable hash of `${ip}::${userAgent}` via Web Crypto so the module is safe to import from any runtime.
- New-device email: `lib/email-templates/admin-new-device.ts` (Chicago-time formatted, browser/OS detection from UA). `lib/auth/notify.ts` wires it through Resend.
- Rate limiter: `signinLimiter` (10/min/IP) added to `lib/rate-limit.ts`. Fail-open when Upstash env is missing or Redis errors so a limiter outage never blocks legitimate auth.
- Sign-in page: `/signin` server component, white theme, single Google OAuth button via server action, error message handling for `AccessDenied` / `Verification` / `Configuration`.
- Custom NextAuth route handler at `/api/auth/[...nextauth]/route.ts` wraps `signIn`/`callback` GET+POST in the IP rate limiter, leaves session reads unthrottled.
- Sign-in link added to the public navbar (desktop + mobile).
- Server action `signOutAction` wired into the admin layout sign-out button.
- Type augmentation in `types/next-auth.d.ts` adds `isAdmin` to `Session` and `JWT`.
- Edge-runtime fixes during build-out: rewrote `lib/auth/device.ts` from `node:crypto` to Web Crypto so the middleware bundle stays Node-free.

**Stage 2 (Tier 2) -- admin dashboard surface + layout consistency fix:**
- Admin shell at `app/admin/layout.tsx`: white sidebar with grouped nav (Overview / Operations / Account), DBJ logo, "Signed in as" footer, sign-out form. Mobile shows a top-bar variant. Auth check at the layout level is defense-in-depth (middleware is the primary gate).
- Admin landing at `app/admin/page.tsx`: personalized greeting, six quick-link cards (two live, four marked Soon).
- **Fixed the marketing-navbar leak**: lifted `/internal/monitor`, `/internal/monitor/scan/[scanId]`, `/internal/monitor/api/stream`, and `/internal/cost` out of `app/(marketing)/` and into `app/admin/*`. Re-themed all four pages from the dark canvas (`#06060a`) to the admin shell's light palette (white sections, zinc borders, Tailwind utility classes for state colors). Old paths now 301 to new paths via `next.config.mjs` redirects.
  - `/internal/monitor` -> `/admin/monitor`
  - `/internal/monitor/scan/[scanId]` -> `/admin/monitor/scan/[scanId]`
  - `/internal/monitor/api/stream` -> `/admin/monitor/api/stream`
  - `/internal/cost` -> `/admin/costs`
- Fixed pre-existing duplicate React key warning in MonitorLive.tsx: SSE merge now dedupes by id when prepending so a seed/stream race can't produce duplicate-key console warnings.
- Middleware cleanup: dropped `/internal` from `PROTECTED_PREFIXES` and `CACHE_EXCLUDED_PREFIXES` (next.config redirects fire before middleware ever sees the path).
- robots.ts: added `/admin/` and `/signin` disallows alongside the existing `/internal/` (kept for the redirect window).

### Files added

- `auth.config.ts`, `auth.ts`, `middleware.ts` (revised)
- `app/api/auth/[...nextauth]/route.ts`
- `app/signin/page.tsx`
- `app/admin/layout.tsx`, `app/admin/page.tsx`
- `app/admin/monitor/page.tsx`, `app/admin/monitor/MonitorLive.tsx`
- `app/admin/monitor/api/stream/route.ts`, `app/admin/monitor/scan/[scanId]/page.tsx`
- `app/admin/costs/page.tsx`
- `lib/auth/allowlist.ts`, `lib/auth/audit.ts`, `lib/auth/device.ts`, `lib/auth/notify.ts`, `lib/auth/actions.ts`
- `lib/email-templates/admin-new-device.ts`
- `lib/db/migrations/010_admin_audit.sql`
- `scripts/run-migration.mjs`
- `types/next-auth.d.ts`

### Files modified

- `lib/rate-limit.ts` (added `signinLimiter`)
- `components/layout/Navbar.tsx` (Sign in link, desktop + mobile)
- `next.config.mjs` (legacy `/internal/*` redirects)
- `app/robots.ts` (disallow admin + signin)
- `lib/services/monitoring.ts`, `lib/services/lighthouse-monitor.ts` (path comments updated)

### Files deleted

- `app/(marketing)/internal/monitor/page.tsx`
- `app/(marketing)/internal/monitor/MonitorLive.tsx`
- `app/(marketing)/internal/monitor/api/stream/route.ts`
- `app/(marketing)/internal/monitor/scan/[scanId]/page.tsx`
- `app/(marketing)/internal/cost/page.tsx`

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- Sign-in -> Google OAuth -> `/admin` flow verified manually with both allowlist accounts.
- Migration `010_admin_audit.sql` applied via `node --env-file=.env.local scripts/run-migration.mjs`.

### Known minor items

- Migration 010 was applied to the dev Postgres (which is the same Neon branch as production via POSTGRES_URL). Confirm before next prod deploy that the `admin_audit_log` table exists in the production Neon branch.
- Sign-in page logo Image emits a width/height aspect-ratio console warning. Cosmetic.
- Next.js 16 deprecation: `middleware.ts` should eventually move to `proxy.ts`. Non-blocking.

### Git status at session pause

Working tree clean. Stages 1 + 2 shipped in commit `b1f59e4` (`feat(admin): Google OAuth login portal + unified /admin/* operations surface`), pushed to `origin main`. Vercel auto-deploy triggered.

### Next recommended task

Stage 3 (operational tools): build out `/admin/scans` (filterable scans table with status + revenue range), `/admin/leads` (unified inbox combining scan emails + contact form submissions), `/admin/database` (row counts + recent activity per table), and `/admin/audit` (read view over `admin_audit_log`). Each becomes one of the cards currently labeled "Soon" on the dashboard.

---

## Earlier Session: April 27, 2026 -- Pass 1 + blueprint for the remaining 5 portfolio templates

### What shipped (templates + docs)

Pass 1 content-infrastructure expansion plus a deep-dive blueprint markdown doc for the five portfolio templates that had not yet been improved. After this session all 8 templates and all 8 blueprints are in place and ready for the per-template critique and edit pass.

**Templates expanded** (all under `public/templates/`):
- `dental-practice.html`: 1080 -> 2042 lines. New surfaces: dated promo strip + emergency strip, Specials with three dated cards, Ridgeview Smile Plan in-house membership ($29/mo adult, $19 kids), Smile Gallery, Office Tour (technology + comfort), named hygiene team (Maya Rios, Jordan Tate, Elena Lin), Financing (CareCredit / Sunbit / Cherry / in-house), multi-modal contact strip, footer compliance (TX dental license, ADA, TDA, sterilization standards, Hablamos Espanol). Insurance pill grid expanded 8 -> 12 carriers with honest out-of-network aside.
- `real-estate.html`: 907 -> 1747 lines. New surfaces: Sold portfolio (8 closed transactions with year, neighborhood, side, price), Buyer Process + Seller Process numbered timelines, Concierge (Off-Market Access, Staging, Renovation Strategy, Relocation Network, Discreet Photography, Trusted Advisors), Press / Recognition strip with 6 publication marks + dated honors list, Off-Market Private List quarterly email capture, Direct Private Consultation CTA replacing the thin sellers section. Listings cards now carry status glyphs (Active / Under Contract / Just Sold). Footer rebuilt as 4-column with TREC license, broker license, EHO, MLS NTREIS, IABS, TREC Consumer Protection Notice. Brokerage affiliation pill (Briggs Freeman Sotheby's) added quietly to nav.
- `med-spa.html`: 1113 -> 2370 lines. New surfaces: per-area transparent Pricing menu (neuromodulators, fillers, energy/resurfacing, body/peels/IV), Reverie Society monthly membership, dated Specials (Botox Days, Mother's Day Restoration, Filler Bank), Before/After gallery with consent disclaimer, three-provider credentials grid (Medical Director MD/NPI, RN injector, Master Esthetician), six-brand Shop (ZO, SkinMedica, Obagi, Alastin, ISDIN, EltaMD), Safety section (physician oversight, sterile technique, hyaluronidase on site, aftercare line), Financing (CareCredit / Cherry / Affirm with terms), 4-platform reviews strip (Google / RealSelf / Yelp / D Magazine), expanded footer compliance (TX Medical Board, NPI, RN/LE license numbers, HIPAA notice).
- `pi-law.html`: 1274 -> 2221 lines. New surfaces: red 24/7 + bilingual urgent strip above nav, "No Fee Unless We Win" badge cluster on hero, Free Case Review intake form with personal-review pledge from senior partner, Practice Areas expanded 6 -> 10 cards (auto, truck, motorcycle, pedestrian/bike, premises, work, wrongful death, dog bite, catastrophic, med-mal/bad faith), Results with case-amount cards under the verdicts ledger, "What to do after an accident" 7-step lead magnet, Recognition with 8 dated peer-reviewed badges (Super Lawyers, Best Lawyers, Multi-Million / Million Dollar Advocates Forum, Martindale-Hubbell, AVVO, TTLA, D Magazine), 4-channel multi-modal contact (Call / Text / Online / Live Chat), 3 Office Locations (Dallas / Fort Worth / Plano), 8-question FAQ accordion, mobile sticky CTA. Footer disclaimer expanded with State Bar of Texas attorney advertising notice + named responsible attorney + prior-results disclaimer. Note: agent stripped diacritics from "Espanol"; flagged for the critique pass.
- `financial-advisor.html`: 1308 -> 2291 lines. New surfaces: signed Fiduciary Pledge after the founder portrait, Who I Serve with $2M minimum + capped relationship count, Specialties (RSU/ISO/10b5-1, business sale, multi-gen, tax, estate, charitable/DAF), published tiered Fee schedule (1.00 / 0.85 / 0.65 / 0.45) plus planning-only retainer, Custodian disclosure (Schwab / Fidelity / Pershing / eMoney) on charcoal section, quarterly Insights commentary grid replacing the thin press lockup, expanded Recognition with dated honors and methodology disclaimer, Privacy / cybersecurity 3-card strip, restructured Contact as a Discovery Call booking surface ("no follow-up if it is not a fit"). Footer rebuilt 4-column with Form ADV Part 2A/2B, Form CRS, Privacy Policy, Fiduciary Statement, SEC file number, RIA attribution. Nav adds Fees + Client Login.

**Blueprints created** (all under `docs/blueprints/`):
- `dental-practice.md` (39 lines)
- `real-estate.md` (37 lines)
- `med-spa.md` (37 lines)
- `pi-law.md` (41 lines)
- `financial-advisor.md` (37 lines)

All five mirror the format established by `upscale-restaurant.md` / `hvac-contractor.md` / `luxury-home-builder.md`: frontmatter (title, slug, template, headline, summary), 4 sections (How <archetype> actually use the site / What most <vertical> sites get wrong / What your <vertical> site actually needs / See the proof), audit-voice opinionated, ends with the indexing-blocked + screenshots-separately note.

### Discipline preserved across all 5

- Every existing CSS variable, type stack, color token, and visual idiom preserved on each template. Mobile breakpoints extended for the new sections. No redesigns.
- Every image references a file that exists on disk in `public/templates/images/`. No invented filenames.
- `<meta name="robots" content="noindex, nofollow">` preserved on all 8 templates.
- Em-dash check across `public/templates/` + `docs/blueprints/` returns zero matches.
- All new sections use meaningful IDs and `aria-labelledby` on their headings.

### Known issues to address in the critique pass

1. PI-law agent stripped diacritics from "Hablamos Espanol" for ASCII safety; restore "Español".
2. Voice mix in `pi-law.html` and `financial-advisor.html`: agents preserved the existing "we" firm-voice in structural sections and only used "I" in personal-letter / pledge surfaces. CLAUDE.md mandates first-person "I" throughout the site, but those two templates already shipped with "we" before this pass. Decide whether to push them all the way to first-person.
3. User flagged that the three Pass-1 templates from prior sessions (restaurant, hvac, luxury-builders) were also "not impressive" and deserve a critique pass. All 8 templates are now at parity for that work.

### Next recommended task

Critique pass, one template at a time. Joshy will lead; the agent should match each template's design constraints and resist over-restructuring during edits.

## Prior Session: April 27, 2026 -- In-house real-time monitoring (V1 + safe V2 enhancements)

### What shipped (code)

A from-scratch monitoring stack that observes Pathlight + the marketing
site without leaning on third-party telemetry beyond Sentry (which
stays for unhandled-exception capture).

**Schema (migration `009_monitoring.sql`, applied to prod Neon):**
- `monitoring_events` (BIGSERIAL id, event TEXT, level TEXT,
  scan_id UUID nullable, payload JSONB, created_at TIMESTAMPTZ).
  Four indexes: created_at, (event, created_at), scan_id partial,
  (level, created_at) partial for non-info.
- `lighthouse_history` (BIGSERIAL id, page TEXT, strategy TEXT,
  performance/accessibility/best_practices/seo INTEGER, duration_ms,
  status, error_message, created_at). Two indexes: page+strategy
  trend, created_at sweep.

**Service layer:**
- `lib/services/monitoring.ts` -- generic `track(event, payload,
  options?)` writer plus typed readers (`getRecentEvents`,
  `getEventsAfterId`, `getEventsForScan`, `getFunnelCounts`,
  `getLevelSummary`, `getLatestLighthousePerPage`,
  `getLighthouseHistory`, `getCanaryStatus`). Writes are best-effort
  (failures swallowed) so the monitor cannot cascade into request
  failures.
- `lib/services/lighthouse-monitor.ts` -- daily-cron PSI runner. List
  of monitored pages: /, /about, /work, /services, /pricing,
  /pathlight, /contact x desktop + mobile = 14 PSI calls/day.
  `getRollingMedians` returns 7-day medians for regression checks.

**Inngest crons (registered in `app/(grade)/api/inngest/route.ts`):**
- `lighthouseMonitorDaily` -- cron `0 9 * * *` (09:00 UTC). Audits
  every (page, strategy), persists row, alerts on >5pt drop from 7d
  median (warn) or >15pt drop or below `MONITORING_LIGHTHOUSE_FLOOR`
  (error). Each (page, strategy) is its own Inngest step with 5s
  pacing between.
- `pathlightSyntheticCheck` -- cron `0 */4 * * *` (every 4 hours).
  Narrow synthetic: PSI desktop + Browserless desktop screenshot
  against `MONITORING_CANARY_URL` (defaults to
  thestarautoservice.com). No Anthropic, no scans-table writes, no
  emails. Two consecutive fails on the same check escalate to Sentry
  error (single-shot blips do not page).
- `monitoringPurgeDaily` -- cron `0 11 * * *`. Drops
  monitoring_events older than 30 days, lighthouse_history older than
  365 days.

**`track()` instrumentation in pipeline + endpoints:**
- `lib/inngest/functions.ts` -- scan.started (entry), scan.complete /
  scan.partial / scan.failed (s6 finalize branches), audio.generated
  / audio.failed (a5 outcomes), email.report.sent / email.report.failed
  (e1), terminal scan.failed in the outer catch.
- `app/(grade)/api/scan/route.ts` -- scan.requested,
  scan.deduped, scan.rate-limited (with `reason: email|ip`).
- `lib/services/email.ts` -- email.delivered / email.bounced
  (warn) / email.complained (error) / email.delivery_delayed
  inside `handleResendWebhookEvent` so the funnel surfaces every
  webhook outcome.
- `app/(grade)/api/chat/route.ts` -- chat.message tagged with
  turn count.
- `app/(marketing)/api/contact/route.ts` -- contact.submitted (lead
  signal!) / contact.failed.

**Dashboard (`/internal/monitor`, gated by `INTERNAL_ADMIN_PIN`):**
- Server component at `app/(marketing)/internal/monitor/page.tsx`.
  Sections: Synthetic canary status, Funnel (24h/7d/30d) with auto-
  flagged ratios (red text when bounce rate >2%, partial >20%, etc.),
  Severity pill counts, Lighthouse latest grid (cells colored by
  threshold: green >=95, yellow >=90, orange >=75, red <75), and the
  live event tail seeded with the most recent 50 events.
- SSE live tail at `app/(marketing)/internal/monitor/api/stream/route.ts`
  polls `monitoring_events.id > lastSeen` every 2s and pushes deltas.
  Connection capped at 5 minutes; client `MonitorLive.tsx` reconnects
  with the latest cursor.
- Per-scan drill-down at `/internal/monitor/scan/[scanId]` -- click
  any scanId in the live tail to see all monitoring events +
  api_usage events for that scan in chronological order.

**Public health endpoint:**
- `/api/status` returns `{ ok, generatedAt, canary, pathlight }`
  JSON. 30s edge cache. Designed for external uptime tools
  (UptimeRobot, BetterStack). Returns 503 when the canary has 2+
  consecutive failures or DB is unreachable. No internals exposed.

### Migrations applied

Migration 009 was applied directly to prod Neon during this session.
Verified: both tables present, all 6 indexes plus the 2 PK indexes
created, INSERT/SELECT/DELETE smoke test passed.

### Files

New (8): `lib/db/migrations/009_monitoring.sql`,
`lib/services/monitoring.ts`, `lib/services/lighthouse-monitor.ts`,
`app/(marketing)/internal/monitor/page.tsx`,
`app/(marketing)/internal/monitor/MonitorLive.tsx`,
`app/(marketing)/internal/monitor/api/stream/route.ts`,
`app/(marketing)/internal/monitor/scan/[scanId]/page.tsx`,
`app/(marketing)/api/status/route.ts`.

Modified (6): `lib/inngest/functions.ts` (3 new crons + 7 track()
points + lighthouse-monitor import),
`app/(grade)/api/inngest/route.ts` (register the 3 crons),
`app/(grade)/api/scan/route.ts` (3 track() points),
`app/(grade)/api/chat/route.ts` (1 track() point),
`app/(marketing)/api/contact/route.ts` (2 track() points),
`lib/services/email.ts` (track() inside webhook handler).

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- 0 em-dashes added in any new line (verified via diff scan).
- DB migration smoke test: INSERT + SELECT + DELETE on
  monitoring_events round-trips cleanly.

### Optional env (set in Vercel if desired)

- `MONITORING_LIGHTHOUSE_FLOOR` (default 90) -- absolute floor below
  which any Lighthouse category drop becomes a Sentry error.
- `MONITORING_CANARY_URL` (default https://thestarautoservice.com/)
  -- target URL for the 4-hourly synthetic check.

### V3 (deferred -- consider once V1 has data)

- Deep canary: full end-to-end Pathlight scan once a day with a
  dedicated email + skip-emails flag, catches Anthropic / scoring
  regressions the narrow synthetic does not. ~$0.20/run = ~$6/mo.
- Lighthouse trend sparklines per page on the dashboard.
- Public `/status` HTML page (vs the JSON endpoint we shipped).
- Lead-heat scoring layer on top of contact + scan + chat counts.

## Prior Session: April 27, 2026 -- Audio player CSP unblock + post-complete polling extension

### What shipped (code)

`vercel.json` CSP gained an explicit `media-src 'self'
https://*.public.blob.vercel-storage.com;` directive. Without it the
CSP fell back to `default-src 'self'`, which blocked the browser from
loading the audio summary MP3 from the public Blob CDN. Symptom: the
audio file was reachable via curl with valid `audio/mpeg` content-type
and 857KB body, but the `<audio controls>` element on the report page
rendered greyed out and refused to play. CSP was the only blocker
once the private-store fix landed earlier today.

`app/(grade)/pathlight/[scanId]/ScanStatus.tsx` polling loop now keeps
polling for up to twelve additional ticks (~36s) after status flips
out of the active set, gated on `audioSummaryUrl` still being null.
Reason: the Inngest pipeline runs `a5` (audio) and `e1` (email) AFTER
`s6` finalize marks status complete, so the audio URL lands a few
seconds after the live polling page would otherwise stop. Previously
users only saw the audio player after a manual refresh. Now the live
page picks it up automatically. Logic moved inside the existing
`fetchOnce` callback so it reads `data.audioSummaryUrl` directly
instead of stale React state; the separate `statusState` useEffect
that cleared the interval is gone.

### What was already correct (verified, not changed)

- The Blob is uploaded correctly with `audio/mpeg` content-type and
  the public Blob URL persists to `scan_results.audio_summary_url`.
  Verified by curl on the most recent scan
  (`45d2e033-ba25-47c4-9c0c-9f4293bf0931`): 200 OK, 857696 bytes,
  valid MPEG ADTS layer III 128kbps mono. The earlier hypothesis that
  `Content-Disposition: attachment` was blocking inline playback was
  wrong; HTML5 `<audio>` plays attachment-flagged media fine. CSP was
  the actual culprit.

### Files changed (2 modified, 1 docs)

- `vercel.json` -- added `media-src` directive to the Content-Security-Policy header.
- `app/(grade)/pathlight/[scanId]/ScanStatus.tsx` -- post-complete
  polling extension (12 extra ticks while audioSummaryUrl is null).
- `docs/ai/session-handoff.md` -- this entry.

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- 0 em-dashes in added lines.

### Note on parallel work

A separate session has uncommitted in-flight work on this branch
(rate-limit additions to chat + PDF endpoints, ScanningCore UI
refactor, globals.css updates). I detected it, stashed it under
`parallel-session-wip-other-tab`, shipped this fix on top of HEAD,
then restored the stash. Their work is back in the working tree
exactly as the user left it; this commit only contains the audio
fixes.

## Prior Session: April 27, 2026 -- Resend webhook schema permissive + audio Blob store fix

### What shipped (code)

`lib/services/email.ts` `resendWebhookEventSchema` loosened to be
permissive at the boundary. Real Resend test events were arriving,
passing Svix signature verification, then being rejected by zod and
returning `"ignored"` so no row landed in `email_events`. Specific
changes: `data` itself optional + passthrough; `data.email_id`/`to`/
`tags` use `.nullish()` instead of `.optional()`; tag entries accept
optional `name` and `z.unknown()` for `value` (Resend system tags
sometimes deliver null values which broke `z.string()`). The handler
now uses `typeof === "string"` guards before extracting `scan_id`/
`email_type` from tags. The "failed schema validation" warning now
includes the failing field paths and zod messages so the next
regression is diagnosable from function logs.

### What shipped (infra; user-driven, no code)

1. **Vercel Blob store recreated as Public.** Original `pathlight-audio`
   store was created Private, which conflicts with `lib/services/voice.ts`
   uploadToBlob (REST PUT defaults to public access). Symptom: ElevenLabs
   was being called and counted in api_usage_events but
   `audio_summary_url` was always NULL because the Blob upload
   400'd with `Cannot use public access on a private store`. The `a5`
   step's try/catch swallowed the error so the report still shipped
   without audio (graceful degradation worked as designed). Fix: deleted
   the private store, recreated `pathlight-audio` as public. Fresh
   `BLOB_READ_WRITE_TOKEN` rotated automatically.
2. **`RESEND_WEBHOOK_SECRET` set in Vercel** + webhook URL registered
   in Resend dashboard.

### What was already correct (verified, not changed)

- Migrations 005, 006, 007, 008 all already applied to prod Neon (DB
  query confirmed `email_events_status_check` covers all 7 statuses,
  `uniq_email_event_resend_id_status` index exists,
  `idx_scans_email_url_created` exists, `scan_results.audio_summary_url`
  column exists, `api_usage_events.provider_check` includes
  `elevenlabs`). The "still-pending" language in earlier docs was
  drift; everything was actually shipped.

### Manual post-deploy verification

1. **Webhook test event:** Resend dashboard → Webhooks → Send test
   event. Confirm Vercel function logs for `/api/webhooks/resend`
   return 200 with NO `[email] webhook payload failed schema
   validation` warning. A new row should land in `email_events` with
   the test event's status (or, for a fully synthetic test that lacks
   `scan_id`/`email_type` tags and pre-existing send row, outcome will
   be "uncorrelated" -- still a clean parse, just no insert).
2. **Audio fix:** run a fresh Pathlight scan of any URL. The `a5` step
   should run silently (no `[a5] audio summary failed` warning). The
   report page should show the `<audio controls>` block above the
   Pillar Breakdown, and the report email should include the "Listen
   to your 60-second summary" link.

### Files changed (1 modified, N docs)

- `lib/services/email.ts` -- permissive webhook schema + diagnostic
  zod-error logging + type-guarded tag reads.
- `docs/ai/session-handoff.md` -- this entry.
- `docs/ai/current-state.md` -- removed "manual deploy gates" /
  "still-pending 005 + 006" drift; added Blob-store-private fix note.
- `docs/ai/backlog.md` -- dropped "Two manual steps remaining" from
  the Resend webhook entry; added Blob-store-private fix note to the
  voice entry.

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- 0 em-dashes in changed file.

### Final state

- Committed and pushed to `origin main` as `a68ce3e`
  (`fix(pathlight): permissive Resend webhook schema + audio Blob
  notes`).
- Working tree clean after this snapshot commit.
- Vercel auto-deploys 1-3 min after push.

## Prior Session: April 27, 2026 -- Pathlight partial-banner mitigation (schema-repair prompt)

`lib/services/claude-analysis.ts` `callClaudeWithJsonSchema` repair
prompt now threads the specific `firstAttempt.error` (parse failure
or Zod validation message) back to Claude, instead of the generic
"your previous response was not valid JSON." Targets the dominant
remaining trigger of the report-page "Some analysis steps could not
be completed" banner: schema-validation failures where the JSON
parsed but a field type/shape was wrong, and the second attempt
repeated the same failure because Claude had no signal about what to
fix. Total Claude calls per JSON step still capped at 2.

Committed and pushed to `origin main` as `217c262`
(`fix(pathlight): JSON-schema repair prompt threads the actual parse
error`). Snapshot follow-up `e26e914`.

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
- ~~Migrations `005`-`008` queued~~ -- verified applied to prod Neon on April 27. No action needed.
- **Manual Vercel dashboard step:** `www.dbjtechnologies.com` now attached per Joshy (April 27). After the deploy lands, verify `curl -I https://www.dbjtechnologies.com/` returns 301 -> apex, and `curl https://dbjtechnologies.com/robots.txt` shows the disallow list from `app/robots.ts` (not the prior permissive one-liner).

## Future Surface (not pending, just enumerated)

Additional Pathlight technical surface beyond the twelve pitfalls, captured for future sessions: PSI quota fallback, no auth on `/pathlight/[scanId]` report URL, 420s pipeline finish ceiling, frozen 206-entry vertical DB with no freshness signal, fixed 3s polling cadence with no exponential backoff, no aggregated telemetry on cache hit rate / screenshot health / vertical-match score histogram, no per-chat-session turn cap. (Resend bounce/complaint webhook and cost monitoring + alerting both shipped in April 27 sessions; see archive.)

## Next Recommended Tasks

1. Re-scan any URL to verify the audio Blob fix produced an `audio_summary_url` row, the `<audio controls>` block renders above the Pillar Breakdown, and the report email contains the "Listen to your 60-second summary" link.
2. Send a Resend test event from the dashboard and confirm `email_events` receives a row with no `[email] webhook payload failed schema validation` warning in the function logs.
3. Add sample report screenshot(s) to Pathlight landing.
4. Screenshot all eight portfolio templates at desktop (1440px) and mobile (768px) widths (`pi-law.html`, `luxury-builders.html`, `dental-practice.html`, `med-spa.html`, `hvac-contractor.html`, `real-estate.html`, `financial-advisor.html`, `restaurant.html`) and wire them into `lib/work-data.ts`.
5. Decide on Pathlight product error message voice (system "we" vs studio "I"; leaning toward system voice per SaaS convention).
6. Follow up with Tyler on testimonial request.
7. Run the Gemini Deep Research prompt for DFW competitive landscape and keyword research.
8. Set up Google Voice for business phone number ($10/month Google Workspace add-on). Then add `telephone` to `Organization` and `LocalBusiness` JSON-LD in `components/layout/JsonLd.tsx`.

## Current Git Status

`main` is at `8289370` (feat(templates): Pass 1 + blueprint for the remaining 5 portfolio templates), confirmed pushed to `origin main`. Working tree NOT clean: a parallel next-auth integration workstream is in progress with uncommitted edits to `lib/rate-limit.ts`, `package.json`, `package-lock.json` and untracked `app/api/`, `auth.ts`, `lib/auth/`, `lib/db/migrations/010_admin_audit.sql`, `lib/email-templates/admin-new-device.ts`, `types/`. Those belong to a separate workstream and were intentionally not staged in this commit. Recent chain (most recent first): `8289370` (5 templates Pass 1 + blueprints) -> `fe5f022` (snapshot for b9b8dfe) -> `b9b8dfe` (monitoring V1+V2) -> `de17ba0` (split moon rotation from libration for smoother motion) -> `ea39189` (ElevenLabs voice Adam -> Charlie) -> `c564eb9` (moon libration + aurora ribbons + pulsating rings) -> `ef11e35` (rate-limit PDF/chat + Pathlight moon loading state) -> `932109e` (snapshot for 7d17be5) -> `7d17be5` (CSP media-src + post-complete polling) -> earlier chain elided in archive.
