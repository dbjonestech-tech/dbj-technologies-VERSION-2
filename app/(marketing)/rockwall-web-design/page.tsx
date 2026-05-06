import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { RockwallContent } from "./RockwallContent";

const SLUG = "/rockwall-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Rockwall Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <RockwallContent />;
}
