/* ─── WORK / PROJECTS ──────────────────────────────── */

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectSection {
  heading: string;
  body: string;
}

export interface ProjectTechDetail {
  name: string;
  reason: string;
}

export interface ProjectDetail {
  slug: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  liveUrl: string;
  metrics: ProjectMetric[];
  techStack: string[];
  notable: string;
  image: string;
  heroDescription: string;
  sections: ProjectSection[];
  techDetails: ProjectTechDetail[];
  timeline: string;
  ctaText: string;
  ctaHref: string;
}

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "star-auto-service",
    name: "Star Auto Service",
    description:
      "Production website for a 25-year Richardson, TX auto repair shop. Perfect Lighthouse scores across the board, automated lead capture, and local SEO architecture — built and deployed from zero in a single focused session.",
    category: "Client Project",
    gradient: "from-blue-600 to-cyan-500",
    liveUrl: "https://star-auto-service.vercel.app",
    metrics: [
      { label: "Performance", value: "100" },
      { label: "Accessibility", value: "100" },
      { label: "SEO", value: "100" },
    ],
    techStack: ["Next.js 16", "Tailwind CSS 4", "Resend", "Google Analytics"],
    notable:
      "Every inquiry hits the owner's inbox instantly. Every page loads in under a second. Every Lighthouse category scores 100.",
    image: "/images/case-studies/star-auto-desktop.webp",
    heroDescription:
      "A complete digital presence for a family-owned, ASE-certified auto repair shop serving Richardson, TX since 1998. Engineered from zero to production with perfect Lighthouse scores, automated email delivery, and local SEO architecture that puts Miguel's shop in front of every nearby search.",
    sections: [
      {
        heading: "The Client",
        body: "Miguel Ibarra runs The Star Auto Service — a family-owned, ASE-certified auto repair shop in Richardson, TX that's been serving the community since 1998. With a 4.8-star rating, bilingual service, and NAPA Auto Care certification, the shop had decades of trust built in person. What it didn't have was a web presence that matched.",
      },
      {
        heading: "The Challenge",
        body: "Every local auto repair search in Richardson returns shops with modern websites, online booking, and Google reviews front and center. Without a professional site, Star Auto was invisible to anyone who didn't already drive past the shop. The goal was clear: build a site that ranks for local searches, converts visitors to phone calls, and reflects the quality of the work Miguel's team actually delivers.",
      },
      {
        heading: "The Approach",
        body: "Mobile-first, because over 60% of local service searches happen on phones. Sub-second load times, because every extra second of load time costs conversions. Local SEO from day one — not as an afterthought. The site was architected around a single conversion goal: get the visitor to call (972) 231-2886 or submit the contact form. Every design decision serves that goal.",
      },
      {
        heading: "What I Delivered",
        body: "A 4-page production website with hero imagery, service breakdowns, about page with trust signals, and a contact form wired to automated email delivery via Resend. JSON-LD structured data for local business schema. Google Analytics for traffic visibility. Security headers, custom 404 page, skip navigation for accessibility, and Cloudflare DNS for speed and protection. Every page responsive across all device sizes.",
      },
    ],
    techDetails: [
      {
        name: "Next.js 16",
        reason:
          "Server-side rendering for instant first paint and SEO-friendly HTML. App Router with static generation for zero-latency page loads.",
      },
      {
        name: "Tailwind CSS 4",
        reason:
          "Utility-first styling for precise, responsive design without CSS bloat. Every breakpoint tested on real devices.",
      },
      {
        name: "Resend",
        reason:
          "Transactional email API for the contact form. Every inquiry hits Miguel's inbox within seconds — no missed leads.",
      },
      {
        name: "Google Analytics",
        reason:
          "Traffic and conversion visibility from day one. Miguel can see exactly where visitors come from and what they click.",
      },
      {
        name: "Cloudflare DNS",
        reason:
          "Enterprise-grade DNS with DDoS protection, CDN caching, and global edge delivery. Professional infrastructure for a local business.",
      },
      {
        name: "JSON-LD",
        reason:
          "Structured data markup tells Google exactly what this business is, where it is, and what it does. Critical for local pack ranking.",
      },
    ],
    timeline:
      "Built and deployed from zero to production in a single focused session.",
    ctaText: "Ready for Results Like These?",
    ctaHref: "/contact",
  },
  {
    slug: "pathlight",
    name: "Pathlight",
    description:
      "The only free tool that tells a business owner what's broken on their website, what it's costing them, and what to fix first. AI-powered analysis with industry-specific revenue modeling — not generic scores.",
    category: "Internal Product",
    gradient: "from-violet-600 to-pink-500",
    liveUrl: "https://dbjtechnologies.com/pathlight",
    metrics: [
      { label: "AI Pipeline Stages", value: "5" },
      { label: "Curated Verticals", value: "206" },
      { label: "Scan Time", value: "~2 min" },
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "Claude API",
      "Inngest",
      "Neon PostgreSQL",
      "Resend",
    ],
    notable:
      "The only free tool that translates website problems into dollar signs. 206 industry benchmarks. Zero scan-to-scan variance for covered verticals.",
    image: "/images/case-studies/pathlight-landing.webp",
    heroDescription:
      "A full-stack AI platform that scans any business website and produces an intelligence report: performance audit, design analysis, revenue impact estimate, and prioritized fix list — all in minutes, for free. Built to prove that AI can deliver genuine business insight, not just summarize what you already know.",
    sections: [
      {
        heading: "The Problem",
        body: "Small business owners know their website 'could be better.' But they don't know what specifically is wrong, how much it's costing them, or what to fix first. Free tools like Lighthouse give technical scores that mean nothing to a restaurant owner. Agencies charge thousands for discovery calls before providing any insight. There's no middle ground — no tool that translates technical website problems into business language with dollar signs attached.",
      },
      {
        heading: "The Solution",
        body: "Pathlight scans any business website and delivers a complete intelligence report in minutes. Not a Lighthouse score. Not a generic SEO checklist. A full analysis: how the site looks and functions (vision analysis), how it performs technically (Lighthouse + PageSpeed Insights), what the design problems are costing in real revenue (industry-benchmarked modeling), and exactly what to fix first ranked by business impact.",
      },
      {
        heading: "How It Works",
        body: "A 5-stage AI pipeline processes every scan. Stage 1: Headless Chrome captures desktop and mobile screenshots plus a full Lighthouse audit. Stage 2: Claude's vision model analyzes design, layout, conversion psychology, and competitive positioning. Stage 3: The curated vertical database matches the business to its industry and retrieves validated deal values — no web research variance. Stage 4: Revenue impact modeling combines the deal value with estimated traffic, conversion rates, and the specific problems found. Stage 5: Remediation priorities rank every issue by business impact and implementation difficulty.",
      },
      {
        heading: "The Curated Database",
        body: "206 industry verticals with validated deal values, sourced from cross-referencing Gemini, Grok, and Claude research with human adjudication. High-confidence entries skip the AI benchmark call entirely — instant lookup, zero variance, zero token cost. A three-layer matching system (exact name, alias table, fuzzy scoring with synonym expansion) ensures accurate classification even when vision describes the business differently than the database expects.",
      },
      {
        heading: "The Report",
        body: "Every scan produces a Pathlight Score (0-100) broken into four weighted pillars: Design (35%), Performance (25%), Positioning (25%), and Findability (15%). Below the score: the top 3 fixes ranked by impact and difficulty, full desktop and mobile screenshots, and a revenue impact estimate with methodology transparency. The Ask Pathlight chatbot lets business owners ask follow-up questions about their results — and it's honest about confidence levels rather than pretending precision.",
      },
    ],
    techDetails: [
      {
        name: "Claude Sonnet 4.6",
        reason:
          "Vision analysis for design evaluation and remediation. Three separate API calls per scan with specialized prompts for each stage.",
      },
      {
        name: "Claude Haiku 4.5",
        reason:
          "Powers the Ask Pathlight chatbot. Streaming responses with full scan context injection and methodology transparency rules.",
      },
      {
        name: "Inngest",
        reason:
          "Background job orchestration with step-level retry and backoff. Each pipeline stage runs as an independent step — if one fails, others still complete.",
      },
      {
        name: "Neon PostgreSQL",
        reason:
          "Serverless Postgres for scan persistence, findings storage, and email event tracking. JSONB columns for flexible AI analysis storage.",
      },
      {
        name: "Resend",
        reason:
          "4-email nurture sequence triggered per scan. HMAC-secured unsubscribe links and RFC 8058 List-Unsubscribe headers for deliverability.",
      },
      {
        name: "Browserless",
        reason:
          "Headless Chrome API for screenshot capture and Lighthouse audits. Runs in the cloud so serverless functions don't need Chrome installed.",
      },
      {
        name: "PageSpeed Insights API",
        reason:
          "Google's own performance scoring with retry logic for transient failures. Feeds data into both the performance pillar and the revenue model.",
      },
      {
        name: "Upstash Redis",
        reason:
          "Rate limiting infrastructure. Per-IP and per-session scan throttling to prevent abuse and control API costs.",
      },
    ],
    timeline:
      "Designed, architected, and built as a solo project. Pipeline iteratively hardened across 15+ commits addressing variance, accuracy, and reliability.",
    ctaText: "Scan Your Website Free",
    ctaHref: "/pathlight",
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
