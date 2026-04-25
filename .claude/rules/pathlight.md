# Pathlight Rules

## Public Presentation
- Pathlight should be described publicly by outcomes, not internal machinery.
- Do NOT reveal: screenshot pipeline, model orchestration, prompt architecture, scoring formulas, matching algorithms, vertical database contents, cost per scan, API model names, or agent implementation details.
- Public language focuses on: trust, leads, conversion, revenue leakage, fix priorities.
- When editing Pathlight pages, preserve the scan CTA and lead-generation flow.

## Pipeline Architecture
- All Claude API calls MUST use temperature 0 for deterministic output.
- estimatedMonthlyLoss is computed server-side from assumption fields. Never let Claude generate the headline revenue number directly.
- The curated vertical database (lib/data/verticals.ts) is the Tier 1 lookup. High/medium confidence entries skip the API benchmark call entirely.
- The vertical matcher has three layers: exact name -> alias table -> fuzzy scoring with synonym expansion. All three must work together.
- Retry logic wraps both Anthropic API calls (callWithRetry) and PSI calls. Do not remove or weaken retry behavior.

## Revenue Estimates
- Revenue prompt uses concrete industry reference tables, not freeform "estimate based on your knowledge."
- Conversion rate defaults to 2% for local businesses. Conversion improvement defaults to 0.20 (20%).
- B2B deal values below $500 trigger a warning and floor clamp.
- The chatbot must acknowledge methodology limitations honestly when challenged. It must never defend obviously wrong numbers.

## Data Persistence
- All scan data persists to Postgres (scans, scan_results, email_events, chat_sessions tables).
- industry_benchmark JSONB column stores researched benchmark data.
- lighthouse_data JSONB column stores raw Lighthouse category scores.
- ai_analysis JSONB column stores vision audit, remediation, revenue impact results.

## Testing Scans
- After any pipeline change, re-scan at least one site and verify: score, revenue estimate, source attribution, chatbot responses.
- Compare results across two scans of the same site to verify consistency.
- For covered verticals (51 high/medium), revenue should be identical across scans.
