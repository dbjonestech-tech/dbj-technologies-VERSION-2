import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Fixed-price engineering engagements: Starter from $4,500, Professional from $9,500, Enterprise custom. Scope, timeline, and cost agreed before development begins.",
  alternates: { canonical: "https://dbjtechnologies.com/pricing" },
  openGraph: {
    title: "Pricing | DBJ Technologies",
    description:
      "Transparent fixed pricing for web, application, and cloud engagements. Starter $4,500, Professional $9,500, Enterprise custom — every scope locked in before I write a line of code.",
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
