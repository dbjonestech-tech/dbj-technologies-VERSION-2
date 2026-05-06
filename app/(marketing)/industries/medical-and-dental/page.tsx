import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { MedicalAndDentalContent } from "./MedicalAndDentalContent";

const SLUG = "/industries/medical-and-dental";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Medical and Dental Practice Websites",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function MedicalAndDentalPage() {
  return <MedicalAndDentalContent />;
}
