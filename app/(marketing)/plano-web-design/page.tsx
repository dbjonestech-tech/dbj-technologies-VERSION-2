import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { PlanoContent } from "./PlanoContent";

const SLUG = "/plano-web-design";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Plano Web Design Studio",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <PlanoContent />;
}
