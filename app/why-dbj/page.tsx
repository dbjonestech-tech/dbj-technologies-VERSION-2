import type { Metadata } from "next";
import WhyDBJContent from "./WhyDBJContent";

export const metadata: Metadata = {
  title: "Why DBJ Technologies",
  description: "Performance guarantees, code ownership, principal-level expertise, and fixed pricing. Commitments written into every engagement agreement.",
  openGraph: {
    title: "Why DBJ Technologies",
    description: "90+ Lighthouse scores, 100% code ownership, principal-level expertise, and fixed pricing. Guaranteed in every contract.",
  },
};

export default function WhyDBJPage() {
  return <WhyDBJContent />;
}
