# CC Prompt · 04 · Medical Aesthetics / Med Spa Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 4 of 8. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, white teal-coral, steel-blue orange, rich-black copper, warm-charcoal forest green, espresso burgundy). This one owns the SOFT BLUSH + DEEP PLUM + DUSTY ROSE EDITORIAL lane · Vogue magazine spread on a quiet morning.

## Task

Build a high-fidelity medical aesthetics practice landing page mockup for an upscale Highland Park clinic. The target reader is an affluent woman 30 to 55 who decides whether to book a consultation in roughly 12 seconds based on visual presentation. The site has to LOOK like the waiting room: quiet, curated, unhurried. Editorial luxury meets clinical precision. Not Groupon Botox. Not pink-gradient med-spa cliche.

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✦ ◆). No SVG paths.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'onum'` (oldstyle figures) on body for editorial cadence; small caps where Bodoni Moda supports them via `font-variant-caps: all-small-caps` on eyebrows.

### File

Create `public/templates/med-spa.html`.

### Identity

- Vertical: Physician-led medical aesthetics
- Fictional practice: REVERIE AESTHETICS
- Location: Highland Park Village, Dallas
- Voice: First person plural ("we"). Editorial, refined, restrained. Never bro-y, never bargain-hunt, never "drip" or "snatch" language.

### Design system (lock these tokens)

```css
:root {
  --bg: #FAFAFA;             /* primary soft white */
  --bg-blush: #FEF6F3;       /* alternating warm blush */
  --bg-cream: #F8EFEA;       /* deeper blush for accent bands */
  --plum: #4A2545;           /* primary heading + dark element */
  --plum-deep: #3A1B36;
  --rose: #C4918E;           /* primary CTA + accent */
  --rose-deep: #B07E7A;      /* hover */
  --rose-pale: rgba(196,145,142,0.12);
  --taupe: #8B7D7A;          /* body */
  --taupe-light: #B5A8A4;    /* meta */
  --hairline-rose: rgba(196,145,142,0.32);
  --hairline-plum: rgba(74,37,69,0.08);
  --shadow-soft: 0 2px 12px rgba(74,37,69,0.06);
  --shadow-lift: 0 8px 28px rgba(74,37,69,0.10);
}
```

- Heading font: **Bodoni Moda** weights 400/500. Use the variable optical-size axis if available (load with `opsz,wght@8..96,400;8..96,500`). Italics are a featured element.
- Body font: **Outfit** weights 300/400/500.
- Type scale: `--fs-display: clamp(2.8rem, 5vw, 4.4rem);` `--fs-h2: clamp(1.95rem, 3.2vw, 2.8rem);` `--fs-h3: 1.4rem;` `--fs-body: 1.06rem;` `--fs-eyebrow: 0.72rem; letter-spacing: 0.32em;`. Bodoni headlines have very high stroke contrast · leave generous tracking on body to balance.
- Body line-height 1.85. Heading line-height 1.05.
- Buttons: rose solid, white text, **0px** radius (squared = precision), padding `1.05rem 2.4rem`, uppercase, letter-spacing 0.2em, font-size 0.78rem, weight 400. Hover: rose-deep, translateY(-1px), `--shadow-lift`. Ghost: 1px plum border, plum text · use sparingly.
- Cards on light: white panel, `--shadow-soft`, no border. Featured cards may receive a 1px rose top border (`--hairline-rose`).
- Section padding: `clamp(5rem, 9vw, 7.5rem) clamp(1.5rem, 6vw, 4rem)`.
- This template is the most editorially spaced of the 8 (rivaled only by real estate). Negative space is the brand.

### Sections (in order)

1. **Sticky nav.** White bg, no border (or 1px hairline-plum at the very bottom). Wordmark "REVERIE" in Bodoni Moda 400 letter-spaced **0.32em** (extreme tracking · this is part of the editorial signature) plum. Nav links Outfit 400 taupe: Treatments, About, Results, Journal, Contact. Right side: rose solid CTA "Book Consultation".

2. **Hero (asymmetric editorial).** Full viewport min-height 100svh. `--bg` background. Background image at very low opacity (0.05), `filter: saturate(0.18) blur(0.5px)`: https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1920&q=80. Position cover/center. Content LEFT-ALIGNED at golden ratio: max-width 640px, padding-left `clamp(1.5rem, 8vw, 8rem)`. A second visual layer: a small rose serif numeral "01" at 0.18 opacity in Bodoni Moda 8rem, positioned absolute top-right of the hero (visible on desktop only, hidden under 1024px) · this evokes a magazine page number and is reused across major sections (02, 03...). Eyebrow rose letterspaced "MEDICAL AESTHETICS · HIGHLAND PARK". Headline Bodoni Moda 400 plum (italicize "Subtlety" with `<em>`): "Where Science Meets *Subtlety*." Sub Outfit 400 taupe, line-height 1.85, max-width 520px: "Physician-led aesthetics in the heart of Highland Park. We believe the best results are the ones nobody can pinpoint. Natural. Refined. Yours." Single CTA: rose solid "Schedule a Consultation". Restraint matches the brand. Below: thin taupe hairline (max-width 280px) then a small line in Outfit taupe-light: "Dr. Elaine Whitfield, MD · Board-Certified Dermatologist · 15+ Years".

3. **Philosophy with editorial drop cap and pull-quote (signature treatment).** `--bg-blush` background. Two-column desktop layout. Left column has body text, right column has a single oversized Bodoni Moda italic pull-quote that floats in the page like a magazine sidebar. The pull-quote is CSS-only: a `<blockquote>` set in Bodoni Moda italic 2.6rem plum, line-height 1.15, with a 1px rose vertical rule on its left at 0.42em padding, max-width 380px. The quote: *"Every face tells a story. Our role is not to rewrite it · but to edit with precision."* (Note: that em-dash-looking character must be a normal hyphen surrounded by spaces or a comma. Verify zero em dashes. Use a comma here in the actual output.) Section number "02" appears top-right at 0.18 opacity. Eyebrow rose "OUR PHILOSOPHY". H2 Bodoni Moda plum: "Less Is Almost Always More." Three Outfit body paragraphs in `--taupe`, line-height 1.95. The FIRST paragraph opens with a Bodoni Moda drop cap in `--rose`, font-size 4.6em, line-height 0.85, float: left, margin: 0.08em 0.55rem 0 0. Paragraphs:
   - "Every face tells a story. Our role is not to rewrite it but to edit with precision. We approach aesthetics the way a skilled retoucher approaches a portrait, the goal is to enhance what is already beautiful, not to change who you are."
   - "Dr. Whitfield personally performs every injectable treatment. No hand-offs, no rotating providers, no surprises. The person you consult with is the person who treats you."
   - "We limit our schedule intentionally. Fewer patients per day means unhurried appointments, thorough consultations, and results we are proud to stand behind."

4. **Treatments.** `--bg` background. Section number "03" top-right. Eyebrow rose "TREATMENTS". H2 Bodoni Moda plum "What We Offer." Six cards in a 3x2 grid (2 cols at tablet, 1 at mobile). Each card: white bg, `--shadow-soft`, padding 2rem, 1px `--hairline-rose` top border. Card structure: Bodoni Moda 1.4rem plum title, then a thin rose hairline (40px), then Outfit taupe body 1.05rem, then at the bottom a price callout in Bodoni Moda italic rose 1.15rem with `'tnum'`. Six treatments (use the copy from the original brief · Botox & Dysport, Dermal Fillers, Laser Skin Resurfacing, Chemical Peels, Body Contouring, IV Therapy & Wellness · but ensure no em dashes and slightly polish so each description is exactly two sentences for visual rhythm).

5. **Real results (testimonials).** `--bg-blush` background. Section number "04" top-right. Eyebrow rose "REAL RESULTS". H2 Bodoni Moda plum "Our Patients Speak for Themselves." Two testimonial cards side by side (stack on mobile). Each card: white bg, padding 2.5rem, `--shadow-soft`, no border. A massive Bodoni Moda 5rem rose opening quotation mark `“` at 0.22 opacity positioned absolute top-left of the card (CSS `::before`). Quote in Outfit italic 400 1.1rem `--plum`, line-height 1.65. Attribution in Bodoni Moda 0.85rem `--rose` letterspaced 0.18em uppercase. Quotes stay specific to consultation experience and natural results (use the copy provided originally). Below the two testimonials, centered: a trust line in Outfit taupe small `'onum'`: `American Board of Dermatology · American Society for Dermatologic Surgery · 4.9★ on Google (200+ Reviews)`.

6. **Provider profile (editorial).** `--bg` background. Section number "05" top-right. A two-column asymmetric layout: 5/12 width left column for the eyebrow + name + credentials, 7/12 width right for the bio. Left: eyebrow rose "MEET DR. WHITFIELD"; H2 Bodoni Moda plum 2rem "Elaine Whitfield, MD"; small italic line in Outfit `--taupe`: "Board-Certified Dermatologist"; below, a stacked credentials list in Outfit uppercase letterspaced taupe small: `MD, COLUMBIA UNIVERSITY · DERMATOLOGY RESIDENCY, NYU LANGONE · FELLOW, AAD · 15+ YEARS PRACTICING`. Right: a 90-word bio in Outfit `--taupe` line-height 1.95 ending with a quoted sentence in Bodoni Moda italic plum 1.2rem set on its own line (a "kicker" to break the column visually): *"I have always believed that aesthetic medicine should be a quiet conversation, not a sales pitch."* · attribution underneath in Outfit taupe-light small letterspaced.

7. **Consultation CTA.** `--bg` background. Centered. Section number "06" top-right. H2 Bodoni Moda plum: "Your Consultation Is the First Treatment." Sub Outfit `--taupe` max-width 520px: "Every relationship begins with a conversation. We listen first, assess second, and only recommend treatments that align with your goals. No obligation, no pressure." Rose CTA "Book Your Consultation". Below, a small Outfit taupe-light line: `Or call (214) 555-0891 · Highland Park Village, Suite 204`.

8. **Footer.** Plum bg `--plum`, with a deeper band `--plum-deep` at the very bottom. Three columns. Left: "REVERIE AESTHETICS" Bodoni Moda letterspaced 0.32em in a soft cream (`#F4E6E0`). Below: a tagline in Outfit italic taupe-light: "Highland Park · Dallas". Center: contact info in Outfit taupe-light line-height 1.8 (address `47 Highland Park Village, Suite 204, Dallas, TX 75205`, phone, email `hello@reverieaesthetics.com`). Right: hours `Monday to Friday 9am to 6pm · Saturday 9am to 2pm · Closed Sunday` and `Website by DBJ Technologies` in `--rose` letterspaced. Bottom band: 1px rose hairline rule (`--hairline-rose`), then "© 2026 Reverie Aesthetics. All rights reserved." centered in `#D9C7C2` 12px.

### Distinction guardrails (must NOT resemble)

- Luxury Builders (warm-white sage Cormorant): both light editorial. Differentiate: your accent is ROSE/PLUM (warm pink-violet), builders is sage (gray-green). Your serif is Bodoni Moda (high-contrast didone) · distinctly different from Cormorant's transitional softness. Your hero shows magazine page numbers and a vertical pull-quote rule; builders shows a long vertical sage rule and a project ledger. Do not borrow the project ledger.
- Real Estate (rich black + copper Libre Caslon): both LEFT-aligned editorial. Differentiate aggressively: you are LIGHT/SOFT (blush bg, plum ink); real estate is DARK/AUSTERE (black bg, ivory ink). You use rose hairlines + drop cap + page numbers; real estate uses copper rules + price-as-headline cards. Do not adopt price-as-headline.
- Restaurant (espresso + burgundy Fraunces): completely different tone (dark intimate vs light editorial), different serif (Fraunces warm vs Bodoni Moda sharp), different signature (printed menu vs magazine pull-quote). Do not borrow dotted leaders.
- Dental (white teal coral): both light. Differentiate: your warmth is BLUSH/PLUM, dental is COOL teal. Your serif is editorial Bodoni Moda; dental is friendly DM Serif Display. You have NO rounded cards (0 or 1-radius); dental cards are 12px-rounded.

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Bodoni Moda + Outfit with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/med-spa.html` returns 0.
10. Section numerals "01"-"06" appear at top-right of each major section as faint Bodoni Moda figures (desktop only).
11. Drop cap on the first philosophy paragraph and pull-quote sidebar with a vertical rose rule both render correctly.
12. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
