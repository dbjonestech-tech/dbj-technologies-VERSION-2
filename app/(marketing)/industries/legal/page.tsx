import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { LegalContent } from "./LegalContent";

const SLUG = "/industries/legal";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Legal Practice Websites",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <LegalContent />;
}
