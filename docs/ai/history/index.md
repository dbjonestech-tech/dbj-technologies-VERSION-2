# Session History Index

Archived session-handoff snapshots, newest first. The live
`docs/ai/session-handoff.md` is intentionally compact and only covers the
most recent session; full diagnostic trails for prior sessions live here.

These files are NOT included in the `dbjcontext` portal pack by default.
Pull them in only when a current task requires the historical detail
(grep across this directory or read the dated file directly).

## Archive

- [`2026-04-27.md`](2026-04-27.md) - April 27 omnibus: ElevenLabs cost gap closure (hard cap + hourly cron), Voice Report Delivery (Feature #5, ElevenLabs Adam), PDF Report Download (Feature #10, Browserless /pdf), Cost monitoring + alerting (Feature #12, api_usage_events table + /internal/cost dashboard), Resend bounce/complaint webhook (Feature #11), Pathlight lockdown of public surfaces, hvac-contractor Pass 1 + blueprint, restaurant Pass 1 + blueprint, luxury-builders Pass 1 + blueprint, ChatGPT external-audit triage (SEO/a11y/canonical fixes). Live handoff archived when it crossed 101 KB.
- [`2026-04-25.md`](2026-04-25.md) - 26-item mega session: homepage hardening, About hydration fixes, repo-native AI memory system, Pathlight landing overhaul, founder photo chain, homepage strategic overhaul, brand-voice sweep, pricing detail pages refactor, package configurator at `/pricing/build`, twelve-pitfall Pathlight sweep, DOM commit-phase crash fix, Anthropic prompt caching, portal-chat context pack rebuild.

## When to archive

When `docs/ai/session-handoff.md` crosses ~30 KB (the `dbjcontext` audit
threshold), copy its current contents to a new dated file in this
directory, replace the live handoff with a compact summary that points
back here, and add an entry above.

Naming: `YYYY-MM-DD.md` for single-day sessions, `YYYY-MM-DD-to-YYYY-MM-DD.md`
for multi-day arcs that share a coherent theme.
