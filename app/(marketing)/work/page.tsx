import type { Metadata } from "next";
import WorkContent from "./WorkContent";
import { getAllDesignBriefMeta } from "@/lib/design-briefs";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by DBJ Technologies. Production-grade websites and applications with real performance metrics.",
  alternates: { canonical: "https://dbjtechnologies.com/work" },
  openGraph: {
    title: "Work | DBJ Technologies",
    description:
      "Selected projects by DBJ Technologies. Production-grade websites and applications with real performance metrics.",
  },
};

export default function WorkPage() {
  const designBriefs = getAllDesignBriefMeta();
  return <WorkContent designBriefs={designBriefs} />;
}
