# DBJ Technologies / Pathlight -- Agent Instructions

## Project Identity

DBJ Technologies is a solo-principal-architect digital engineering studio in Dallas, TX.
Pathlight is the diagnostic engine that finds where websites lose leads, trust, and revenue.
DBJ is the implementation arm that fixes what Pathlight finds.

## Core Positioning

The public site sells business outcomes, not technical complexity.
The primary business promise: "We find where your website and digital systems are losing leads, trust, and revenue, then we fix the highest-impact issues first."

## Pathlight Rules

- Pathlight is front and center as the lead generation engine.
- Present Pathlight by outcomes, not internal machinery.
- Do NOT reveal: screenshot pipeline, model orchestration, prompt architecture, scoring formulas, matching algorithms, vertical database contents, cost per scan, or agent implementation details.
- Public language focuses on: trust, leads, conversion, revenue leakage, fix priorities.

## Work Rules

- Before editing, inspect relevant files and summarize the plan.
- Prefer minimal, surgical changes.
- Do not rewrite working sections unless explicitly asked.
- Do not change deployment, auth, environment variables, or API behavior without permission.
- Before suggesting a commit, inspect git diff.
- Run build/lint/tests when available.

## Review Rules

When reviewing another agent's work, check for:
- Unrelated changes or scope creep
- Broken behavior
- Generic agency language (should be principal-architect positioning)
- Exposed Pathlight internals
- Missing error states
- Deployment risks
- Copy that is too technical for business buyers

## Common Commands

```
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```
