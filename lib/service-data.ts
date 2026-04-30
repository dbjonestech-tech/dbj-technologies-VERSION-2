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
  technologies: string[];
  deliverables: string[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
  ctaText: string;
}

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    slug: "website-design",
    iconName: "Globe",
    title: "Website Design & Development",
    tagline: "Custom websites built for speed, trust, and conversion. Not templates.",
    heroTitle: "Websites Built to",
    heroHighlight: "Perform, Convert, and Grow.",
    heroDescription:
      "I build custom websites from scratch. No templates, no page builders. Every site is designed for your specific business goals, loads fast, ranks well in search, and works perfectly on every device. You get a site that earns trust and turns visitors into customers.",
    longDescription:
      "Your website is the first impression for every potential customer. I build each one by hand, tailored to your brand, your goals, and the way your customers actually use the web. Every page is optimized for speed, search visibility, and accessibility so you show up where it matters and convert visitors once they arrive. No shortcuts, no shared templates. Just a site built specifically for your business.",
    benefits: [
      { iconName: "Zap", title: "Sub-Second Load Times", description: "Server Components, static generation, and aggressive optimization deliver pages that load before users blink." },
      { iconName: "Code2", title: "Modern Architecture", description: "Built on Next.js App Router with TypeScript. The same patterns used by Vercel, Stripe, and high-growth startups." },
      { iconName: "Monitor", title: "Responsive on Every Device", description: "Engineered mobile-first and tested on real devices. Your site works perfectly on phones, tablets, and desktops." },
      { iconName: "Shield", title: "SEO & Accessibility Built-In", description: "Semantic HTML, structured data, meta optimization, and WCAG AA+ compliance are standard on every build." },
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
      { question: "How long does a typical frontend project take?", answer: "A standard 5 to 10 page production site ships in 4 to 6 weeks from kickoff. More complex applications with CMS integration or custom features typically run 6 to 10 weeks." },
      { question: "Do you work with headless CMS platforms?", answer: "Yes. I integrate with Sanity, Strapi, Contentful, and headless WordPress. The frontend is always built with Next.js for dramatically better performance, security, and SEO." },
      { question: "What happens after launch?", answer: "Every engagement includes 30 days of complimentary post-launch support. After that, I offer monthly maintenance retainers starting at $299/month or ad-hoc support at my standard rate." },
    ],
    relatedSlugs: ["user-experience", "speed-and-search", "ecommerce"],
    ctaText: "Start a Project",
  },
  {
    slug: "business-systems",
    iconName: "Server",
    title: "Business Systems & Integrations",
    tagline: "Connect your tools, automate workflows, and let the system handle the busywork.",
    heroTitle: "Business Systems That",
    heroHighlight: "Work Behind the Scenes.",
    heroDescription:
      "I build the infrastructure your business runs on. CRM connections, automated workflows, databases, and the logic that ties your tools together so information flows where it needs to go. You focus on running your business while the systems handle the rest.",
    longDescription:
      "Every form submission, every customer login, every automated email, every data sync between your tools relies on backend systems working correctly. I design and build the server-side logic, databases, and integrations that keep your business running smoothly. Whether you need to connect your CRM, automate a workflow, or build a custom dashboard, I make sure the systems behind your site are as reliable as the ones in front of it.",
    benefits: [
      { iconName: "Server", title: "Type-Safe End-to-End", description: "TypeScript from database schema to API response. Catch errors at compile time, not in production." },
      { iconName: "GitBranch", title: "Zero-Downtime Deploys", description: "Blue-green deployments, health checks, and automated rollback ensure your API never goes dark during updates." },
      { iconName: "Shield", title: "Security-First Design", description: "Authentication, rate limiting, input validation, and secrets management baked into every service from day one." },
      { iconName: "Zap", title: "Real-Time Capable", description: "WebSocket and Server-Sent Events for live data when your application demands it. Built on battle-tested infrastructure." },
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
      { question: "What languages and frameworks do you use?", answer: "My primary backend stack is Node.js with TypeScript (Express, Fastify, or Hono). For data-heavy services, I use Python. Every project is chosen based on what's best for the problem, not personal preference." },
      { question: "Can you work with my existing database?", answer: "Yes. I work with PostgreSQL, MongoDB, Redis, and most major databases. I can design from scratch or extend existing schemas with proper migration strategies." },
      { question: "Do you build microservices or monoliths?", answer: "It depends on your scale. Most projects start as a well-structured monolith because it's simpler and cheaper. I design with clear service boundaries so extraction to microservices is straightforward when you actually need it." },
    ],
    relatedSlugs: ["website-design", "hosting", "ecommerce"],
    ctaText: "Start a Project",
  },
  {
    slug: "hosting",
    iconName: "Cloud",
    title: "Hosting & Reliability",
    tagline: "Your site stays online, loads fast everywhere, and handles traffic spikes without breaking.",
    heroTitle: "Hosting That",
    heroHighlight: "Never Goes Down.",
    heroDescription:
      "I set up and manage the hosting, security, and infrastructure your site runs on. Fast load times, automatic backups, SSL certificates, uptime monitoring, and the peace of mind that comes from knowing your site is always online and always protected.",
    longDescription:
      "Your website needs to be fast, secure, and online 24/7. I handle the technical side of hosting, deployment, and server management so you never have to think about it. That includes setting up SSL certificates, configuring backups, monitoring uptime, and making sure your site loads quickly no matter where your visitors are. If something goes wrong at 2am, I have monitoring in place to catch it before your customers do.",
    benefits: [
      { iconName: "Server", title: "Auto-Scaling Architecture", description: "Infrastructure that grows and shrinks with your traffic automatically. Pay for what you use, handle any spike." },
      { iconName: "GitBranch", title: "CI/CD Automation", description: "Automated build, test, and deployment pipelines. Push code, and it's live in minutes with zero manual intervention." },
      { iconName: "Shield", title: "Security & Compliance", description: "Network isolation, secrets management, WAF configuration, and compliance-ready infrastructure from day one." },
      { iconName: "Cpu", title: "Always-On Monitoring", description: "Real-time dashboards, automated alerts, and incident response runbooks. Problems are detected before users notice." },
    ],
    technologies: ["AWS", "GCP", "Vercel", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Cloudflare", "Datadog", "Redis"],
    deliverables: [
      "Cloud architecture design document",
      "Infrastructure-as-code (Terraform/CloudFormation)",
      "CI/CD pipeline configuration",
      "Monitoring and alerting setup",
      "Security hardening and compliance audit",
      "Runbook and operational documentation",
    ],
    faq: [
      { question: "Which cloud provider should I use?", answer: "It depends on your needs. For most web applications, I recommend Vercel or AWS for the best balance of developer experience and scale. GCP excels at data workloads, and Azure integrates best with Microsoft ecosystems." },
      { question: "Can you manage infrastructure ongoing?", answer: "Yes. I offer managed infrastructure retainers that include continuous monitoring, patching, scaling optimization, and incident response." },
      { question: "How do you handle migrations?", answer: "I plan zero-downtime migrations with rollback strategies at every step. I migrate in phases, validate each stage, and only cut over when everything is verified." },
    ],
    relatedSlugs: ["business-systems", "website-design", "ecommerce"],
    ctaText: "Start a Project",
  },
  {
    slug: "user-experience",
    iconName: "Palette",
    title: "User Experience & Conversion",
    tagline: "Every page guides visitors toward calls, forms, quotes, or purchases.",
    heroTitle: "Design That",
    heroHighlight: "Turns Visitors Into Customers.",
    heroDescription:
      "I design every page, form, and interaction to guide visitors toward taking action. Research-backed layouts, intuitive navigation, and polished visual details that make your business look as good online as it is in person.",
    longDescription:
      "Beautiful design that nobody can use is a waste. I start every design engagement with a clear understanding of what your customers need to do on your site and what actions you want them to take. From there, I design layouts, navigation, forms, and interactive elements that guide visitors naturally toward booking, buying, or reaching out. Every detail is intentional, from button placement to page flow.",
    benefits: [
      { iconName: "Users", title: "Research-Informed Design", description: "User personas, competitive analysis, and journey mapping ensure every design decision is grounded in real user needs." },
      { iconName: "MousePointer", title: "Interactive Prototypes", description: "Clickable, testable prototypes in Figma before any code is written. Validate with real users before investing in development." },
      { iconName: "PenTool", title: "Design Systems", description: "Scalable component libraries and style guides that keep your brand consistent as your product grows." },
      { iconName: "Accessibility", title: "Accessibility-First", description: "WCAG AA+ compliant designs with proper contrast, hierarchy, and interaction patterns that work for everyone." },
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
      { question: "Do you do design-only engagements?", answer: "Yes. I offer design-only engagements with clean handoff documentation. However, most clients engage me for design and engineering together because it eliminates the translation gap entirely." },
      { question: "What design tools do you use?", answer: "Figma is my primary tool for UI design, prototyping, and design systems. For production motion, I use Framer Motion and GSAP." },
      { question: "How many review cycles are included?", answer: "Standard engagements include 2 to 3 collaborative design review cycles per phase. Starting with research and prototyping drastically reduces revision cycles because I validate early." },
    ],
    relatedSlugs: ["website-design", "ecommerce", "speed-and-search"],
    ctaText: "Start a Project",
  },
  {
    slug: "ecommerce",
    iconName: "ShoppingCart",
    title: "E-Commerce & Custom Applications",
    tagline: "Online stores, booking systems, client portals, and business tools that work.",
    heroTitle: "Online Stores and Applications",
    heroHighlight: "Built to Sell.",
    heroDescription:
      "I build e-commerce stores and custom web applications that handle real transactions. Product catalogs, shopping carts, secure checkout, inventory management, and whatever custom features your business needs to sell online and serve customers.",
    longDescription:
      "Selling online means more than listing products on a page. I build complete e-commerce experiences with product catalogs, filtering, secure checkout, inventory tracking, and the custom features your specific business needs. Whether you are selling physical products, digital downloads, subscriptions, or services, the store I build is designed to make purchasing easy and keep customers coming back.",
    benefits: [
      { iconName: "Store", title: "Platform-Agnostic", description: "Shopify, WooCommerce, headless commerce, or fully custom. I build on whatever platform fits your business model and scale." },
      { iconName: "CreditCard", title: "Frictionless Checkout", description: "One-click payments, guest checkout, saved carts, and multiple payment options. Every step is optimized to reduce abandonment." },
      { iconName: "TrendingUp", title: "Conversion Optimization", description: "A/B tested product pages, smart upsells, and analytics-driven improvements that increase revenue per visitor." },
      { iconName: "Database", title: "Inventory & Operations", description: "Real-time inventory sync, automated order management, shipping integrations, and back-office tools that scale." },
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
    relatedSlugs: ["website-design", "user-experience", "speed-and-search"],
    ctaText: "Start a Project",
  },
  {
    slug: "speed-and-search",
    iconName: "Gauge",
    title: "Speed & Search Performance",
    tagline: "Fast sites rank higher, convert better, and cost less to run.",
    heroTitle: "Speed and Search Rankings That",
    heroHighlight: "Beat Your Competition.",
    heroDescription:
      "I make your site load faster and rank higher than your competitors. Page speed optimization, technical SEO, structured data, and the performance work that gets Google to notice you and keeps visitors from bouncing.",
    longDescription:
      "A slow website loses customers before they ever see what you offer. I audit your current performance, identify what is slowing you down, and fix it. That includes image optimization, code cleanup, server response times, and the technical SEO work that helps Google rank you above competitors. The result is a site that loads fast, scores high on Google's performance tests, and converts better because visitors stick around.",
    benefits: [
      { iconName: "Gauge", title: "Core Web Vitals Mastery", description: "LCP, CLS, and INP diagnosed and optimized with surgical precision. Every fix is measured and documented." },
      { iconName: "FileSearch", title: "Bundle Analysis", description: "Dependency audits, tree-shaking verification, and code splitting strategies that cut your JavaScript payload." },
      { iconName: "Image", title: "Asset Optimization", description: "Image formats, font subsetting, responsive images, and CDN configuration for maximum delivery speed." },
      { iconName: "BarChart3", title: "Audit Reports", description: "Detailed Lighthouse and WebPageTest reports with prioritized action items and projected impact scores." },
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
      { question: "How much can you improve my Lighthouse score?", answer: "Results depend on your starting point, but most engagements deliver 20 to 40+ point improvements. I provide projected scores during the audit phase so you know what to expect before committing." },
      { question: "Do you only work with Next.js sites?", answer: "No. I audit and optimize any web application regardless of framework. Next.js is my preferred stack for new builds, but performance engineering is framework-agnostic." },
      { question: "How long does a performance engagement take?", answer: "A standard audit and implementation cycle runs 2 to 4 weeks. The audit itself takes 3 to 5 days, followed by prioritized implementation sprints." },
    ],
    relatedSlugs: ["website-design", "hosting", "business-systems"],
    ctaText: "Start a Project",
  },
];

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return SERVICE_DETAILS.find((s) => s.slug === slug);
}

export function getServiceSlugs(): string[] {
  return SERVICE_DETAILS.map((s) => s.slug);
}
