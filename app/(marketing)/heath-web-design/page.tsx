import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { HeathContent } from "./HeathContent";

const SLUG = "/heath-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Heath Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <HeathContent />;
}
