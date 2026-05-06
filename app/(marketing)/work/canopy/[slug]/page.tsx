import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCanopyDeepDive,
  getCanopyDeepDiveSlugs,
} from "@/lib/canopy-deep-dives";
import { SITE } from "@/lib/constants";
import { CanopyDeepDiveLayout } from "@/components/templates/CanopyDeepDiveLayout";
import { JsonLd } from "@/components/layout/JsonLd";

/* Static-generates one page per registered Canopy deep-dive. With an
   empty registry this resolves to no static paths; the page handler
   below still runs for any /work/canopy/{slug} URL that happens to be
   requested and returns notFound() when the slug is not registered, so
   the route is safe to ship before any Phase 3 content lands. */
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

  return {
    title: `${page.heading} | Canopy Architecture`,
    description: page.summary,
    alternates: { canonical: `${SITE.url}/work/canopy/${slug}` },
    openGraph: {
      title: `${page.heading} | Canopy Architecture | DBJ Technologies`,
      description: page.summary,
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

  return (
    <>
      <JsonLd
        type="breadcrumb"
        breadcrumb={[
          { name: "Home", url: SITE.url },
          { name: "Work", url: `${SITE.url}/work` },
          { name: "Canopy", url: `${SITE.url}/work/canopy` },
          { name: page.heading, url: `${SITE.url}/work/canopy/${slug}` },
        ]}
      />
      <CanopyDeepDiveLayout page={page} />
    </>
  );
}
