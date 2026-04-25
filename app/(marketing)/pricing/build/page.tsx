import type { Metadata } from "next";
import BuildContent from "./BuildContent";

export const metadata: Metadata = {
  title: "Build Your Package",
  description:
    "Configure a custom website package. Pick a base tier, toggle the add-ons you need, see a running total, and request a quote.",
  alternates: { canonical: "https://dbjtechnologies.com/pricing/build" },
  openGraph: {
    title: "Build Your Package | DBJ Technologies",
    description:
      "Pick a base tier, add the features you need, and request a fixed-price quote tailored to your project.",
  },
};

export default function BuildPackagePage() {
  return <BuildContent />;
}
