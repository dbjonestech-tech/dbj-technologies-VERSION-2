# Product Brief

## DBJ Technologies

DBJ Technologies is a boutique digital engineering studio founded by Joshua Jones, based in Dallas, TX. It operates as a one-person shop delivering bespoke Next.js sites and digital systems for small-to-mid-sized businesses. Positioned as senior-architect-level consulting, not a commodity dev shop. Clients get one experienced architect who builds the system right the first time, with full source code ownership and no lock-in.

Website: dbjtechnologies.com (~24 unique URLs, 18 page.tsx files plus dynamic [slug] routes; Next.js 16 + Tailwind CSS 3.4, Lighthouse 400/400 baseline)

Pricing: Starter $4,500 (3-4 weeks), Professional $9,500 (5-8 weeks), Enterprise custom (8-16 weeks, scoped during paid discovery). Maintenance plans at $299/month. Hourly consulting at $175/hour.

Contact: joshua@dbjtechnologies.com (Google Workspace, SPF/DKIM/DMARC authenticated)

## Pathlight

Pathlight is an AI-powered website audit and lead generation SaaS built under DBJ. It is the autonomous sales weapon that generates warm leads at near-zero marginal cost.

What it does: Scans a business website, captures real screenshots at desktop and mobile viewpoints, runs Lighthouse/PSI performance analysis, scores sites across four pillars (Design, Performance, Positioning, Search Visibility), generates AI-powered remediation recommendations with revenue impact modeling, and delivers results via email with a Calendly CTA. Includes an "Ask Pathlight" AI chat agent for prospects to interrogate their results.

Cost per scan: approximately $0.15-0.25 (Anthropic API + Browserless)

Pipeline (actual step.run order in lib/inngest/functions.ts): URL submission -> Cloudflare Turnstile -> validate-url -> capture-screenshots (Browserless, desktop + mobile) -> mark-analyzing -> run-audit (PSI/Lighthouse with retry) -> ai-vision-audit (Claude Sonnet 4.6) -> ai-remediation -> research-benchmark (curated vertical database 206 entries first; web research fallback for uncovered) -> ai-revenue-impact -> calculate-score -> finalize -> send-report-email -> send-followup-1 (48h) -> send-followup-2 (5d) -> send-breakup (8d). Ask Pathlight chat is on the report page (Claude Haiku 4.5).

Key differentiator: Unlike asking a chatbot to audit a website, Pathlight opens a real browser, captures real screenshots, and analyzes what visitors actually see. The revenue number is computed from researched industry benchmarks, not hallucinated.

## Star Auto Service

Completed client project for a mechanic shop in Richardson, TX (client: Miguel Ibarra). Live at thestarautoservice.com. Next.js 16 + Tailwind 4, Lighthouse Performance 100. First DBJ mechanic-shop template and portfolio piece. DNS on Cloudflare, deployed on Vercel.

## Soil Depot

Tyler's business website. Josh built the site in WordPress at Tyler's request. Live at soil-depot.com. Showcased on the /work page as a case study but with limited technical detail since it is WordPress (not Next.js). Tyler is the primary referral source for new clients.
