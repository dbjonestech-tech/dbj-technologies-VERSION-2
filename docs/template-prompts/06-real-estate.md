# CC Prompt · 06 · Luxury Real Estate Personal Brand Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 6 of 8. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, white teal-coral, soft-blush plum, steel-blue orange, warm-charcoal forest green, espresso burgundy). This one owns the RICH BLACK + WARM IVORY + COPPER GALLERY lane. The quietest, most spacious page in the portfolio, alongside luxury builders.

## Task

Build a high-fidelity personal-brand landing page mockup for a top-producing DFW luxury residential agent. Not a Zillow clone. Not a KW/Compass page with a headshot pasted in. The agent IS the brand. The site should feel like a Sotheby's International property brochure translated to the web. Every design choice signals: "I operate at a level above."

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✦ ◆ ☎). Used sparingly.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'tnum'` and `'salt'` (stylistic alternates) on the property prices for refined figure styling; `'onum'` (oldstyle) on body for editorial cadence.

### File

Create `public/templates/real-estate.html`.

### Identity

- Vertical: Luxury residential real estate, $4M to $10M+ properties
- Fictional brand: LAUREN PRESCOTT, Luxury Residential
- Brokerage: Briggs Freeman Sotheby's International Realty
- Location: Park Cities (Highland Park, University Park) and Preston Hollow
- Voice: First person singular ("I"). Quiet, exact, no boasting. The agent's personal voice, not "we, the team."

### Design system (lock these tokens)

```css
:root {
  --black: #0A0A0A;          /* primary dark */
  --black-soft: #141414;     /* card on dark */
  --ivory: #F5F1EB;          /* warm light */
  --cream: #FAF7F2;          /* alternating light */
  --copper: #B87333;         /* primary accent */
  --copper-deep: #A06428;    /* hover */
  --copper-pale: rgba(184,115,51,0.12);
  --warm-gray: #7A7067;      /* body on light */
  --warm-gray-light: #A09890;/* meta */
  --on-dark: #E8E2D7;        /* body on dark */
  --on-dark-dim: #968E80;    /* meta on dark */
  --hairline-copper: rgba(184,115,51,0.18);
  --hairline-light: rgba(10,10,10,0.08);
  --shadow-soft: 0 2px 18px rgba(10,10,10,0.06);
  --shadow-lift: 0 14px 36px rgba(10,10,10,0.10);
}
```

- Heading font: **Libre Caslon Display** weight 400.
- Body font: **Karla** weights 300/400/500.
- Type scale: `--fs-display: clamp(2.8rem, 5vw, 4.4rem);` `--fs-h2: clamp(2rem, 3.2vw, 2.8rem);` `--fs-h3: 1.4rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.72rem; letter-spacing: 0.32em;`. Property-card prices use `--fs-price: clamp(2.4rem, 3.5vw, 3.4rem);` (Libre Caslon, copper).
- Body line-height 1.85. Heading line-height 1.05.
- Buttons: copper solid, white text, **0px** radius, padding `1.05rem 2.4rem`, uppercase, letter-spacing 0.22em (deeper than other templates · gallery register), font-size 0.78rem, weight 400. Hover: copper-deep, translateY(-1px). Ghost: 1px copper border, copper text, transparent fill. Used for the secondary "Learn More" affordances.
- Cards on dark: `--black-soft` bg, 1px `--hairline-copper` border, no shadow. On light: `--cream` bg, `--shadow-soft`, hover lifts with `--shadow-lift` and reveals a 1px copper top border.
- Section padding: `clamp(5.5rem, 10vw, 8.5rem) clamp(1.5rem, 6vw, 4rem)`. **More vertical air than any other template** · this is the brand.
- Negative space is the design. Do not fill it.

### Sections (in order)

1. **Sticky nav.** `--black` bg, no border (the black is the boundary). Wordmark "LAUREN PRESCOTT" in Libre Caslon 400 letter-spaced **0.32em** ivory. Nav links Karla 400 `--on-dark`: Properties, Neighborhoods, About, Sellers, Contact. Right side: copper solid CTA "Schedule Consultation".

2. **Hero (extreme negative space).** Full viewport min-height 100svh. `--black` bg. Background image at very low opacity (0.05), `filter: saturate(0.12) blur(0.5px)`: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80. Position cover/center. Content LEFT-aligned at golden ratio: max-width 640px, padding-left `clamp(2rem, 9vw, 9rem)`. Eyebrow copper letterspaced "LUXURY RESIDENTIAL · DALLAS". Headline Libre Caslon 400 ivory: "Your Home Should Be as Considered as the Life You've Built." Sub Karla 400 `--on-dark-dim` line-height 1.85 max-width 520px: "I represent buyers and sellers across Dallas's most distinguished neighborhoods. Every transaction is personal, every strategy is custom, and every detail is handled with the discretion my clients expect." Single CTA: copper solid "Begin a Conversation". No secondary. Below: thin copper hairline (max-width 240px), then a stat triplet in Karla uppercase letterspaced `--on-dark-dim`: `$340M Career Volume · 200+ Transactions · Park Cities Resident Since 2008`.

3. **Selected properties (signature element · price-as-headline cards).** `--ivory` bg. Eyebrow copper "SELECTED PROPERTIES". H2 Libre Caslon black "Currently Representing." Below H2 a one-line italic Karla `--warm-gray`: "A small sample of active and recently sold listings." Three TALL portrait cards in a row (stack on mobile). Each card: `--cream` bg, padding 2.5rem 2rem 2rem 2rem, no border. NO IMAGES. The visual element of each card IS THE PRICE, rendered massive in Libre Caslon 400 copper at `--fs-price`, with `'tnum'` for clean alignment. Below the price: a 1px copper hairline 60px wide. Below the hairline: address in Karla 500 ink, "5 Bed · 5.2 Bath · 6,400 SF" in Karla `--warm-gray` small uppercase letterspaced, then a 30-word property description in Karla `--warm-gray`. At the bottom: a small Libre Caslon italic copper "View Listing →" link. Hover: card lifts with `--shadow-lift`, copper top border (1px) appears. Three properties (use the original brief copy: $4,250,000 / 4907 Lakeside Drive, Highland Park; $2,875,000 / 3814 Normandy Avenue, University Park; $6,900,000 / 9220 Sunnybrook Lane, Preston Hollow). Below the cards, centered: a Libre Caslon italic copper letterspaced link "View All Properties →".

4. **Neighborhood expertise.** `--cream` bg. Eyebrow copper "NEIGHBORHOOD EXPERTISE". H2 Libre Caslon black "I Know These Streets Because I Live on Them." Four neighborhood entries in a 2x2 grid (stack on mobile). Each entry: 3px solid copper LEFT bar, padding-left 1.75rem, Libre Caslon 400 1.5rem black neighborhood name, then a small Karla uppercase letterspaced copper line "MEDIAN $X.XM · X TRANSACTIONS YTD" in `'tnum'`, then a 50-word description in Karla `--warm-gray`. Use the four neighborhoods from the original brief (Highland Park, University Park, Preston Hollow, Prosper & Southlake) and add the median-price line.

5. **About / philosophy (editorial).** `--ivory` bg. Two-column desktop. Left column: eyebrow copper "ABOUT LAUREN", H2 Libre Caslon black "Real Estate at the Highest Level Is Not About Houses.", three Karla `--warm-gray` paragraphs line-height 1.95. Right column: a single oversized copper opening quotation mark `“` rendered in Libre Caslon 11rem at 0.10 opacity, position absolute top-right, AND a vertical 1px copper rule full column height running at 0.6em padding-left of the right column. Use the original-brief copy verbatim, polished to remove any em dashes.

6. **Testimonials (editorial vertical pacing).** `--black` bg. Eyebrow copper "CLIENT EXPERIENCES". H2 Libre Caslon ivory "Trust Built on Results." Two quotes stacked vertically (NOT side by side). Each: a large copper opening quotation mark `“` Libre Caslon 5rem at 0.22 opacity (CSS `::before`), quote in Karla italic 400 ivory 1.18rem line-height 1.6, attribution in Libre Caslon italic copper letterspaced small. Two attributions: "The Sutton Family · Highland Park" and "David & Christine M. · University Park". Quotes specific to negotiation, intuition, market reading.

7. **Sellers · confidential analysis CTA.** `--cream` bg. Centered. Eyebrow copper "FOR SELLERS". H2 Libre Caslon black "Considering a Sale?" Sub Karla `--warm-gray` max-width 540px: "I provide every prospective seller with a confidential market analysis and custom pricing strategy. No obligation, no pressure. Just clarity on what your home is worth and how I would position it." Copper CTA "Request a Private Consultation". Below: small Karla `--warm-gray-light`: `Or call directly (214) 555-0672 · All inquiries kept confidential`.

8. **Footer (minimal, spacious).** `--black` bg with extra padding (`clamp(4rem, 6vw, 5rem)` top). Three columns. Left: "LAUREN PRESCOTT" Libre Caslon letterspaced ivory; below in Karla `--on-dark-dim` "Luxury Residential · Dallas, TX". Center: contact (phone `(214) 555-0672`, `lauren@laurenprescott.com`, address `3300 Knox Street, Suite 110, Dallas, TX 75205`) in Karla `--on-dark-dim`. Right: brokerage line in Karla italic `--on-dark-dim` "Briggs Freeman Sotheby's International Realty"; below, `Website by DBJ Technologies` in copper letterspaced. Bottom band: 1px copper hairline rule, then "© 2026 Lauren Prescott. All rights reserved. Equal Housing Opportunity." centered in `--on-dark-dim` 12px Karla.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): your dark is TRUE BLACK (`#0A0A0A`), pi-law is cool navy. Your accent is WARM COPPER (`#B87333`), pi-law is COOL BRASS GOLD (`#C9A84C`). Your hero is left-aligned with extreme negative space; pi-law is centered classical with framing rules. Do not adopt the verdicts-ledger pattern.
- HVAC (steel-blue + orange): both dark. Yours is true black; HVAC is steel-blue. Your typography is classical Libre Caslon (gallery quiet); HVAC is condensed industrial bold (loud). Your hero has no patterns/grids; HVAC has a dot-grid blueprint.
- Med Spa (blush + plum + rose): both LEFT-aligned editorial. Differentiate aggressively: you are DARK/AUSTERE (black + ivory + copper), med spa is LIGHT/SOFT (blush + plum + rose). Your serif is Libre Caslon (broad classical Caslon); med spa is Bodoni Moda (high-contrast didone). Your signature is price-as-headline; med spa's is magazine pull-quotes with section numerals. Do not put numerals in the page corners.
- Financial Advisor (warm charcoal + forest green + EB Garamond): both have institutional gravitas. Differentiate: yours is BLACK + COPPER (warm-brown gallery), financial is WARM CHARCOAL + FOREST GREEN (warm-neutral library). Yours is asymmetric LEFT-aligned; financial is centered SYMMETRIC. Yours is Libre Caslon (display Caslon); financial is EB Garamond (book humanist).
- Restaurant (espresso + burgundy): different temperature (your dark is true black; restaurant is brown-red espresso). Different accent (copper vs burgundy). Different rhythm (gallery quiet vs intimate centered).

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Libre Caslon Display + Karla with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/real-estate.html` returns 0.
10. Each property card uses the price as the dominant visual element in Libre Caslon copper at `--fs-price`, with `font-feature-settings: 'tnum'`.
11. NO image placeholders or boxes appear anywhere on the page.
12. Section padding is the largest in the portfolio (you should physically see more whitespace than other templates).
13. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
