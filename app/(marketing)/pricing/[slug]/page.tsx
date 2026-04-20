import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPricingBySlug,
  getPricingSlugs,
  getPricingTierByName,
} from "@/lib/pricing-data";
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
    title: `${detail.tierName} Package`,
    description: detail.heroDescription,
    openGraph: {
      title: `${detail.tierName} Package | DBJ Technologies`,
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

  const tier = getPricingTierByName(detail.tierName);

  if (!tier) {
    notFound();
  }

  return <PricingDetailLayout detail={detail} tier={tier} />;
}
