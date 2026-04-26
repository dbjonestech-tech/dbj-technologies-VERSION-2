# CC Prompt · 02 · Luxury Custom Home Builder Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 2 of 8 in the DBJ portfolio. The other seven occupy distinct lanes (cool-navy gold, white teal-coral, soft-blush plum, steel-blue orange, rich-black copper, warm-charcoal forest green, espresso burgundy). This one owns the WARM WHITE + MUTED SAGE + ARCHITECTURAL RESTRAINT lane.

## Task

Build a high-fidelity custom home builder landing page mockup. It must look like a $15K custom build for a Park Cities builder whose finished homes appear in D Home and Architectural Digest. Not a generic contractor page. Not a Houzz pro listing. The reader is an architect, designer, or affluent end-client who recognizes when a website is designed by people who understand proportion.

### Ground rules

1. Single self-contained HTML file. ALL CSS in one `<style>` block in `<head>`. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap` only.
5. Icons: Unicode glyphs only (✦ ◆ ✓). No SVG paths.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes. Use commas.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'onum'` (oldstyle figures) on body to lend an editorial feel; `'tnum'` on the project ledger years/sf column.

### File

Create `public/templates/luxury-builders.html`.

### Identity

- Vertical: High-end custom residential builder, $3M to $15M projects
- Fictional firm: ASHWORTH & FOSTER, Builders
- Location: Park Cities, Dallas (serves Highland Park, University Park, Preston Hollow, Southlake)
- Voice: First person plural ("we"), considered, architectural. Quiet authority. Not "luxury" word-salad.

### Design system (lock these tokens)

```css
:root {
  --warm-white: #FAF9F6;       /* primary background */
  --off-white: #F5F0EB;        /* alternating section */
  --linen: #EFE8DD;            /* section divider band */
  --sage: #7C856B;             /* primary accent */
  --sage-deep: #5F6750;        /* hover, text accent */
  --sage-pale: rgba(124,133,107,0.15);
  --charcoal: #1A1A1A;         /* heading ink */
  --warm-gray: #6B6B6B;        /* body */
  --warm-gray-light: #9A9A9A;  /* meta */
  --hairline: rgba(26,26,26,0.10);
  --shadow-soft: 0 2px 16px rgba(26,26,26,0.05);
}
```

- Heading font: **Cormorant Garamond** weights 300 (display) and 500 (subheads); use italic 300/500 for editorial accents.
- Body font: **DM Sans** weights 400/500.
- Type scale: `--fs-display: clamp(2.8rem, 5.5vw, 5rem);` `--fs-h2: clamp(2rem, 3.2vw, 2.8rem);` `--fs-h3: 1.35rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.72rem; letter-spacing: 0.28em;`.
- Body line-height 1.85. Heading line-height 1.05 (Cormorant has lots of vertical air, can go tight).
- Buttons: charcoal solid, warm-white text, **0px** radius (square = architectural), padding `1.05rem 2.25rem`, uppercase, letter-spacing 0.18em, font-weight 500, font-size 0.78rem. Hover: sage-deep background. Ghost: 1px sage border, sage text.
- Cards on light: `--warm-white` panel, `--shadow-soft`, no border. Project ledger entries: borderless rows separated by hairline rules.
- Section padding: `clamp(5rem, 9vw, 8rem) clamp(1.25rem, 5vw, 3rem)` (more vertical air than other templates · this is the quietest layout in the portfolio besides real estate).

### Sections (in order)

1. **Sticky nav.** `--warm-white` bg, hairline bottom. Wordmark "ASHWORTH & FOSTER" in Cormorant 500 letter-spaced 0.16em, charcoal. Links DM Sans warm-gray: Portfolio, Process, Studio, Journal, Contact. Right side: charcoal solid CTA "Begin a Project". No phone in nav (this is restraint, not urgency).

2. **Hero** (full viewport min-height 100svh). `--warm-white` bg. ASYMMETRIC: content occupies left two-thirds at golden-section offset (max-width 700px, generous left padding `clamp(2rem, 8vw, 8rem)`). Right third holds a single oversized vertical sage rule (1px wide, 70% of viewport height) positioned 12vw from right edge · that's the ONLY ornament in the hero. Eyebrow sage "CUSTOM RESIDENTIAL · DALLAS". Headline Cormorant 300 italic blend (use a span to italicize "considered"): "Houses Are Built. Homes Are *considered*." Sub DM Sans warm-gray line-height 1.85 max-width 560px: "We design and build a small number of custom residences each year for clients who care as much about how a home is made as how it looks. Every detail is decided by the principal who runs the project, not delegated to a project manager." Single CTA: charcoal solid "View Recent Work". Below: thin charcoal hairline (max-width 240px), then a stat triplet in DM Sans uppercase letter-spaced sage: `Founded 2009 · 47 Homes Completed · AIA Dallas Member`.

3. **Project ledger (signature element).** `--off-white` bg. Eyebrow sage "RECENT WORK". H2 Cormorant 300 charcoal: "A Selection of Recent Projects." Subhead in DM Sans warm-gray, max-width 580px: "Each home is documented after completion. We do not photograph during staging or before landscape maturity." Then a borderless ledger (CSS grid, NOT a table). Five rows. Columns: **Year · Project Name · Location · Square Feet · Architect**. Year and SF columns use `font-feature-settings: 'tnum'`. Architect column right-aligned italic Cormorant 500. 1px hairline rule between rows. Sample rows:
   - 2025 · The Lakeside Residence · Highland Park · 8,400 sf · Robbie Fusch
   - 2024 · Strait Lane Estate · Preston Hollow · 11,200 sf · Stocker Hoesterey Montenegro
   - 2024 · Beverly Drive Renovation · Highland Park · 6,100 sf · Wilson Fuqua
   - 2023 · Drewery Place · University Park · 5,800 sf · Olsen Studios
   - 2023 · Strait Hollow Compound · Preston Hollow · 14,400 sf · Robbie Fusch
   Below the ledger: a small italic Cormorant line "View the complete portfolio →" linking nowhere (visual only).

4. **Philosophy with drop cap (signature treatment).** `--warm-white` bg. Two-column desktop layout. Left column: eyebrow sage "PHILOSOPHY", H2 Cormorant 300 italic charcoal "On Building Slowly." Right column: three short paragraphs in DM Sans warm-gray, line-height 1.95. The FIRST paragraph opens with a CSS-only drop cap: first letter rendered as Cormorant 300, font-size 4.2em, line-height 0.85, color sage, float: left, margin: 0.1em 0.6rem 0 0. The drop cap is the editorial signature of this template; do not use this technique anywhere else in the portfolio. Paragraphs:
   - "We accept four to six new projects per year. That number is not aspirational. It is the limit of what one principal builder can supervise without delegating decisions that should not be delegated."
   - "Every project begins with a conversation, not a contract. We want to understand how you will use the house, what time of day you spend in which rooms, and what you have collected over a lifetime that needs a place to belong."
   - "Our role is to translate the architect's drawings into a built home that improves with age. The trim has to align. The hardware has to feel right in the hand. The HVAC has to be silent. These are not optional upgrades. They are the work."

5. **Capabilities.** `--off-white` bg. Eyebrow sage "WHAT WE BUILD". H2 Cormorant 300 charcoal "Capabilities." A single-column rhythm of four entries (NOT a grid · this is a design choice; the layout breathes). Each entry: small sage ✦ glyph, Cormorant 500 charcoal title, DM Sans warm-gray body. 1px hairline below each entry. Entries:
   - Ground-Up Custom Residences. "New construction from a clean lot, working with the architect of your choosing. Typical project duration 18 to 24 months."
   - Whole-Home Renovations. "Down-to-studs renovation of a Park Cities or Preston Hollow home with character worth preserving. We are particularly experienced with 1920s through 1950s Georgian, Tudor, and ranch homes."
   - Estate Additions and Outbuildings. "Pool houses, guest quarters, garages, and primary-suite additions matched to the existing architecture so the seam disappears."
   - Pre-Construction Consulting. "We engage during architectural design to provide constructibility review, budget validation, and material sourcing before drawings are finalized."

6. **The Studio.** `--warm-white` bg. Eyebrow sage "THE STUDIO". H2 Cormorant 300 italic charcoal "Three Principals. Forty Years of Building." Three text-only profile blocks side by side (stack on mobile). No headshot placeholders. Each: thin sage rule top, Cormorant 500 charcoal name, DM Sans uppercase letterspaced sage role, then a 50-word bio in warm-gray. Names: William Ashworth, Founding Principal (Texas Tech, 22 years building); Daniel Foster, Principal (Texas A&M, 15 years building, formerly with a national builder); Anna Reyes, Director of Project Management (UT Austin Architecture, oversees all active projects).

7. **Testimonials with editorial pacing.** `--linen` bg. Eyebrow sage "WHAT OUR CLIENTS SAY". H2 Cormorant 300 charcoal "On Working Together." Two quotes stacked vertically. Each: large sage opening quote glyph at 0.14 opacity (CSS `::before` Cormorant 4rem), quote in Cormorant 300 italic 1.35rem charcoal line-height 1.6, attribution DM Sans uppercase letterspaced sage. Quotes specific to construction (timeline, change orders, communication). Sample attributions: "The Hadley Family · Highland Park" and "John & Anne Pemberton · Preston Hollow".

8. **Process timeline (vertical).** `--off-white` bg. Eyebrow sage "PROCESS". H2 Cormorant 300 charcoal "From First Conversation to Move-In." Five steps as a VERTICAL list (this template's process is vertical, distinguishing it from the law firm's horizontal four-step). Each step: small Cormorant sage numeral "01"-"05" left-aligned at 2.2rem, Cormorant 500 charcoal title, DM Sans warm-gray body, vertical sage hairline connector at 1px running down the left margin between steps. Steps: 01 Discovery; 02 Pre-Construction; 03 Architectural Coordination; 04 Build; 05 Closeout and Warranty.

9. **CTA.** `--warm-white` bg. Centered. H2 Cormorant 300 italic charcoal "If You Are Considering a Project." Sub DM Sans warm-gray max-width 540px: "We are happy to talk through what you have in mind. Discovery conversations are confidential and do not commit either of us to anything." Charcoal CTA "Schedule a Discovery Conversation". Below in small warm-gray-light: "Studio: 4516 Lovers Lane, Suite 220, Dallas".

10. **Footer.** `--linen` bg with a darker `#E2DACC` band at the very bottom. Three columns. Left: "ASHWORTH & FOSTER" Cormorant letterspaced charcoal, "Builders, est. 2009" italic below. Center: address, phone `(214) 555-0428`, email `studio@ashworthfoster.com`. Right: hours `Studio open by appointment, Monday to Friday`, then `Website by DBJ Technologies` in sage. Bottom band: thin sage rule, `© 2026 Ashworth & Foster Custom Builders. All rights reserved.` centered in warm-gray-light.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): you are warm and light, not cool and dark. You use a vertical hairline as ornament, not gold framing rules. Cormorant is more delicate than Playfair.
- Med Spa (soft blush + plum + rose + Bodoni Moda): both are light editorial. Differentiate aggressively: your accent is muted SAGE GREEN (not pink/rose), your serif is Cormorant (not Bodoni's high-contrast didone), your section background is warm-white/linen (not blush). The med spa uses a magazine pull-quote spread; you use a project ledger and drop cap. Do not adopt pull-quote treatment.
- Financial Advisor (warm charcoal + parchment + forest green + EB Garamond): both have warm earth tones and green accents. Differentiate: your sage is muted gray-green (`#7C856B`), financial's forest green is deep saturated (`#2D5F4A`). You have NO dark hero · financial does. You use Cormorant; financial uses EB Garamond. Your layout is asymmetric (left-aligned hero, vertical hairline); financial is centered/symmetric.

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for Cormorant Garamond + DM Sans with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/luxury-builders.html` returns 0.
10. Drop cap present on the first philosophy paragraph and rendered correctly.
11. Project ledger uses `'tnum'` and renders aligned years/SF columns.
12. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
