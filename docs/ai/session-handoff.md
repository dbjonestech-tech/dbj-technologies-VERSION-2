# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-02.md`](history/2026-05-02.md), which holds the verbatim
record of every May 2 entry that was below this header before this reset.

## Current state (May 2, 2026 -- session closed at `5cc71c4`. Tree clean, pushed to origin main.)

HEAD: `5cc71c4 chore(docs): archive May 2 session-handoff, reset live handoff to compact summary`

Prior chore: `ce7f57e chore(hooks): forcing function for end-of-session memory discipline`

Last functional commit before doc/hook chores: `84dead2 feat(canopy): Pathlight health dashboard - per-stage breakdown, error clustering, provider rates, partial-rate sparkline, one-click rescan`

### What shipped this session (chronological, top is oldest)

1. `9ad2d76` -- `/admin/errors` Sentry feed filter excludes `OPERATIONAL_SOURCES` (lighthouse-monitor, cost-monitor, elevenlabs-circuit-breaker, synthetic-canary). Operational alerts have their own dedicated pages; the bug feed is now actual code bugs only.
2. `814c878` -- Scan-pipeline correctness + cost. (a) `track("scan.started")` wrapped in `step.run("track-start")` so it fires once per scan, not seven times per Inngest replay. (b) a3 benchmark-research short-circuit when vision fails; saves ~$0.20 in Sonnet tokens per partial scan.
3. `bd45447` -- Screenshot reliability. Request interception inside Browserless `/function` blocks ~30 third-party origins (GTM/GA/DoubleClick/Facebook/Intercom/Drift/Hotjar/etc.) and aborts media. Dual capture strategy: primary `networkidle2` + 35s, fallback `domcontentloaded` + 25s + 5s settle. `isPermanentBrowserlessError` short-circuits 401/403/404. api_usage_events now logs `retry` (not `fail`) when fallback follows primary.
4. `f4bc84f` + `18f85dc` + `6d3090a` + `42777c9` + `fb0a088` -- **Phase 4 Email Integration COMPLETE end-to-end.** Gmail OAuth with AES-256-GCM token encryption, ingest cron every 5 min using Gmail History API with backfill fallback, open + click tracking endpoints, compose modal with merge-field substitution + live preview, templates editor at `/admin/canopy/templates`, EmailThreadPanel side-by-side on contact + deal detail pages. Migration 033 applied to prod Neon. `OAUTH_TOKEN_ENCRYPTION_KEY` set in Vercel production sensitive store.
5. `a0f5051` -- iOS-grade polish pass. Shared `<ToastProvider>` + `useToast()` hook (success/error/info, spring slide-in, 4s auto-dismiss, 5-toast cap). Cmd+K command palette with fuzzy + initials match + localStorage recents. `/admin/loading.tsx` cold-load skeleton. Toasts wired into templates / compose / competitors / activity composer. `HOVER_OPEN_DELAY` 1500ms -> 500ms on dashboard cards. Time-of-day greeting. `scroll-padding-top` + `-webkit-tap-highlight-color: transparent` globals.
6. `6edc8c0` -- Deferred polish closed. Mobile sidebar drawer (`MobileSidebar.tsx`, body scroll lock, focus management, reduced-motion swap). Roving-tabindex on `/admin/contacts` table rows (ArrowUp/Down/Home/End/Enter/Space). `EmailPair.tsx` 3-mode layout (mobile stack / sm-xl tabs / xl+ side-by-side). Audit log relative time + key-by-key diff (`+` green / `-` red / `~` amber).
7. `3371138` -- Pathlight robustness pass. New `ClaudeCallTimeoutError` class so timer-driven AbortController fires get retried (vs treating `APIUserAbortError` as fatal). Revenue-impact gets `REVENUE_CALL_TIMEOUT_MS = 120_000`. Browserless wraps `page.goto` in try/catch and screenshots whatever already painted on heavy sites (mbusa.com, wingertrealestate.com). Fallback bumped to `load` + 40s + 6s settle. Sidebar "Scans" -> "Pathlight scans"; container widened to `max-w-screen-2xl`.
8. `9686b3a` -- Three follow-on UX upgrades. (1) ⌘K record search via `searchCommandPalette` server action - up to 5 contacts + 5 deals matching email/name/company, prefix-rank ordering, RBAC-scoped. (2) Undo on destructive actions: Toast grew an `action` field; templates archive + competitors remove offer Undo. (3) Route-level loading skeletons for `/admin/contacts`, `/admin/deals`, `/admin/audit`.
9. `66247b8` -- canopy-table standardization. The 4 remaining untreated tables (`/admin/costs` by-provider + by-operation, sequences list, team roster) now carry `.canopy-table`. Status numbers wrapped in `bg-emerald-50` / `bg-amber-50` / `bg-red-50` pills so meaningful tints survive the column rotation.
10. `c8a3150` -- Public Canopy showcase route at `/showcase/canopy` with fixture-only data. `lib/demo/fixtures.ts` is the single source of truth. 5 routes (dashboard / contacts / deals / audit) mirror the live admin chrome 1:1 against invented client names and audit rows. Safe to screenshot for marketing. SEO permissive.
11. `84dead2` -- **Pathlight health dashboard.** New service `lib/services/pathlight-health.ts` with `getPartialStageBreakdown` (parses `scans.error_message` semicolons, attributes to first broken stage), `getTopErrorPatterns` (clusters by normalized signature - URLs collapsed, hex/UUID/numbers placeholdered), `getProviderHealth` (per-provider, per-operation total/ok/retry/fail/successPct/avg duration), `getPartialRateBuckets` (hourly via `generate_series`). Four sections wired into `/admin/monitor/page.tsx` between Funnel and Severity. One-click `RescanByScanIdAction` + `RescanButton` on `/admin/monitor/scan/[scanId]` that creates a fresh scan row preserving the original for comparison.
12. `ce7f57e` -- chore: end-of-session memory discipline forcing-function hooks.

### Durable lessons crystallized this session

- **`APIUserAbortError` from the Anthropic SDK is ambiguous** -- it can mean "user code cancelled" (fatal) or "our timer fired" (transient). Track which inside the AbortController and only retry timer-driven aborts. Revenue-impact has the longest prompt and routinely brushes 60-80s; it now gets 120s vs the default 90s.
- **Browserless screenshots work even when Puppeteer never reports `networkidle`** -- heavy corporate sites (analytics polling, chat widgets) never settle. Wrap `page.goto` in try/catch and screenshot whatever is already painted. Above-the-fold rendering happens long before nav settle.
- **Third-party origin blocking has a real success-rate impact** -- ~30 known hosts (GTM, GA, DoubleClick, Facebook, Intercom, Drift, Hotjar, FullStory, Segment, Mixpanel, Amplitude, Tawk, Crisp, Zendesk, LinkedIn Insight, Bing UET, Microsoft Clarity) account for most slow-loading content on business sites. Block them at request-interception level inside the Browserless function.
- **Inngest steps re-execute on replay; non-step code re-runs every replay** -- if you're tracking a once-per-scan event, wrap it in `step.run`. The pre-fix code wrote 7 `monitoring_events` rows per scan because `track("scan.started")` lived outside any step.
- **OAuth tokens go encrypted at rest from day one** -- AES-256-GCM with `iv:authTag:ciphertext` hex format. Loads key from `OAUTH_TOKEN_ENCRYPTION_KEY` (64 hex chars). `isTokenEncryptionConfigured()` exists so UI can render a config nag instead of throwing.
- **Outbound link rewriting must escape HTML** -- click-tracking redirector is otherwise an injection vector for user-supplied template body text.
- **`api_usage_events.status='retry'` ≠ `status='fail'`** -- distinguishing them in the cost log lets reports answer "did this scan pay twice or pay once and lose the screenshot?"

### Operational items pending verification

The code shipped, but these still need browser eyes:

1. **`/admin/monitor` Pathlight health dashboard** (`84dead2`) -- visit after deploy and confirm the 4 new sections render with real data. Drill into a partial scan and use the Re-scan button. Memory says tsc + lint clean does not validate the Server -> Client RSC boundary; check `vercel logs --status-code 500 --since 5m` after the deploy.
2. **Phase 4 Email Integration** (`f4bc84f`/`18f85dc`/`6d3090a`):
   - Connect Gmail at `/admin/canopy` (OAuth round-trip should land on `?google=connected&email=<addr>`).
   - Trigger `canopy-gmail-ingest` manually once via app.inngest.com -> Functions -> Invoke to populate the first historical batch into `email_messages`.
   - Create a starter template at `/admin/canopy/templates`, pick it from a contact's compose panel, send, verify open + click tracking land in the EmailThreadPanel within ~30s.
3. **Pipeline fixes** (`814c878`) -- smoke a Pathlight scan and verify (a) `monitoring_events` shows exactly one `scan.started` row per scanId (was seven), (b) when vision fails, no a3 benchmark-research spend in `api_usage_events`.
4. **Screenshot reliability** (`bd45447` + `3371138`) -- scan a heavy commercial site (Intercom or Drift widget + video embeds) and confirm the layered strategy succeeds. `api_usage_events.status='retry'` if primary failed and fallback caught it.
5. **`/admin/search` populates** -- needs manual Inngest invocation of `search-console-daily` for instant data; otherwise backfills at the 06:00 UTC cron.

### Operational housekeeping (low priority)

- Flip the GCP `iam.disableServiceAccountKeyCreation` legacy constraint back to "Inherit parent's policy" in the org policies console. Existing key keeps working; only blocks new key creation.
- Empty Trash to fully purge the deleted GCP service account JSON (was at `~/Downloads/dbj-admin-2cad95e72a64.json`).

### Next recommended task

Verify the Pathlight health dashboard (item #1 above) by visiting `/admin/monitor` and using the Re-scan button on a real partial scan. Once that is confirmed working, the obvious follow-on is the deferred **auto-retry-on-partial cron** -- an hourly Inngest cron that finds <60min-old partials and re-runs the failed stages -- but it deserves a week of dashboard data first to confirm whether it is worth building.

### Working tree

Clean.
