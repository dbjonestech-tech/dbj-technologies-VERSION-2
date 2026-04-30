# Session Handoff

Live snapshot of what the next session needs. Older sessions live under
`docs/ai/history/` (see `history/index.md`). The most recent archive is
[`history/2026-04-29-to-2026-04-30.md`](history/2026-04-29-to-2026-04-30.md),
which holds the verbatim record of every session entry that was below this
header before the April 30 reset.

## Current state (end of April 30, 2026)

### Most recent commits (top of `origin main`)

- `25a71bd` docs: update session-handoff with f68c756 commit hash
- `f68c756` feat(contact + services): surface email/phone on contact, fix services capability stack on mobile
- `6b1e0a3` fix(pricing): align CTAs and feature dividers across the three tier cards
- `0c4cbaa` revert: pathlight logo changes
- `72be7f0` fix(work/canopy): video occupies hero, no misleading 'live' caption, more copy sanitization

Working tree clean. All changes pushed to `origin main`. Vercel auto-deploys from main.

### What landed in the last code sprint (April 30)

- **Contact page**: Email + Phone cards added to the silver sidebar above Location and Response Time. Email is `mailto:joshua@dbjtechnologies.com`. Phone displayed as `214-DBJ-TECH` (lettered for `\d{3}-\d{3}-\d{4}` scrape resistance), `tel:` link uses decoded `+12143258324`. Constants live at `SITE.phoneDisplay` / `SITE.phoneTel` in `lib/constants.ts`. This re-introduces a publicly displayed email after the silver scale-back removed it earlier in the day; Joshua's reasoning was that legitimacy and accessibility for warm leads outweigh the spam-curb logic on a low-volume marketing site.
- **Services page**: CapabilityStack mobile fix. Row alignment `items-center` -> `items-start lg:items-center`, tagline `truncate` -> `line-clamp-2 lg:truncate`, trailing `01`-`06` number badge hidden below `sm:`, outer card `p-6 lg:p-8` -> `p-4 sm:p-6 lg:p-8`, per-row padding tightened on mobile. Process / Pricing render fine at the same h1 clamp because their right-column shapes differ; the issue was specific to the CapabilityStack with 6 long service titles wrapping under `items-center`.
- **Pricing page**: CTA + feature-divider horizontal alignment via `lg:min-h-[5rem]` on tier descriptions and `lg:min-h-[7rem]` on price blocks. Professional card retains `lg:-mt-4 lg:mb-4` elevation by design (recommended-tier visual anchor); Joshua confirmed this is intentional, not drift.
- **Work / Canopy detail**: video now occupies the hero, "live" caption removed (Star Auto Canopy install is auth-walled, so "live" was misleading). Project CTA row wraps on narrow viewports.
- **Pathlight**: logo revert reapplied.

### Open questions Joshua needs to resolve

1. **NAP consistency (Dallas vs Royse City).** Site brands as "Dallas, TX" (`SITE.address`, contact Location card, CLAUDE.md identity). GBP shows physical address `5073 Co Rd 2656, Royse City, TX 75189`, service area `Hunt County, Texas`, phone `(214) 325-8324`, 5.0 / 2 reviews, profile strength "Looks good!". Google's local algorithm treats the two as different NAP strings, which dilutes local-pack signal. Two clean fixes: (a) hide GBP physical address and broaden service area to "Dallas-Fort Worth Metroplex" (lower-effort, keeps home address private), or (b) widen `SITE.address` on the site to "Greater Dallas / DFW Metroplex". Resolve before pursuing local SEO work.
2. **Pathlight intermittent banner.** "Some analysis steps could not be completed" still triggers occasionally. Traced April 27 to s6 finalize on non-transient Anthropic responses (schema validation failures after one retry, or benchmark research timeouts on cold cache). No mitigation shipped yet.

### Next recommended task

After Vercel propagation, incognito-load `/contact` and `/services` on Joshua's phone. On `/contact`, confirm Email + Phone cards render above Location and that tapping each fires the `mailto:` and `tel:` handlers. On `/services`, confirm the right-column "The Stack" capability card now reads cleanly with titles wrapping to 2 lines. After visual confirmation, decide on the Dallas-vs-Royse-City NAP question above.

### Durable lessons from this sprint (worth keeping)

- **Same h1 clamp can render fine on Pricing / Process and broken on Services.** The diagnostic is the right-column shape, not the h1. Process's PhaseLadder uses `items-start` with shorter copy and no trailing badge. Services's CapabilityStack used `items-center` with 6 long service titles and an `01`-`06` trailing badge. Long titles wrapping under `items-center` against a fixed-position trailing badge is the "renders poorly on mobile" signature.
- **NAP consistency is upstream of any local SEO work.** Mismatched city strings (Dallas vs Royse City) dilute local-pack signal regardless of how much on-page schema or keyword work ships later. Resolve the address question first.
- **Public HTML scrape-resistance is one channel only.** Lettered phone (`214-DBJ-TECH`) on the site, numeric phone on validated channels (GBP, Schema.org JSON-LD if added, email signature). Both reconcile to the same E.164 (`+12143258324`) so Google sees one number for NAP.
- **Pricing-tier CTA misalignment is solved with `lg:min-h-[5rem]` + `lg:min-h-[7rem]` row floors.** The Professional `lg:-mt-4` elevation is a deliberate UI pattern (recommended-tier anchor), not a bug.
