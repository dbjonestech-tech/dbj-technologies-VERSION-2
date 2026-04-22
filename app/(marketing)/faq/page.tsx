import type { Metadata } from "next";
import FaqContent from "./FaqContent";
import { JsonLd } from "@/components/layout/JsonLd";
import { FAQ_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about working with DBJ Technologies. Project timelines, pricing, technologies, post-launch support, and more.",
  alternates: { canonical: "https://dbjtechnologies.com/faq" },
  openGraph: {
    title: "FAQ | DBJ Technologies",
    description:
      "Everything you need to know about working with DBJ Technologies.",
  },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd type="faq" faqItems={FAQ_ITEMS} />
      <FaqContent />
    </>
  );
}
