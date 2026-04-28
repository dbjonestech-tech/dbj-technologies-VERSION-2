import type { Metadata } from "next";
import { PathlightBackdrop } from "./PathlightBackdrop";
import { PathlightContent } from "./PathlightContent";
import { PathlightForm } from "./PathlightForm";

export const metadata: Metadata = {
  title: "Pathlight | Free AI Website Analysis",
  description:
    "Free AI powered website intelligence for local businesses. Find the problems, find the money drain, find the fix. No credit card. Results in minutes.",
  alternates: { canonical: "https://dbjtechnologies.com/pathlight" },
  openGraph: {
    type: "website",
    url: "https://dbjtechnologies.com/pathlight",
    siteName: "DBJ Technologies",
    title: "Pathlight | Free AI Website Analysis",
    description:
      "AI powered website analysis for local businesses. Find the problems. Find the money drain. Find the fix.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pathlight | Free AI Website Analysis",
    description:
      "Free AI powered website intelligence. Find the problems. Find the money drain. Find the fix.",
  },
};

export default function GradePage() {
  return (
    <>
      <PathlightBackdrop />
      <PathlightForm />
      <PathlightContent />
    </>
  );
}
