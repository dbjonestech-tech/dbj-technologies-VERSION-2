# Do Not Break

## Lighthouse Scores
The site scores 400/400 on desktop. Do NOT attempt to "harden" or "optimize" a perfect score. A prior attempt to improve a 400/400 dropped Performance to 81 and required an emergency revert. If it's perfect, leave it alone.

## HeroCinema Animation System
The homepage animation uses a phase-based system (blueprint -> build -> reveal -> complete) with SVG logo animation, lightning crackle effects, and scroll hijacking. This is fragile. Do NOT touch HeroCinema phases, timing, or the animation cascade without explicit permission. The ssr:false dynamic import is intentional and correct for this component.

## Pathlight Scan Pipeline Order
The Inngest pipeline steps execute in a specific order with data dependencies. Do NOT change the step execution order. The flow is: screenshots -> PSI/Lighthouse -> vision audit -> benchmark lookup/research -> revenue estimation -> remediation -> score calculation -> report generation -> email delivery.

## Pathlight Report Page (ScanStatus.tsx)
This is the most complex component in the codebase. Changes here affect the score hero, pillar breakdown, Lighthouse section, screenshots, Top 3 fixes accordion, revenue section, Ask Pathlight chat, print stylesheet, and the scan loading state. Make surgical changes only. Read the full component before editing.

## Contact Form -> Resend Flow
The contact form sends via Resend (not Gmail SMTP). The env vars CONTACT_EMAIL and CONTACT_FROM_EMAIL control routing. Do NOT reintroduce Gmail SMTP. Do NOT change the Resend from-domain without verifying domain authentication.

## Vertical Database Matching
lib/services/vertical-lookup.ts has three matching layers (exact name, alias table, fuzzy scoring) that were tested with 200+ test cases across 5 diagnostic suites. Do NOT refactor the matching algorithm without re-running all test suites. Do NOT modify lib/data/verticals.ts without understanding the downstream impact on revenue estimates.

## Email Authentication
joshua@dbjtechnologies.com has SPF, DKIM, and DMARC configured in Cloudflare DNS. Do NOT modify MX, SPF TXT, DKIM TXT (_domainkey), or DMARC TXT records without understanding the authentication chain.

## Star Auto Service DNS
thestarautoservice.com DNS is on Cloudflare with CNAME records pointing to Vercel. Do NOT change DNS records. Do NOT list this as pending -- it is complete.

## Pathlight Internals on Public Pages
Vendor names, model versions, pipeline architecture, matching algorithms, cost per scan, and vertical database contents must NOT appear on any public-facing page. The Pathlight case study on /work uses high-level capability categories only.

## Print Stylesheet
The @media print block in globals.css has carefully scoped rules including .pathlight-report wrapper, print-expand, print-grid-expand, and print-hidden classes. Changes here affect PDF report output. Test print after any CSS changes.

## Route Groups
(marketing) and (grade) are isolated route groups with separate layouts. Import boundaries are enforced. Do NOT import (marketing) components into (grade) or vice versa.
