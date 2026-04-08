import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Fixed-price engineering phases: Foundation, Scale, and Enterprise. Scope and cost agreed before development begins.",
  openGraph: {
    title: "Pricing | DBJ Technologies",
    description:
      "Fixed-price engineering engagements with clear scope. Know exactly what you're getting before I write a single line of code.",
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
