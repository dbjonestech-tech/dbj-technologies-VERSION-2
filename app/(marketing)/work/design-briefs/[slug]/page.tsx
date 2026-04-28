import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getAllDesignBriefSlugs,
  getDesignBriefBySlug,
} from "@/lib/design-briefs";
import { SITE } from "@/lib/constants";

export function generateStaticParams() {
  return getAllDesignBriefSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brief = getDesignBriefBySlug(slug);

  if (!brief) {
    return { title: "Design Brief Not Found" };
  }

  return {
    title: `${brief.vertical} Design Brief`,
    description: brief.summary,
    alternates: { canonical: `${SITE.url}/work/design-briefs/${slug}` },
    openGraph: {
      title: `${brief.vertical} Design Brief | DBJ Technologies`,
      description: brief.summary,
      images: [{ url: brief.preview }],
    },
  };
}

export default async function DesignBriefPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brief = getDesignBriefBySlug(slug);

  if (!brief) {
    notFound();
  }

  const accent = brief.paletteAccent;

  return (
    <article className="relative">
      {/* Hero: framed preview image as the page's establishing shot */}
      <section className="relative pt-32 pb-12 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors mb-8"
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
              Design Brief &middot; {brief.vertical}
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-bold leading-[1.05] tracking-tight mb-6 max-w-3xl">
            {brief.headline}
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mb-12">
            {brief.summary}
          </p>

          {/* Framed preview */}
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{
              borderColor: `${accent}33`,
              boxShadow: `0 30px 80px -30px ${accent}40, 0 10px 30px -15px rgba(0,0,0,0.15)`,
            }}
          >
            <Image
              src={brief.preview}
              alt={`${brief.vertical} reference architecture preview`}
              width={2400}
              height={1500}
              priority
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
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

      {/* Body */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {brief.sections.map((section, i) => (
            <div key={section.heading} className="mb-16 last:mb-0">
              <div className="flex items-baseline gap-4 mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
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

      {/* Closing CTA */}
      <section className="py-16 border-t border-text-primary/8">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em] mb-4"
            style={{ color: accent }}
          >
            Build It For Real
          </p>
          <h3 className="font-display text-2xl font-bold mb-4">
            Want this architecture, executed for your practice?
          </h3>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            I build the version of this that ships. Designed end to end,
            launched on production grade infrastructure, with the surfaces
            above tuned to your actual book of business.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: accent }}
            >
              Start a Project
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 rounded-full border border-text-primary/15 px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-text-primary/35"
            >
              See Other Briefs
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
