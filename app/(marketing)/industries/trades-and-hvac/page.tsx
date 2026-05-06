import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { TradesAndHvacContent } from "./TradesAndHvacContent";

const SLUG = "/industries/trades-and-hvac";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Trades and HVAC Websites",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function Page() {
  return <TradesAndHvacContent />;
}
