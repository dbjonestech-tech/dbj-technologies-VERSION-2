# CC Prompt · 03 · Dental Practice Template

Paste the fenced block into Claude Code at the project root. Screenshot, then commit with the batch.

---

```
STOP. Before you write a single line of code, read /mnt/skills/public/frontend-design/SKILL.md and internalize its principles. This is template 3 of 8. The other seven occupy distinct lanes (cool-navy gold, warm-white sage, soft-blush plum, steel-blue orange, rich-black copper, warm-charcoal forest green, espresso burgundy). This one owns the BRIGHT CLEAN WHITE + TEAL with WARM CORAL ACCENT lane. Modern, friendly, clinical. NOT austere.

## Task

Build a high-fidelity general and cosmetic dentistry practice landing page mockup. It must look like a $15K custom build for a Plano practice that competes for affluent families. Not a clip-art tooth-icon Wix page. Not a corporate dental-chain template. The reader is a parent comparing three practices on a Tuesday night and deciding whose website made them feel calmest.

### Ground rules

1. Single self-contained HTML, all CSS in one `<style>` block. No frameworks.
2. Pure HTML + CSS. ZERO JavaScript.
3. Required `<meta>` tags: robots noindex, viewport.
4. Google Fonts via `<link>` with `&display=swap`.
5. Icons: Unicode glyphs only (✦ ✓ ◆). No SVG paths.
6. Footer credit links to https://dbjtechnologies.com.
7. ≥1600px tall at desktop. Must not break at 768px.
8. No em dashes.
9. Honor `prefers-reduced-motion`.
10. `font-feature-settings: 'kern', 'liga'` global; `'tnum'` on the timeline numerals.

### File

Create `public/templates/dental-practice.html`.

### Identity

- Vertical: General and cosmetic family dentistry
- Fictional practice: RIDGEVIEW DENTAL
- Location: Plano, TX (West Plano, near Legacy West)
- Voice: First person plural ("we"), warm, judgment-free, plain-spoken. Not chirpy. Not sales-y.

### Design system (lock these tokens)

```css
:root {
  --white: #FFFFFF;
  --cream: #FDF8F4;
  --mist: #F4F8F8;          /* alternating cool-tinted section */
  --teal: #2A9D8F;          /* primary accent */
  --teal-deep: #1F8175;     /* hover */
  --teal-pale: rgba(42,157,143,0.10);
  --coral: #E76F51;         /* secondary warm accent · used sparingly for CTAs and highlights */
  --coral-deep: #C95B40;    /* coral hover */
  --charcoal: #264653;      /* heading ink, slightly warm navy */
  --charcoal-soft: #34556A;
  --warm-gray: #5A6B73;     /* body */
  --warm-gray-light: #8896A0; /* meta */
  --hairline: rgba(38,70,83,0.10);
  --shadow-soft: 0 2px 14px rgba(38,70,83,0.07);
  --shadow-lift: 0 12px 28px rgba(38,70,83,0.10);
}
```

- Heading font: **DM Serif Display** weight 400.
- Body font: **DM Sans** weights 400/500.
- Type scale: `--fs-display: clamp(2.5rem, 5vw, 4.2rem);` `--fs-h2: clamp(1.85rem, 3vw, 2.5rem);` `--fs-h3: 1.25rem;` `--fs-body: 1.0625rem;` `--fs-eyebrow: 0.74rem; letter-spacing: 0.18em;`.
- Body line-height 1.75. Heading line-height 1.1.
- Buttons: coral solid, white text, **8px** radius (rounded but not pill · friendly clinical), padding `0.95rem 1.85rem`, font-weight 500, letter-spacing 0.04em. Hover: coral-deep, translateY(-1px), `--shadow-lift`. Secondary: teal solid (used for non-primary CTAs). Ghost: 1px teal border, teal text.
- Cards on light: `--white` panel, `--shadow-soft`, **12px** radius (this template's friendliness lives in the radius · DO NOT use 12px radius elsewhere in the portfolio). Hover: `--shadow-lift`, translateY(-2px).
- Section padding: `clamp(4rem, 7vw, 6rem) clamp(1.25rem, 5vw, 3rem)`.

### Sections (in order)

1. **Sticky nav.** White bg, hairline bottom. Logo lockup: small teal circle (24px) with a coral inner dot, then "Ridgeview Dental" in DM Serif Display 400 charcoal. Nav links DM Sans charcoal-soft. Right side: ghost teal "Patient Login" + coral solid "Book Appointment".

2. **Hero.** Full viewport min-height 100svh. Background: a soft top-down gradient `linear-gradient(180deg, #FFFFFF 0%, #F4F8F8 80%)`. Layered ornament: a single large CSS-only teal arc (use a wrapper with `border-radius: 50%`, `border: 2px solid var(--teal-pale)`, dimensions 120vw × 120vw, positioned absolute top: -60vw, right: -40vw · visible only as a quarter arc behind content). Content centered, max-width 720px. Eyebrow teal letterspaced "GENERAL · COSMETIC · FAMILY DENTISTRY". Headline DM Serif Display charcoal: "Modern Care in a Comfortable Setting." Sub DM Sans warm-gray line-height 1.75 max-width 580px: "Whether it has been six months or six years since your last visit, Ridgeview Dental is a judgment-free practice where your comfort comes first. Same-day appointments. Most insurance accepted. We will tell you what you need and what can wait." Two CTAs: coral solid "Book an Appointment" + ghost teal "Call (972) 555-0149". Below: a chip row of trust marks in DM Sans uppercase letterspaced charcoal-soft separated by small teal ✦ glyphs: `Same-Day Emergencies · In-Network with Most Insurance · 4.9★ on Google · Sedation Available`.

3. **Services grid.** White bg. Eyebrow teal "WHAT WE OFFER". H2 charcoal "Care for Every Stage of Life." A 3x2 grid of six service cards. Each card: white bg, 12px radius, soft shadow, padding 1.75rem, a small 36px circular teal-pale chip in the top-left holding a Unicode glyph (✦, ◆, etc.) in teal, then card title in DM Serif Display 1.3rem charcoal, body in DM Sans warm-gray. Six services: Preventive Cleanings & Exams; Cosmetic Dentistry & Whitening; Clear Aligners; Crowns, Bridges & Implants; Pediatric Dentistry; Sedation Dentistry. Hover: card lifts with `--shadow-lift`.

4. **Your first visit (signature element · numbered timeline).** `--mist` bg. Eyebrow teal "YOUR FIRST VISIT". H2 charcoal "Step by Step, So There Are No Surprises." A horizontal 4-step timeline (vertical stack on mobile) connected by a 2px teal hairline running through the center of all four step circles. Each step: a 56px white circle with `--shadow-soft` and a 2px teal border, containing a numeral in DM Serif Display teal (`'tnum'` for clean alignment); below the circle a step title in DM Serif Display 1.15rem charcoal; below that a 30-word DM Sans warm-gray body. Steps: 01 Welcome and Paperwork ("We send paperwork ahead of time so you spend less time in the waiting room."); 02 Comprehensive Exam and X-Rays ("Including digital scans, oral cancer screening, and a periodontal evaluation."); 03 Treatment Conversation ("We walk through what we found, what is urgent, what can wait, and what it costs."); 04 Cleaning Same Day if Time Allows ("Most new patients are in and out in under 90 minutes.").

5. **Why Ridgeview.** White bg. Two-column desktop layout. Left: eyebrow teal "WHY RIDGEVIEW", H2 charcoal "What Makes the Difference." Right column has three stacked feature blocks, each prefixed by a small coral ✦ glyph and a DM Serif Display title:
   - "We do not upsell." · "If you do not need it, we will tell you. Our hygienists are not on commission and our recommendations are based on clinical findings, not quarterly targets."
   - "We treat anxiety seriously." · "Nitrous, oral sedation, and IV sedation are all available. Same-day if scheduled in advance. We have patients who finally got back into a chair after 20 years away."
   - "We are family-built." · "Our pediatric room has its own waiting area, its own books, and its own playlist. Children become teenagers become parents. We try to be the office that earns those decades."

6. **Doctor introduction.** `--cream` bg. Two-column desktop. Left column: eyebrow teal "MEET DR. PARKER", H2 DM Serif Display charcoal "Dr. Sarah Parker, DDS", DM Sans warm-gray body 70-80 words: "Dr. Parker received her DDS from Baylor College of Dentistry in 2011 and completed advanced training in restorative and cosmetic dentistry at Spear Education. She has practiced in Plano since 2013 and lives in West Plano with her husband and two children. She is a member of the American Dental Association, the Texas Dental Association, and the Greater Dallas Dental Society." A small chip row below in DM Sans uppercase letterspaced teal: `BAYLOR DDS · SPEAR EDUCATION · ADA MEMBER`. Right column: a single text-only blockquote in DM Serif Display italic 1.4rem charcoal, line-height 1.5, max-width 380px, with a coral opening quotation mark at 0.18 opacity: "I went to dental school because my own dentist made every visit feel safe when I was a kid. That is what I want this office to be for someone else's kid." Attribution in DM Sans uppercase letterspaced teal small: "DR. SARAH PARKER".

7. **Testimonials grid.** White bg. Eyebrow teal "WHAT OUR PATIENTS SAY". H2 charcoal "Stories from the Chair." Three testimonial cards in a row (stack on mobile). Each card: white bg, 12px radius, `--shadow-soft`, padding 1.75rem, five small coral ★ at top, quote in DM Sans 1.05rem warm-gray, attribution in DM Sans uppercase letterspaced teal small. Make quotes specific (anxiety conquered, kid who used to cry, late-night emergency call). Sample attributions: "Lauren M., Plano · Patient since 2019", "James T., Frisco · Father of two", "The Velasquez Family · West Plano".

8. **Insurance and pricing transparency.** `--mist` bg. Eyebrow teal "INSURANCE AND COSTS". H2 charcoal "We Will Always Be Honest About What Things Cost." Two-column desktop. Left column: short paragraph "We are in-network with most major PPO plans. We will run your benefits before you arrive so you have an estimate going in, not a surprise going out. If you do not have insurance, ask about our in-house savings plan." Right column: a small grid of accepted-insurance chips in DM Sans uppercase letterspaced charcoal: Delta Dental · Cigna · MetLife · Aetna · United · BCBS · Guardian · Humana. Each chip is a soft `--teal-pale` background pill with charcoal text, 6px radius, padding `0.5rem 0.9rem`.

9. **CTA.** `--cream` bg. Centered, generous padding. Eyebrow coral "BOOK YOUR APPOINTMENT". H2 DM Serif Display charcoal "We Have a Chair Open for You This Week." Sub DM Sans warm-gray max-width 540px: "Same-day appointments are usually available for emergencies. Routine cleanings book about a week out. We will work around your schedule, including early mornings and Saturday cleanings." Coral CTA "Book Your Appointment". Below: small line "Or call (972) 555-0149 · 5701 Legacy Drive, Suite 240, Plano".

10. **Footer.** Charcoal-soft bg `#34556A`. Four columns. Column 1: small teal-and-coral logo lockup, "Ridgeview Dental", and a one-liner "Modern, comfortable family dentistry in West Plano." Column 2: hours `Mon-Thu 7am-6pm · Fri 7am-2pm · Sat 8am-1pm`. Column 3: contact (address, phone, email `hello@ridgeviewdental.com`). Column 4: a small set of links (Patient Forms, Financing, Insurance, Privacy) in DM Sans, plus `Website by DBJ Technologies` in teal letterspaced. Bottom band: thin teal hairline, `© 2026 Ridgeview Dental. All rights reserved.` left, `Plano, TX` right, both in `--warm-gray-light`.

### Distinction guardrails (must NOT resemble)

- PI Law (cool navy + brass gold + Playfair): your dark in the footer is a warm-leaning charcoal-soft (`#34556A`), not navy. Your accent is teal + coral, not gold. Your tone is warm/friendly, not institutional/grave.
- Med Spa (blush + plum + rose + Bodoni Moda): both are light. Differentiate: your accents are TEAL + CORAL (cool blue-green plus warm orange-red), entirely different from blush/plum/rose. Your serif is DM Serif Display (modern slab-ish), not Bodoni's high-contrast didone. Your treatment cards live in a 3x2 grid; med spa uses a magazine spread with pull quotes. Do not adopt the editorial pull-quote pattern here.
- HVAC (steel-blue + orange): both have a warm orange-ish accent. CRITICAL DIFFERENTIATION: your coral is `#E76F51` (warm orange-red, friendlier saturation), HVAC's orange is `#F97316` (vivid pure orange). Coral is used SPARINGLY here on CTA + a few highlights; HVAC slathers orange across emergency strips. Your bg is bright white; HVAC is dark steel-blue.
- Restaurant (espresso + burgundy): completely different (dark vs light, burgundy vs teal-coral, Fraunces vs DM Serif Display).

### Verification

1. Single self-contained HTML, all CSS in `<style>`.
2. Required `<meta>` tags present.
3. Google Font `<link>` for DM Serif Display + DM Sans with `&display=swap`.
4. Zero `<script>` tags.
5. `Website by DBJ Technologies` links to https://dbjtechnologies.com.
6. No DBJ branding outside the footer credit.
7. Page over 1600px at desktop.
8. 768px responsive media query stacks correctly.
9. `grep -c $'\xe2\x80\x94' public/templates/dental-practice.html` returns 0.
10. The first-visit timeline is a horizontal connected sequence at desktop and a vertical stack at mobile.
11. The 12px card radius is unique to this template · confirm you used 12px specifically.
12. Visually distinct from all other templates per guardrails above.

Do NOT add to work-data.ts. Do NOT modify any existing files. Do NOT commit.

Report what you created with a brief design summary.
```
