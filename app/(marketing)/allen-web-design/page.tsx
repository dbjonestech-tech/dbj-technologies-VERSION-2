import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { AllenContent } from "./AllenContent";

const SLUG = "/allen-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Allen Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <AllenContent />;
}
