import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPricingBySlug, getPricingSlugs } from "@/lib/pricing-data";
import { PricingDetailLayout } from "@/components/templates/PricingDetailLayout";

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
    alternates: { canonical: `https://dbjtechnologies.com/pricing/${slug}` },
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

  return <PricingDetailLayout detail={detail} />;
}
