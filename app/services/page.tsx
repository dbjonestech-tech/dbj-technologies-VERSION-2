import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";
import { JsonLd } from "@/components/layout/JsonLd";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Frontend architecture, backend systems, cloud infrastructure, interface engineering, e-commerce platforms, and performance optimization. Scoped, priced, and delivered with production-grade precision.",
  openGraph: {
    title: "Services | DBJ Technologies",
    description:
      "Six core engineering disciplines. Fixed pricing, clear deliverables, production-grade results.",
  },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd type="service" />
      <ServicesContent />
    </>
  );
}
