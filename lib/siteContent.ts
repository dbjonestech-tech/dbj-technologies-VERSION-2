import {
  Globe,
  Smartphone,
  Cloud,
  Palette,
  ShoppingCart,
  Search,
  Code2,
  Server,
  Shield,
  Zap,
  Users,
  BarChart3,
  Gauge,
  Layers,
  Database,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
 * SITE CONTENT — SINGLE SOURCE OF TRUTH
 * ═══════════════════════════════════════════════════════
 * All user-facing copy lives here. Components import
 * and render — they never define their own text.
 * ═══════════════════════════════════════════════════════ */

/* ─── INTERFACES ───────────────────────────────────── */

export interface HeroContent {
  badge: string;
  headlineWords: string[];
  headlineAccent: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  techTicker: string[];
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface ServiceItem {
  icon: LucideIcon;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface ValueItem {
  title: string;
  description: string;
}

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  name: string;
  description: string;
  price: number | null;
  timeline: string;
  popular: boolean;
  features: PricingFeature[];
  cta: string;
}

export interface PricingAddon {
  name: string;
  description: string;
  price: number;
  unit: string;
  cta: string;
  href: string;
}

export interface PortfolioItem {
  title: string;
  category: string;
  description: string;
  tags: string[];
  gradient: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: "General" | "Technical" | "Billing" | "Support";
}

export interface AboutPrinciple {
  title: string;
  text: string;
}

export interface CTADefaults {
  heading: string;
  highlight: string;
  description: string;
  buttonText: string;
}

/* ─── HERO ─────────────────────────────────────────── */

export const HERO_CONTENT: HeroContent = {
  badge: "Accepting New Engagements",
  headlineWords: ["Architect", "The"] /* no-cache */,
  headlineAccent: "Impossible.",
  subheading:
    "Websites and digital systems that generate trust, capture leads, and grow revenue. Built by a solo principal architect in Dallas, TX.",
  primaryCta: { label: "Start a Project", href: "/contact" },
  secondaryCta: { label: "See What We Build", href: "/work" },
  techTicker: ["React", "Next.js", "TypeScript", "Node.js", "Vercel"],
};

/* ─── STATS ────────────────────────────────────────── */

export const STATS: StatItem[] = [
  { value: 90, suffix: "+", label: "Lighthouse Score Baseline" },
  { value: 100, suffix: "%", label: "Client Code Ownership" },
  { value: 30, suffix: "-day", label: "Post-Launch Support" },
  { value: 4, suffix: "-phase", label: "Delivery Framework" },
];

/* ─── SERVICES ─────────────────────────────────────── */

export const SERVICES: ServiceItem[] = [
  {
    icon: Globe,
    slug: "frontend-architecture",
    title: "Website Design & Development",
    tagline: "Custom websites built for speed, trust, and conversion. Not templates.",
    description:
      "I design and implement component-driven frontend architectures using Next.js, React, and TypeScript. Every system ships with strict type safety, server-side rendering strategies, and sub-second load times as baseline requirements.",
    features: [
      "Next.js App Router & Server Components",
      "Design system & component library engineering",
      "SSR, SSG, and ISR rendering strategies",
      "Accessibility-first (WCAG AA+) by default",
    ],
  },
  {
    icon: Server,
    slug: "backend-systems",
    title: "Business Systems & Integrations",
    tagline: "Connect your tools, automate workflows, and let the system handle the busywork.",
    description:
      "I build backend systems that are typed end-to-end, rigorously tested, and designed for zero-downtime deployments. From RESTful APIs to real-time WebSocket services, every endpoint is instrumented, documented, and ready for scale.",
    features: [
      "Node.js, Python & Go microservices",
      "REST & GraphQL API design",
      "Authentication & authorization systems",
      "Real-time data with WebSockets & SSE",
    ],
  },
  {
    icon: Cloud,
    slug: "cloud-infrastructure",
    title: "Hosting & Reliability",
    tagline: "Your site stays online, loads fast everywhere, and handles traffic spikes without breaking.",
    description:
      "I architect cloud-native infrastructure on AWS, Vercel, and GCP that auto-scales under load, recovers from failure automatically, and costs only what you use. Every deployment is repeatable, monitored, and hardened from day one.",
    features: [
      "AWS, Vercel & GCP architecture",
      "Docker & container orchestration",
      "CI/CD pipeline automation",
      "Monitoring, alerting & incident response",
    ],
  },
  {
    icon: Palette,
    slug: "interface-engineering",
    title: "User Experience & Conversion",
    tagline: "Every page guides visitors toward calls, forms, quotes, or purchases.",
    description:
      "I engineer interfaces where every animation serves a purpose, every transition communicates state, and every interaction feels instantaneous. Design systems, micro-interactions, and scroll-driven narratives built with production-grade motion libraries.",
    features: [
      "Framer Motion & GSAP animation systems",
      "Interactive prototypes & design QA",
      "Design system implementation",
      "Responsive, device-tested interfaces",
    ],
  },
  {
    icon: ShoppingCart,
    slug: "ecommerce-platforms",
    title: "E-Commerce & Custom Applications",
    tagline: "Online stores, booking systems, client portals, and business tools that work.",
    description:
      "I build commerce platforms where every millisecond of load time impacts revenue. From headless Shopify storefronts to custom checkout flows with Stripe, every element is optimized for conversion rate and average order value.",
    features: [
      "Headless Shopify & custom storefronts",
      "Stripe & payment gateway engineering",
      "Inventory sync & order management",
      "Conversion-optimized checkout flows",
    ],
  },
  {
    icon: Gauge,
    slug: "web-performance",
    title: "Speed & Search Performance",
    tagline: "Fast sites rank higher, convert better, and cost less to run.",
    description:
      "I audit, diagnose, and resolve performance bottlenecks at every layer, from render-blocking resources and layout shifts to slow server responses and unoptimized assets. Every engagement delivers measurable, auditable improvements to Core Web Vitals.",
    features: [
      "Core Web Vitals optimization (LCP, CLS, INP)",
      "Bundle analysis & code splitting",
      "Image, font & asset optimization",
      "Lighthouse & WebPageTest audit reports",
    ],
  },
];

/* ─── PROCESS STEPS ────────────────────────────────── */

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Diagnose",
    description:
      "I learn your business, your customers, and your goals before proposing anything. No assumptions.",
  },
  {
    step: "02",
    title: "Architect",
    description:
      "I design the system around your actual needs, not a template. You approve the plan before any code is written.",
  },
  {
    step: "03",
    title: "Engineer",
    description:
      "I build it right the first time. Every feature is tested and reviewed before you see it.",
  },
  {
    step: "04",
    title: "Harden",
    description:
      "Performance testing, security review, and monitoring setup. Your site launches ready for real traffic.",
  },
];

/* ─── PATHLIGHT CTA (HOMEPAGE SECTION) ─────────────── */

export const PATHLIGHT_CTA_CONTENT = {
  eyebrow: "Free tool",
  heading: "Pathlight",
  tagline:
    "Not sure your website is working for you? Pathlight scans your site and shows you where you may be losing trust, leads, and revenue. Free. Results in minutes.",
  buttonLabel: "Scan My Website",
  buttonHref: "/pathlight",
};

/* ─── TECH STACK ───────────────────────────────────── */

export const TECH_STACK = [
  "React", "Next.js", "TypeScript", "Node.js", "Python",
  "AWS", "Docker", "PostgreSQL", "MongoDB", "Redis",
  "Tailwind CSS", "Figma", "Vercel", "GraphQL", "Turborepo",
];

/* ─── VALUES ───────────────────────────────────────── */

export const VALUES: ValueItem[] = [
  {
    title: "Precision Over Speed",
    description:
      "I never ship anything I wouldn't stake my reputation on. Every deliverable meets the same standard I hold for my own systems.",
  },
  {
    title: "Radical Transparency",
    description:
      "No black boxes. You see every architectural decision, every timeline update, and every line of code in real time.",
  },
  {
    title: "Performance as a Discipline",
    description:
      "Every millisecond matters. I engineer for speed because your users, your revenue, and your search rankings demand it.",
  },
  {
    title: "Ownership, Not Dependency",
    description:
      "When the project is done, you walk away with everything. No monthly platform fees, no proprietary CMS you can't leave, no dependency on me to keep the lights on.",
  },
];

/* ─── ABOUT ────────────────────────────────────────── */

export const ABOUT_CONTENT = {
  badge: "About",
  headline: "The Anti-Agency",
  headlineAccent: "Model.",
  description:
    "I'm Joshua Jones, a principal architect in Dallas, TX. I started DBJ Technologies because most businesses get sold agency overhead, junior developers, and template sites when what they actually need is one experienced architect who builds the system right the first time.",
  principles: [
    {
      title: "I build with the tools I'd choose for my own products",
      text: "Next.js, React, TypeScript, Tailwind, Vercel. The same stack powering the best product teams in the world. Your project benefits from the exact same tooling, not a watered-down agency version.",
    },
    {
      title: "Every engagement ships with full source code and documentation",
      text: "You own everything I build. Full source code, deployment guides, environment configs, and handoff documentation. No lock-in, no hostage situations, no proprietary platforms you can't leave.",
    },
    {
      title: "I scope before I build",
      text: "Every engagement begins with a paid discovery phase that produces a clear scope, timeline, and fixed price. Development doesn't start until you've approved the plan. No hourly surprises, no scope creep.",
    },
  ] as AboutPrinciple[],
  ctaHeading: "Want to Know More?",
  ctaHighlight: "Let's Talk.",
  ctaDescription:
    "I'm happy to walk through my process, show you relevant work, or just answer questions. No pitch deck required.",
  ctaButton: "Get in Touch",
};

/* ─── ABOUT STORY ──────────────────────────────────── */

export const ABOUT_STORY = {
  whyThisWay: {
    heading: "Why I Work This Way",
    body: "I left the consultancy world because I watched smart decisions get buried by politics and ego. Leadership who had no business touching technology were blocking engineers from doing their best work. I sat through a 140-page website rebuild where every improvement had to survive a committee of people who didn’t understand what they were approving. I knew I could serve clients better alone than a room full of titles ever would.",
  },
  whatYouGet: {
    heading: "What You Actually Get",
    body: "White glove is overused. I mean it literally. I obsess over details most developers never notice, because I come from a hospitality mindset, not just an engineering one. The smallest interaction, the fastest response, the pixel nobody else would catch. That’s what turns a good product into something that makes your client say \"wow.\" I’m on call for my clients. Not during business hours. Not until the invoice clears. Always. I don’t disappear after the project ships. I built it, I know it inside out, and I’m a phone call away whether it’s been three days or three years.",
  },
  howIBuild: {
    heading: "How I Build",
    body: "I don’t ship until it’s right. That means painstaking hours, iteration after iteration, hammering at every detail until nothing slips through. I’ll rebuild a section five times if the first four aren’t good enough. Most developers ship \"good enough\" and move on. I stay until it’s done. AI is part of my workflow, not a shortcut. I use it to go deeper, move faster, and catch what I’d otherwise miss, but every decision, every line, every pixel still runs through a human standard: mine.",
  },
  whoThisIsFor: {
    heading: "Who This Is For",
    body: "I work with business owners who need one thing built right, not an agency retainer that never ends. I choose my clients carefully and I’m selective about the work I take on. If you need a website, a product, or a digital system and you want to own it completely when it’s done, we should talk.",
  },
  personal: "Based in Dallas. I seek to love Jesus. Husband to Sarah, a licensed professional counselor. Father of two. We live on a farm where we raise sheep and are building an orchard and vineyard. Professional musician, conversational in French and Spanish, and currently writing a novel. I build wooden structures for fun.",
};

/* ─── PORTFOLIO / WORK ─────────────────────────────── */

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: "Frontend Architecture",
    category: "Core Discipline",
    description:
      "Component-driven systems with Next.js, React, and TypeScript, engineered for sub-second renders and long-term maintainability.",
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    title: "Backend Infrastructure",
    category: "Core Discipline",
    description:
      "API design, database architecture, and cloud-native services, typed end-to-end and built for zero-downtime deployments.",
    tags: ["Node.js", "PostgreSQL", "AWS", "Docker"],
    gradient: "from-violet-600 to-pink-500",
  },
  {
    title: "Performance Engineering",
    category: "Core Discipline",
    description:
      "Core Web Vitals optimization, bundle analysis, and rendering strategy. Turning measurable audits into measurable speed gains.",
    tags: ["Lighthouse", "WebPageTest", "Vercel", "Edge"],
    gradient: "from-emerald-600 to-teal-500",
  },
];

/* ─── PRICING ──────────────────────────────────────── */

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    description:
      "Perfect for small businesses and personal brands launching their first professional site.",
    price: 4500,
    timeline: "3–4 weeks",
    popular: false,
    features: [
      { text: "Up to 5 pages", included: true },
      { text: "Responsive design", included: true },
      { text: "Basic SEO setup", included: true },
      { text: "Contact form", included: true },
      { text: "2 rounds of revisions", included: true },
      { text: "CMS integration", included: false },
      { text: "Custom animations", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
  },
  {
    name: "Professional",
    description:
      "For growing companies that need a high-performance site with advanced features and integrations.",
    price: 9500,
    timeline: "5–8 weeks",
    popular: true,
    features: [
      { text: "Up to 15 pages", included: true },
      { text: "Responsive design", included: true },
      { text: "Advanced SEO & analytics", included: true },
      { text: "CMS integration", included: true },
      { text: "Custom animations & interactions", included: true },
      { text: "3 rounds of revisions", included: true },
      { text: "Performance optimization", included: true },
      { text: "Priority support (48h)", included: true },
    ],
    cta: "Go Professional",
  },
  {
    name: "Enterprise",
    description:
      "Full-scale digital transformation with dedicated engineering, custom infrastructure, and white-glove service.",
    price: null,
    timeline: "8–16 weeks",
    popular: false,
    features: [
      { text: "Unlimited pages", included: true },
      { text: "Custom web application", included: true },
      { text: "Full-stack development", included: true },
      { text: "Cloud infrastructure setup", included: true },
      { text: "CI/CD & DevOps pipeline", included: true },
      { text: "Dedicated project manager", included: true },
      { text: "SLA & uptime guarantee", included: true },
      { text: "24/7 priority support", included: true },
    ],
    cta: "Contact Us",
  },
];

export const PRICING_ADDONS: PricingAddon[] = [
  {
    name: "Hourly Consulting",
    description:
      "Need a specific fix, performance audit, code review, or migration? Book dedicated engineering hours.",
    price: 175,
    unit: "per hour",
    cta: "Book Hours",
    href: "/contact",
  },
  {
    name: "Maintenance & Support",
    description:
      "Ongoing updates, monitoring, backups, security patches, and priority support to keep your site running flawlessly.",
    price: 299,
    unit: "per month",
    cta: "Start Retainer",
    href: "/contact",
  },
];

/* ─── FAQ ──────────────────────────────────────────── */

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: "General",
    question: "What kind of clients does DBJ Technologies work with?",
    answer:
      "I work with growth-stage companies, funded startups, and established businesses that need technology built correctly the first time. The $4,500 minimum engagement (Starter tier) filters for clients who value engineering quality over the cheapest bid.",
  },
  {
    category: "General",
    question: "How long does a typical engagement take?",
    answer:
      "A 5 to 10 page production site ships in 4 to 6 weeks. Complex applications with custom backends typically run 8 to 16 weeks. I provide a detailed timeline during the paid discovery phase before any commitment.",
  },
  {
    category: "General",
    question: "Do you work with clients outside of Texas?",
    answer:
      "Yes. While I'm based in Dallas, I work with clients across the US and internationally. All project management, design reviews, and communication happens digitally through structured async workflows.",
  },
  {
    category: "Technical",
    question: "What is your core technology stack?",
    answer:
      "My primary stack is Next.js, React, TypeScript, Node.js, and Tailwind CSS. For data layers, I use PostgreSQL, MongoDB, and Redis. I deploy on Vercel, AWS, and GCP depending on the architectural requirements of each engagement.",
  },
  {
    category: "Technical",
    question: "Will my site be fully responsive?",
    answer:
      "Every build is engineered mobile-first and tested on real devices, not just browser emulators. I test across iOS, Android, tablets, and desktop at every breakpoint.",
  },
  {
    category: "Technical",
    question: "Do you handle hosting, domains, and DNS?",
    answer:
      "Yes. I handle deployment to Vercel, AWS, or your preferred infrastructure, plus domain registration, DNS configuration, SSL certificates, and email routing.",
  },
  {
    category: "Technical",
    question: "Can you integrate with existing tools and APIs?",
    answer:
      "Yes. I regularly integrate with CRMs (HubSpot, Salesforce), payment processors (Stripe, PayPal), analytics platforms, and custom APIs. If it has a documented interface, I can connect it.",
  },
  {
    category: "Billing",
    question: "How does your pricing work?",
    answer:
      "We offer fixed-price project packages with clear deliverables and timelines. Every project begins with a paid discovery phase that includes a detailed scope, timeline, and cost breakdown before development begins. We also offer hourly consulting for specific needs and monthly retainers for ongoing maintenance and support.",
  },
  {
    category: "Billing",
    question: "What are the payment terms?",
    answer:
      "Standard engagements require 50% upon scope approval and 50% at final delivery. Larger engagements are structured around milestone-based payments. I accept bank transfers, credit cards, and checks.",
  },
  {
    category: "Billing",
    question: "Are there ongoing costs after launch?",
    answer:
      "Hosting and domain fees are minimal (typically $20–50/month). We offer a Maintenance & Support retainer at $299/month that includes updates, monitoring, backups, security patches, and priority support.",
  },
  {
    category: "Support",
    question: "What happens after my project launches?",
    answer:
      "Every engagement includes 30 days of post-launch support at no additional cost. After that, I offer monthly maintenance retainers or ad-hoc support at my standard rate.",
  },
  {
    category: "Support",
    question: "How do I request changes after launch?",
    answer:
      "Retainer clients submit requests through a dedicated support channel and receive responses within 24 to 48 hours. I also accept ad-hoc requests via email for one-off updates.",
  },
];

/* ─── CTA DEFAULTS ─────────────────────────────────── */

export const CTA_DEFAULTS: CTADefaults = {
  heading: "Ready to Build",
  highlight: "Something Exceptional?",
  description:
    "Tell me about your project. No pitch deck, no pressure. Just a direct conversation about what you need and how I can engineer it.",
  buttonText: "Start a Conversation",
};

/* ─── BUDGET OPTIONS (CONTACT FORM) ────────────────── */

export const BUDGET_OPTIONS = [
  "$4,500 to $10,000",
  "$10,000 to $25,000",
  "$25,000+",
  "Not sure yet",
];

export const PROJECT_TYPE_OPTIONS = [
  "New Website",
  "Website Redesign",
  "Web Application",
  "E-Commerce Platform",
  "Performance Audit",
  "Infrastructure & DevOps",
  "Other",
];
