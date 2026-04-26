# CC Prompt · 07 · Financial Advisor / Wealth Management Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 7 of 8. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, white teal-coral, soft-blush plum, steel-blue orange, rich-black copper, espresso burgundy). This one owns the WARM CHARCOAL + PARCHMENT + FOREST GREEN INSTITUTIONAL lane. Old-money library. Mahogany desk. Banker's lamp. Tabular figures and disclosures.

## Task

Build a high-fidelity wealth management firm landing page mockup for an independent fee-only RIA serving HNW families. Not an Edward Jones branch page. Not a Wealthfront robo-advisor clone. The reader is a 55-year-old business owner who just sold a company and is interviewing three firms. The site has to communicate within 10 seconds: fiduciary, independent, fee-only, decades of experience.

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✦ ◆ ✓). No SVG paths.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'tnum'` on AUM stat lockup, fee chips, year of certification, and disclosure tables; `'onum'` (oldstyle figures) on body for editorial cadence.

### File

Create `public/templates/financial-advisor.html`.

### Identity

- Vertical: Independent fee-only fiduciary RIA, HNW
- Fictional firm: BECKETT WEALTH PARTNERS
- Location: Turtle Creek / Uptown Dallas
- Voice: First person plural ("we"). Measured, deliberate, careful. Never aggressive, never sales-driven.

### Design system (lock these tokens)

```css
:root {
  --charcoal: #2D2926;       /* primary warm dark */
  --charcoal-deep: #221F1C;  /* footer band */
  --charcoal-soft: #3A3631;  /* card on dark */
  --parchment: #F7F3EF;      /* primary light */
  --warm-white: #FFFDF9;     /* alternating light */
  --linen: #EFEAE2;          /* divider band */
  --forest: #2D5F4A;         /* primary accent */
  --forest-deep: #234A3B;    /* hover */
  --forest-pale: rgba(45,95,74,0.10);
  --warm-stone: #7A746E;     /* body on light */
  --warm-stone-light: #A39C95; /* meta */
  --on-dark: #E8E2D7;        /* body on dark */
  --on-dark-dim: #B5AFA8;    /* meta on dark */
  --hairline-forest: rgba(45,95,74,0.20);
  --hairline-light: rgba(45,41,38,0.10);
  --shadow-soft: 0 2px 15px rgba(45,41,38,0.05);
  --shadow-lift: 0 12px 32px rgba(45,41,38,0.10);
}
```

- Heading font: **EB Garamond** weights 400/500. Italics are used as editorial accents in pull-quotes only.
- Body font: **Work Sans** weights 400/500.
- Type scale: `--fs-display: clamp(2.5rem, 5vw, 3.8rem);` `--fs-h2: clamp(1.95rem, 3vw, 2.6rem);` `--fs-h3: 1.3rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.74rem; letter-spacing: 0.22em;`. AUM/disclosure use `--fs-tabular: 1rem;` with `'tnum'`.
- Body line-height 1.85. Heading line-height 1.1.
- Buttons: forest solid, white text, **2px** radius (squared = institutional precision), padding `1rem 2.1rem`, uppercase, letter-spacing 0.16em, font-weight 500, font-size 0.78rem. Hover: forest-deep, translateY(-1px), `--shadow-lift`. Ghost: 1px forest border, forest text · used on light bg.
- Cards on light: `--warm-white` bg, `--shadow-soft`, no border. Featured cards may have a 3px forest top accent line. On dark: `--charcoal-soft` bg, 1px `--hairline-forest` border, no fill.
- Section padding: `clamp(5rem, 9vw, 7.5rem) clamp(1.5rem, 6vw, 4rem)`.

### Sections (in order)

1. **Sticky nav.** `--charcoal` bg, hairline bottom (rgba(247,243,239,0.08)). Wordmark "BECKETT WEALTH PARTNERS" in EB Garamond 500 letter-spaced 0.14em parchment, with a 2px wide × 20px tall forest accent bar to the LEFT of the wordmark. Nav links Work Sans 400 `--on-dark`: Services, Philosophy, Team, Insights, Contact. Right side: forest solid CTA "Schedule a Conversation".

2. **Hero (centered institutional symmetry).** Full viewport min-height 100svh. `--charcoal` background. Add a CSS-only banker pinstripe pattern at very low opacity: `background-image: repeating-linear-gradient(135deg, rgba(247,243,239,0.025) 0 1px, transparent 1px 28px);` layered over the charcoal. NO photographic image. Content CENTERED (symmetry = institutional stability), max-width 760px. Eyebrow forest letterspaced "WEALTH MANAGEMENT · DALLAS, TEXAS". Headline EB Garamond 400 parchment: "Wealth Is Personal. Your Strategy Should Be Too." Sub Work Sans 400 `--on-dark-dim` line-height 1.85 max-width 600px centered: "Beckett Wealth Partners is a fee-only fiduciary firm serving families, business owners, and executives across Dallas-Fort Worth. We manage portfolios, plan for transitions, and protect what you have built." Two CTAs centered: forest solid "Schedule a Consultation" + ghost forest "Our Approach". Below: thin forest hairline (max-width 60px, centered), then a TABULAR AUM lockup. The AUM lockup is a centered three-figure row with 1px hairline-forest dividers between figures: `Founded 2003 · $540M Assets Under Advisement · Fee-Only Fiduciary`. Stat figures rendered in EB Garamond italic forest 1.5rem with `'tnum'`, labels below in Work Sans uppercase letterspaced `--on-dark-dim` small. This lockup is a signature institutional element.

3. **Services.** `--parchment` bg. Eyebrow forest "WHAT WE DO". H2 EB Garamond charcoal "Comprehensive Wealth Management." Subtext Work Sans `--warm-stone` centered max-width 620px: "Every client relationship begins with a plan. Not a product pitch, not a portfolio template. A plan built around your specific financial life." Four cards in a 2x2 grid (single col mobile). Each card: `--warm-white` bg, `--shadow-soft`, no border, padding 2rem, 3px forest top accent line. Title in EB Garamond 500 1.3rem charcoal, body in Work Sans `--warm-stone`. Use the original-brief copy for the four services (Wealth Management, Retirement Planning, Estate and Legacy Planning, Business Owner Services).

4. **Philosophy + commitments.** `--warm-white` bg. Two-column desktop. Left: eyebrow forest "OUR PHILOSOPHY", H2 EB Garamond charcoal "We Sit on Your Side of the Table.", two body paragraphs in Work Sans `--warm-stone` line-height 1.95 (use original-brief copy on fee-only structure and conflicts of interest). Right: three small commitment cards stacked vertically. Each card: `--linen` bg, no shadow, padding 1.5rem 1.75rem, 3px forest LEFT bar, EB Garamond 500 1.1rem charcoal title with a leading forest ✦, Work Sans `--warm-stone` body small. Three commitments: Fee-Only, Fiduciary, Independent (use original-brief copy).

5. **Leadership.** `--parchment` bg. Eyebrow forest "LEADERSHIP". H2 EB Garamond charcoal "Experience You Can Verify." Three text-only profile blocks side by side (stack on mobile). Each block: `--warm-white` bg card, `--shadow-soft`, padding 2rem, no border. Top of card: a stack of credential chips in Work Sans uppercase letterspaced forest small (e.g., "CFP · CFA · 28 YRS"). Below chips: name in EB Garamond 500 1.4rem charcoal. Below name: title in Work Sans uppercase letterspaced `--warm-stone` small. Below title: 60-word bio in Work Sans `--warm-stone`. Three principals (use original-brief: James Beckett CFP CFA founding partner; Catherine Okafor CFP partner financial planning; Daniel Reeves CFA chief investment officer).

6. **Client perspectives.** `--charcoal` bg. Eyebrow forest "CLIENT PERSPECTIVES". H2 EB Garamond parchment "Relationships Measured in Decades." Two testimonial blocks stacked vertically (editorial pacing · same as real estate but the typography is distinct). Each: a large forest opening quotation mark `“` in EB Garamond 5rem at 0.18 opacity, quote in Work Sans italic 400 `--on-dark` 1.18rem line-height 1.55, attribution in EB Garamond italic forest letterspaced small AND a `(Client since YYYY)` suffix in Work Sans `--on-dark-dim` `'tnum'` for tabular alignment. Two quotes (Hargrove family wirehouse migration; Dr. Nguyen practice-sale tax savings).

7. **Insights / press lockup.** `--linen` bg. A single-row trust band. Eyebrow forest letterspaced "AS SEEN IN" centered. Below it, six newspaper/journal nameplates rendered in EB Garamond italic 1.15rem charcoal, separated by small forest `·` glyphs and aligned in a centered horizontal row that wraps to two rows on mobile: `Wall Street Journal · Barron's · Financial Advisor Magazine · Dallas Business Journal · D CEO · Forbes`. Below the row, a thin forest hairline (max-width 80px, centered), and a small Work Sans `--warm-stone` line: "References to media appearances do not constitute endorsement." This press band is a signature institutional element.

8. **Consultation CTA.** `--parchment` bg. Centered, generous padding. H2 EB Garamond charcoal: "The First Conversation Is the Most Important One." Sub Work Sans `--warm-stone` max-width 560px: "Whether you are evaluating a new advisor, preparing for a transition, or simply want a second opinion on your current plan, we welcome the conversation. No obligation, no sales pressure." Forest CTA "Request a Private Consultation". Below: small Work Sans `--warm-stone-light`: "Or call directly (214) 555-0318 · Turtle Creek Centre, Suite 1200".

9. **Footer (signature element · formal disclosure).** `--charcoal` bg with `--charcoal-deep` band at the very bottom. Three columns. Column 1: "BECKETT WEALTH PARTNERS" EB Garamond letterspaced parchment with the 2px forest accent bar; below in Work Sans `--on-dark-dim` "Registered Investment Advisor · CRD #189204". Column 2: contact (address `3811 Turtle Creek Blvd, Suite 1200, Dallas, TX 75219`, phone `(214) 555-0318`, email `info@beckettwealth.com`) in Work Sans `--on-dark-dim` line-height 1.8. Column 3: a stacked links column (Form ADV · Privacy Policy · Form CRS · ADV Brochure) in Work Sans `--on-dark` letterspaced uppercase small, plus `Website by DBJ Technologies` in forest letterspaced. Below the columns: a FORMAL DISCLOSURE block in Work Sans `--on-dark-dim` 11px, line-height 1.7, max-width 880px centered, italicized: "Beckett Wealth Partners is a registered investment advisor. Registration does not imply a certain level of skill or training. Past performance is not indicative of future results. All investing involves risk, including loss of principal. The information presented on this site is for informational purposes only and does not constitute investment advice." Bottom band: thin forest 1px rule, then "© 2026 Beckett Wealth Partners. All rights reserved." centered in `--on-dark-dim` Work Sans 12px.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): both have institutional gravitas. Differentiate: your dark is WARM CHARCOAL (`#2D2926` brown-leaning), pi-law is COOL NAVY (`#0B1628` blue). Your accent is FOREST GREEN, pi-law is BRASS GOLD. Your serif is EB Garamond (book humanist), pi-law is Playfair Display (high-contrast didone). Your hero is centered with banker pinstripe pattern; pi-law uses gold framing rules.
- Luxury Builders (warm-white sage Cormorant): both have green-ish accents and warm earth tones. Differentiate: your dark hero is the difference. Builders has NO dark section; you have a charcoal hero and testimonial section. Your green is FOREST DEEP (`#2D5F4A`), builders is MUTED SAGE (`#7C856B`). Your serif is EB Garamond; builders is Cormorant. Builders is asymmetric; you are centered/symmetric.
- Real Estate (rich black + copper Libre Caslon): both institutional with old-money feel. Differentiate: your dark is WARM CHARCOAL, real estate is TRUE BLACK. Your accent is FOREST GREEN, real estate is COPPER. Your hero is CENTERED symmetric; real estate is LEFT-aligned asymmetric. Your serif is EB Garamond (book); real estate is Libre Caslon (display).
- Restaurant (espresso + burgundy): different accent (forest green vs burgundy), different layout (centered institutional vs centered intimate), different serif. Although both have warm darks, your warm charcoal `#2D2926` is markedly grayer than restaurant's espresso `#1C1210`.
- HVAC (steel-blue + orange): different temperature, different accent, different rhythm.

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for EB Garamond + Work Sans with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/financial-advisor.html` returns 0.
10. AUM lockup uses tabular figures (`'tnum'`) and renders three figures with hairline dividers.
11. Banker pinstripe diagonal pattern is present in the hero at low opacity.
12. Formal disclosure block is present in the footer at small italic font, max-width centered.
13. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
