/* ─── WORK / PROJECTS ──────────────────────────────── */

export interface ProjectMetric {
  label: string;
  value: string;
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
}

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "star-auto-service",
    name: "Star Auto Service",
    description:
      "Full-service auto repair website for a Richardson, TX mechanic shop. Engineered for speed, local SEO visibility, and conversion.",
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
      "Contact form with automated email delivery, mobile-first responsive design, sub-second load times.",
  },
  {
    slug: "pathlight",
    name: "Pathlight",
    description:
      "AI-powered website intelligence platform. Scans any business website and delivers a performance audit, design review, revenue impact estimate, and prioritized fix list in minutes.",
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
      "Vision analysis, industry benchmarking with curated database, revenue impact modeling, AI chatbot for report Q&A.",
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
