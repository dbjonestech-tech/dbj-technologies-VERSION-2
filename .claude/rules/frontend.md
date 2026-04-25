# Frontend Rules

## Copy and Content
- Never use em dashes in any copy. Use commas, periods, or restructured sentences instead.
- Use first-person "I" language, not "we." This is a solo principal architect studio.
- Do NOT use generic agency language. Copy should sell business outcomes, not technical credentials.
- Site content lives in lib/siteContent.ts and lib/constants.ts. Check there first before hardcoding strings.
- Work page data lives in lib/work-data.ts.

## Performance
- Never optimize a working perfect Lighthouse score. Prior attempt dropped Performance from 100 to 81.
- SSR is wrong for position:fixed overlay components. HeroCinema's static SSR import caused worse CLS than dynamic(ssr:false).
- Always question whether SSR is appropriate for animated above-the-fold overlays.
- Use Next.js Image component with appropriate priority, quality, and sizes props. Small width/height props cause blurry images on retina displays.

## Animation
- Framer Motion entrance animations are scroll-triggered via viewport/whileInView. Chrome MCP and bots may not trigger them.
- All animations should respect prefers-reduced-motion. Use framer-motion's useReducedMotion() hook, not raw window.matchMedia (which causes SSR hydration mismatches).
- The HeroCinema phase system is fragile. Do not touch without explicit permission.

## Route Groups
- (marketing) handles the main site pages (about, work, services, pricing, etc.)
- (grade) handles Pathlight (scan form, report page, chat)
- Import boundaries are enforced. Do not cross-import between route groups.
- Each route group has its own layout.tsx.

## Styling
- Tailwind CSS 3.4 with custom CSS variables in globals.css.
- CSS variables defined in :root: --bg-primary (#FAFAFA), --bg-secondary (#F1F5F9), --accent-blue (#3b82f6), --accent-cyan (#0891b2), --accent-violet (#7c3aed). Dark canvas color #06060a is hardcoded across components and globals.css (no --bg-primary-dark variable).
- Two cyans coexist: brand cyan #1AD4EA is the DBJ logo mark fill (Footer.tsx, ScanStatus.tsx). Tailwind's accent-cyan / --accent-cyan #0891b2 is the gradient/accent color used in buttons, dividers, hover glows.
- Print styles live in @media print block in globals.css. Use print-hidden, print-expand, print-grid-expand classes.

## Web Fetch Caveat
- Fetching dbjtechnologies.com inner pages may return content inconsistent with browser-rendered state due to route group layouts, client-side hydration, and CDN caching.
- Never treat fetch results as confirmed site state without Josh's explicit verification in an incognito browser.
