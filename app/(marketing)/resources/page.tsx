import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPagesByCluster } from "@/lib/page-system/resolve";
import { accentMap } from "@/lib/page-system/accent-map";
import type { PageConfig } from "@/lib/page-system/types";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Field-grade guides on web performance, conversion, and the engineering choices behind a high-converting service business website.",
};

const CLUSTERS: { id: string; label: string; tagline: string }[] = [
  {
    id: "resources-educational",
    label: "Educational",
    tagline: "Deep, citation-backed pieces on engineering and conversion.",
  },
  {
    id: "resources-decision",
    label: "Decision and comparison",
    tagline: "Honest framings of which vendor model and platform actually fits.",
  },
];

function ResourceCard({ page }: { page: PageConfig }) {
  const a = accentMap[page.accent];
  return (
    <Link href={page.slug} className="glass-card-hover p-6 lg:p-8 group">
      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em] mb-3"
        style={{ color: a.hex }}
      >
        {page.archetype === "editorial" ? "Educational" : "Decision"}
      </p>
      <h2 className="font-display text-xl lg:text-2xl font-bold leading-tight mb-3 transition-colors group-hover:[color:var(--card-accent)]" style={{ ["--card-accent" as string]: a.hex }}>
        {page.title}
      </h2>
      <p className="text-sm text-text-secondary leading-relaxed mb-5">
        {page.description}
      </p>
      <span
        className="inline-flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: a.hex }}
      >
        Read the guide
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function ResourcesIndexPage() {
  return (
    <main className="relative pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-cyan mb-5">
            Resources
          </p>
          <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-bold leading-[1.06] tracking-tight mb-6">
            Field-grade guides on web performance and conversion.
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Deep, citation-backed pieces on the engineering and design choices
            that move real revenue for service businesses. Written from the
            field, not from a content calendar.
          </p>
        </div>

        <div className="mt-16 lg:mt-24 space-y-16 lg:space-y-20">
          {CLUSTERS.map((cluster) => {
            const pages = listPagesByCluster(cluster.id);
            if (pages.length === 0) return null;
            return (
              <section key={cluster.id}>
                <div className="flex items-baseline justify-between gap-4 mb-6 lg:mb-8">
                  <h2 className="font-display text-xl lg:text-2xl font-bold tracking-tight">
                    {cluster.label}
                  </h2>
                  <p className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    {cluster.tagline}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {pages.map((p) => (
                    <ResourceCard key={p.slug} page={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
