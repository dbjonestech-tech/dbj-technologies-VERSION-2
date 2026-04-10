import { PRICING_TIERS } from "./constants";

/* ─── EXTENDED PRICING DATA ────────────────────────── */

export interface PricingDetail {
  slug: string;
  tierName: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  idealFor: string[];
  whatsIncluded: { title: string; description: string }[];
  timeline: string;
  revisions: string;
  support: string;
  addOns: { title: string; price: string; description: string }[];
  faq: { question: string; answer: string }[];
}

export const PRICING_DETAILS: PricingDetail[] = [
  {
    slug: "starter",
    tierName: "Starter",
    heroTitle: "The Starter Phase:",
    heroHighlight: "Launch With Precision.",
    heroDescription:
      "Everything a business needs to go live with a production-grade, high-performance web presence. No templates, no bloat. Just clean, engineered code built for your specific goals.",
    idealFor: [
      "Businesses launching their first production-grade website",
      "Founders and solo operators who need a professional digital presence",
      "Startups validating a product or service in-market",
      "Local businesses upgrading from DIY builders or agency templates",
    ],
    whatsIncluded: [
      { title: "Up to 5 Production Pages", description: "Home, About, Services, Contact, and one additional page, all designed and engineered from scratch with Next.js." },
      { title: "Mobile-First Responsive Engineering", description: "Engineered mobile-first and tested on real devices. Your site works perfectly across all screen sizes." },
      { title: "Technical SEO & Structured Data", description: "Meta tags, sitemap, robots.txt, Open Graph tags, and JSON-LD structured data so search engines can find and index your site." },
      { title: "Contact Form with Validation", description: "A functional, validated contact form with server-side handling that sends submissions directly to your email." },
      { title: "Performance Baseline: 90+ Lighthouse", description: "Image optimization, code splitting, and rendering strategy tuned to guarantee a 90+ Lighthouse baseline." },
      { title: "Collaborative Design Review", description: "A focused design review cycle to align on visual direction and refine details before final build." },
    ],
    timeline: "3 to 4 weeks from kickoff to launch",
    revisions: "Collaborative design review cycle included",
    support: "30 days of post-launch support at no additional cost",
    addOns: [
      { title: "CMS Integration", price: "+$500", description: "Add a headless CMS (Sanity, Strapi, or Contentful) so you can update content without touching code." },
      { title: "Additional Pages", price: "+$300/page", description: "Extra pages beyond the included 5, engineered to match the same architectural standard." },
      { title: "Custom Animation Systems", price: "+$400", description: "Scroll-triggered animations, hover effects, and micro-interactions with Framer Motion." },
      { title: "Analytics Setup", price: "+$200", description: "Vercel Analytics or Google Analytics with conversion tracking configured and tested." },
    ],
    faq: [
      { question: "Is the Starter phase right for me?", answer: "If you need a clean, production-grade website with up to 5 pages and don't require a CMS or complex custom features, Starter is the ideal starting point. It's designed to get you live quickly with engineering-grade quality." },
      { question: "Can I upgrade to Professional later?", answer: "Absolutely. Every Starter engagement is built on the same modern architecture as Professional and Enterprise phases. Adding pages, CMS, or advanced features later is straightforward with no rewrites needed." },
      { question: "What if I need more design review cycles?", answer: "Additional review cycles are available for $400 each. Most Starter clients find that one focused cycle is sufficient when the discovery phase is thorough." },
    ],
  },
  {
    slug: "professional",
    tierName: "Professional",
    heroTitle: "The Professional Phase:",
    heroHighlight: "Engineered for Growth.",
    heroDescription:
      "For growing businesses that need advanced architecture, CMS-driven content, custom interaction design, and priority support. This is the most common engagement tier.",
    idealFor: [
      "Growing companies that need more than a basic website",
      "Businesses requiring CMS-managed content and blog systems",
      "Companies that want custom animation and interaction design",
      "Businesses that need priority support and faster iteration cycles",
    ],
    whatsIncluded: [
      { title: "Up to 15 Production Pages", description: "A comprehensive site with service pages, landing pages, blog templates, and more, all custom engineered." },
      { title: "Mobile-First Responsive Engineering", description: "Pixel-perfect engineering across all devices with custom breakpoint optimization and real-device testing." },
      { title: "Advanced SEO, Analytics & Schema", description: "Complete SEO setup, schema markup, analytics integration, conversion tracking, and search console configuration." },
      { title: "Headless CMS Integration", description: "Full content management system so you can update pages, blog posts, and media without developer help." },
      { title: "Custom Animation & Interaction Systems", description: "Scroll-triggered animations, parallax effects, hover states, and micro-interactions engineered with Framer Motion." },
      { title: "Collaborative Design Review Cycles", description: "Multiple collaborative review cycles to ensure every detail meets your standards. No arbitrary 'revision rounds.'" },
      { title: "Performance Target: 95+ Lighthouse", description: "Advanced optimization including image CDN, code splitting, prefetching, and 95+ Lighthouse scores guaranteed." },
      { title: "Priority Support Channel (48h SLA)", description: "Post-launch issues and questions addressed within 48 hours through a dedicated support channel." },
    ],
    timeline: "5 to 8 weeks from kickoff to launch",
    revisions: "Collaborative design review cycles included throughout",
    support: "30 days of priority post-launch support, then optional maintenance retainer",
    addOns: [
      { title: "Blog System", price: "+$800", description: "Full blog with categories, tags, author pages, and RSS feed, all CMS-managed." },
      { title: "E-Commerce Integration (up to 50 products)", price: "+$2,000", description: "Shopify or custom e-commerce integration with payment processing and product management." },
      { title: "Multi-Language Support", price: "+$1,200", description: "i18n setup with language switcher and CMS-managed translations." },
      { title: "Custom API Integrations", price: "+$600/integration", description: "CRM, marketing automation, scheduling, or any third-party API connected to your site." },
    ],
    faq: [
      { question: "Why is Professional the most common engagement?", answer: "It hits the sweet spot for most businesses. Enough pages for a comprehensive site, CMS so you stay independent, custom animations that make a strong impression, and priority support for peace of mind." },
      { question: "What CMS do you recommend?", answer: "For most Professional engagements, I recommend Sanity for its flexibility and developer experience. I also work with Strapi, Contentful, and headless WordPress depending on your needs." },
      { question: "Can I add e-commerce later?", answer: "Yes. The Professional architecture supports adding e-commerce functionality as an upgrade at any time without rebuilding the foundation." },
    ],
  },
  {
    slug: "enterprise",
    tierName: "Enterprise",
    heroTitle: "The Enterprise Phase:",
    heroHighlight: "Full-Scale Digital Engineering.",
    heroDescription:
      "Custom application engineering, cloud infrastructure, dedicated architectural oversight, and white-glove delivery. For organizations that need technology to be a competitive advantage.",
    idealFor: [
      "Organizations needing custom web applications or SaaS platforms",
      "Companies requiring cloud infrastructure and DevOps engineering",
      "Businesses with complex integrations and data requirements",
      "Businesses that need dedicated architectural oversight throughout the engagement",
    ],
    whatsIncluded: [
      { title: "Unlimited Pages & Application Views", description: "No page limits. I build as many pages, views, and application screens as your project requires." },
      { title: "Custom Full-Stack Application", description: "Full-stack application engineering with user authentication, dashboards, data management, and custom business logic." },
      { title: "API Design & Backend Engineering", description: "Frontend, backend, API design, and database architecture, all typed end-to-end and tested at every boundary." },
      { title: "Cloud Infrastructure & DevOps", description: "Production-grade cloud architecture on AWS or Vercel with auto-scaling, security hardening, and monitoring." },
      { title: "CI/CD Pipeline & Staging Environments", description: "Automated build, test, and deployment pipelines with staging environments and rollback capabilities." },
      { title: "Dedicated Architectural Oversight", description: "I serve as your principal architect throughout the engagement. One point of contact, one standard of quality." },
      { title: "SLA & Uptime Guarantees", description: "Contractual uptime guarantees with defined response times and escalation procedures." },
      { title: "Priority Support with Guaranteed Response Times", description: "Rapid-response support with guaranteed SLA response times for critical issues." },
    ],
    timeline: "8 to 20 weeks depending on scope (defined during paid discovery)",
    revisions: "Continuous collaborative iteration within agreed project scope",
    support: "Dedicated ongoing support with custom SLA",
    addOns: [
      { title: "AI/ML Integration", price: "Custom", description: "AI-powered features including recommendations, natural language processing, and predictive analytics." },
      { title: "Data Migration", price: "Custom", description: "Migration of existing data, users, and content from legacy systems with validation and rollback plans." },
      { title: "Training & Documentation", price: "Included", description: "Comprehensive documentation and hands-on training so you can manage and extend the platform." },
      { title: "Ongoing Managed Services", price: "Custom", description: "Fully managed infrastructure, updates, monitoring, and feature development on a monthly retainer." },
    ],
    faq: [
      { question: "How is Enterprise pricing determined?", answer: "Enterprise engagements are scoped and priced based on a paid discovery phase. I define the technical requirements, architecture, timeline, and deliverables, then provide a detailed, fixed-price proposal." },
      { question: "Do I get dedicated attention?", answer: "Yes. As a solo principal architect, every Enterprise client gets my direct attention throughout the engagement. No junior handoffs, no rotating resources, no communication layers." },
      { question: "What does the SLA cover?", answer: "SLAs define uptime guarantees (typically 99.9%), response times for different severity levels, and escalation procedures. Terms are customized based on your operational requirements." },
    ],
  },
];

export function getPricingBySlug(slug: string): PricingDetail | undefined {
  return PRICING_DETAILS.find((p) => p.slug === slug);
}

export function getPricingSlugs(): string[] {
  return PRICING_DETAILS.map((p) => p.slug);
}

export function getPricingTierByName(name: string) {
  return PRICING_TIERS.find((t) => t.name === name);
}
