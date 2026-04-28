# Portal Strategy

Forward-looking strategy doc for the customer-portal initiative. Captures the
April 27, 2026 strategy session held immediately after Stage 3 of the admin
portal shipped (commit `97051ca`). Read this before any work on Stage 5
(admin invitations) or the white-glove client portal.

**Status:** strategy agreed, implementation not started.

---

## How this conversation started

Stage 3 of the admin portal shipped to `origin main` (admin scans, leads,
audit, database surfaces plus `contact_submissions` persistence via
migration 011). The remaining "Soon" placeholder in the admin shell was
`/admin/users`. Joshy asked whether "user signup" could ship next, and
whether option B (full customer accounts) was too complicated.

Two interpretations of "user signup" surfaced:

- **Option A:** admin invitations. The Stage 5 entry in the original
  roadmap. `/admin/users` page where Joshy invites collaborators by
  email; invited user clicks link, signs in with Google, gets added to
  a DB-backed allowlist instead of the `ADMIN_EMAILS` env var.
  Estimated effort: 4-6 hours, one migration (`admin_users` +
  `admin_invitations`), one email template, one accept-token route,
  one tweak to the signIn callback.
- **Option B:** public end-user signup with customer accounts.
  Estimated effort: 2-3 days minimum, but most of the cost is product
  strategy work that only Joshy can do (defining what accounts unlock,
  pricing, copy, privacy footprint, support process).

---

## Joshy's vision for the client portal

When asked what a customer portal would actually contain, Joshy listed:

- Sign up + sign in
- Shopping cart
- Payment information + checkout
- Profile
- Billing information
- View where they are in their current project status (what work is
  being done for them or their website)
- View their Pathlight score / scan data
- Message Joshy directly
- "and on..."

That feature list spans two completely different products if you take it
literally. Disambiguating those products was the load-bearing decision of
the strategy session.

---

## Two surfaces, not one

Trying to fuse "Pathlight customer accounts" with "DBJ client engagement
dashboard" forces an answer to "is DBJ a SaaS company or a
principal-architect studio." The answer that's working today is studio.
Pathlight is the lead magnet. The studio is the revenue. They each
deserve their own surface.

### Pathlight customer portal (SaaS)

- Anonymous-first lead funnel up front (do NOT add signup before the
  scan form; the zero-friction "free, no credit card" promise is what
  converts).
- Optional account on the back end. "Claim your scan" CTA appears
  AFTER the report lands.
- Free tier: 1 scan / month + report archive.
- Paid tier: unlimited re-scans, score-drop monitoring, scan-over-time
  comparison, team accounts, white-label exports.
- Stripe + checkout + billing belongs HERE, not in the studio portal.
- This is productized.

### DBJ client portal (white-glove)

- Private dashboard for paid engagements only. NEVER public signup.
- Joshy provisions the account when a contract is signed. Invitation
  flow identical to Stage 5 admin invites.
- Project status (current phase, milestones, next deliverable), file
  vault, invoice history, change-request form, preview/staging links.
- Optional in-app messaging thread.
- Optional Pathlight scan history scoped to that client.
- This is account management, not SaaS.

---

## Decided sequencing

Joshy's call after the strategy discussion: ship Stage 5 (admin
invitations) first, then build the white-glove client portal. Pathlight
customer-account monetization is deferred indefinitely.

### Why this order is right

1. **Stage 5 builds the auth foundation the client portal needs anyway.**
   The invitation flow, accept-token route, DB-backed allowlist, and
   role column are dual-purpose. The client portal reuses the same
   machinery; the only difference is `role = 'client'` instead of
   `role = 'admin'`.
2. **Stage 5 is small enough to ship clean before the larger thing.**
   ~4-6 hours. One migration, one page, one email template. The client
   portal then lands on top of a working auth surface instead of two
   moving targets at once.
3. **Studio-not-SaaS identity stays intact.** No public signup at any
   stage of this plan. Both Stage 5 and the client portal are
   invitation-only.

### Architectural reuse from Stage 5

When client portal v1 ships, the only NEW code needed is:

- `/portal` route group + layout (separate from `/admin`)
- `clients` table (or `users` table with role column shared by admin
  and client)
- Simple project-status JSON or table
- Per-client Pathlight scan scoping query

The invitation flow is already done. New client signs contract, Joshy
clicks "Invite client" in `/admin/clients`, they get an email, they
sign in with Google, they land on their dashboard. Zero auth code is
rewritten.

---

## Client portal scope warning

The full feature list Joshy listed (pay, add scope, view status,
message Joshy, view Pathlight score, profile, billing, etc.) is a 4-6
week build if shipped at once. That's how SaaS startups die. The MVP
that earns the right to exist is much smaller and ships in phases:

- **Client portal v1 (~2 weeks):** project status dashboard (current
  phase + milestones + next deliverable), file vault (read-only
  download links), Pathlight scan history scoped to that client. NO
  payments, NO messaging, NO scope-adds. Pure read-only "where is my
  project."
- **Client portal v2 (after v1 has real users):** in-app messaging
  thread between Joshy and the client, scope-add request form (creates
  a draft change-order Joshy approves in `/admin`).
- **Client portal v3:** Stripe billing portal, deposit pay, recurring
  retainer charges, invoice PDF download.

The reason for that ordering: every feature shipped before clients are
using v1 is a feature being guessed at. Once Tyler or future clients
are actually logging in, the right next surface becomes obvious. Right
now nobody is logging in, so the priority order is theoretical.

---

## Revenue framing

The studio (Star Auto, Soil Depot, future $4.5k-$9.5k+ Next.js builds)
is near-term revenue. Pathlight monetization is interesting at scale
but DBJ is pre-scale.

If prioritizing for revenue: Stage 5 -> client portal v1 -> client
portal v2 -> client portal v3 -> (much later) Pathlight customer
accounts. The white-glove portal lifts retention on paid work because
every retainer client who sees a polished portal is a client who
renews and refers. Pathlight billing only matters once attach rate is
proven, which can't happen before "Claim your scan" exists, which
isn't on the near-term roadmap.

---

## Shopping-cart instinct

Joshy mentioned shopping cart, payment, checkout. That instinct is
real but it's a different flow from the portal: it's the FRONT of the
funnel, not the back.

The existing `/pricing/build` page is already a package configurator.
Turning it into a real cart with deposit pay -> discovery booking ->
signed contract -> client portal access is its own initiative,
probably a Phase 2.5 between client portal v1 and v2. It's not part
of the portal itself; it's the on-ramp INTO the portal.

---

## Open questions / follow-ups

- What's the minimum project-status data shape? Probably: phase
  enum (discovery / design / build / review / launch / maintenance),
  current milestone string, next deliverable string, projected ETA.
  Lives in a `client_projects` table separate from `clients`.
- Where do file deliverables live? Vercel Blob makes sense given the
  audio-summary precedent, but per-client access scoping needs a
  signed-URL pattern or a Postgres-gated proxy route.
- Does the client portal need real-time messaging or is async email
  better? Real-time is a much bigger maintenance surface.
- Tyler is the obvious first client to onboard once v1 ships. Confirm
  with him before building specifically for his needs.

---

## Status checkpoint

- April 27, 2026 (morning): strategy agreed. Stage 5 to be implemented
  next when Joshy gives the go-ahead. Client portal v1 queued behind it.
- April 27, 2026 (afternoon): **Stage 5 shipped.** `admin_users` +
  `admin_invitations` tables (migration 012), DB-backed allowlist in
  `lib/auth/users.ts`, invitation acceptance at `/invite/[token]`, and
  the `/admin/users` invite/manage surface.
- April 27, 2026 (evening): **Client portal v1 shipped.** Migration 013
  added `clients`, `client_projects`, `client_files`, and
  `admin_invitations.role`. New `lib/auth/access.ts` resolves access
  from env / admin_users / clients / pending invitations in priority
  order. The `/portal` surface (home + files + scans + account) and the
  `/admin/clients` management surface (invite + per-client detail with
  project + file editing) are live. Invitation email parameterized by
  role; acceptance redirects role-aware. Audit log extended with
  `client.file_download` events via monitoring_events. See
  session-handoff.md for the full file list and manual verification
  checklist.
- Next up: onboard Tyler as the first real client. Capture feedback,
  then plan v2 (in-app messaging + scope-add request form).
- This doc is the canonical strategy reference. Update it as decisions
  change; do not let session-handoff.md drift from it.
