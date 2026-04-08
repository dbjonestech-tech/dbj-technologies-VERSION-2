/* ─── WORK / CORE ENGINEERING DISCIPLINES ────────── */

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
}

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "frontend-architecture",
    title: "Frontend Architecture",
    category: "Core Discipline",
    type: "internal",
    typeLabel: "Engineering Discipline",
    gradient: "from-blue-600 to-cyan-500",
    tagline: "Component-driven systems engineered for scale, speed, and long-term maintainability.",
    description:
      "Component-driven systems with Next.js, React, and TypeScript — engineered for sub-second renders and long-term maintainability.",
    longDescription:
      "Every frontend I build starts with a system-level architecture decision: rendering strategy, component boundaries, data flow, and state management — all defined before a single component is created. The result is a codebase that ships fast, stays maintainable, and scales from a marketing site to a full application without rewrites. I use Next.js App Router with Server Components by default, implement strict TypeScript throughout, and enforce performance budgets that guarantee 90+ Lighthouse scores on every page.",
    challenge:
      "Most frontends accumulate technical debt because they're built component-by-component without an architectural plan. The result is performance regressions, inconsistent patterns, and codebases that become harder to change over time.",
    solution:
      "I start with architecture: define the rendering strategy per route, establish a typed component library with Storybook documentation, implement automated performance budgets in CI, and enforce consistent patterns that make the codebase easier to maintain as it grows — not harder.",
    results: [
      { label: "Stack", value: "Next.js + TypeScript" },
      { label: "Baseline", value: "90+ Lighthouse" },
      { label: "Standard", value: "WCAG AA+" },
    ],
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    features: [
      "Server Components & App Router architecture",
      "Typed component library with Storybook",
      "Automated performance budgets in CI",
      "Accessibility-first with automated testing",
    ],
  },
  {
    slug: "backend-infrastructure",
    title: "Backend Infrastructure",
    category: "Core Discipline",
    type: "internal",
    typeLabel: "Engineering Discipline",
    gradient: "from-violet-600 to-pink-500",
    tagline: "API design, database architecture, and cloud-native services — typed end-to-end.",
    description:
      "API design, database architecture, and cloud-native services — typed end-to-end and built for zero-downtime deployments.",
    longDescription:
      "Every backend system I build is typed from database schema to API response, tested at every boundary, and deployed with zero-downtime strategies. I design APIs that are self-documenting, databases that are properly indexed and migrated, and cloud infrastructure that auto-scales without manual intervention. Whether it's a REST API, GraphQL layer, or real-time WebSocket service — every system is instrumented with structured logging, error tracking, and performance monitoring from the first deployment.",
    challenge:
      "Backend systems fail when they're treated as an afterthought — untyped APIs, manual deployments, missing monitoring, and database schemas that weren't designed for the queries they actually serve.",
    solution:
      "I treat the backend as a first-class architectural concern. Type-safe API contracts, database schema design with migration strategies, automated CI/CD pipelines, and comprehensive monitoring are not add-ons — they're the foundation every endpoint is built on.",
    results: [
      { label: "Stack", value: "Node.js + PostgreSQL" },
      { label: "Deploy", value: "Zero-Downtime" },
      { label: "Coverage", value: "End-to-End Types" },
    ],
    tags: ["Node.js", "PostgreSQL", "AWS", "Docker"],
    features: [
      "Type-safe APIs with end-to-end TypeScript",
      "Database design with migration strategies",
      "CI/CD with automated testing and deploys",
      "Structured logging and error tracking",
    ],
  },
  {
    slug: "performance-engineering",
    title: "Performance Engineering",
    category: "Core Discipline",
    type: "internal",
    typeLabel: "Engineering Discipline",
    gradient: "from-emerald-600 to-teal-500",
    tagline: "Core Web Vitals optimization with measurable, auditable results.",
    description:
      "Core Web Vitals optimization, bundle analysis, and rendering strategy — turning measurable audits into measurable speed gains.",
    longDescription:
      "Performance engineering is not about running Lighthouse once and tweaking a few images. I diagnose bottlenecks at every layer of the stack — render-blocking resources, layout shifts, JavaScript payload, server response times, and caching strategies. Every fix is measured with before/after data, and every engagement produces a detailed audit report with prioritized recommendations ranked by impact. The goal is not a perfect score — it's a measurably faster experience that impacts your conversion rate, search rankings, and user satisfaction.",
    challenge:
      "Performance degradation is invisible until it's catastrophic. Most teams don't have the tooling or expertise to diagnose where the bottlenecks are, which fixes will have the highest impact, or how to prevent regressions after optimization.",
    solution:
      "I apply a systematic audit methodology: measure Core Web Vitals in the field and in the lab, identify the highest-impact bottlenecks, implement fixes with before/after measurements, and configure monitoring to catch regressions before they ship to production.",
    results: [
      { label: "Tooling", value: "Lighthouse + WebPageTest" },
      { label: "Focus", value: "LCP, CLS, INP" },
      { label: "Standard", value: "Auditable Results" },
    ],
    tags: ["Lighthouse", "WebPageTest", "Vercel", "Edge"],
    features: [
      "Core Web Vitals diagnosis and optimization",
      "Bundle analysis and JavaScript payload reduction",
      "Image, font, and asset optimization pipeline",
      "Performance monitoring and regression prevention",
    ],
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
