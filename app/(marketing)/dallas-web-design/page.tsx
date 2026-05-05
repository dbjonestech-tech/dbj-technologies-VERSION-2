import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { DallasContent } from "./DallasContent";

const SLUG = "/dallas-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Dallas Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function DallasWebDesignPage() {
  return <DallasContent />;
}
