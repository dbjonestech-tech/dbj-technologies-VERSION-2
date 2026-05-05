import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { LocalSeoContent } from "./LocalSeoContent";

const SLUG = "/resources/local-seo-for-dallas-service-businesses";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Local SEO for Dallas Service Businesses",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function LocalSeoPage() {
  return <LocalSeoContent />;
}
