import type { Metadata } from "next";
import ProcessContent from "./ProcessContent";

export const metadata: Metadata = {
  title: "My Process",
  description: "A structured 4-phase delivery framework: Diagnose, Architect, Engineer, Harden. Clear milestones and deliverables at every stage.",
  alternates: { canonical: "https://dbjtechnologies.com/process" },
  openGraph: {
    title: "My Process | DBJ Technologies",
    description: "Four phases, clear milestones, and full transparency. Diagnose, Architect, Engineer, Harden.",
  },
};

export default function ProcessPage() {
  return <ProcessContent />;
}
