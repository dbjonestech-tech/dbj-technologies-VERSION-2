import type { Metadata } from "next";
import WorkContent from "./WorkContent";

export const metadata: Metadata = {
  title: "Core Disciplines",
  description:
    "Three core engineering disciplines that define my practice: Frontend Architecture, Backend Infrastructure, and Performance Engineering.",
  openGraph: {
    title: "Core Disciplines | DBJ Technologies",
    description:
      "Frontend architecture, backend infrastructure, and performance engineering. The disciplines behind every engagement.",
  },
};

export default function WorkPage() {
  return <WorkContent />;
}
