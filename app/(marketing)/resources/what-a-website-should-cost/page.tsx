import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { WebsiteCostContent } from "./WebsiteCostContent";

const SLUG = "/resources/what-a-website-should-cost";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "What a Website Should Cost",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function WebsiteCostPage() {
  return <WebsiteCostContent />;
}
