# Template Prompts · Portfolio (8 Verticals)

These are the production prompts for the static HTML mockups that appear on the Work page. Each one is a paste-ready brief for Claude Code. The prompts are tuned so the eight templates form a coherent portfolio with **zero overlap** in palette, type pair, or layout signature.

## Distinction Matrix (locked)

| # | File | Vertical | Tone | Accent | Type pair | Signature element |
|---|---|---|---|---|---|---|
| 1 | `01-pi-law.md` | Personal-injury law | Dark navy | Gold `#C9A84C` | Playfair Display + DM Sans | Verdicts ledger (tabular) |
| 2 | `02-luxury-builders.md` | Custom home builder | Warm white | Sage `#7C856B` | Cormorant Garamond + DM Sans | Project ledger + drop cap |
| 3 | `03-dental-practice.md` | General dentistry | Clean white | Teal `#2A9D8F` + Coral `#E76F51` | DM Serif Display + DM Sans | Numbered first-visit timeline |
| 4 | `04-med-spa.md` | Medical aesthetics | Soft blush | Plum `#4A2545` + Rose `#C4918E` | Bodoni Moda + Outfit | Editorial pull-quotes + drop caps |
| 5 | `05-hvac-contractor.md` | HVAC contractor | Steel-blue dark | Vivid orange `#F97316` | Barlow Condensed + Source Sans 3 | Emergency strip + city grid |
| 6 | `06-real-estate.md` | Luxury real estate | Rich black | Copper `#B87333` | Libre Caslon Display + Karla | Price-as-headline cards |
| 7 | `07-financial-advisor.md` | Wealth management | Warm charcoal | Forest green `#2D5F4A` | EB Garamond + Work Sans | Disclosure + AUM lockup |
| 8 | `08-restaurant.md` | Chef-driven restaurant | Espresso | Burgundy `#7B2D3B` + amber `#C9A96E` | Fraunces + Nunito Sans | Printed menu with dotted leaders |

## Universal ground rules (applied in every prompt)

1. Single self-contained HTML file, all CSS in `<style>` in `<head>`, no frameworks, hand-written CSS only.
2. Pure HTML + CSS. **Zero JavaScript.** No scroll listeners, no observers, no toggles. Mobile nav wraps as a static bar.
3. `<meta name="robots" content="noindex, nofollow">` and `<meta name="viewport" content="width=device-width, initial-scale=1">` required.
4. `<link>` tags for Google Fonts in `<head>` only · no `@import` (slower, blocks render).
5. Icons via Unicode glyphs only (✦ ◆ ✓ ☎). No SVG icon paths drawn by hand.
6. Footer credit: `Website by DBJ Technologies` linking to `https://dbjtechnologies.com`. Otherwise no DBJ branding.
7. Page must be at least 1600px tall at desktop width. Must not break at 768px.
8. **No em dashes anywhere.** Run `grep -c $'\xe2\x80\x94' <file>` to verify zero.
9. Respect `@media (prefers-reduced-motion: reduce)` · disable transitions in that query.
10. Every prompt includes a final verification block with the same numbered checks.

## Universal CSS quality bar (applied in every prompt)

- Define a `:root` CSS-variable design token set at the top of `<style>`. Semantic names (`--bg`, `--bg-alt`, `--accent`, `--ink`, `--muted`, `--hairline`, `--shadow-soft`).
- Type scale via `clamp()` · at minimum: `--fs-display`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-eyebrow`.
- Body text gets `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;` on `html` or `body`.
- Set `font-feature-settings: 'kern', 'liga'` globally; add `'tnum'` (tabular figures) on price/result/stat columns; add `'onum'` (oldstyle figures) where the design calls for editorial body.
- Use `font-display: swap` (Google Fonts URL adds `&display=swap`).
- Hover transitions are composite-only: `transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease, color 200ms ease`. No transitioning `background-position` or `width`.
- All section padding follows a rhythm: `padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem)`.
- Hairline rules: `1px solid var(--hairline)` where `--hairline` is the brand color at 0.06 to 0.12 opacity.
- One shadow token, used consistently. No drop-shadow stacking.
- All buttons share the same height/padding/letter-spacing within a template (consistency over variety).
- Body `line-height` between 1.7 and 1.85. Headings `line-height` between 1.05 and 1.2.

## Cross-template "do not look like" rules

Every prompt restates the previous templates' design tokens so the model can audit against them. The new template MUST NOT share a dominant background tone + accent combination with any prior template. The MUST-NOT-RESEMBLE block is included explicitly in each prompt.

## How to use

Open the prompt for the next template, copy the entire fenced block, paste into Claude Code at the project root. Wait for the "Report what you created" output. Screenshot the resulting file in a browser at 1440px and 768px widths. Commit the batch only after all eight are screenshotted.
