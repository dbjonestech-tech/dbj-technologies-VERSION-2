import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { NextjsDevelopmentContent } from "./NextjsDevelopmentContent";

const SLUG = "/services/nextjs-development";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Next.js Development for Service Businesses",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function NextjsDevelopmentPage() {
  return <NextjsDevelopmentContent />;
}
