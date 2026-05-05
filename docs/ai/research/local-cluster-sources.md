# Local Cluster: Verified Primary-Source URLs

Reference list for the 18 city pages in the local cluster. These URLs
were gathered during a research pass that pulled in external AI-generated
research (Gemini deep-research, May 5 2026); only the primary-source URLs
verified to be real institutional, government, or municipal sources are
listed here. Secondary blog posts, vendor marketing pages, and SEO blogs
were discarded.

When drafting any city page, the first move is to fetch the relevant
EDC / Chamber / Census source live and cite the actual current data on
the page. **Do not paraphrase claims from Gemini's research prose into
the page; verify the underlying number against the primary source first.**

## Regional and metro-wide

- **Federal Reserve Bank of Dallas**: DFW economic indicators and
  business and financial services research:
  `https://www.dallasfed.org`
- **Dallas Regional Chamber**: annual DFW economic momentum pieces and
  healthcare-impact reports: `https://www.dallaschamber.org`
- **U.S. Bureau of Labor Statistics**: DFW area employment data:
  `https://www.bls.gov`
- **U.S. Census Bureau QuickFacts**: per-city demographic data:
  `https://www.census.gov/quickfacts`

## Per-city primary sources

### Dallas

- City of Dallas Office of Economic Development:
  `https://dallasecodev.org`
- City of Dallas Annual Comprehensive Financial Report:
  `https://dallascityhall.com`

### Plano

- TxEDC Dallas-Irving-Plano page:
  `https://businessintexas.com`

### Frisco

- Frisco EDC quarterly economic-investment reporting (search
  `localprofile.com` for current article)

### McKinney

- City of McKinney FY25 strategic goals + TIRZ project plans:
  `https://mckinneytexas.org`

### Allen

- Allen EDC labor and demographics:
  `https://allenedc.com`
- Allen 2045 Comprehensive Plan:
  `https://cityofallen.org`

### Prosper

- Prosper EDC:
  `https://prosperedc.com`

### Las Colinas / Irving

- Irving Chamber of Commerce HQ density and industry overview:
  `https://irvingchamber.com`
- Las Colinas Association:
  `https://lascolinas.org`

### Richardson

- Richardson Economic Development:
  `https://richardsoneconomicdevelopment.com`
- IASP Telecom Corridor profile (for the IQ tech hub history):
  `https://iasp.ws`

### Addison

- Addison Economic Development quarterly retail reports:
  `https://addisoned.com`
- Town of Addison Comprehensive Plan:
  `https://agendas.addisontx.gov`

### Southlake

- Select Southlake economic-development fast facts:
  `https://selectsouthlake.com`
- U.S. Census Bureau QuickFacts: Southlake city, Texas

### Park Cities (Highland Park / University Park)

- DataUSA PUMA-level demographics

### Coppell

- City of Coppell budget and economic-development pages:
  `https://coppelltx.gov`

### Flower Mound

- DataUSA Flower Mound TX
- Texas Demographics: Flower Mound

### Rockwall County / Rockwall City

- Rockwall EDC 2025 Community Profile:
  `https://rockwalledc.com`

### Royse City

- U.S. Census Bureau QuickFacts: Royse City city, Texas
- Royse City Community Profile:
  `https://roysecitycdc.org`

### Heath

- City of Heath 2025 Comprehensive Plan:
  `https://heathtx.com`

### Forney

- Forney Texas EDC:
  `https://forneytexasedc.org`

## Verification protocol when drafting a city page

1. Fetch the relevant EDC / Chamber URL live; confirm the current data
   point matches what the AI research claimed before quoting it.
2. Use Census QuickFacts for population, median income, and
   demographic baselines. These are the cleanest, most defensible
   citations.
3. Use BLS for employment and industry-mix claims.
4. For any "fastest-growing" or "ranked Nth" claim, find the exact
   ranking source (NCHStats, U.S. Census, the Forbes ranking PDF,
   etc.) and cite the year. Stale rankings get out of date fast.
5. Banned: paraphrasing a third-party blog's interpretation of an
   EDC's data. Always cite the EDC directly.

## What was discarded from the Gemini research

For the record (so we don't relitigate later):

- "Next.js vs WordPress" performance table (1.2s vs 3.8s, Lighthouse
  86 vs 51). Sourced to nandann.com and neodigit.fr, which are SEO
  marketing blogs, not authoritative. We already cite Vodafone (web.dev)
  and Web Almanac for performance claims; use those.
- "$5.3M custom CRM TCO" table. Sourced to Salesboom CRM, a vendor
  selling against build. Biased.
- "30% of Fortune 500 use Contentful," "82% higher CTR for rich
  results," "39% INP improvement." Common SEO claims with no primary
  source.
- The form-field conversion table (Neil Patel, Diamond Group, Zuko).
  Citable as practitioner data only, not peer-reviewed.
- The skeleton JSON-LD with placeholder business name.
- All prose. Em dashes throughout, third-person institutional voice
  ("the firm", "the studio", "the principal-architect"), banned
  phrases ("leverage", "uncompromising," "robust").

## When this file goes stale

This file should be re-verified when the local-cluster build begins.
EDC data refreshes annually. Treat any number older than eighteen
months as suspect.
