import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { RichardsonContent } from "./RichardsonContent";

const SLUG = "/richardson-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Richardson Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <RichardsonContent />;
}
