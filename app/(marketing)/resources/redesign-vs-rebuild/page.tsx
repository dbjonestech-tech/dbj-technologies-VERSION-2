import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { RedesignVsRebuildContent } from "./RedesignVsRebuildContent";

const SLUG = "/resources/redesign-vs-rebuild";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Redesign vs Rebuild",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <RedesignVsRebuildContent />;
}
