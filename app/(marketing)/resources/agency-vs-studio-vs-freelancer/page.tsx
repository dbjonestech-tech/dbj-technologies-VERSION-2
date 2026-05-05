import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { AgencyStudioFreelancerContent } from "./AgencyStudioFreelancerContent";

const SLUG = "/resources/agency-vs-studio-vs-freelancer";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Agency, Studio, or Freelancer",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function AgencyStudioFreelancerPage() {
  return <AgencyStudioFreelancerContent />;
}
