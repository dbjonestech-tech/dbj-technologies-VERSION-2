import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllDesignBriefMeta,
  getAllDesignBriefSlugs,
  getDesignBriefBySlug,
} from "@/lib/design-briefs";
import { SITE } from "@/lib/constants";
import { DesignBriefHero } from "@/components/design-briefs/DesignBriefHero";
import { DesignBriefSection } from "@/components/design-briefs/DesignBriefSection";
import { DesignBriefClosing } from "@/components/design-briefs/DesignBriefClosing";

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
      <DesignBriefHero
        accent={accent}
        vertical={brief.vertical}
        position={position}
        total={total}
        headline={brief.headline}
        summary={brief.summary}
        preview={brief.preview}
        previewAlt={brief.previewAlt}
        sectionCount={sectionCount}
        loadBearingCount={brief.keySurfaces.length}
      />

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

      {/* Body sections */}
      <section
        id="brief"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          {brief.sections.map((section, i) => (
            <DesignBriefSection
              key={section.heading}
              accent={accent}
              index={i}
              total={sectionCount}
              heading={section.heading}
              paragraphs={section.paragraphs}
              image={section.image}
            />
          ))}
        </div>
      </section>

      <DesignBriefClosing accent={accent} related={related} />
    </article>
  );
}
