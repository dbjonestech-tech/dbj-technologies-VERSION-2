/* ─── WORK / PORTFOLIO EXTENDED DATA ──────────────── */

export interface ProjectDetail {
  slug: string;
  title: string;
  category: string;
  type: "concept" | "internal" | "client";
  typeLabel: string;
  gradient: string;
  tagline: string;
  description: string;
  longDescription: string;
  challenge: string;
  solution: string;
  results: { label: string; value: string }[];
  tags: string[];
  features: string[];
  /* testimonial field reserved for real client projects only */
}

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "apex-ventures-corporate-hub",
    title: "Apex Ventures Corporate Hub",
    category: "Corporate",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-blue-600 to-cyan-500",
    tagline: "A modern corporate site built for credibility and investor engagement.",
    description: "A sleek corporate site with animated data visualizations and investor portal integration.",
    longDescription:
      "This concept project demonstrates our approach to corporate web design — combining premium visual design with functional depth. The site features animated data visualizations, a gated investor portal, and a content-managed newsroom. Every page is optimized for credibility, SEO, and lead generation.",
    challenge:
      "Corporate sites often feel generic or dated. The goal was to create a corporate presence that feels modern and dynamic while maintaining the professionalism and trust signals that enterprise audiences expect.",
    solution:
      "We designed a content-driven architecture with animated data visualizations, a gated investor section, and seamless CMS integration. The result is a site that's as functional as it is visually impressive.",
    results: [
      { label: "Stack", value: "Next.js" },
      { label: "Pages", value: "12" },
      { label: "CMS", value: "Sanity" },
    ],
    tags: ["Next.js", "Framer Motion", "Vercel", "Sanity"],
    features: [
      "Animated data visualizations with D3.js",
      "Gated investor portal with authentication",
      "CMS-managed newsroom and press releases",
      "SEO-optimized with structured data",
    ],
  },
  {
    slug: "luxethread-ecommerce-platform",
    title: "LuxeThread E-Commerce Platform",
    category: "E-Commerce",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-violet-600 to-pink-500",
    tagline: "High-end fashion marketplace engineered for conversion and speed.",
    description: "High-end fashion marketplace with AI-powered recommendations and sub-second page loads.",
    longDescription:
      "This concept showcases our e-commerce capabilities at the premium end of the market. The platform features a headless Shopify backend, AI-powered product recommendations, a custom wishlist system, and checkout optimization that reduces abandonment. Every product page loads in under a second.",
    challenge:
      "Luxury e-commerce requires a delicate balance: the site must feel exclusive and premium while removing all friction from the buying process. Speed and aesthetics had to coexist at the highest level.",
    solution:
      "We built a headless Shopify storefront with Next.js, leveraging static generation for product pages and edge functions for personalization. AI recommendations drive cross-sells, and the checkout is streamlined to three steps.",
    results: [
      { label: "Platform", value: "Shopify" },
      { label: "Frontend", value: "Next.js" },
      { label: "Checkout", value: "3-Step" },
    ],
    tags: ["React", "Shopify", "Node.js", "Stripe"],
    features: [
      "Headless Shopify with Next.js storefront",
      "AI-powered product recommendations",
      "Optimized 3-step checkout flow",
      "Real-time inventory management",
    ],
  },
  {
    slug: "novabridge-saas-dashboard",
    title: "NovaBridge SaaS Dashboard",
    category: "SaaS",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-emerald-600 to-teal-500",
    tagline: "Enterprise analytics dashboard built for scale and real-time insights.",
    description: "Enterprise analytics dashboard processing 10M+ events daily with real-time visualizations.",
    longDescription:
      "This concept demonstrates our full-stack capability for data-intensive SaaS applications. The dashboard processes millions of events daily, rendering them as real-time charts, tables, and custom visualizations. Built with a focus on performance under load and intuitive data exploration.",
    challenge:
      "Analytics dashboards often buckle under data volume — slow queries, laggy charts, and confusing navigation. The goal was to build a dashboard that stays fast and intuitive regardless of data scale.",
    solution:
      "We architected a streaming data pipeline with server-side aggregation, client-side virtualization for large datasets, and a modular dashboard builder that lets users customize their views. The result handles 10M+ daily events without breaking a sweat.",
    results: [
      { label: "Stack", value: "TypeScript" },
      { label: "Charts", value: "D3.js" },
      { label: "Infra", value: "AWS" },
    ],
    tags: ["TypeScript", "D3.js", "AWS", "PostgreSQL"],
    features: [
      "Real-time data streaming and aggregation",
      "Drag-and-drop dashboard builder",
      "Custom D3.js visualizations",
      "Role-based access control",
    ],
  },
  {
    slug: "catalyst-corp-landing-page",
    title: "Catalyst Corp Landing Page",
    category: "Landing Pages",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-orange-500 to-red-500",
    tagline: "Conversion-optimized product launch page built for maximum signup rate.",
    description: "Conversion-optimized product launch page that achieved a 12% signup rate in week one.",
    longDescription:
      "This concept project showcases our approach to high-conversion landing pages. Every element — from the headline hierarchy to the CTA placement to the social proof structure — was designed using conversion rate optimization principles and validated through our A/B testing framework.",
    challenge:
      "Product launch pages have one job: convert visitors into signups. Most landing pages lose visitors to slow loads, unclear value propositions, or too many distractions.",
    solution:
      "We stripped the page to its essentials: a clear value proposition above the fold, social proof, a feature showcase, and a single, repeated CTA. The page loads in under 0.5 seconds and was A/B tested across three variations.",
    results: [
      { label: "Framework", value: "Next.js" },
      { label: "Deploy", value: "Vercel" },
      { label: "Testing", value: "A/B" },
    ],
    tags: ["Next.js", "Tailwind", "A/B Testing", "Vercel"],
    features: [
      "A/B testing framework built in",
      "Conversion-optimized layout and copy",
      "Sub-half-second load times",
      "Full analytics and funnel tracking",
    ],
  },
  {
    slug: "pinnacle-ai-platform",
    title: "Pinnacle AI Platform",
    category: "SaaS",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-blue-500 to-violet-600",
    tagline: "AI model management platform with visual workflow builder.",
    description: "AI model management platform with drag-and-drop workflow builder and real-time inference monitoring.",
    longDescription:
      "This concept demonstrates our capability for complex, technical SaaS applications. The platform lets teams manage AI models, build inference pipelines with a drag-and-drop visual editor, and monitor performance in real time. Built for technical users who need power without complexity.",
    challenge:
      "AI teams juggle multiple models, datasets, and deployment targets. Existing tools are either too simple for production use or too complex for rapid experimentation.",
    solution:
      "We designed a visual workflow builder that lets users chain models, data sources, and transformations with drag-and-drop simplicity. Under the hood, it generates production-grade pipeline configurations with version control and rollback.",
    results: [
      { label: "Frontend", value: "React" },
      { label: "Backend", value: "Python" },
      { label: "Infra", value: "Docker" },
    ],
    tags: ["React", "Python", "Docker", "AWS"],
    features: [
      "Drag-and-drop pipeline builder",
      "Model version control and registry",
      "Real-time inference monitoring",
      "One-click deployment to production",
    ],
  },
  {
    slug: "meridian-group-rebrand",
    title: "Meridian Group Rebrand",
    category: "Corporate",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-cyan-500 to-blue-600",
    tagline: "Complete digital rebrand from identity to implementation.",
    description: "Complete digital rebrand including website, design system, and internal documentation portal.",
    longDescription:
      "This concept showcases our full-service rebrand capability. Starting from brand strategy, we developed a new visual identity, design system, and component library, then implemented everything across a new marketing site and internal documentation portal. The design system ensures brand consistency as the company scales.",
    challenge:
      "Rebrands often result in a new logo and website that slowly drift apart from internal tools and collateral. The goal was a systematic approach that ensures consistency across every touchpoint.",
    solution:
      "We built a comprehensive design system in Figma and Storybook that serves as the single source of truth. The marketing site and internal portal both consume the same component library, guaranteeing visual consistency.",
    results: [
      { label: "System", value: "Figma" },
      { label: "Frontend", value: "Next.js" },
      { label: "Components", value: "Storybook" },
    ],
    tags: ["Figma", "Next.js", "Storybook", "Tailwind"],
    features: [
      "Brand strategy and visual identity",
      "Design system with 60+ components",
      "Marketing website rebuild",
      "Internal documentation portal",
    ],
  },
  {
    slug: "freshcart-grocery-delivery",
    title: "FreshCart Grocery Delivery",
    category: "E-Commerce",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-green-500 to-emerald-600",
    tagline: "Real-time grocery delivery app with route optimization.",
    description: "Real-time inventory grocery delivery app with route optimization and driver tracking.",
    longDescription:
      "This concept demonstrates our mobile app and real-time infrastructure capabilities. The platform includes a customer-facing app for browsing and ordering, a driver app for deliveries, and an admin dashboard for operations. Real-time inventory and driver tracking keep everything in sync.",
    challenge:
      "Grocery delivery requires real-time coordination between inventory, orders, routes, and drivers. Stale data means wrong orders, missed deliveries, and frustrated customers.",
    solution:
      "We built a real-time architecture with WebSocket connections for live inventory and driver tracking, route optimization for efficient deliveries, and an operations dashboard that gives managers a bird's-eye view of everything in motion.",
    results: [
      { label: "Mobile", value: "React Native" },
      { label: "Backend", value: "Node.js" },
      { label: "Apps", value: "3" },
    ],
    tags: ["React Native", "Node.js", "PostgreSQL", "Redis"],
    features: [
      "Customer ordering app (iOS + Android)",
      "Driver delivery app with navigation",
      "Real-time inventory and tracking",
      "Route optimization engine",
    ],
  },
  {
    slug: "vertex-labs-product-launch",
    title: "Vertex Labs Product Launch",
    category: "Landing Pages",
    type: "concept",
    typeLabel: "Concept Project",
    gradient: "from-pink-500 to-violet-600",
    tagline: "Immersive 3D product showcase with WebGL animations.",
    description: "Immersive 3D product showcase with WebGL animations and interactive feature explorer.",
    longDescription:
      "This concept pushes the boundaries of what a product launch page can be. Instead of static images and bullet points, visitors explore the product through interactive 3D models, animated feature breakdowns, and a guided tour that tells the product story through scroll-driven animation.",
    challenge:
      "Hardware and deep-tech product launches need to communicate complex features in an engaging way. Traditional pages with specs and screenshots fail to create the excitement these products deserve.",
    solution:
      "We created an immersive experience with Three.js-powered 3D models, GSAP scroll animations, and interactive hotspots that let users explore features at their own pace. The experience is impressive without sacrificing load performance.",
    results: [
      { label: "3D Engine", value: "Three.js" },
      { label: "Animation", value: "GSAP" },
      { label: "Deploy", value: "Vercel" },
    ],
    tags: ["Three.js", "GSAP", "Vercel", "WebGL"],
    features: [
      "Interactive 3D product models",
      "Scroll-driven storytelling animations",
      "Interactive feature hotspots",
      "Optimized for performance despite 3D assets",
    ],
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
