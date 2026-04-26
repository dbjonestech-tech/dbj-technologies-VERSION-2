# CC Prompt · 01 · Personal Injury Law Firm Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 1 of 8 in the DBJ portfolio. The other seven templates each occupy a fundamentally distinct visual lane (warm-white sage, white teal-coral, soft-blush plum, steel-blue orange, rich-black copper, warm-charcoal forest green, espresso burgundy). This one owns the COOL DARK NAVY + COOL GOLD lane. Nothing else in the portfolio uses navy + gold; do not encroach on adjacent lanes.

## Task

Build a high-fidelity personal-injury law firm landing page mockup. It must look like a $15K custom build for a serious DFW plaintiff firm. Not a Justia template. Not a yellow-pages PI mill. The reader should feel: this firm has tried real cases, has won real verdicts, and can be trusted with the worst day of someone's life.

### Ground rules

1. Single self-contained HTML file. ALL CSS in one `<style>` block in `<head>`. No frameworks, no external CSS, no Tailwind, no `@import`.
2. Pure HTML + CSS. ZERO JavaScript. No scroll listeners, no observers, no toggles. Mobile nav is a static wrapped bar.
3. `<meta name="robots" content="noindex, nofollow">` and `<meta name="viewport" content="width=device-width, initial-scale=1">` required in `<head>`.
4. Google Fonts via `<link>` only with `&display=swap`. No `@import`.
5. Icons via Unicode glyphs only (✦ ◆ ✓). No hand-drawn SVG icon paths.
6. Footer: `Website by DBJ Technologies` linking to https://dbjtechnologies.com. No other DBJ branding.
7. Page must be at least 1600px tall at desktop width. Must not break at 768px.
8. No em dashes anywhere. Use commas, periods, or restructured sentences.
9. Respect `@media (prefers-reduced-motion: reduce)` · disable transitions in that block.
10. Add `font-feature-settings: 'kern', 'liga'` globally. Add `'tnum'` (tabular figures) on the verdicts ledger column.

### File

Create `public/templates/pi-law.html`.

### Identity

- Vertical: Personal injury (auto, truck, premises, wrongful death)
- Fictional firm: BAUDER & ASSOCIATES, Trial Lawyers
- Location: Downtown Dallas
- Voice: First person plural ("we"), restrained, plain-spoken authority. No hype. No "fight for you" cliches.

### Design system (lock these tokens)

```css
:root {
  --navy: #0B1628;          /* deep cool navy, primary background */
  --navy-soft: #122036;     /* hero gradient stop, slightly lifted */
  --navy-band: #091222;     /* darker band for footer */
  --cream: #F4EFE3;         /* warm off-white for light sections */
  --paper: #FAF6EC;         /* alternate paper tone */
  --gold: #C9A84C;          /* primary cool gold accent (NOT amber) */
  --gold-dim: #A98A38;      /* hover state */
  --ink: #0B1628;           /* heading color on light bg */
  --gray: #C9D0DC;          /* body on dark */
  --gray-dim: #8A95A8;      /* meta on dark */
  --warm-gray: #5C5246;     /* body on light bg */
  --hairline-gold: rgba(201,168,76,0.22);
  --hairline-ink: rgba(11,22,40,0.10);
  --shadow-soft: 0 2px 14px rgba(11,22,40,0.10);
}
```

- Heading font: **Playfair Display** weights 400/500/700. Use 700 for the hero, 500 for section heads.
- Body font: **DM Sans** weights 400/500.
- Type scale: `--fs-display: clamp(2.6rem, 5vw, 4.4rem);` `--fs-h2: clamp(1.9rem, 3vw, 2.6rem);` `--fs-h3: 1.25rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.75rem; letter-spacing: 0.22em;`.
- Body line-height 1.75. Heading line-height 1.1.
- Buttons: gold background, navy text, **2px** radius (squared = institutional), padding `1rem 2rem`, uppercase, `letter-spacing: 0.14em`, font-weight 500. Hover: `--gold-dim`, translateY(-1px), `0 8px 20px rgba(201,168,76,0.22)`. Ghost: 1px gold border, gold text, transparent fill.
- Cards on light: `var(--cream)` panel, `var(--shadow-soft)`, no border. On dark: 1px gold-tinted border `var(--hairline-gold)`, no fill.

### Section rhythm

Use `padding: clamp(4.5rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem)` for every section.

### Sections (in order)

1. **Sticky nav.** `--navy` bg, hairline gold bottom border. Wordmark "BAUDER & ASSOCIATES" in Playfair 500, letter-spaced 0.18em, gold. To the right of the wordmark a tiny 2px-wide × 18px-tall gold bar. Nav links in DM Sans 500, color `--gray`, hover `--cream`. Right side: gold solid CTA "Free Consultation" with phone `(214) 555-0184` rendered as a ghost button before it.

2. **Hero** (full viewport, min-height: 100svh). `--navy` background. Subtle radial gold glow at low opacity (`radial-gradient(ellipse at 30% 40%, rgba(201,168,76,0.06), transparent 60%)`) layered with a single hairline gold rule positioned 80px from each side framing the content (use border on a wrapper). Content centered. Eyebrow "TRIAL LAWYERS · ESTABLISHED 1998". Headline (Playfair 700, gold): "When the Outcome Matters, Bring the Lawyers Who Try the Case." Sub (DM Sans, `--gray`, max-width 620px, line-height 1.85): "We represent people who have been catastrophically injured. Most of our cases settle. The ones that don't, we try. Insurance carriers know which firms walk into a courtroom and which firms don't. We do." Two CTAs: gold solid "Free Case Review" + ghost gold "Call (214) 555-0184". Below: thin gold rule (max-width 80px, centered) and a tabular trustline: `Board-Certified Personal Injury Trial Law · Texas Bar Foundation Fellow · 25+ Years Trying Cases`.

3. **Verdicts ledger (signature element).** `--cream` background. Eyebrow gold "RECENT RESULTS". H2 navy "Verdicts and Settlements." Below H2 a one-line context paragraph: "A representative sample. Past results do not guarantee future outcomes." Then a borderless table-like layout (use a CSS grid, NOT a real `<table>`, so it stays semantic and reflowable) with five rows. Columns: **Year · Case Type · Forum · Result**. Result column right-aligned in Playfair 500, navy, with `font-feature-settings: 'tnum'` for clean tabular figures. Each row separated by a 1px gold hairline at 0.22 opacity. Sample rows:
   - 2024 · Commercial Trucking Collision · Dallas County · `$8.2M`
   - 2023 · Hospital Negligence · Tarrant County · `$4.6M`
   - 2023 · Premises Liability · Collin County · `$2.1M`
   - 2022 · Auto Negligence · Dallas County · `$1.85M`
   - 2021 · Wrongful Death · Denton County · `$3.4M`
   Below the ledger, a centered small line in `--warm-gray`: "Disclosure: results vary based on the unique facts of each case."

4. **Practice areas.** `--paper` background. Eyebrow "PRACTICE AREAS". H2 "What We Handle." A 2x3 grid (1 column on mobile) of six cards. Each card is `--cream` with `--shadow-soft`, has a 2px gold left border, padding 1.75rem. Title in Playfair 500. Body in DM Sans 400, `--warm-gray`. Six cards: Auto and Trucking Collisions; Medical Malpractice; Premises Liability; Wrongful Death; Catastrophic Injury; Insurance Bad Faith. Each card 60-70 words of plain language about what the area covers and what makes the firm's approach distinct.

5. **Why this firm.** `--navy` background. Eyebrow gold "WHY BAUDER". H2 cream "What Sets a Trial Firm Apart from a Settlement Mill." Three rows (single column), each prefixed by a small gold ✦ glyph and a Playfair 500 cream subhead, with DM Sans body in `--gray`:
   - "We try cases." · "Roughly 95 percent of personal injury firms settle every case they take. We are not one of them. The carriers who pay our cases know that."
   - "We are board-certified." · "Texas Board Legal Specialization in Personal Injury Trial Law. Fewer than 2 percent of Texas lawyers hold this certification."
   - "We do not pyramid." · "The lawyer who signs your case is the lawyer who tries it. We do not run an intake mill that hands you off to a junior associate after the contract is signed."

6. **Attorney profiles.** `--cream` background. Eyebrow gold "ATTORNEYS". H2 navy "Who Will Represent You." Three text-only profile blocks side by side (stack on mobile). No headshot placeholders. Each block: thin gold horizontal rule on top, name in Playfair 500 navy, post-nominals in DM Sans uppercase letterspaced gold, then a 60-word bio in `--warm-gray`. Names: Robert L. Bauder, Founding Partner (J.D. UT Austin, board-certified PI trial law); Catherine Holloway, Senior Trial Attorney (former Dallas County ADA, 14 years trial experience); Marcus Yates, Partner (focuses on commercial trucking and catastrophic injury).

7. **Process (4 steps).** `--paper` background. Eyebrow "WORKING TOGETHER". H2 navy "What Happens After You Call." Four-step horizontal sequence (stack on mobile). Each step is a column with: a small gold serif numeral (Playfair 700, 2.5rem) "01" through "04", a Playfair 500 step title, and a 30-word DM Sans body. Steps: 01 Free Consultation; 02 Investigation and Filing; 03 Negotiation; 04 Trial if Necessary. Between steps on desktop, render a 1px gold hairline horizontal connector at the centerline of the numerals.

8. **Testimonials.** `--navy` bg. Two quotes stacked vertically (editorial pacing). Each quote prefixed by a large decorative gold opening quotation mark at opacity 0.18 (CSS `::before` content '\201C', font-size 5rem, Playfair). Quote in Playfair italic 400, `--cream`, 1.4rem, line-height 1.55. Attribution in DM Sans uppercase letterspaced gold, small. Quotes: (1) widow of trucking-collision victim, Dallas; (2) father of catastrophically-injured teen, Plano. Make the quotes specific (process, outcome, communication), not generic.

9. **CTA.** `--cream` bg. Centered. H2 navy in Playfair 700: "If You Are Hurt, the Clock Is Already Running." Sub in DM Sans `--warm-gray`, max-width 560px: "Texas has a two-year statute of limitations on most personal injury claims. Evidence disappears, witnesses move, and insurance adjusters take statements that hurt cases. Call us today." Gold CTA "Schedule Your Free Consultation" + smaller line "Or call (214) 555-0184. Available nights and weekends."

10. **Footer.** `--navy-band` bg. Three columns (stack on mobile). Left: wordmark and small line "Trial Lawyers · Established 1998". Center: address `1700 Pacific Avenue, Suite 2400, Dallas, TX 75201`, phone, email `intake@bauderlaw.com`, hours `Monday to Friday 8am to 6pm`. Right: small disclaimer block in `--gray-dim` text 12px line-height 1.6: "Not certified by the Texas Board of Legal Specialization unless otherwise noted. The contents of this website do not constitute legal advice. Contacting Bauder & Associates does not create an attorney-client relationship." `Website by DBJ Technologies` link in `--gold` letterspaced. Bottom band: thin gold hairline rule then "© 2026 Bauder & Associates, PLLC. All rights reserved." centered in `--gray-dim`.

### Distinction guardrails (must NOT resemble)

- Luxury Builders (warm white + sage + Cormorant): your background is COOL deep navy, not warm white. Your accent is COOL brass-gold, not muted sage green.
- Real Estate (rich black + copper + Libre Caslon): your dark is navy with blue cast, not pure black. Your gold is cool brass, NOT warm copper. Your hero is centered classical, not left-aligned gallery negative space.
- Restaurant (espresso + burgundy + warm gold): your gold is COOLER (`#C9A84C`), used as a primary accent across frames and rules. Restaurant's gold is WARMER (`#C9A96E`), used only as a sparing ornament. Do not echo restaurant's intimate centered layout · yours is institutional centered with framing rules.
- HVAC (steel-blue + orange): different accent (gold vs orange) and entirely different vibe (verdict gravity vs emergency-response urgency).

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Playfair Display + DM Sans, with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/pi-law.html` returns 0.
10. Verdicts ledger uses `font-feature-settings: 'tnum'` for the result column.
11. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
