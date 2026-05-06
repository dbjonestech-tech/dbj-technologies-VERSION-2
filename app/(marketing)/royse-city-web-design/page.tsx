import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { RoyseCityContent } from "./RoyseCityContent";

const SLUG = "/royse-city-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Royse City Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <RoyseCityContent />;
}
