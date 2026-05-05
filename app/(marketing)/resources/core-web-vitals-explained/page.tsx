import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { CoreWebVitalsContent } from "./CoreWebVitalsContent";

const SLUG = "/resources/core-web-vitals-explained";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Core Web Vitals Explained",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function CoreWebVitalsPage() {
  return <CoreWebVitalsContent />;
}
