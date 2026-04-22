import type { Metadata } from "next";
import MaintenanceSupportContent from "./MaintenanceSupportContent";

export const metadata: Metadata = {
  title: "Maintenance & Support",
  description: "Keep your website fast, secure, and up-to-date with dedicated maintenance plans. Continuous monitoring, security updates, performance optimization, and priority support.",
  alternates: { canonical: "https://dbjtechnologies.com/maintenance-support" },
  openGraph: {
    title: "Maintenance & Support | DBJ Technologies",
    description: "Monthly maintenance plans starting at $299/month. Monitoring, updates, security, and priority support.",
  },
};

export default function MaintenanceSupportPage() {
  return <MaintenanceSupportContent />;
}
