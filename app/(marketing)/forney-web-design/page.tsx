import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { ForneyContent } from "./ForneyContent";

const SLUG = "/forney-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Forney Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <ForneyContent />;
}
