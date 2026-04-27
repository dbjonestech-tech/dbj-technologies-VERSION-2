# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-27.md`](history/2026-04-27.md), which holds the
verbatim record of every session entry that was below this one before
archive.

## Last Session: April 27, 2026 -- Image swap + hero polish across all 8 portfolio templates

### What shipped

Replaced ten template image assets with new Gemini-generated photography (cropped manually, watermark removed) and rebuilt several hero compositions to make each template's first impression authentic, premium, and visually distinct from the others. Image-asset blocker from the prior critique pass is now cleared. All 8 templates are visibly improved and ready for the next round of critique.

**Image swaps** (10 files, all converted PNG -> JPG at q88-90, sRGB, progressive, EXIF stripped):

- `images/people/dental-dentist.jpg` -- new female dentist in a sage-and-cream operatory, replacing the previously-mismatched masked-male photo. Used for both hero and the Dr. Sarah Parker doctor section.
- `images/people/financial-advisor-1.jpg` -- new founder profile portrait of James Beckett, ivory studio backdrop, three-quarter view, navy suit.
- `images/people/builders-principal.jpg` -- new William Ashworth portrait at a finished walnut kitchen island in a Park Cities residence, replacing the under-construction timber-frame shot.
- `images/people/hvac-technician.jpg` -- new Carlos R. portrait with clean shirt embroidery and consistent Ironclad Air branding (the AI-text artifacts you flagged in the prior critique are gone).
- `images/med-spa-hero.jpg` -- new editorial hero portrait (woman in cream silk robe, peony, soft natural light through arched window) to fill the previously-empty top of the med-spa hero.
- `images/real-estate-hero.jpg` -- new Park Cities estate at golden hour, replacing the prior generic dusk-home shot.
- `images/restaurant-dish1.jpg` -- new overhead pappardelle with lamb ragu, Pecorino, oil-poached cherry tomatoes, oxblood napkin. Promoted to the hero (replacing the bartender).
- `images/restaurant-cocktail.jpg` -- NEW file, smoked old fashioned with single large cube and orange peel. Used as the bar-section background.
- `images/pi-law-courthouse.jpg` -- NEW file, Old Red Courthouse Dallas County in late afternoon light. Used in the new hero strip.
- `images/pi-law-detail.jpg` -- NEW file, leather attache case + brass banker's lamp + fountain pen on legal pads. Used in the new hero strip.

**Layout / copy work per template:**

- `dental-practice.html`: removed the colored teal-circle-with-coral-dot logo mark from both nav and footer (you described it as "truly hideous"). Repointed the doctor-section image to the new file and corrected width/height attributes. Wordmark-only branding now.
- `luxury-builders.html`: removed the round "A" monogram badge from the wordmark for the same reason -- the squarespace-cheap reading was largely the badge. Wordmark-only branding now. Updated principal-photo alt text to match the new finished-kitchen scene.
- `med-spa.html`: hero converted from single-column text to magazine 2-column spread. Text on the left, new portrait on the right, magazine "01" pagenum overlays the upper-right corner of the image. Soft drop shadow and 1px ivory inner highlight on the photo. Mobile collapses to single column with the image moving to order:2.
- `financial-advisor.html`: hero restructured from centered-serif (visually too similar to real-estate) to a 2-column grid -- text/CTAs/stats left-aligned on the left, framed founder portrait on the right with ivory studio backdrop, hairline forest border, soft outer shadow, and italic-serif name + Work-Sans title caption. The old separate `advisor-portrait-zone` section was deleted (the portrait is now in the hero) and its dead CSS was cleaned up.
- `real-estate.html`: hero restructured from centered-stack to 2-column grid with the new Park Cities home occupying the LEFT column at 60vh+, text on the right. The mirror layout (image-left vs. advisor's image-right) plus the warm dusk vs. cool studio mood makes the two templates feel distinct on first glance.
- `pi-law.html`: gold serif italic h1 reduced in size and weight, color shifted from full gold to cream with a single italic-gold accent on the closing phrase ("Bring the Lawyers Who Try the Case."). Cheap reading addressed. Inserted a new full-width 2-image strip beneath the hero, sitting on the navy ground: courthouse on the left (4:5 portrait), leather-attache still life on the right (4:3), each with a small gold caption block. Restored Espanol diacritics to Espanol across 4 surfaces (urgent strip, contact-modes, FAQ, footer CTA).
- `restaurant.html`: bartender no longer dominates. Hero image swapped to the pappardelle dish (the bartender lives now as a small 84px circular bar-director portrait next to Henry Ramos's name in the bar section). Bar-section background swapped from bartender to the new smoked-old-fashioned cocktail at center 35%. Added `.bar-director` flex cluster CSS.
- `hvac-contractor.html`: only image asset swap (no layout change) -- the new technician photo with clean shirt embroidery flows through the existing hero composition.

**Discipline preserved:** every existing CSS variable, type stack, color token, and visual idiom kept. All references resolve. `<meta name="robots" content="noindex, nofollow">` still on every template. Mobile breakpoints extended for every layout change. Em-dash sweep across `public/templates/` + `docs/blueprints/` returns zero matches. `tsc --noEmit` clean.

### Cross-cutting items still pending

These were on the original critique list but were intentionally not addressed in this image-swap pass. They will need a follow-up:

- **Differentiated promo / specials banners** across templates (currently uniform top strips -- need vertical-specific iconography, sizing, sometimes thumbnail imagery, icons that represent the actual day/event of the special).
- **Google Maps embed** on hero where service-area-relevant (HVAC, restaurant, dental, med-spa, pi-law).
- **Google reviews widget** on hero where appropriate by tier (skip for luxury builder, agent, RIA).
- **High-end Dallas magazine review marks** on the restaurant hero (D Magazine, Eater, Texas Monthly, Wine Spectator) with proper editorial typography.

### Known minor items

- Financial-advisor mobile breakpoint: the dead `.advisor-portrait-frame` mobile rule was deleted alongside the desktop CSS; verified no other rules reference it.
- The new `restaurant-cocktail.jpg`, `pi-law-courthouse.jpg`, and `pi-law-detail.jpg` are NEW files; the other 7 image swaps overwrote existing files in place to preserve all HTML refs.

### Next recommended task

User-led critique pass, template by template. The image asset blocker is cleared, so the next round should focus on the cross-cutting items above (differentiated promo banners, Google Maps + Reviews placements, restaurant magazine marks) plus per-template polish.

## Prior Session: April 27, 2026 -- Admin Stage 5: invitation-based admin users + /invite

### What shipped

Stage 5 closes the admin shell: `/admin/users` is now live, and any new admin can be added by sending an invitation email instead of editing the `ADMIN_EMAILS` env var. The bootstrap allowlist remains as a fallback so a database outage cannot lock you out. The architecture is forward-compatible with the planned client portal (see `docs/ai/portal-strategy.md`); the same invitation machinery will provision client accounts when that initiative starts.

**Database (migration 012):**
- `admin_users`: email PK, role (CHECK ('admin') for now, expandable to ('admin', 'client')), invited_by, invited_at, accepted_at, last_signin_at, status (active/disabled), created_at. One partial index on (status, email) for active lookups.
- `admin_invitations`: token PK (UUID via Web Crypto), email, invited_by, expires_at (now + 7 days), used_at, revoked_at, created_at. Two partial indexes (open invitations by email, and recent invitations by created_at).

**Auth flow:**
- `lib/auth/users.ts`: DB-backed query module (Edge-safe via neon serverless). Exposes isAdminUser, listAdminUsers, getAdminUser, updateLastSignin, disableAdminUser, reactivateAdminUser, hasValidInvitationFor, createInvitation, getInvitationByToken, acceptInvitationFor (single-CTE consume + upsert), listInvitations, revokeInvitation, classifyInvitation.
- `auth.config.ts` signIn callback now allows three sources in cost order: env allowlist (sync set), admin_users active row, valid pending invitation. JWT callback only sets isAdmin at sign-in time (trigger=signIn or fresh user) and trusts the gate on subsequent refreshes so neither the JWT nor session refresh re-hits the DB.
- `auth.ts` events.signIn now does DB bookkeeping for non-env users: existing admin_users row -> updateLastSignin; otherwise call acceptInvitationFor (CTE that consumes the most recent valid invitation and upserts admin_users in one statement). audit metadata gains `acceptedInvitation: boolean`. env-allowlist users skip both branches.

**Public invitation acceptance (`/invite/[token]`):**
- Top-level public route (NOT under /admin layout, so it does not require auth to view). Server component reads the token, classifies state (valid/expired/used/revoked/missing) via classifyInvitation, renders the appropriate UI.
- Valid state: shows invitee email + inviter + expiry, plus a "Accept and sign in with Google" button that calls `signIn("google", { redirectTo: "/admin" })`. When the OAuth round-trip completes, the signIn callback allows entry (because hasValidInvitationFor matches), and events.signIn consumes the invitation and creates the admin_users row before the redirect lands.
- Already-signed-in admins are short-circuited to /admin so the page is never visible post-acceptance.
- Other states render polite messaging and a link back to /signin or /.

**`/admin/users` surface:**
- Stat cards: bootstrap admins (env count), invited admins, open invitations, disabled.
- Invite form: email input + server action `inviteAdminAction` that validates format, blocks self-invite, blocks duplicates against env list, blocks duplicates against active admin_users, blocks duplicates against open invitations, creates the invitation, sends the email via Resend, audit-logs success/failure, and revalidates the path.
- Invited admins table: shows DB-backed users with status badge, invited_by, accepted_at, last_signin_at relative time, plus a Disable / Reactivate action (you cannot disable yourself).
- Invitations table: 200 most recent across all states, with state badge (open/expired/used/revoked), inviter, sent/expires timestamps, and for open invitations a `<details>` block revealing the public accept URL plus a Revoke button.
- Flash banner reads `?error=` / `?sent=` / `?delivery=failed|sent` / `?revoked=1` / `?disabled=` / `?reactivated=` from the search params, populated by server-action redirects.

**Email template (`lib/email-templates/admin-invitation.ts`):**
- White card on zinc background, accent cyan CTA button, reuses the BuiltEmail type. Includes a fallback paste-this-link block for clients that strip the button.
- `lib/auth/notify.ts` gains `sendAdminInvitationEmail` that THROWS on failure (unlike the new-device email which swallows). The inviting admin needs to know if delivery failed so they can copy the accept link manually.

**Wiring:**
- `app/admin/layout.tsx`: Users entry no longer disabled.
- `app/admin/page.tsx`: Users card flipped to live with updated description.
- `app/robots.ts`: `/invite/` added to disallow list.
- `middleware.ts`: `/invite` added to CACHE_EXCLUDED_PREFIXES so per-token pages are never cached at the CDN. Pre-existing em-dashes in middleware.ts comments stripped.

### Files added

- `lib/db/migrations/012_admin_users.sql`
- `lib/auth/users.ts`
- `lib/email-templates/admin-invitation.ts`
- `app/admin/users/page.tsx`
- `app/admin/users/actions.ts`
- `app/invite/[token]/page.tsx`

### Files modified

- `auth.config.ts` (3-source signIn check, jwt trigger gate)
- `auth.ts` (events.signIn DB bookkeeping)
- `lib/auth/notify.ts` (added sendAdminInvitationEmail)
- `middleware.ts` (CACHE_EXCLUDED_PREFIXES)
- `app/admin/layout.tsx` (Users live)
- `app/admin/page.tsx` (Users card live)
- `app/robots.ts` (/invite/ disallow)

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- 0 em-dashes across all changed files (including middleware.ts comments which had two pre-existing em-dashes; both replaced).
- Migration 012 applied successfully to the linked Neon branch (5 statements ok).

### Manual verification next

1. Sign in to /admin as bootstrap admin. Visit /admin/users. Send an invite to a second Google address you control.
2. Confirm the invitation email arrives via Resend.
3. Open the email link in a private window. Verify /invite/{token} renders with the correct invitee email and inviter.
4. Click "Accept and sign in with Google". Sign in with the matching account.
5. Land on /admin. Verify the Audit log shows `signin.success` with `acceptedInvitation: true`.
6. Back in /admin/users, verify the new admin shows in the Invited admins table with last_signin_at set, and the invitation row is now state=used.
7. Test denial: try to accept the (now-used) invitation a second time. Should show "already used" copy.
8. Test mismatch: send an invitation to one email, attempt to accept with a different Google account. Should be denied at signIn callback (lands on /signin?error=AccessDenied).
9. Test disable: disable the new admin from the Invited admins table. Sign in as them, should be denied.

### Known minor items

- Migration 012 was applied to the dev Postgres which is the same Neon branch as production via POSTGRES_URL. Confirm before next prod deploy that admin_users + admin_invitations tables exist in the production Neon branch.
- The CHECK on `admin_users.role` only allows 'admin' today. When the client portal initiative starts, alter the constraint to ('admin', 'client') as part of that migration.
- The disable/reactivate actions immediately flip status, but any active JWT cookie for the disabled user remains valid until natural expiration (8 hours). For instant lockout we would need a session-revocation table; deferred until there is a real reason.
- The /invite page's `<details>` block shows the accept URL but cannot auto-select on focus (would require a client component). Manual click into the input still works for copy-paste.

### Git status at session pause

Working tree clean for Stage 5 work. Stage 5 shipped in commit `fd84067` (`feat(admin): Stage 5 invitation-based admin users + /invite`), pushed to `origin main`. Vercel auto-deploy triggered. `scripts/check-admin-audit-table.mjs` remains untracked (carried over from a prior session, intentionally left out of Stage 5).

### Next recommended task

Per the portal strategy doc: client portal v1 (~2 weeks). New `/portal` route group with its own minimal layout, a `clients` table (or a `role` column on a unified users table) wired to the same invitation flow that just shipped, and a project status dashboard scoped to the signed-in client. Read `docs/ai/portal-strategy.md` for the phased plan, scope warnings, and revenue framing before starting.

---

## Earlier Session: April 27, 2026 -- Admin Stage 3: operational tools (scans, leads, audit, database)

### What shipped

Stage 3 lands the four operational tools that completed the admin shell. Every "Soon" placeholder on the landing dashboard except Users is now live, and the contact form gained durable persistence so leads are no longer lost when Resend is the only record.

**New surfaces (4 server-component pages):**
- `/admin/scans` -- Filterable scans table joined against scan_results. Filters: status (pending / scanning / analyzing / complete / partial / failed), date window (24h / 7d / 30d / 90d), revenue bucket ($0-$1k, $1k-$5k, $5k-$10k, $10k+, "no revenue computed"), free-text search across URL/email/business name. Each row shows status badge + Pathlight score + computed monthly loss + duration; per-row links to the public report and to the existing /admin/monitor/scan/{id} drill-down. 50 per page with prev/next pagination.
- `/admin/leads` -- Two-tab unified inbox. "Pathlight signups" (leads table) shows email, business, scan_count, last_scan_at, unsubscribed badge. "Contact form" reads the new contact_submissions table (full name + email + phone + company + budget + project_type + message + Resend ID + IP + UA), with a collapsible <details> per row for the message body. Top of page: 4 stat cards (total leads, unsubscribed, total contacts, contacts 7d).
- `/admin/audit` -- Read view over admin_audit_log. Filters: event type (8 known events), result (success/denied/error), date window (24h/7d/30d), email (partial match). Rows show timestamp, event, badged result, email, IP, short UA, expandable JSON metadata. 4 stat cards across the top (events 24h, denied 24h, errors 24h, unique emails 24h) with warn/error tone when non-zero.
- `/admin/database` -- Catalog view of all 10 tracked tables (scans, scan_results, leads, contact_submissions, email_events, email_unsubscribes, monitoring_events, lighthouse_history, api_usage_events, admin_audit_log) grouped by domain (Pathlight / Email / Telemetry / Admin). Each row: total count, 24h/7d/30d insert volume, newest row relative time, oldest row absolute date, and a one-line description. Read-only. Per-table errors fail safe with `total = -1` rendered as red `error`.

**Contact form persistence (migration 011 + route change):**
- New table `contact_submissions` (UUID id, name, email lowercased, phone, company, budget, project_type, message, resend_id, ip, user_agent, created_at). Two indexes (created_at DESC, email).
- Migration `011_contact_submissions.sql` applied to Neon via `node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/011_contact_submissions.sql`.
- `app/(marketing)/api/contact/route.ts` now calls a best-effort `persistContactSubmission()` helper alongside the Resend send. Failures swallow to console.warn (same pattern as `track()` and `writeAdminAudit()`). Persistence runs on all three paths: dev (no API key), Resend success (with `data.id` captured), Resend failure (resend_id null). A delivery error is exactly when the durable record matters most so the lead is captured regardless.

**Nav + dashboard wiring:**
- `app/admin/layout.tsx`: dropped `disabled: true` from Scans, Leads, Database, Audit log. Users remains the only "Soon" entry.
- `app/admin/page.tsx`: same four cards flipped from "Soon" to "live"; added a dedicated Audit log card (ShieldCheck icon).

### Files added

- `lib/db/migrations/011_contact_submissions.sql`
- `app/admin/scans/page.tsx`
- `app/admin/leads/page.tsx`
- `app/admin/audit/page.tsx`
- `app/admin/database/page.tsx`

### Files modified

- `app/(marketing)/api/contact/route.ts` (persistence helper + 3 call sites + user-agent capture; also stripped a pre-existing em-dash from line 91)
- `app/admin/layout.tsx` (4 entries flipped to live)
- `app/admin/page.tsx` (5 cards: 3 flipped to live + new Audit log card)

### Verification

- `npx tsc --noEmit` clean.
- `npm run lint` exit 0.
- 0 em-dashes across all changed files.
- Migration 011 applied successfully to the Neon branch (POSTGRES_URL); 3 statements ok.

### Known minor items

- Migration 011 was applied to the dev Postgres which is the same Neon branch as production via POSTGRES_URL. Confirm before next prod deploy that `contact_submissions` table exists in the production Neon branch.
- /admin/users still placeholder; reserved for Stage 5 (roles + invitation foundation).
- The neon serverless driver does not strongly type `await Promise.all([sql\`...\`, ...])`; loadCounts in /admin/leads casts to `{ n: number }[][]` after the await. Same pattern can be reused for any future page that runs multiple count queries in parallel.

### Git status at session pause

Working tree clean. Stage 3 shipped in commit `97051ca` (`feat(admin): Stage 3 operational tools (scans, leads, audit, database)`), pushed to `origin main`. Vercel auto-deploy triggered. `scripts/check-admin-audit-table.mjs` remains untracked (carried over from a prior session, intentionally left out of Stage 3).

### Next recommended task

Stage 5 (admin invitations / Tier 5). The path was re-prioritized in the post-Stage-3 strategy session: skip Stage 4 polish for now and ship Stage 5 because its invitation infrastructure is dual-purpose with the planned white-glove client portal. **Read `docs/ai/portal-strategy.md` first** -- it captures the full discussion of admin invites vs Pathlight customer accounts vs DBJ client portal, why the studio-not-SaaS identity matters, the phased plan (Stage 5 -> client portal v1 -> v2 -> v3), and the architectural reuse argument. Stage 4 polish (cmdk, sonner, theme toggle, keyboard shortcuts) is deferred and can land after the portal initiative.

---

## Earlier Session: April 27, 2026 -- Admin login portal (Stages 1 + 2 = Tiers 0-2)

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

`main` is at `fd84067` (feat(admin): Stage 5 invitation-based admin users + /invite), confirmed pushed to `origin main`. Working tree clean except for `scripts/check-admin-audit-table.mjs` (carried over from a prior session, intentionally untracked). Recent chain (most recent first): `fd84067` (Stage 5 admin users + invitations) -> `30aeb6d` (snapshot for 551cd6f) -> `551cd6f` (templates image swap + hero polish) -> `f8808ef` (snapshot for 97051ca) -> `97051ca` (Stage 3 operational tools) -> `1ccc863` (snapshot for b1f59e4) -> `b1f59e4` (Stages 1+2 admin login portal) -> `8289370` (5 templates Pass 1 + blueprints) -> `b9b8dfe` (monitoring V1+V2) -> earlier chain elided in archive.
