import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCanopyDeepDive,
  getCanopyDeepDiveSlugs,
} from "@/lib/canopy-deep-dives";
import { SITE } from "@/lib/constants";
import { CanopyDeepDiveLayout } from "@/components/templates/CanopyDeepDiveLayout";
import { JsonLd } from "@/components/layout/JsonLd";

/* All six pages in the funnel were drafted and shipped together on
   2026-05-06. Search engines use this for article freshness ranking
   and for the visible "published" date in some result formats; bumping
   it requires an actual content rewrite, not a stylesheet tweak. */
const DATE_PUBLISHED = "2026-05-06";

/* Static-generates one page per registered Canopy deep-dive. */
export function generateStaticParams() {
  return getCanopyDeepDiveSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getCanopyDeepDive(slug);

  if (!page) {
    return { title: "Not Found" };
  }

  const url = `${SITE.url}/work/canopy/${slug}`;
  const ogImageUrl = page.image.startsWith("http")
    ? page.image
    : `${SITE.url}${page.image}`;

  return {
    title: `${page.heading} | Canopy Architecture`,
    description: page.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${page.heading} | Canopy Architecture | DBJ Technologies`,
      description: page.summary,
      siteName: SITE.name,
      publishedTime: DATE_PUBLISHED,
      authors: [SITE.url],
      images: [
        {
          url: ogImageUrl,
          width: 1800,
          height: 1170,
          alt: page.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.heading} | Canopy Architecture`,
      description: page.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function CanopyDeepDivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getCanopyDeepDive(slug);

  if (!page) {
    notFound();
  }

  const url = `${SITE.url}/work/canopy/${slug}`;
  const wordCount = page.body.split(/\s+/).filter(Boolean).length;

  return (
    <>
      <JsonLd
        type="breadcrumb"
        breadcrumb={[
          { name: "Home", url: SITE.url },
          { name: "Work", url: `${SITE.url}/work` },
          { name: "Canopy", url: `${SITE.url}/work/canopy` },
          { name: page.heading, url },
        ]}
      />
      <JsonLd
        type="techArticle"
        techArticle={{
          headline: `${page.heading} | Canopy Architecture`,
          description: page.summary,
          url,
          image: page.image,
          datePublished: DATE_PUBLISHED,
          wordCount,
          articleSection: "Canopy Architecture",
          keywords: [
            "Canopy",
            "small-business operating system",
            page.heading,
            "architecture",
            "DBJ Technologies",
          ],
        }}
      />
      <CanopyDeepDiveLayout page={page} />
    </>
  );
}
