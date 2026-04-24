# DBJ Technologies — Official Website

> **Architect The Impossible.**
> Bespoke digital engineering studio website built with Next.js 16, TypeScript, Tailwind CSS, and Framer Motion.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 3.4
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Email:** Nodemailer (SMTP)
- **Fonts:** Syne (display), Outfit (body), JetBrains Mono (code)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/dbj-technologies.git
cd dbj-technologies

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your SMTP credentials

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP mail server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP mail server port | `587` |
| `SMTP_USER` | SMTP username/email | — |
| `SMTP_PASS` | SMTP password or app password | — |
| `CONTACT_EMAIL` | Where contact form submissions are sent | `joshua@dbjtechnologies.com` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for metadata | `https://dbjtechnologies.com` |

> **Note:** The contact form works without SMTP credentials during development — submissions are logged to the console instead.

---

## Project Structure

```
app/                    # Next.js App Router pages
├── page.tsx            # Home
├── about/              # About page
├── services/           # Services page
├── websites/           # Portfolio page
├── pricing/            # Pricing page
├── faq/                # FAQ page
├── contact/            # Contact page
├── api/contact/        # Contact form API endpoint
└── globals.css         # Global styles & design system

components/
├── layout/             # Navbar, Footer
├── ui/                 # Reusable UI components
├── sections/           # Page sections (Hero, CTA, Stats, etc.)
└── effects/            # Visual effects (particles, spotlight, etc.)

lib/
├── constants.ts        # ALL site content centralized
└── utils.ts            # Utility functions
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy — zero config needed

```bash
# Or deploy via CLI
npx vercel --prod
```

---

## Customization

All site content (copy, services, pricing, FAQ, team members, etc.) is centralized in `lib/constants.ts`. Update this file to customize the site without touching any components.

### Adding pages

1. Create a new folder in `app/` with a `page.tsx`
2. Add the route to `NAV_LINKS` in `lib/constants.ts`
3. Add the route to `app/sitemap.ts`

### Replacing placeholder images

Portfolio project cards use gradient placeholders. Replace with real images by:
1. Adding images to `public/`
2. Using `next/image` in the portfolio cards (`app/websites/page.tsx`)

### OG Image

Replace `public/og-image.png` with your own 1200×630 Open Graph image.

---

## Performance Targets

- Lighthouse Performance: 95+
- Lighthouse Accessibility: 95+
- Lighthouse Best Practices: 100
- Lighthouse SEO: 100

---

## License

Proprietary — © 2026 DBJ Technologies. All rights reserved.
