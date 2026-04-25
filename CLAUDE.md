# DBJ Technologies / Pathlight -- Project Instructions

## Project Identity

DBJ Technologies is a solo-principal-architect digital engineering studio based in Dallas, TX.
Pathlight is the AI-powered website intelligence platform that scans any business website and produces a scored report with revenue impact estimates, design analysis, and prioritized fixes.
DBJ builds what Pathlight diagnoses. Pathlight generates warm leads at near-zero marginal cost.

Founder: Joshua Jones (Joshy). joshua@dbjtechnologies.com.

## Tech Stack

- Next.js 16, TypeScript, Tailwind CSS 3.4, Framer Motion
- Deployed on Vercel via GitHub repo `dbj-technologies-VERSION-2` (remote: `origin main`)
- Pathlight pipeline: Inngest orchestration, Claude Sonnet 4.6 (vision/remediation/revenue), Claude Haiku 4.5 (chatbot)
- Browserless headless Chrome for screenshots + Lighthouse
- PageSpeed Insights API, Neon PostgreSQL, Resend email, Upstash Redis, Cloudflare Turnstile

## Non-Negotiables

- Do NOT present DBJ as a commodity web dev shop. It is a principal-architect studio.
- Do NOT expose Pathlight internals publicly (model names, pipeline stages, matching algorithms, cost per scan, vertical database).
- Do NOT use em dashes in any copy. Ever.
- Do NOT optimize a working perfect Lighthouse score. If it's perfect, leave it alone.
- Do NOT rewrite working sections unless explicitly asked.
- Before major edits, read docs/ai/current-state.md and docs/ai/decision-log.md.
- Before committing, show changed files and explain why each changed.
- All implementation prompts end with: "Report what you changed. Do NOT commit yet."
- Commits use descriptive messages and push to `origin main` (NOT new-origin).

## Problem-Solving Rules

1. Obvious fix first
2. Lateral alternative
3. What could go wrong
4. Blast radius estimate upfront
5. Front-load trade-offs
6. Never iterate more than twice without forcing a diagnostic pause
7. Always ask "what changed recently?" before debugging -- start with `git diff`, not theory
8. Diagnostic-first prevents wasted commits

## Common Commands

```
npm run dev
npm run build
npm run lint
npx tsc --noEmit
git add -A && git commit -m "descriptive message" && git push origin main
```

## Key File Locations

- Site content/copy: `lib/siteContent.ts`, `lib/constants.ts`, `lib/work-data.ts`
- Pathlight pipeline: `lib/inngest/functions.ts`
- Claude API calls: `lib/services/claude-analysis.ts`
- Vertical database: `lib/data/verticals.ts` (206 entries)
- Vertical lookup: `lib/services/vertical-lookup.ts`
- Chatbot prompt: `lib/prompts/pathlight-chat.ts`
- Scoring: `lib/services/scoring.ts`
- Screenshots: `lib/services/browserless.ts`
- PSI: `lib/services/pagespeed.ts`
- DB queries: `lib/db/queries.ts`
- Types: `lib/types/scan.ts`
- Report page: `app/(grade)/pathlight/[scanId]/ScanStatus.tsx`
- About page: `app/(marketing)/about/AboutContent.tsx`
- Work page: `app/(marketing)/work/WorkContent.tsx`

## Memory System

Before large changes, read these docs:
1. docs/ai/current-state.md
2. docs/ai/decision-log.md
3. docs/ai/do-not-break.md
4. docs/ai/session-handoff.md
5. docs/ai/backlog.md
