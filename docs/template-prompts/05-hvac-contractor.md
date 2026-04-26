# CC Prompt · 05 · HVAC Contractor Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 5 of 8. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, white teal-coral, soft-blush plum, rich-black copper, warm-charcoal forest green, espresso burgundy). This one owns the STEEL-BLUE INDUSTRIAL DARK + VIVID ORANGE EMERGENCY lane. Bold, urgent, dependable.

## Task

Build a high-fidelity HVAC contractor landing page mockup. The reader's air conditioning died at 2pm on an August Saturday in Texas, the house is 92 degrees, and they have three tabs open. The site has to communicate within 8 seconds: licensed, fast, fair, picks up the phone. It must look like a $15K custom build, not a Thumbtack listing.

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✓ ✦ ☎ ⚡ ❄ ★). No SVG paths. The phone icon ☎ is the most important glyph in this template · it appears in the nav, hero, and emergency strip.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'tnum'` on phone numbers, response time stats, and pricing rows.

### File

Create `public/templates/hvac-contractor.html`.

### Identity

- Vertical: Residential and commercial HVAC, $3M+ annual revenue
- Fictional company: IRONCLAD AIR
- Location: Arlington, TX (central DFW)
- Voice: First person plural ("we"). Direct, blunt, no-fluff. Confidence without bravado.

### Design system (lock these tokens)

```css
:root {
  --steel: #1B2838;          /* primary dark bg */
  --steel-deep: #151F2E;     /* footer band */
  --steel-soft: #233246;     /* card on dark */
  --white: #FFFFFF;
  --bone: #F8FAFC;           /* alternating light bg */
  --mist: #E2E8F0;           /* subtle divider on light */
  --orange: #F97316;         /* primary accent · urgency */
  --orange-deep: #EA580C;    /* hover */
  --orange-pale: rgba(249,115,22,0.12);
  --ink: #1E293B;            /* heading on light */
  --slate: #475569;          /* body on light */
  --slate-light: #64748B;    /* meta */
  --gray-on-dark: #CBD5E1;
  --gray-dim: #94A3B8;
  --hairline-light: rgba(30,41,59,0.10);
  --hairline-dark: rgba(255,255,255,0.08);
  --shadow-soft: 0 2px 14px rgba(30,41,59,0.08);
  --shadow-lift: 0 12px 30px rgba(30,41,59,0.18);
}
```

- Heading font: **Barlow Condensed** weights 600/700/800. The condensed compression is the visual signature · do not soften it.
- Body font: **Source Sans 3** weights 400/600.
- Type scale: `--fs-display: clamp(2.4rem, 5vw, 4rem);` `--fs-h2: clamp(1.85rem, 3vw, 2.6rem);` `--fs-h3: 1.3rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.78rem; letter-spacing: 0.18em;`. Headlines should be UPPERCASE almost everywhere · that's the industrial register.
- Body line-height 1.7. Heading line-height 1.05.
- Buttons: orange solid, white text, **4px** radius (barely rounded · industrial precision), padding `1rem 1.85rem`, uppercase, letter-spacing 0.06em, font-weight 700. Hover: orange-deep, translateY(-1px), `--shadow-lift`. Ghost (used on dark): 1px white border, white text, transparent bg. White-bg variant on the dark CTA section: white solid bg, ink text.
- Cards on light: white bg, **6px** radius, `--shadow-soft`, 3px solid orange top accent bar (this is the template's signature card device). On dark: `--steel-soft` bg, 1px `--hairline-dark` border, no top accent.
- Section padding: `clamp(4rem, 7vw, 6rem) clamp(1.25rem, 5vw, 3rem)`.

### Sections (in order)

1. **Sticky nav.** `--steel` bg, hairline-dark bottom. Wordmark "IRONCLAD AIR" in Barlow Condensed 700 white, with a 3px-tall × 24px-wide orange bar to the LEFT of the wordmark. Nav links Source Sans 3 600 white/gray-on-dark, hover white. Right side: orange solid CTA "☎ (817) 555-0193" · phone icon glyph in white, number in tabular figures. Phone is visible in nav at all 100% of the time, no exceptions.

2. **Hero.** Full viewport min-height 100svh. `--steel` background overlaid with a CSS-only blueprint dot grid: `background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 22px 22px;`. ALSO add a low-opacity image layer `linear-gradient(rgba(27,40,56,0.92), rgba(27,40,56,0.92)), url(https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80)` cover/center, `filter: saturate(0.4)` on the underlying layer (apply on a background `<div>` not the section). Content LEFT-aligned, max-width 720px. Eyebrow orange Barlow Condensed 600 letterspaced "24/7 EMERGENCY HVAC SERVICE · DFW METROPLEX". Headline Barlow Condensed 700 white uppercase: "YOUR AC BROKE. WE'RE ALREADY ON THE WAY." Sub Source Sans 3 400 `--gray-on-dark` line-height 1.75 max-width 580px: "Licensed, bonded, insured. Same-day service across Dallas-Fort Worth. We show up on time, explain the problem in plain English, and fix it right the first time. No surprises on the invoice." Two CTAs: orange solid "Schedule Service" + ghost "☎ (817) 555-0193". Below: a horizontal trust row in Source Sans 3 white small, separated by orange `·` glyphs: `Licensed & Insured · BBB A+ Rated · 2,500+ 5★ Reviews · Same-Day Available`.

3. **Emergency strip (signature element).** A FULL-WIDTH bright orange band, 80px tall on desktop, containing one centered line in Barlow Condensed 700 white uppercase: `AC EMERGENCY?  WE ANSWER 24/7, INCLUDING WEEKENDS AND HOLIDAYS.  AVERAGE RESPONSE: 90 MINUTES.` Use Unicode separators (small white circles) between the three clauses. Add a thin orange-deep 2px bottom border. This strip is the loudest design element in the entire portfolio · no other template has anything like it. Mobile: stack the three clauses vertically, keep all text white-on-orange.

4. **Services grid.** White bg. Eyebrow orange "WHAT WE DO". H2 Barlow Condensed 700 ink uppercase "RESIDENTIAL AND COMMERCIAL HVAC SERVICES." A 3x2 grid of six cards (2 cols at tablet, 1 at mobile). Each card: white bg, 6px radius, `--shadow-soft`, padding 1.5rem 1.75rem, 3px orange top accent bar. Top of card: a small Unicode glyph (❄ for cooling, 🔥 for heat, ⚡ for emergency, etc.) in `--orange` 1.6rem. Title in Barlow Condensed 700 1.2rem uppercase ink. Body in Source Sans 3 slate. Bottom of card: a small "Learn More →" link in Barlow Condensed 600 orange uppercase letterspaced. Hover: card lifts with `--shadow-lift`. Six services: AC Repair, AC Installation, Heating Repair, Maintenance Plans, Commercial HVAC, Indoor Air Quality (use the copy from the original brief, polished to match the in-your-face voice).

5. **Why Ironclad.** `--bone` bg. Eyebrow orange "WHY IRONCLAD". H2 Barlow Condensed 700 ink uppercase "WHAT SETS US APART FROM EVERY OTHER HVAC COMPANY." Single-column rhythm of four feature blocks (NOT a grid). Each block: a 4px solid orange left bar (full block height), padding-left 1.5rem, Barlow Condensed 700 1.4rem ink uppercase title with a leading orange ✓ glyph, body in Source Sans 3 slate line-height 1.75. 1px hairline-light divider between blocks. Use the copy from the original brief: Flat-Rate Pricing, Background-Checked Technicians, We Don't Upsell, Texas Heat Specialists.

6. **Service area (signature element · DFW city grid).** White bg. Eyebrow orange "SERVICE AREA". H2 Barlow Condensed 700 ink uppercase "SERVING THE ENTIRE DFW METROPLEX." Subtext Source Sans 3 slate max-width 600px: "From Denton to Waxahachie, McKinney to Weatherford. One call, one truck, same-day service." Below the subtext, a 4-column (2 at mobile) grid of city pills. Each pill: `--bone` bg, 4px radius, `--hairline-light` 1px border, padding `0.7rem 1rem`, Barlow Condensed 600 ink uppercase, with a leading small orange ☆ glyph and a tabular tiny ZIP-style "DFW" suffix in `--slate-light`. 20 cities in two visual rows: Arlington, Dallas, Fort Worth, Plano, Frisco, McKinney, Denton, Irving, Grand Prairie, Mansfield, Southlake, Keller, Grapevine, Richardson, Garland, Mesquite, Weatherford, Waxahachie, Allen, Prosper. Below the grid, a centered line in Source Sans 3 slate: "Don't see your city? Call us. If you're in DFW, we can get to you."

7. **Reviews.** `--bone` bg. Eyebrow orange "WHAT OUR CUSTOMERS SAY". H2 Barlow Condensed 700 ink uppercase "2,500+ FIVE-STAR REVIEWS AND COUNTING." Three review cards in a row (stack on mobile). Each card: white bg, 6px radius, `--shadow-soft`, padding 1.75rem, no top bar (saves the orange bar for service cards). Top: five Unicode ★ in `--orange` 1.05rem (use `font-feature-settings: 'tnum'` to keep aligned). Quote in Source Sans 3 1.05rem slate line-height 1.65. Attribution in Barlow Condensed 600 orange uppercase letterspaced small. Use specific quotes from the original brief (Fourth of July outage; honest no-replace; restaurant manager).

8. **Financing CTA section.** `--steel` bg. A two-column desktop layout (stack on mobile). LEFT: eyebrow orange "FINANCING AVAILABLE", H2 Barlow Condensed 700 white uppercase "NEW SYSTEM? WE MAKE IT AFFORDABLE.", body Source Sans 3 `--gray-on-dark` line-height 1.7: "0% financing for 36 months on qualifying installations. No money down. Credit decisions in minutes. Because a new AC system shouldn't drain your savings." A small chip row below in Barlow Condensed 600 uppercase letterspaced orange separated by `·`: `0% APR · 36 MONTHS · NO PREPAYMENT PENALTY`. RIGHT: an orange solid CTA card (radius 6px, padding 2.5rem, full white text) with a Barlow Condensed 700 1.7rem heading "READY TO GET STARTED?", a Source Sans 3 body "Call (817) 555-0193 for a free in-home estimate. No pressure, no obligation.", and a white solid button with ink text "GET FREE ESTIMATE".

9. **Footer.** `--steel-deep` bg. Four columns (collapse to 2 then 1 at small widths). Column 1: Wordmark "IRONCLAD AIR" Barlow Condensed white with the 3px orange left bar; below, a Source Sans 3 small `--gray-dim` line "Trusted HVAC since 2004 · Arlington, TX". Column 2: Services list (six links) in Source Sans 3 `--gray-on-dark`. Column 3: Service Area top cities. Column 4: Hours `Mon-Fri 7am-7pm · Sat 8am-5pm · Emergency 24/7`. Below the columns: license line in Barlow Condensed 600 uppercase letterspaced orange small: `TACLA LICENSE #12345 · BBB A+ ACCREDITED · CARRIER FACTORY AUTHORIZED DEALER`. Bottom band: thin orange 1px rule, then "© 2026 Ironclad Air. All rights reserved." left, "Website by DBJ Technologies" right (linked), both in Source Sans 3 `--gray-dim` 12px.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): both have a dark hero. Differentiate aggressively: your accent is VIVID ORANGE (`#F97316`), pi-law's is COOL BRASS GOLD (`#C9A84C`). Your typography is condensed industrial (Barlow Condensed); pi-law is classical didone (Playfair). Your tone is URGENT (emergency strip!); pi-law is GRAVE (verdicts ledger). Do not adopt a verdicts-style tabular ledger.
- Real Estate (rich black + copper Libre Caslon): both dark. Yours is steel-BLUE (`#1B2838`), real estate is true BLACK (`#0A0A0A`). Yours is industrial bold; real estate is gallery quiet.
- Financial Advisor (warm charcoal + forest green + EB Garamond): different temperature (your dark is cool blue-gray; financial's is warm brown-charcoal). Different accent (orange vs forest green). Different rhythm (industrial bold vs institutional symmetric).
- Restaurant (espresso + burgundy): completely different temperature and accent.
- Dental (white teal + coral): both have a warm accent on the orange-red spectrum. CRITICAL: your orange is `#F97316` (vivid pure orange, slathered everywhere); dental's coral is `#E76F51` (warmer, friendlier, used SPARINGLY). Your bg is dark; dental's is light. The HVAC orange should feel like a bullhorn.

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Barlow Condensed + Source Sans 3 with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/hvac-contractor.html` returns 0.
10. Phone number `(817) 555-0193` is visible in the nav and renders with `font-feature-settings: 'tnum'`.
11. Emergency orange strip is full-width, ≥80px tall on desktop, white text on orange.
12. Service area renders as a 4-column grid of city pills (2 columns at mobile).
13. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
