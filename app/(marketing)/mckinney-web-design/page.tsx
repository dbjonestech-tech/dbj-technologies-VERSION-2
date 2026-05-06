import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { McKinneyContent } from "./McKinneyContent";

const SLUG = "/mckinney-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "McKinney Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <McKinneyContent />;
}
