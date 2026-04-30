import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  getAllDesignBriefMeta,
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
  const allSlugs = getAllDesignBriefSlugs();
  const position = allSlugs.indexOf(slug) + 1;
  const total = allSlugs.length;
  const sectionCount = brief.sections.length;
  const related = getAllDesignBriefMeta()
    .filter((m) => m.slug !== slug)
    .slice(0, 3);

  return (
    <article className="relative">
      {/* Hero - magazine cover spread */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        {/* Subtle accent wash backdrop */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${accent} 0%, transparent 65%)`,
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Work
          </Link>

          {/* Title block, ranged-left at reading width */}
          <div className="mt-12 lg:mt-16 max-w-4xl">
            <div className="flex items-center gap-3 mb-7 flex-wrap">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Design Brief
              </span>
              <span className="text-text-muted/50" aria-hidden="true">
                /
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {brief.vertical}
              </span>
              <span className="text-text-muted/50" aria-hidden="true">
                /
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                {String(position).padStart(2, "0")} of{" "}
                {String(total).padStart(2, "0")}
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8">
              {brief.headline}
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-2xl mb-10">
              {brief.summary}
            </p>

            {/* Meta strip */}
            <div className="flex items-center gap-6 lg:gap-8 mb-10">
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-display text-3xl lg:text-4xl font-bold leading-none"
                  style={{ color: accent }}
                >
                  {sectionCount}
                </span>
                <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Surfaces
                </span>
              </div>
              <div className="h-8 w-px bg-text-primary/15" aria-hidden="true" />
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-display text-3xl lg:text-4xl font-bold leading-none"
                  style={{ color: accent }}
                >
                  {brief.keySurfaces.length}
                </span>
                <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Load Bearing
                </span>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform motion-safe:hover:-translate-y-0.5"
                style={{ backgroundColor: accent }}
              >
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#brief"
                className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
              >
                Read the Brief
              </Link>
            </div>
          </div>

          {/* Hero screenshot - breakout to full container width */}
          <div className="relative mt-16 lg:mt-20">
            {/* Accent halo */}
            <div
              className="absolute -inset-6 lg:-inset-10 -z-10 blur-3xl opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
              }}
              aria-hidden="true"
            />
            {/* Framed screenshot */}
            <div
              className="relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 transform-gpu"
              style={{
                borderColor: `${accent}55`,
                boxShadow: `0 50px 120px -30px ${accent}55, 0 25px 60px -20px rgba(0,0,0,0.22)`,
              }}
            >
              <Image
                src={brief.preview}
                alt={
                  brief.previewAlt ||
                  `${brief.vertical} reference architecture preview`
                }
                width={2400}
                height={1500}
                priority
                className="w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 1400px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent}33 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Body - magazine sections */}
      <section
        id="brief"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          {brief.sections.map((section, i) => (
            <article
              key={section.heading}
              className="mb-28 lg:mb-40 last:mb-0"
              aria-labelledby={`section-${i + 1}-heading`}
            >
              {/* Editorial chapter break - large italic numeral + ruler */}
              <div className="flex items-end gap-6 lg:gap-10 mb-10 lg:mb-14">
                <span
                  className="font-display italic font-bold text-[clamp(3.5rem,7.5vw,6.5rem)] leading-[0.85] -mb-1"
                  style={{ color: accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="h-px flex-1 mb-5"
                  style={{
                    background: `linear-gradient(90deg, ${accent}66 0%, ${accent}11 100%)`,
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Section heading */}
              <h2
                id={`section-${i + 1}-heading`}
                className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-[1.1] tracking-tight mb-12 lg:mb-16 max-w-4xl"
              >
                {section.heading}
              </h2>

              {/* Section image - breakout to full container width with accent halo */}
              {section.image ? (
                <div className="relative mb-14 lg:mb-20">
                  <div
                    className="absolute -inset-4 lg:-inset-8 -z-10 blur-3xl opacity-25 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 transform-gpu"
                    style={{
                      borderColor: `${accent}44`,
                      boxShadow: `0 40px 100px -30px ${accent}44, 0 20px 40px -15px rgba(0,0,0,0.18)`,
                    }}
                  >
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={1600}
                      height={1000}
                      className="w-full h-auto"
                      sizes="(max-width: 1024px) 100vw, 1400px"
                    />
                  </div>
                </div>
              ) : null}

              {/* Prose - nested narrower for readability */}
              <div className="mx-auto max-w-3xl space-y-6 lg:space-y-7">
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Closing - outro CTA + related briefs */}
      <section className="relative py-20 lg:py-28 border-t border-text-primary/10 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-20 items-start">
            {/* Build CTA */}
            <div>
              <p
                className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
                style={{ color: accent }}
              >
                Build It For Real
              </p>
              <h3 className="font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-bold leading-[1.12] tracking-tight mb-6">
                Want this architecture, executed for your practice?
              </h3>
              <p className="text-text-secondary leading-relaxed mb-8 lg:text-lg">
                I build the version of this that ships. Designed end to end,
                launched on production grade infrastructure, with the surfaces
                above tuned to your actual book of business.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform motion-safe:hover:-translate-y-0.5"
                style={{ backgroundColor: accent }}
              >
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Related briefs */}
            <div>
              <div className="flex items-baseline justify-between mb-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Other Briefs
                </p>
                <Link
                  href="/work"
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text-primary transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 lg:gap-5">
                {related.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/work/design-briefs/${m.slug}`}
                    className="group block rounded-xl overflow-hidden border border-text-primary/10 hover:border-text-primary/25 transition-colors bg-bg-primary"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
                      <Image
                        src={m.preview}
                        alt={`${m.vertical} brief preview`}
                        fill
                        className="object-cover object-top motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        sizes="(max-width: 640px) 100vw, 240px"
                      />
                    </div>
                    <div className="p-4">
                      <div
                        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1.5"
                        style={{ color: m.paletteAccent }}
                      >
                        Design Brief
                      </div>
                      <div className="font-display text-base font-bold leading-tight">
                        {m.vertical}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
