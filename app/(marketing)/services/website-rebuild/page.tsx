import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { WebsiteRebuildContent } from "./WebsiteRebuildContent";

const SLUG = "/services/website-rebuild";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Website Rebuild Service",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <WebsiteRebuildContent />;
}
