import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-system/resolve";
import { PerformanceAuditContent } from "./PerformanceAuditContent";

const SLUG = "/services/website-performance-audit";

export function generateMetadata(): Metadata {
  const config = getPageConfig(SLUG);
  return {
    title: config?.title ?? "Website Performance Audit",
    description: config?.description,
    alternates: { canonical: SLUG },
  };
}

export default function PerformanceAuditPage() {
  return <PerformanceAuditContent />;
}
