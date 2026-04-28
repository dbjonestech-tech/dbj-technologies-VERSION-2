import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  getAllBlueprintSlugs,
  getBlueprintBySlug,
} from "@/lib/blueprints";
import { SITE } from "@/lib/constants";

export function generateStaticParams() {
  return getAllBlueprintSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blueprint = getBlueprintBySlug(slug);

  if (!blueprint) {
    return { title: "Blueprint Not Found" };
  }

  return {
    title: `${blueprint.vertical} Blueprint`,
    description: blueprint.summary,
    alternates: { canonical: `${SITE.url}/work/blueprints/${slug}` },
    openGraph: {
      title: `${blueprint.vertical} Blueprint | DBJ Technologies`,
      description: blueprint.summary,
    },
  };
}

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blueprint = getBlueprintBySlug(slug);

  if (!blueprint) {
    notFound();
  }

  const accent = blueprint.paletteAccent;

  return (
    <article className="relative">
      <section className="relative pt-40 pb-16 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Work
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            />
            <span
              className="font-mono text-[11px] uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              Vertical Blueprint &middot; {blueprint.vertical}
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-bold leading-[1.05] tracking-tight mb-6">
            {blueprint.headline}
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
            {blueprint.summary}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={`/templates/${blueprint.template}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: accent }}
            >
              View the Live Template
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-text-primary/15 px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-text-primary/35"
            >
              Build Yours
            </Link>
          </div>
        </div>
      </section>

      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent}33 50%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {blueprint.sections.map((section, i) => (
            <div
              key={section.heading}
              className="mb-16 last:mb-0"
            >
              <div className="flex items-baseline gap-4 mb-6">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="h-px flex-1"
                  style={{
                    background: `linear-gradient(90deg, ${accent}55 0%, ${accent}11 100%)`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <h2 className="font-display text-[clamp(1.6rem,2.8vw,2.2rem)] font-bold leading-tight tracking-tight mb-6">
                {section.heading}
              </h2>
              <div className="space-y-5">
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className="text-[1.0625rem] leading-[1.85] text-text-secondary"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 border-t border-text-primary/8">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em] mb-4"
            style={{ color: accent }}
          >
            See the Proof
          </p>
          <h3 className="font-display text-2xl font-bold mb-4">
            The template that executes everything above.
          </h3>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            A working static page that demonstrates the architecture in production-grade detail. Open it side by side with this blueprint and read them together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/templates/${blueprint.template}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: accent }}
            >
              Open the Template
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-text-primary/15 px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-text-primary/35"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
