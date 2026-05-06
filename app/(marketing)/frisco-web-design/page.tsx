import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { FriscoContent } from "./FriscoContent";

const SLUG = "/frisco-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Frisco Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <FriscoContent />;
}
