/* ─── SERVICE DETAIL DATA ──────────────────────────── */
/* Icons are stored as string names and resolved in client components
   to avoid serialization issues across the server/client boundary. */

export interface ServiceDetail {
  slug: string;
  iconName: string;
  title: string;
  tagline: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  longDescription: string;
  benefits: { iconName: string; title: string; description: string }[];
  process: { step: string; title: string; description: string }[];
  technologies: string[];
  deliverables: string[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
  ctaText: string;
}

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    slug: "frontend-architecture",
    iconName: "Globe",
    title: "Frontend Architecture",
    tagline: "Component systems built for scale",
    heroTitle: "Frontend Architecture That",
    heroHighlight: "Performs at Scale.",
    heroDescription:
      "I design and implement component-driven frontend architectures using Next.js, React, and TypeScript. Every system ships with strict type safety, server-side rendering strategies, and sub-second load times.",
    longDescription:
      "Your frontend is the surface area of your entire business. I build component architectures that load in under a second, render on the server where it matters, and scale from a landing page to a full application without rewrites. No templates, no page builders — just clean, hand-crafted TypeScript built for your specific goals. Every project ships with responsive engineering, SEO foundations, accessibility compliance, and performance scores that set you apart from competitors.",
    benefits: [
      { iconName: "Zap", title: "Sub-Second Load Times", description: "Server Components, static generation, and aggressive optimization deliver pages that load before users blink." },
      { iconName: "Code2", title: "Modern Architecture", description: "Built on Next.js App Router with TypeScript — the same patterns used by Vercel, Stripe, and high-growth startups." },
      { iconName: "Monitor", title: "Responsive on Every Device", description: "Engineered mobile-first and tested on real devices. Your site works perfectly on phones, tablets, and desktops." },
      { iconName: "Shield", title: "SEO & Accessibility Built-In", description: "Semantic HTML, structured data, meta optimization, and WCAG AA+ compliance are standard on every build." },
    ],
    process: [
      { step: "01", title: "Diagnose & Strategy", description: "I audit your current state, analyze competitive landscape, and define goals, sitemap, and component architecture." },
      { step: "02", title: "Prototype & Design", description: "Interactive prototypes in Figma that map every page, interaction, and responsive breakpoint before code is written." },
      { step: "03", title: "Engineer & Test", description: "Hand-coded in Next.js with TypeScript. Every component is tested for performance, accessibility, and cross-browser compatibility." },
      { step: "04", title: "Deploy & Harden", description: "Deployed to production with CI/CD, monitoring, analytics, and 30 days of post-launch support included." },
    ],
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel", "Sanity", "Turborepo", "Storybook", "Node.js", "PostgreSQL"],
    deliverables: [
      "Fully responsive, production-ready frontend",
      "Component library with documentation",
      "SEO setup with sitemap, meta tags, and structured data",
      "Performance audit with 90+ Lighthouse baseline",
      "Analytics and conversion tracking setup",
      "Full source code and deployment documentation",
    ],
    faq: [
      { question: "How long does a typical frontend project take?", answer: "A standard 5–10 page production site ships in 4–6 weeks from kickoff. More complex applications with CMS integration or custom features typically run 6–10 weeks." },
      { question: "Do you work with headless CMS platforms?", answer: "Yes. I integrate with Sanity, Strapi, Contentful, and headless WordPress. The frontend is always built with Next.js for dramatically better performance, security, and SEO." },
      { question: "What happens after launch?", answer: "Every engagement includes 30 days of complimentary post-launch support. After that, I offer monthly maintenance retainers starting at $299/month or ad-hoc support at my standard rate." },
    ],
    relatedSlugs: ["interface-engineering", "web-performance", "ecommerce-platforms"],
    ctaText: "Let's Architect Your Frontend",
  },
  {
    slug: "backend-systems",
    iconName: "Server",
    title: "Backend & API Systems",
    tagline: "APIs and services built for production",
    heroTitle: "Backend Systems That",
    heroHighlight: "Scale Under Pressure.",
    heroDescription:
      "I build backend systems that are typed end-to-end, rigorously tested, and designed for zero-downtime deployments. From RESTful APIs to real-time WebSocket services, every endpoint is production-ready.",
    longDescription:
      "Your backend is the engine behind every feature your users interact with. I build API systems and microservices that are typed from database to client, tested at every boundary, and deployed with zero-downtime strategies. Whether you need a REST API, GraphQL layer, real-time WebSocket service, or background job processor — every system is instrumented, documented, and designed to scale horizontally without rewrites.",
    benefits: [
      { iconName: "Server", title: "Type-Safe End-to-End", description: "TypeScript from database schema to API response. Catch errors at compile time, not in production." },
      { iconName: "GitBranch", title: "Zero-Downtime Deploys", description: "Blue-green deployments, health checks, and automated rollback ensure your API never goes dark during updates." },
      { iconName: "Shield", title: "Security-First Design", description: "Authentication, rate limiting, input validation, and secrets management baked into every service from day one." },
      { iconName: "Zap", title: "Real-Time Capable", description: "WebSocket and Server-Sent Events for live data when your application demands it. Built on battle-tested infrastructure." },
    ],
    process: [
      { step: "01", title: "API Specification", description: "I define endpoints, data models, authentication flows, and integration points before writing any code." },
      { step: "02", title: "Architecture Design", description: "Database schema, service boundaries, and infrastructure architecture — validated against your scale requirements." },
      { step: "03", title: "Build & Test", description: "Type-safe implementation with comprehensive test coverage. Integration tests, load tests, and security scans." },
      { step: "04", title: "Deploy & Monitor", description: "Production deployment with CI/CD, structured logging, error tracking, and performance monitoring." },
    ],
    technologies: ["Node.js", "Python", "TypeScript", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "Docker", "AWS", "Vercel"],
    deliverables: [
      "Production-ready API with documentation",
      "Database schema and migration scripts",
      "Authentication & authorization system",
      "Test suite (unit, integration, load)",
      "CI/CD pipeline configuration",
      "Full source code and deployment documentation",
    ],
    faq: [
      { question: "What languages and frameworks do you use?", answer: "My primary backend stack is Node.js with TypeScript (Express, Fastify, or Hono). For data-heavy services, I use Python. Every project is chosen based on what's best for the problem — not personal preference." },
      { question: "Can you work with my existing database?", answer: "Yes. I work with PostgreSQL, MongoDB, Redis, and most major databases. I can design from scratch or extend existing schemas with proper migration strategies." },
      { question: "Do you build microservices or monoliths?", answer: "It depends on your scale. Most projects start as a well-structured monolith — it's simpler and cheaper. I design with clear service boundaries so extraction to microservices is straightforward when you actually need it." },
    ],
    relatedSlugs: ["frontend-architecture", "cloud-infrastructure", "ecommerce-platforms"],
    ctaText: "Let's Engineer Your Backend",
  },
  {
    slug: "cloud-infrastructure",
    iconName: "Cloud",
    title: "Cloud & Edge Infrastructure",
    tagline: "Scalable deployments that stay up",
    heroTitle: "Cloud Infrastructure That",
    heroHighlight: "Scales With You.",
    heroDescription:
      "I architect cloud-native infrastructure on AWS, Vercel, and GCP that auto-scales under load, recovers from failure automatically, and costs only what you use.",
    longDescription:
      "Your application is only as reliable as the infrastructure running it. I design, build, and manage cloud environments that auto-scale under load, recover from failures automatically, and cost only what you use. Whether you're migrating from a legacy server, containerizing a monolith, or building cloud-native from scratch, I bring the architecture and automation expertise to make it production-ready from day one.",
    benefits: [
      { iconName: "Server", title: "Auto-Scaling Architecture", description: "Infrastructure that grows and shrinks with your traffic automatically. Pay for what you use, handle any spike." },
      { iconName: "GitBranch", title: "CI/CD Automation", description: "Automated build, test, and deployment pipelines. Push code, and it's live in minutes with zero manual intervention." },
      { iconName: "Shield", title: "Security & Compliance", description: "Network isolation, secrets management, WAF configuration, and compliance-ready infrastructure from day one." },
      { iconName: "Cpu", title: "24/7 Monitoring", description: "Real-time dashboards, automated alerts, and incident response runbooks. Problems are detected before users notice." },
    ],
    process: [
      { step: "01", title: "Infrastructure Audit", description: "I assess your current setup, identify bottlenecks, security gaps, and cost inefficiencies." },
      { step: "02", title: "Architecture Design", description: "Cloud-native architecture designed for your scale, compliance requirements, and budget constraints." },
      { step: "03", title: "Build & Migrate", description: "Infrastructure-as-code deployment with Docker, Terraform, and automated provisioning. Zero-downtime migrations." },
      { step: "04", title: "Monitor & Optimize", description: "Ongoing monitoring, cost optimization, and proactive maintenance to keep everything running at peak performance." },
    ],
    technologies: ["AWS", "GCP", "Vercel", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Cloudflare", "Datadog", "Redis"],
    deliverables: [
      "Cloud architecture design document",
      "Infrastructure-as-code (Terraform/CloudFormation)",
      "CI/CD pipeline configuration",
      "Monitoring and alerting setup",
      "Security hardening and compliance audit",
      "Runbook and documentation for your team",
    ],
    faq: [
      { question: "Which cloud provider should I use?", answer: "It depends on your needs. For most web applications, I recommend Vercel or AWS for the best balance of developer experience and scale. GCP excels at data workloads, and Azure integrates best with Microsoft ecosystems." },
      { question: "Can you manage infrastructure ongoing?", answer: "Yes. I offer managed infrastructure retainers that include 24/7 monitoring, patching, scaling optimization, and incident response." },
      { question: "How do you handle migrations?", answer: "I plan zero-downtime migrations with rollback strategies at every step. I migrate in phases, validate each stage, and only cut over when everything is verified." },
    ],
    relatedSlugs: ["backend-systems", "frontend-architecture", "ecommerce-platforms"],
    ctaText: "Let's Architect Your Cloud",
  },
  {
    slug: "interface-engineering",
    iconName: "Palette",
    title: "Interface & Interaction Engineering",
    tagline: "Precision motion and pixel-level craft",
    heroTitle: "Interfaces Engineered for",
    heroHighlight: "Precision & Delight.",
    heroDescription:
      "I engineer interfaces where every animation serves a purpose, every transition communicates state, and every interaction feels instantaneous. Design systems, micro-interactions, and scroll-driven narratives — all production-grade.",
    longDescription:
      "Beautiful design that nobody can use is a waste. I start every design engagement with a clear understanding of your users, their goals, and the friction points in their journey. Then I engineer interfaces that feel intuitive, guide users toward action, and make your brand impossible to forget. Every interaction is intentional, every animation serves a purpose, and every pixel is placed with architectural precision.",
    benefits: [
      { iconName: "Users", title: "Research-Informed Design", description: "User personas, competitive analysis, and journey mapping ensure every design decision is grounded in real user needs." },
      { iconName: "MousePointer", title: "Interactive Prototypes", description: "Clickable, testable prototypes in Figma before any code is written. Validate with real users before investing in development." },
      { iconName: "PenTool", title: "Design Systems", description: "Scalable component libraries and style guides that keep your brand consistent as your product grows." },
      { iconName: "Accessibility", title: "Accessibility-First", description: "WCAG AA+ compliant designs with proper contrast, hierarchy, and interaction patterns that work for everyone." },
    ],
    process: [
      { step: "01", title: "Research & Discovery", description: "User interviews, competitive audits, and analytics review to understand the problem space and opportunity." },
      { step: "02", title: "Information Architecture", description: "Sitemaps, user flows, and wireframes that define the structure and logic of every screen." },
      { step: "03", title: "Visual Engineering", description: "High-fidelity mockups brought to life with Framer Motion, GSAP, and production-grade animation systems." },
      { step: "04", title: "Handoff & QA", description: "Pixel-perfect implementation with design QA during development to ensure nothing is lost in translation." },
    ],
    technologies: ["Figma", "Framer Motion", "GSAP", "Tailwind CSS", "Storybook", "Lottie", "Three.js", "After Effects"],
    deliverables: [
      "User research findings and personas",
      "Wireframes and user flow diagrams",
      "High-fidelity UI designs (all breakpoints)",
      "Interactive prototype for testing",
      "Design system and component library",
      "Production animation implementation",
    ],
    faq: [
      { question: "Do you do design-only engagements?", answer: "Yes. I offer design-only engagements with clean handoff documentation. However, most clients engage me for design and engineering together — it eliminates the translation gap entirely." },
      { question: "What design tools do you use?", answer: "Figma is my primary tool for UI design, prototyping, and design systems. For production motion, I use Framer Motion and GSAP." },
      { question: "How many review cycles are included?", answer: "Standard engagements include 2–3 collaborative design review cycles per phase. Starting with research and prototyping drastically reduces revision cycles because I validate early." },
    ],
    relatedSlugs: ["frontend-architecture", "ecommerce-platforms", "web-performance"],
    ctaText: "Let's Engineer Your Interface",
  },
  {
    slug: "ecommerce-platforms",
    iconName: "ShoppingCart",
    title: "E-Commerce & Platform Engineering",
    tagline: "Transactional systems built to convert",
    heroTitle: "E-Commerce That",
    heroHighlight: "Actually Converts.",
    heroDescription:
      "I build commerce platforms where every millisecond of load time impacts revenue. From headless Shopify storefronts to custom checkout flows, every element is optimized for conversion.",
    longDescription:
      "E-commerce is not just about listing products — it's about engineering a buying experience that removes friction at every step. I build stores that load instantly, search intuitively, and check out seamlessly. Whether you need a Shopify storefront, a headless commerce setup, or a fully custom platform, I optimize every element for conversion rate, average order value, and customer lifetime value.",
    benefits: [
      { iconName: "Store", title: "Platform-Agnostic", description: "Shopify, WooCommerce, headless commerce, or fully custom — I build on whatever platform fits your business model and scale." },
      { iconName: "CreditCard", title: "Frictionless Checkout", description: "One-click payments, guest checkout, saved carts, and multiple payment options. Every step is optimized to reduce abandonment." },
      { iconName: "TrendingUp", title: "Conversion Optimization", description: "A/B tested product pages, smart upsells, and analytics-driven improvements that increase revenue per visitor." },
      { iconName: "Database", title: "Inventory & Operations", description: "Real-time inventory sync, automated order management, shipping integrations, and back-office tools that scale." },
    ],
    process: [
      { step: "01", title: "Commerce Strategy", description: "I analyze your product catalog, margins, fulfillment model, and customer journey to define the right platform and architecture." },
      { step: "02", title: "Store Design", description: "Conversion-optimized product pages, category layouts, and checkout flows designed to maximize revenue per visitor." },
      { step: "03", title: "Build & Integrate", description: "Platform setup, payment processing, shipping, inventory sync, and any third-party integrations your business needs." },
      { step: "04", title: "Launch & Optimize", description: "Go-live with analytics, A/B testing framework, and a 90-day optimization plan to continuously improve conversion rates." },
    ],
    technologies: ["Shopify", "Next.js", "Stripe", "PayPal", "Snipcart", "Sanity", "Node.js", "PostgreSQL", "Redis", "Vercel"],
    deliverables: [
      "Fully functional e-commerce storefront",
      "Payment gateway integration (Stripe, PayPal)",
      "Inventory management system",
      "Shipping and tax configuration",
      "Analytics and conversion tracking",
      "Documentation and training materials",
    ],
    faq: [
      { question: "Shopify or custom build?", answer: "Shopify is ideal for businesses with standard e-commerce needs. Custom builds make sense when you need unique checkout flows, complex pricing, or integrations that Shopify can't support natively. I'll recommend the right fit during discovery." },
      { question: "Can you migrate from my current platform?", answer: "Yes. I handle migrations from any platform including product data, customer records, order history, and SEO redirects to preserve your search rankings." },
      { question: "Do you handle ongoing store optimization?", answer: "I offer e-commerce maintenance retainers that include product updates, seasonal promotions, performance monitoring, and conversion optimization." },
    ],
    relatedSlugs: ["frontend-architecture", "interface-engineering", "web-performance"],
    ctaText: "Let's Build Your Store",
  },
  {
    slug: "web-performance",
    iconName: "Gauge",
    title: "Web Performance & Core Web Vitals",
    tagline: "Measurable speed, not vague promises",
    heroTitle: "Performance Engineering That",
    heroHighlight: "Delivers Measurable Results.",
    heroDescription:
      "I audit, diagnose, and resolve performance bottlenecks at every layer — from render-blocking resources to slow server responses. Every engagement delivers auditable improvements to Core Web Vitals.",
    longDescription:
      "Speed is not a feature — it's the foundation that every other feature depends on. I diagnose performance issues at every layer of the stack: render-blocking resources, layout shifts, unoptimized images, slow database queries, and misconfigured caching. Every engagement produces a detailed audit with prioritized fixes, and I implement them with measurable before/after Lighthouse and WebPageTest data. No vague promises — only auditable results.",
    benefits: [
      { iconName: "Gauge", title: "Core Web Vitals Mastery", description: "LCP, CLS, and INP diagnosed and optimized with surgical precision. Every fix is measured and documented." },
      { iconName: "FileSearch", title: "Bundle Analysis", description: "Dependency audits, tree-shaking verification, and code splitting strategies that cut your JavaScript payload." },
      { iconName: "Image", title: "Asset Optimization", description: "Image formats, font subsetting, responsive images, and CDN configuration for maximum delivery speed." },
      { iconName: "BarChart3", title: "Audit Reports", description: "Detailed Lighthouse and WebPageTest reports with prioritized action items and projected impact scores." },
    ],
    process: [
      { step: "01", title: "Performance Audit", description: "Comprehensive analysis of Core Web Vitals, bundle size, rendering pipeline, and server response times." },
      { step: "02", title: "Prioritized Roadmap", description: "Ranked list of optimizations by impact and effort. You approve the plan before I touch any code." },
      { step: "03", title: "Implement & Measure", description: "Surgical fixes with before/after measurements for every change. No guesswork, no regressions." },
      { step: "04", title: "Verify & Document", description: "Final audit confirming improvements, plus documentation and monitoring setup to prevent future regressions." },
    ],
    technologies: ["Lighthouse", "WebPageTest", "Chrome DevTools", "Vercel Analytics", "Next.js", "Webpack", "Turborepo", "Cloudflare"],
    deliverables: [
      "Comprehensive performance audit report",
      "Prioritized optimization roadmap",
      "Implementation of approved optimizations",
      "Before/after Lighthouse score comparison",
      "Performance monitoring configuration",
      "Documentation and regression prevention guide",
    ],
    faq: [
      { question: "How much can you improve my Lighthouse score?", answer: "Results depend on your starting point, but most engagements deliver 20–40+ point improvements. I provide projected scores during the audit phase so you know what to expect before committing." },
      { question: "Do you only work with Next.js sites?", answer: "No. I audit and optimize any web application regardless of framework. Next.js is my preferred stack for new builds, but performance engineering is framework-agnostic." },
      { question: "How long does a performance engagement take?", answer: "A standard audit and implementation cycle runs 2–4 weeks. The audit itself takes 3–5 days, followed by prioritized implementation sprints." },
    ],
    relatedSlugs: ["frontend-architecture", "cloud-infrastructure", "backend-systems"],
    ctaText: "Let's Optimize Your Performance",
  },
];

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return SERVICE_DETAILS.find((s) => s.slug === slug);
}

export function getServiceSlugs(): string[] {
  return SERVICE_DETAILS.map((s) => s.slug);
}
