import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { ProsperContent } from "./ProsperContent";

const SLUG = "/prosper-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Prosper Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <ProsperContent />;
}
