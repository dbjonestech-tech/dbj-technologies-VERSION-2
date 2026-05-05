import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { AutoServiceContent } from "./AutoServiceContent";

const SLUG = "/industries/auto-service";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Auto Service Websites",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function AutoServicePage() {
  return <AutoServiceContent />;
}
