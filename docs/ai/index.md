# AI Context Index

Before large changes, read these files:

1. **CLAUDE.md** (repo root) -- permanent operating instructions, key file locations, problem-solving rules
2. **docs/ai/product-brief.md** -- what DBJ Technologies and Pathlight are
3. **docs/ai/business-strategy.md** -- positioning, target market, sales direction, brand voice
4. **docs/ai/current-state.md** -- what currently works, what's broken, what's deployed
5. **docs/ai/decision-log.md** -- major decisions already made (do not relitigate)
6. **docs/ai/do-not-break.md** -- fragile or critical areas that require extra caution
7. **docs/ai/session-handoff.md** -- where the last session left off, what's in progress
8. **docs/ai/backlog.md** -- prioritized task list

## Scoped Rules (loaded automatically by Claude Code when relevant)

- **.claude/rules/pathlight.md** -- Pathlight pipeline, revenue, vertical database rules
- **.claude/rules/frontend.md** -- copy, animation, styling, route group rules
- **.claude/rules/deployment.md** -- git, Vercel, env vars, DNS, pre-commit checklist

## How to Use This System

**Start of session:** Read CLAUDE.md + current-state.md + session-handoff.md at minimum.

**Before major changes:** Also read decision-log.md and do-not-break.md.

**End of session:** Update session-handoff.md with what changed, files edited, decisions made, bugs found, and next recommended task.

**After durable decisions:** Add entries to decision-log.md so future sessions don't relitigate settled questions.
