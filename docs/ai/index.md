# AI Context Index

Before large changes, read these files:

1. **CLAUDE.md** (repo root) -- permanent operating instructions, key file locations, problem-solving rules
2. **docs/ai/product-brief.md** -- what DBJ Technologies and Pathlight are
3. **docs/ai/business-strategy.md** -- positioning, target market, sales direction, brand voice
4. **docs/ai/current-state.md** -- what currently works, what's broken, what's deployed
5. **docs/ai/decision-log.md** -- major decisions already made (do not relitigate)
6. **docs/ai/do-not-break.md** -- fragile or critical areas that require extra caution
7. **docs/ai/session-handoff.md** -- compact snapshot of the last session: themes shipped, durable lessons, unresolved issues, next tasks, current git status
8. **docs/ai/backlog.md** -- prioritized task list

Older session detail (full diagnostic trails) lives under `docs/ai/history/`. See `docs/ai/history/index.md`. These files are NOT auto-loaded; read them only when a current task needs the historical detail.

## Scoped Rules (loaded automatically by Claude Code when relevant)

- **.claude/rules/pathlight.md** -- Pathlight pipeline, revenue, vertical database rules
- **.claude/rules/frontend.md** -- copy, animation, styling, route group rules
- **.claude/rules/deployment.md** -- git, Vercel, env vars, DNS, pre-commit checklist

## How to Use This System

**Start of session:** Read CLAUDE.md + current-state.md + session-handoff.md at minimum.

**Before major changes:** Also read decision-log.md and do-not-break.md.

**End of session:** Update session-handoff.md with what changed, files edited, decisions made, bugs found, and next recommended task. When the live handoff crosses ~30 KB (the `dbjcontext` audit threshold fires), archive it to `docs/ai/history/YYYY-MM-DD.md`, add an entry to `docs/ai/history/index.md`, and reset session-handoff.md to a compact summary that points back to the archive.

**After durable decisions:** Add entries to decision-log.md so future sessions don't relitigate settled questions.

## Portal Chat Context Pack (`dbjcontext`)

The `dbjcontext` zsh alias copies a curated context pack to the macOS clipboard for pasting into a fresh Claude.ai portal chat (which has none of these files auto-loaded). The alias calls `scripts/dbj-context.sh`.

**Pack contents (in order):** CLAUDE.md, product-brief.md, business-strategy.md, .claude/rules/{frontend,pathlight,deployment}.md, do-not-break.md, current-state.md, decision-log.md, session-handoff.md, backlog.md.

**Audit warnings printed after copy:**
- Missing files in the file list
- session-handoff.md exceeding 30 KB (archive trigger)
- Em dashes anywhere in the pack (CLAUDE.md forbids them)
- Legacy gmail address beyond the known structural baseline (the deployment.md pre-commit grep)

**Maintenance triggers:**
- When session-handoff.md crosses 30 KB, archive its contents to `docs/ai/history/YYYY-MM-DD.md`, add an entry to `docs/ai/history/index.md`, and replace the live handoff with a compact summary.
- When the legacy-email or em-dash baseline changes, update the constants at the top of `scripts/dbj-context.sh`.
- When a new long-lived doc is added under `docs/ai/` or `.claude/rules/`, add it to the FILES array in the script.
- `docs/ai/history/` is intentionally excluded from the pack. If a portal-chat task needs historical detail, paste the relevant dated file separately.
