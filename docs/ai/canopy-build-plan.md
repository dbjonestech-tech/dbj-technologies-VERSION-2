# Canopy CRM Build Plan

A phased, surgical plan to evolve Canopy (the `/admin` surface in this repo) into a state-of-the-art productized CRM. Source of truth is **this repo** (`dbj-technologies-VERSION-2`). The starter at `github.com/dbjonestech-tech/canopy` and the live install at `ops.thestarautoservice.com` are **frozen**; they will be rebuilt from this canonical Canopy after the build below is complete.

> Read this with `docs/ai/current-state.md`, `docs/ai/decision-log.md`, `docs/ai/do-not-break.md` open. Every phase respects those files.

---

## What is already built (do not redo)

- Migration `022_contacts_crm.sql` - `contacts` (email-keyed, status enum: new/contacted/qualified/proposal/won/lost, follow_up_date, source, pathlight_scan_id, notes_count, last_activity_at) + `contact_notes` (note/status_change/system types). Applied to prod Neon. Verified.
- `lib/services/contacts.ts` - list / detail / unified timeline (LATERAL touchpoint counts, scans + forms + email_events + notes UNIONed in detail timeline)
- `lib/actions/contacts.ts` - six Server Actions (createContact, updateContact, addNote, deleteNote, changeStatus, sync) with per-action revalidatePath
- `/admin/contacts`, `/admin/contacts/[id]`, `/admin/relationships/pipeline` (six-column kanban, per-card status dropdown, NO drag-and-drop deliberately)
- Sidebar Relationships group with overdue follow-up count badge
- Dashboard Relationships card
- Auto-creation wiring in scan finalize step, contact form route, client invitation accept flow (best-effort try/catch)
- First-party error capture pipeline (migration 023, /api/track/error, ErrorBeacon, /admin/errors hybrid first-party + Sentry view) - landed at the start of this plan
- 18+ admin sections: Visitors / Funnel / Search / RUM / Monitor / Costs / Scans / Leads / Database / Pipeline / Platform / Errors / Email / Infrastructure / Audit / Users / Clients + Contacts + Relationships/Pipeline

## What is explicitly out of scope

- Replacing the Resend send path on the contact form (do-not-break: "Do NOT reintroduce Gmail SMTP"). Phase 4 below uses the Gmail API for two-way CRM sync only - outbound transactional email stays on Resend.
- Optimizing Lighthouse 400/400 (do-not-break)
- Touching HeroCinema, ScanStatus.tsx, Pathlight pipeline order, vertical-lookup matching algorithm
- Crossing route-group import boundaries between `(marketing)` and `(grade)`
- Drag-and-drop on the existing Relationships pipeline kanban (decision-log: "NO drag-and-drop"). Phase 1's new deal kanban can revisit this; existing contact kanban stays as-is.

---

## The three-layer Pathlight lock (Phase 0 builds; never bypass)

Every Pathlight scan or external API call billable to DBJ must pass three independent checks before firing. Any one failing aborts with a user-facing reason.

- **Layer 1 - feature toggle.** A `canopy_settings` row holds boolean flags per integration (`pathlight_master_enabled`, `auto_rescan_enabled`, `prospecting_enabled`, `competitive_intel_enabled`, `change_monitoring_enabled`, `attribution_beacon_enabled`). All default `false`.
- **Layer 2 - manual trigger.** No background job auto-fires a scan. Crons only flag candidates and surface them as actionable items in the dashboard. A scan only fires from an explicit user click that calls a Server Action with the candidate ID.
- **Layer 3 - budget cap.** A monthly counter (`monthly_scan_budget`, `scans_used_this_period`, `period_resets_at`) blocks any scan that would exceed the cap. Default 0 (hard off until configured).

Helper: `lib/canopy/pathlight-gate.ts` exports `canFireScan(kind)` returning `{ allowed, reason? }`. Every Pathlight entrypoint (existing and new) routes through it.

---

## Cross-cutting rules

- TypeScript strict; `npx tsc --noEmit` and `npm run lint` clean before each phase ships.
- Server Actions for mutations; RSC for reads. Match existing Phase 2 pattern in `lib/actions/contacts.ts`.
- Drizzle/Neon raw SQL via `getDb()` - no new ORM layer.
- New schema lives in `lib/db/migrations/0XX_*.sql` (sequential, idempotent IF NOT EXISTS guards).
- Every mutation that touches contacts, deals, activities, settings, or audit-relevant entities writes to `audit_log` (built in Phase 0).
- All times stored UTC; rendered America/Chicago by default (configurable via canopy_settings).
- Use existing UI primitives: `PageHeader`, `Sparkline`, `DashboardCard`, `canopy-table`, palette tokens from `lib/admin/page-themes.ts`. Do not introduce a parallel design system.
- Anthropic calls: temperature 0, `callWithRetry` from `lib/services/claude-analysis.ts`.
- Long-running work goes through Inngest steps (existing `lib/inngest/functions.ts`), not raw API routes.
- All implementation prompts end with: "Report what you changed. Do NOT commit yet." Joshua approves commits.

---

## Phase 0 - Settings, Audit, Pathlight Locks
**Pathlight cost: NONE.** Plumbing only. **Risk: low.**

### Schema (migration 024_canopy_settings_and_audit.sql)
- `canopy_settings` - singleton row (id=1 enforced by CHECK), columns for every flag listed in the lock section + budget cap + period reset day + timezone + white-label (logo_url, accent_color, email_from_name)
- `audit_log` - id, actor_user_id, actor_email (denormalized), entity_type, entity_id, action, before JSONB, after JSONB, created_at; indexes on (entity_type, entity_id, created_at desc) and (actor_user_id, created_at desc)
- `feature_flags` - generic key/value scope JSONB for non-Pathlight gradual rollouts (sequence engine staging, etc.)

### Code
- `lib/canopy/settings.ts` - cached settings reader (revalidates on settings update via `revalidateTag("canopy-settings")`)
- `lib/canopy/pathlight-gate.ts` - `canFireScan(kind)`, `incrementScanUsage`, `resetPeriodIfDue`. Pure functions; tests live alongside.
- `lib/canopy/audit.ts` - `recordChange(entityType, entityId, action, before, after, actor)`; `withAudit` higher-order helper that wraps Server Actions
- `lib/actions/canopy-settings.ts` - Server Actions to update settings (each writes to audit_log, revalidates the tag)

### UI
- `/admin/canopy` - new section, palette `slate` or pick a free one. Three card rows:
  1. Pathlight Controls (master kill at top + per-integration switches + current-period spend + remaining budget)
  2. White-label (logo upload, accent color, email from-name)
  3. Notifications (digest cadence, time, toggle)
- `/admin/audit` already exists (`010_admin_audit.sql`). Extend the page with a "Canopy entity changes" tab driven by the new `audit_log` table.

### Acceptance
- Toggling master kill in `/admin/canopy` writes to `audit_log` and disables every Pathlight UI surface (button is disabled + reason shown) within one revalidation.
- A Server Action that calls `canFireScan` returns `{ allowed: false, reason }` when any of the three layers fails; never reaches the Pathlight pipeline.
- Setting `monthly_scan_budget = 0` blocks all scans regardless of toggles.

---

## Phase 1 - Deals Architecture (the pivot)
**Depends on:** Phase 0. **Pathlight cost: NONE. Risk: medium (touches existing kanban + dashboard rollups).**

The pivot: today, `contacts.status` is the single pipeline-stage source-of-truth, and the Relationships kanban moves contacts. Real CRMs move deals; one contact can have many deals over time. We add deals **alongside** contacts and pivot the kanban to a deal board, while keeping contacts.status as a denormalized "primary deal stage" for backward compatibility with the existing dashboard card.

### Schema (migration 025_deals.sql)
- `deals` - id (BIGSERIAL), name TEXT NOT NULL, contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE, owner_user_id, value_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', stage TEXT NOT NULL CHECK (stage IN ('new','contacted','qualified','proposal','won','lost')), probability_pct INTEGER NOT NULL DEFAULT 10 CHECK (probability_pct BETWEEN 0 AND 100), expected_close_at DATE, closed_at TIMESTAMPTZ, won BOOLEAN, loss_reason TEXT, source TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- Indexes: (contact_id), (stage, expected_close_at), (owner_user_id, stage), (closed_at) WHERE closed_at IS NOT NULL
- Backfill SQL (idempotent): for every contact whose `status NOT IN ('won','lost')`, create one open deal with `name = COALESCE(contacts.company, contacts.email)`, `stage = contacts.status`, `value_cents = 0`, `probability_pct` defaulted from a stage→probability map (new=10, contacted=25, qualified=50, proposal=70). For closed contacts, create one closed deal with `won = (status='won')`, `closed_at = updated_at`.

### Code
- `lib/services/deals.ts` - list / detail / weighted pipeline rollup / closed-period analytics; LATERAL contact join for display
- `lib/actions/deals.ts` - Server Actions: createDeal, updateDeal, changeStage, closeDealWon, closeDealLost (loss_reason required), reassignDeal. All audit-logged.
- Stage transition triggers `workflow.evaluate` event (Phase 5 will consume; Phase 1 just emits)

### UI
- New `/admin/deals` Kanban that becomes the primary deal board. Columns are stages. Cards show deal name, value, contact name, days in stage, probability badge.
- Keep `/admin/relationships/pipeline` (contact kanban) but add a banner: "This board moves contacts through their primary stage. For deal-level tracking, see /admin/deals."
- Deal detail page `/admin/deals/[id]`: timeline (placeholder until Phase 2 activities), linked contact card, value/stage/probability editors, won/lost form
- Contact detail page (`/admin/contacts/[id]`) gains a "Deals" panel listing all deals for the contact, open and closed
- Dashboard adds three rollup tiles: Weighted Pipeline (Σ value × probability/100 for open deals), Unweighted Pipeline (Σ value for open deals), Closed-Won This Month. Each tile clicks through to a filtered deal list.

### Acceptance
- Migration 025 applied; backfill creates one deal per active contact, no duplicates on re-run.
- Creating two deals on one contact, winning one and losing the other, updates dashboard rollups correctly within one revalidation.
- Loss reason cannot be empty when closing as lost (Server Action returns validation error).

---

## Phase 2 - Activities & Tasks
**Depends on:** Phase 1. **Pathlight cost: NONE. Risk: medium (extends existing contact_notes pattern).**

Today, `contact_notes` stores three types: note / status_change / system. We extend this into a richer activity model that adds calls, meetings, emails, tasks. Email auto-logging arrives in Phase 4.

### Schema (migration 026_activities.sql)
- `activities` - id, type ENUM ('note','call','meeting','email','task'), contact_id, deal_id NULLABLE, owner_user_id, payload JSONB (type-specific shape), occurred_at, completed_at NULLABLE, due_at NULLABLE, priority ENUM ('low','medium','high','urgent'), created_at
- Indexes: (contact_id, occurred_at desc), (deal_id, occurred_at desc) WHERE deal_id IS NOT NULL, (owner_user_id, due_at) WHERE type='task' AND completed_at IS NULL
- Migrate `contact_notes` rows into `activities` as type='note' (keep contact_notes table for one cycle as compat shim, then drop)

### Code
- `lib/services/activities.ts` - unified timeline reader that merges activities + still-emitted scans/forms/email_events for a contact or deal, sorted reverse-chronological, type-filterable
- `lib/actions/activities.ts` - Server Actions per type, Zod-validated payloads
- `lib/services/tasks.ts` - `getTodayAndOverdue(ownerId)` for the dashboard card

### UI
- Contact and deal detail pages share a `<Timeline>` component with type icons and filters; inline composer ("Log a call", "Schedule a meeting", "Add a task", "Add a note")
- `/admin/tasks` standalone page with filters (mine, all, overdue, by priority, due date)
- Dashboard "Today's Tasks" card

### Acceptance
- Logging a call from a deal page appears on both that deal's and its contact's timeline.
- Overdue tasks on the dashboard show a red urgency cue and click through to `/admin/tasks?filter=overdue`.
- All five activity types have distinct icons and filter chips.

---

## Phase 3 - Custom Fields, Tags, Segments
**Depends on:** Phase 2. **Pathlight cost: NONE. Risk: low (additive).**

### Schema (migration 027_customization.sql)
- `custom_field_definitions` - id, entity_type ('contact'|'deal'), key, label, kind ('text','number','date','select','multi_select','checkbox','url'), options JSONB nullable, display_order, required boolean
- Add `custom_fields JSONB DEFAULT '{}'` to contacts and deals
- Add `tags TEXT[] DEFAULT '{}'` to contacts and deals
- `saved_segments` - id, owner_user_id, entity_type, name, filter_config JSONB, is_shared boolean

### Code
- `lib/canopy/custom-fields.ts` - registry CRUD, per-kind validators
- `lib/canopy/segments.ts` - generic filter compiler turning a `filter_config` into a Drizzle/Neon WHERE clause; supports field equality, range, contains, tag any/all, custom field comparisons

### UI
- `/admin/canopy` settings → Custom Fields editor (drag to reorder, add/edit/remove)
- Contact and deal detail pages render custom fields dynamically below standard fields
- Contact, deal, task list pages get tag chips, filter sidebar, "Save as segment", segment picker

### Acceptance
- Adding a custom field "Vehicle VIN" appears on every contact detail page and is editable; old contacts show empty value without crash.
- Saving a segment with three filters and reopening it tomorrow returns the same results.

---

## Phase 4 - Email Integration
**Depends on:** Phase 3. **Pathlight cost: NONE. Gmail API: free; verification only required if Canopy distributes to other Google accounts.**

> **Critical scope boundary:** This adds Gmail API two-way sync **for the CRM's compose/reply/timeline view**. It does NOT replace the contact form's Resend send path. Outbound transactional email continues through Resend. Per-user authenticated CRM email goes through the Gmail API.

### Schema (migration 028_email_sync.sql)
- `email_messages` - id, contact_id, deal_id NULLABLE, direction ('in'|'out'), gmail_message_id UNIQUE, thread_id, subject, body_html, body_text, from, to TEXT[], cc TEXT[], sent_at, opened_at TIMESTAMPTZ[], clicked_links JSONB
- `email_templates` - id, owner_user_id, name, subject, body_markdown, merge_fields TEXT[]
- `oauth_tokens` - user_id, provider ('google'), scopes TEXT[], access_token (encrypted), refresh_token (encrypted), expires_at

### Code
- `lib/integrations/google-oauth.ts` - OAuth flow, token refresh, scope check (`gmail.send`, `gmail.readonly`, `gmail.modify`)
- `lib/inngest/functions.ts` - new `gmailIngest` cron (every 5 min): pull new messages for each connected user, match `from`/`to` to a contact email, upsert into email_messages, attach to most recent open deal if any
- `lib/email/render.ts` - merge field substitution (`{{contact.name}}`, `{{contact.company}}`, `{{deal.value}}`, `{{pathlight.score}}`)
- Open-tracking pixel hosted at `/api/email/pixel/[messageId]`; click-tracking redirector at `/api/email/click/[messageId]`

### UI
- Compose modal on contact and deal pages with template picker and live merge-field preview
- Inbound emails appear in the timeline as a new activity type (extension of Phase 2 activities)
- `/admin/canopy` settings → Connected Accounts (connect/disconnect Google), Email Templates editor

### Acceptance
- Sending email from a contact page arrives at the recipient and appears in the connected user's Gmail Sent folder; reply lands in the contact's timeline within 5 min.
- One email open and one click are recorded.

---

## Phase 5 - Automation: Sequences, Workflow Rules, Bulk Actions
**Depends on:** Phase 4. **Pathlight cost: NONE for the engine; rules can trigger gated Pathlight actions starting Phase 6.**

### Schema (migration 029_automation.sql)
- `sequences` - id, name, status ('draft'|'active'|'paused'), enrollment_filter JSONB, exit_conditions JSONB
- `sequence_steps` - id, sequence_id, order, kind ('email'|'task'|'wait'), payload JSONB, delay_seconds
- `sequence_enrollments` - id, sequence_id, contact_id, current_step, status ('active'|'paused'|'completed'|'exited'), enrolled_at, last_step_at
- `workflow_rules` - id, name, trigger JSONB (event + match conditions), conditions JSONB, actions JSONB (action queue), enabled

### Code
- Inngest functions: `sequence.advance` (per-enrollment, idempotent), `sequence.exit-on-reply` (consumes Phase 4 inbound email events), `workflow.evaluate` (consumes domain events from earlier phases)
- Action library: `createTask`, `sendEmail`, `enrollInSequence`, `changeStage`, `addTag`, `triggerPathlightScan` (gated by `canFireScan`)
- Bulk action Server Actions: tag, untag, enroll, change owner, delete, export

### UI
- `/admin/sequences` list and step editor
- `/admin/automations` list and rule builder
- Contact, deal, task list pages get checkbox column + bulk action toolbar

### Acceptance
- 3-step sequence with delays 0d/3d/7d enrolls a contact, sends emails 1 and 2 on schedule, the contact replies, email 3 does NOT send.
- Rule "when deal stage changes to Qualified, create task 'Send proposal' due in 2 days" fires correctly.

---

## Phase 6 - Pathlight Manual Integrations (gated by Phase 0 locks)
**Depends on:** Phase 0 + Phase 1+2 data model. **Pathlight cost: GATED (manual). Risk: medium.**

### Schema (migration 030_pathlight_integrations.sql)
- `pathlight_scans_log` - id, contact_id, scan_id (existing scans.id, TEXT), score, score_delta, triggered_by_user_id, triggered_reason, snapshot_url, scanned_at
- `ai_search_checks` - id, contact_id, engine ('chatgpt'|'claude'|'gemini'|'perplexity'|'other'), query, result_text, mentioned BOOLEAN, sentiment ('positive'|'neutral'|'negative'|'unknown'), checked_by_user_id, checked_at
- `lead_scores` - id, contact_id, score INT, components JSONB (pathlight, engagement, recency, touchpoints, deal_value, source), computed_at
- Lead-score weights live as a settings row in `canopy_settings` (extend Phase 0 schema)

### Code
- `lib/canopy/pathlight-client.ts` - server-to-server call into the existing `lib/inngest/functions.ts` scan event. Always behind `canFireScan`.
- `lib/actions/pathlight-rescan.ts` - Server Action `triggerRescan(contactId)`: gate check → enqueue Inngest scan event → on completion, write `pathlight_scans_log` row with delta vs previous scan
- `lib/canopy/lead-scoring.ts` - `computeLeadScore(contactId)`; recomputes on relevant events (scan completed, deal stage changed, activity logged); writes a row to `lead_scores`

### UI
- Contact detail page: "Re-scan with Pathlight" button (disabled with reason when gate blocks); scan history list with delta badges
- Contact detail page: "Check AI search" form (engine select + query field + paste-result textarea) with history below
- Lead score badge on contact cards (kanban + list); sortable column
- `/admin/canopy` settings → Lead Scoring weights editor

### Acceptance
- Master kill on → rescan button disabled with "Pathlight is paused in Settings."
- Master kill off + budget exhausted → button disabled with "Monthly scan budget reached."
- Successful manual rescan increments budget counter, writes audit_log, posts a delta-annotated entry to the contact timeline.

---

## Phase 7 - Analytics & Narrative Digest
**Depends on:** Phases 1, 2, 6. **Pathlight cost: NONE.**

### Code
- `lib/analytics/pipeline.ts` - conversion by stage, avg time in stage, win rate, avg deal size, revenue by period, source attribution, loss reason aggregation
- `lib/analytics/contact.ts` - engagement sparkline series, response time, next-best-action heuristic
- Inngest weekly cron `digest.compose` - builds an HTML email summarizing new contacts, overdue follow-ups, deal movement, pipeline value change, notable visitor sessions, Pathlight score changes (read-only on existing data; no new scans)

### UI
- `/admin/analytics/pipeline` page with Recharts (existing convention from `/admin/visitors`): stage funnel, time-in-stage bars, win-rate trend, source attribution donut, loss reason bars
- Contact detail: engagement sparkline, response time, next-best-action callout
- `/admin/canopy` settings → Digest (toggle, day/time, last digest preview)

### Acceptance
- Analytics numbers cross-check against raw data on a sample of 10 contacts/deals.
- A digest email arrives on schedule and renders correctly in Gmail and Apple Mail.

---

## Phase 8 - Multi-User Enterprise
**Depends on:** Phases 0–7 stable. **Pathlight cost: NONE.**

### Schema (migration 031_rbac.sql)
- Extend existing `admin_users` with role ENUM ('admin','manager','sales','viewer')
- `mentions` - id, source_activity_id, mentioned_user_id, read_at
- `webhooks` - id, url, events TEXT[], secret, enabled
- `api_tokens` - id, user_id, name, hashed_token, scopes TEXT[], last_used_at

### Code
- RBAC middleware on every Server Action and API route. Sales role queries scoped to `owner_user_id = self`.
- @mention parser in note bodies; mentions feed digest + future in-app notifications
- Webhook dispatcher (Inngest) on domain events (contact.created, deal.stage_changed, scan.completed, task.completed)
- REST API at `/api/v1/*` (contacts, deals, activities, tasks). Token auth.
- CSV import wizard with column mapping; export as CSV/Excel/JSON
- White-label theming reads from `canopy_settings`

### UI
- `/admin/canopy/team` (invite, role assign, remove)
- `/admin/canopy/api` (token + webhook management)
- `/admin/canopy/branding` (white-label editor with live preview)
- `/admin/import` wizard
- Audit log viewer on each entity detail page (collapsible)

### Acceptance
- Sales-role user cannot see contacts owned by another sales user, even via direct URL.
- A webhook fires within 10s of a deal stage change.
- A HubSpot CSV export imports cleanly with field mapping.

---

## Phase 9 - Pathlight Advanced (gated)
**Depends on:** Phases 0, 6, 8. **Pathlight cost: GATED (heavy). Risk: high - most expensive surface.**

### Schema (migration 032_pathlight_advanced.sql)
- `prospect_lists` - id, name, source ('manual'|'csv'|'generated'), status, created_by_user_id
- `prospect_candidates` - id, list_id, business_name, website_url, location, vertical, scan_status, scanned_contact_id NULLABLE
- `website_change_signals` - id, contact_id, etag, last_modified, content_hash, observed_at, change_kind
- `competitors` - id, contact_id, competitor_name, website_url, last_pathlight_score, last_scanned_at
- `attribution_events` - id, contact_id, deal_id, event_type ('scan_sent'|'deal_won'|'site_launched'|'metric_recorded'), payload JSONB, recorded_at
- `attribution_beacon_data` - id, contact_id, metric_kind, value, recorded_at

### Code
- Prospecting Server Actions: prepare list (vertical-lookup matching, no scans), then per-row "Scan this candidate" (gate enforced per row)
- Change-monitoring Inngest cron: HEAD-request each active-deal contact's site daily; on etag/last-modified/content-hash change, write `website_change_signals` and surface in dashboard. **No scan auto-fires.** Dashboard offers "Re-scan now" per signal.
- Competitive intel Server Action: per contact, accept up to 5 competitor URLs; "Scan competitors" button gated and counts as N scans.
- Attribution beacon: a JS snippet (extension of `CanopyBeacon` pattern from operations-cockpit) the client embeds on their post-launch site; reports lightweight metrics to attribution_beacon_data; renders ROI on the deal's "Case Study" tab.

### UI
- `/admin/prospecting` page with list management, candidate scan UI (one-by-one or selected bulk), pre-written outreach drafts using merge fields
- Dashboard "Website Changes" card with per-signal action
- Contact detail "Competitors" panel
- Deal detail "Case Study" tab post-win
- `/admin/canopy/beacon` snippet generator + per-client status

### Acceptance
- Prospecting cannot scan a list without master kill off and budget available; UI explains why when blocked.
- Simulated etag change on a tracked site surfaces as an actionable signal but does not fire a scan automatically.
- Closing a deal as won and pasting beacon snippet on the client's staging site produces real-time metric data on the case study tab.

---

## Reporting protocol (per phase)

1. `npx tsc --noEmit` and `npm run lint` clean.
2. `git status --short` and `git diff --stat HEAD` for review.
3. List acceptance criteria with pass/fail; any fail blocks the phase.
4. Update `docs/ai/current-state.md`, `docs/ai/session-handoff.md`, `docs/ai/decision-log.md`, `docs/ai/backlog.md` per CLAUDE.md.
5. Stop. Do not commit. Wait for Joshua's go-ahead.

**Do not skip phases. Do not bundle phases.** The locks (Phase 0) and basic manual flow (Phase 6) must be battle-tested before heavy automated paths (Phase 9) are exposed.

---

## Operational notes

- **Frozen codebases:** `github.com/dbjonestech-tech/canopy` and `/Users/doulosjones/Desktop/operations-cockpit/`. Star Auto's install at `ops.thestarautoservice.com` keeps running. Once this plan completes, that install will be rebuilt from this canonical Canopy.
- **Migration runner:** `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/<file>.sql`
- **Production DB:** Neon Postgres pointed at `POSTGRES_URL`. Migrations are idempotent (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`). Apply to prod after Joshua's review per phase.
