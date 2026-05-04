# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-05-03-to-2026-05-04.md`](history/2026-05-03-to-2026-05-04.md),
which covers the May 3 Inngest-cron + Pathlight reliability arc and the
May 4 Canopy showcase swap.

## Current state (May 4, 2026)

`git log -1` is authoritative for the actual HEAD; this handoff was written
on top of `1486b4a` (`docs: fill bd2d6cd hash for CSP fix in current-state`).
Working tree clean, origin/main in sync.

The two threads that landed this session:

- **Canopy showcase recording + section screenshots** (`182821f`). The `/work`
  Canopy card and the `/work/canopy` detail hero now play a 36-second
  muted/loop screen recording (`canopy-showcase.mp4` ~2.7 MB,
  `canopy-showcase.webm` ~2.6 MB, `canopy-showcase-poster.jpg` ~118 KB,
  poster doubles as the OG/JsonLd `image` since `canopy-dashboard.webp` was
  deleted). Six matched 1800x1170 WebP fixture screenshots dropped into
  `public/images/case-studies/canopy/` and wired to the Analytics &
  Performance, Pipeline & Relationships, Automation, Operations & Health,
  Pathlight Integration, and Architecture & Ownership sections via a new
  optional `image` / `imageAlt` field on `ProjectSection`. Layout renders
  body -> proof -> "Open in showcase ->" with a `max-w-5xl`
  accent-shadowed container at the screenshot's native aspect ratio.
- **GA + CSP follow-on** (`bd2d6cd`, then doc-fill `1486b4a`, with
  earlier `04a2af0` work-page bottom-CTA + sitemap cleanup). Joshua's
  parallel track. Not Claude's work; flagged here only so the next session
  knows the area touched recently.

## Verification gates passed (this session)

- `npx tsc --noEmit` clean
- `npm run lint` clean
- 0 em dashes added in changed source files
- All six section image paths and the showcase video paths confirmed
  present on disk before commit

## Next recommended tasks

1. Spot-check `/work` and `/work/canopy` on the live Vercel deploy once
   it finishes building. Card video autoplays muted, hero video autoplays
   muted, all six section screenshots render in order, "Open in showcase ->"
   link still resolves under each. If anything looks off on a real device
   (autoplay restrictions, layout shift), tighten there rather than
   guessing locally.
2. Decide whether the older Canopy section narratives that lack a
   screenshot ("The Problem," "What You Get," "What Comes Next") want a
   hand-picked image too, or stay text-only as deliberate breathers.
3. Verify GA loads with the new CSP (`bd2d6cd`). The
   feedback memory `feedback_ga_verification_real_browser.md` is the
   playbook: check `transferSize > 0` on `googletagmanager.com/gtag/js`
   in a real browser, not the Tag Assistant green check.
4. From the prior arc: outstanding Inngest cron first-fire verifications
   (search-console-daily 06:00 UTC and infrastructure-check-daily 08:00
   UTC). Search Console may 403 on first run if the GSC service account
   lacks property access; that is a Google Cloud Console permissions
   grant, not a code change.

## Pointers

- Last archived session detail: `docs/ai/history/2026-05-03-to-2026-05-04.md`
- Live deployment + working state per phase: `docs/ai/current-state.md`
- Architectural and business decisions: `docs/ai/decision-log.md`
- Don't-touch invariants: `docs/ai/do-not-break.md`
- Outstanding work: `docs/ai/backlog.md`
