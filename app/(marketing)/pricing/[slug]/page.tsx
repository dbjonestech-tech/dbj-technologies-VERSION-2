import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPricingBySlug, getPricingSlugs } from "@/lib/pricing-data";
import { SITE } from "@/lib/constants";
import { PricingDetailLayout } from "@/components/templates/PricingDetailLayout";
import { JsonLd } from "@/components/layout/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPricingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = getPricingBySlug(slug);

  if (!detail) {
    return {};
  }

  return {
    title: `${detail.name} Package`,
    description: detail.heroDescription,
    alternates: { canonical: `${SITE.url}/pricing/${slug}` },
    openGraph: {
      title: `${detail.name} Package | DBJ Technologies`,
      description: detail.heroDescription,
    },
  };
}

export default async function PricingDetailPage({ params }: Props) {
  const { slug } = await params;
  const detail = getPricingBySlug(slug);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <JsonLd
        type="offer"
        offer={{
          slug: detail.slug,
          name: `${detail.name} Package`,
          description: detail.heroDescription,
          price: detail.price,
        }}
      />
      <JsonLd
        type="breadcrumb"
        breadcrumb={[
          { name: "Home", url: SITE.url },
          { name: "Pricing", url: `${SITE.url}/pricing` },
          { name: detail.name, url: `${SITE.url}/pricing/${detail.slug}` },
        ]}
      />
      <PricingDetailLayout detail={detail} />
    </>
  );
}
