import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug, getServiceSlugs } from "@/lib/service-data";
import { SERVICES } from "@/lib/siteContent";
import { SITE } from "@/lib/constants";
import { ServicePageLayout } from "@/components/templates/ServicePageLayout";
import { JsonLd } from "@/components/layout/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.heroDescription,
    alternates: { canonical: `${SITE.url}/services/${slug}` },
    openGraph: {
      title: `${service.title} | DBJ Technologies`,
      description: service.heroDescription,
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const relatedServices = service.relatedSlugs
    .map((rs) => SERVICES.find((s) => s.slug === rs))
    .filter((s): s is NonNullable<typeof s> => s != null)
    .map(({ slug, title, tagline }) => ({ slug, title, tagline }));

  return (
    <>
      <JsonLd type="faq" faqItems={service.faq} />
      <JsonLd
        type="serviceItem"
        service={{
          slug: service.slug,
          name: service.title,
          description: service.longDescription,
        }}
      />
      <JsonLd
        type="breadcrumb"
        breadcrumb={[
          { name: "Home", url: SITE.url },
          { name: "Services", url: `${SITE.url}/services` },
          { name: service.title, url: `${SITE.url}/services/${slug}` },
        ]}
      />
      <ServicePageLayout service={service} relatedServices={relatedServices} />
    </>
  );
}
