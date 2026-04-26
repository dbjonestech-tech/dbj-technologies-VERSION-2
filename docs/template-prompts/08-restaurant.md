# CC Prompt · 08 · Upscale Chef-Driven Restaurant Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 8 of 8 · the final piece. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, white teal-coral, soft-blush plum, steel-blue orange, rich-black copper, warm-charcoal forest green). This one owns the ESPRESSO + BURGUNDY + AMBER GOLD CANDLELIGHT lane. Warm, sensory, intimate. The page should feel like reading the menu at a restaurant where the chef actually cares.

## Task

Build a high-fidelity upscale restaurant landing page mockup for a chef-driven Bishop Arts spot in Dallas. Not a Toast/Squarespace template. Not a Yelp business page. The site sets the tone before the guest walks through the door. Every typographic choice should evoke a printed menu on heavy paper stock under candlelight.

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✦ ◆). The ✦ glyph rendered three times in a row (✦ ✦ ✦) is the section ornament throughout this template · it is the candlelight signature.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes. ESPECIALLY NOT in menu rows · use dotted leaders instead.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'tnum'` on menu prices and wine vintages; `'onum'` (oldstyle figures) on body for editorial cadence.
11. NO photographic image boxes. NO stock-food placeholders. NO image cards. The single hero background image is the only photographic element on the page.

### File

Create `public/templates/restaurant.html`.

### Identity

- Vertical: Chef-driven seasonal American with Mediterranean influence
- Fictional restaurant: EMBER & VINE
- Location: Bishop Arts District, Dallas
- Voice: First person plural ("we"). Warm, generous, plain-spoken. Not foodie-jargon. Not bro-chef.

### Design system (lock these tokens)

```css
:root {
  --espresso: #1C1210;       /* primary warm dark */
  --espresso-deep: #140A09;  /* footer band */
  --espresso-soft: #261917;  /* card on dark */
  --cream: #FFF8F0;          /* primary light */
  --linen: #F5EDE4;           /* alternating light */
  --paper: #FAF1E5;           /* menu paper bg */
  --burgundy: #7B2D3B;       /* primary accent · Barolo wine */
  --burgundy-deep: #5E2230;  /* hover */
  --burgundy-pale: rgba(123,45,59,0.10);
  --amber: #C9A96E;          /* secondary ornamental gold · warmer than law-firm gold */
  --umber: #6B5B4E;          /* body on light */
  --umber-light: #9A8B7E;    /* meta */
  --on-dark: #E8DDD0;        /* body on dark */
  --on-dark-dim: #B8A99A;    /* meta on dark */
  --hairline-amber: rgba(201,169,110,0.30);
  --hairline-light: rgba(28,18,16,0.10);
  --shadow-soft: 0 4px 18px rgba(28,18,16,0.10);
  --shadow-warm: 0 12px 32px rgba(28,18,16,0.20);
}
```

- Heading font: **Fraunces** weights 400/500. If using the variable axis, load `opsz,SOFT,wght,ital@9..144,0..100,400..500,0..1` so `font-variation-settings: 'SOFT' 50` can be used on the hero headline for the warm character. Italic Fraunces is used heavily.
- Body font: **Nunito Sans** weights 400/500.
- Type scale: `--fs-display: clamp(2.8rem, 5vw, 4.6rem);` `--fs-h2: clamp(2rem, 3.5vw, 3rem);` `--fs-h3: 1.4rem;` `--fs-body: 1.06rem;` `--fs-eyebrow: 0.74rem; letter-spacing: 0.28em;`. Menu rows use `--fs-menu: 1.1rem;` with `'tnum'` on prices.
- Body line-height 1.85. Heading line-height 1.05.
- Buttons: burgundy solid, cream text, **0px** radius, padding `1.05rem 2.4rem`, uppercase, letter-spacing 0.18em, font-weight 500, font-size 0.78rem. Hover: burgundy-deep, translateY(-1px), `--shadow-warm`. Ghost: 1px burgundy border, burgundy text.
- Cards on light: minimal · most content is text-on-paper. Where used: `--paper` bg, `--shadow-soft`, no border.
- Section padding: `clamp(4.5rem, 8vw, 7rem) clamp(1.5rem, 6vw, 4rem)`.
- The page should feel like candlelight: warm-cast everywhere, no cool blues, no gray neutrals. Even the espresso dark has a brown-red cast.

### Sections (in order)

1. **Sticky nav (split layout · signature device).** `--espresso` bg with a 1px `--hairline-amber` bottom rule. Wordmark "EMBER & VINE" in Fraunces 500 letter-spaced 0.18em cream, **CENTERED in the nav** · not left-aligned. Nav links flank the wordmark in a "split" arrangement (THIS IS THE TEMPLATE'S SIGNATURE NAV). Left side of wordmark: "Menu" and "Wine" in Nunito Sans 500 cream small, gap 2.5rem. Right side: "Private Events" and "Reservations". Mobile: nav wraps with wordmark on its own row above stacked links. NO CTA button in the nav · the nav is part of the menu experience, clean and curated.

2. **Hero.** Full viewport min-height 100svh. `--espresso` background. Background image at very low opacity (0.06), `filter: saturate(0.32) sepia(0.18)`: https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80. Position cover/center. Content CENTERED, max-width 720px. Above the headline: a centered ornament row of three small amber ✦ glyphs separated by 1.4em gaps in Fraunces 0.85rem (this is the candlelight ornament signature · used in 4 places on the page). Headline Fraunces 400 cream, with `font-variation-settings: 'SOFT' 50` if available: "Seasonal. Honest. Worth the Drive." Sub Nunito Sans 400 `--on-dark-dim` line-height 1.85 max-width 560px centered: "A chef-driven restaurant in the Bishop Arts District serving seasonal American cuisine with Mediterranean influence. Everything is made here. Nothing is rushed." Single CTA: burgundy solid "Make a Reservation". Below CTA: small Nunito Sans `--on-dark-dim`: "Or call (214) 555-0726". Below that, thin amber 1px hairline (max-width 60px, centered), then "Tuesday through Saturday · 5pm to 10pm" in small `--on-dark-dim`.

3. **Philosophy.** `--cream` bg. Centered. Above the eyebrow: the ✦ ✦ ✦ ornament row in amber. Eyebrow burgundy "OUR APPROACH". H2 Fraunces italic 400 espresso "We Cook What the Season Gives Us." Three centered Nunito Sans `--umber` paragraphs max-width 620px line-height 1.95 (use original-brief copy on seasonal menu, Chef Marcus Cole's New York/SF background, technique that doesn't overshadow product).

4. **Menu (signature element · printed-menu layout with dotted leaders).** `--espresso` bg. Eyebrow amber "CURRENT MENU". H2 Fraunces 400 cream "A Few Things We Are Proud Of." Subhead in Nunito Sans italic `--on-dark-dim`: "Menu changes weekly. This is a recent snapshot." Two columns on desktop (single col mobile). Each column has a category heading in Fraunces 1.4rem amber letter-spaced uppercase ("TO START" / "ENTREES"), followed by 4 menu rows. Each menu row is a CSS grid `[name] [leaders] [price]` where `[leaders]` is a flexible center column that renders DOTTED LEADERS (use `border-bottom: 1px dotted rgba(201,169,110,0.4)` on a flexbox spacer · the leaders should connect dish name to price like a printed menu). Dish name in Fraunces italic 400 cream 1.1rem. Description in Nunito Sans 400 `--on-dark-dim` 0.9rem on a second line, full-width (the dotted leader rule applies to the name+price line above). Price right-aligned in Fraunces 500 amber with `'tnum'`. **THE DOTTED LEADERS ARE THE TEMPLATE'S MOST DISTINCTIVE FEATURE · verify they actually render as dotted between dish and price.** Use the original-brief menu items: Roasted Beet Salad $16, Gulf Oysters $18 / half dozen, Wood-Fired Flatbread $14, Soup of the Moment $12, Pan-Seared Branzino $38, Braised Short Rib $42, Heritage Pork Chop $36, Handmade Pappardelle $28. Below the menu, centered: a "View Full Menu →" link in Fraunces italic amber letterspaced.

5. **Wine program.** `--linen` bg. Two-column desktop layout. Left column: ornament row ✦ ✦ ✦ amber, eyebrow burgundy "THE WINE PROGRAM", H2 Fraunces 400 espresso "Chosen, Not Collected.", two Nunito Sans `--umber` paragraphs (use original-brief copy on 60-bottle list, small producers). Right column: a "STAFF PICKS" wine card. The card is `--paper` bg, `--shadow-soft`, padding 2rem, no border, with a small amber ornament `✦` at top center. Heading "STAFF PICKS THIS WEEK" Fraunces 1.05rem espresso letterspaced uppercase center. Below: three wine rows, each a CSS grid `[name+region] [pricing]`. Wine name in Fraunces italic espresso, region in Nunito Sans `--umber-light` 0.85rem on the next line. Pricing right-aligned in Fraunces 500 burgundy small `'tnum'`. Sample: "Barbera d'Alba, G.D. Vajra · Piedmont · 2021" · "glass $16 · bottle $64". Two more from original brief.

6. **Private dining.** `--espresso` bg. Centered. Ornament ✦ ✦ ✦ amber. Eyebrow amber "PRIVATE DINING". H2 Fraunces 400 cream "Your Table Is Waiting." Description Nunito Sans `--on-dark-dim` max-width 580px centered: "Our private dining room seats up to 24 guests for birthdays, rehearsal dinners, corporate events, and celebrations that deserve a real meal. Custom menus, dedicated service, and a space that feels like yours for the evening." Detail line in Fraunces italic amber letterspaced small: "24 guests maximum · Custom menus from $85 per person · Full buyout available". Burgundy CTA "Inquire About Private Dining".

7. **Press and reviews.** `--cream` bg. Eyebrow burgundy "WHAT PEOPLE ARE SAYING". H2 Fraunces 400 espresso "Recognition." Two quotes stacked vertically. PRESS QUOTE: large amber opening `“` in Fraunces 5rem at 0.18 opacity, quote in Fraunces italic 400 `--espresso` 1.3rem line-height 1.55, attribution "DALLAS MORNING NEWS · 2025" in Nunito Sans uppercase letterspaced burgundy small. CUSTOMER QUOTE: same treatment but quote in Nunito Sans italic 1.1rem (distinguish from press quote stylistically); attribution "RACHEL & THOMAS W. · LAKEWOOD". Below: a centered trust line in Fraunces italic `--umber` small: `4.8★ on Google (380+ Reviews) · OpenTable Diners' Choice 2025 · D Magazine Best New Restaurant`.

8. **Reservation CTA.** `--linen` bg. Centered, generous padding. Ornament ✦ ✦ ✦ amber. H2 Fraunces 400 espresso "We Would Love to Have You." Sub Nunito Sans `--umber` max-width 480px centered: "Reservations recommended, especially Thursday through Saturday. Walk-ins welcome at the bar." Burgundy CTA "Reserve a Table". Below: stacked small lines in Nunito Sans `--umber`: `(214) 555-0726 · 331 W 7th Street, Bishop Arts, Dallas, TX 75208` then `Tuesday through Saturday · 5pm to 10pm · Bar open until 11pm`.

9. **Footer (centered intimate, signature element).** `--espresso` bg. NOT three columns · fully centered editorial layout (this is the template's footer signature, distinguishing from the column-grid footers of every other template). Top: ornament ✦ ✦ ✦ amber. Below: "EMBER & VINE" in Fraunces 500 letterspaced cream center. Below: address `331 West 7th Street · Bishop Arts · Dallas, TX 75208` in Nunito Sans `--on-dark-dim` center. Below: phone and email centered. Below: hours `Tuesday through Saturday · 5pm to 10pm · Bar until 11pm` centered. Below: a single 1px amber hairline rule (max-width 100px). Below: "© 2026 Ember & Vine. All rights reserved. · Website by DBJ Technologies" all on ONE line, centered, in Nunito Sans `--on-dark-dim` 12px, separated by a small `·` glyph. The DBJ link is a subtle inline link, color amber on hover.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): both have gold-ish accents. CRITICAL: your gold is AMBER `#C9A96E` (warmer, used as ORNAMENT only · three dots per section), pi-law's gold is BRASS `#C9A84C` (cooler, used as PRIMARY accent across all elements). Your primary accent is BURGUNDY, not gold. Pi-law is institutional centered with verdicts ledger; you are intimate centered with printed menu.
- Real Estate (rich black + copper Libre Caslon): both warm darks. Yours is ESPRESSO `#1C1210` (brown-red); real estate is TRUE BLACK `#0A0A0A` (no temperature). Your accent is BURGUNDY + AMBER (two warm tones); real estate is COPPER (single warm metal). Your hero is centered; real estate is left-aligned.
- Financial Advisor (warm charcoal + forest green + EB Garamond): both warm darks. Differentiate: your espresso is markedly darker and redder than financial's `#2D2926` warm charcoal. Your accent is burgundy/wine, financial is forest green. Your serif is Fraunces (warm playful soft); financial is EB Garamond (book formal). Your nav is centered split; financial's is left-aligned with right CTA.
- HVAC (steel-blue + orange): different temperature, different rhythm.
- Dental (white + teal + coral): different palette and tone entirely.
- Med Spa (blush + plum + rose): both have warm accents. Your burgundy is much DEEPER and DARKER than med-spa's rose; you are dark-dominant, med spa is light-dominant.

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Fraunces + Nunito Sans with `&display=swap`. If using the Fraunces variable axis, the URL must include the SOFT axis range.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/restaurant.html` returns 0.
10. Menu section renders with DOTTED LEADERS connecting each dish name to its price (visible as a row of dots between them). Verify visually.
11. Three-✦ ornament row appears at the top of at least four sections.
12. Nav uses centered wordmark with split flanking links (left and right of wordmark) on desktop.
13. NO image placeholders or boxes anywhere except the single hero background.
14. Footer is centered editorial · NOT three or four columns.
15. Visually distinct from all other templates per guardrails above. Especially confirm the espresso/burgundy palette does NOT read as similar to pi-law's navy/gold or real estate's black/copper.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
