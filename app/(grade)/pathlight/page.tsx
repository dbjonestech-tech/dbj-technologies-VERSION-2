import type { Metadata } from "next";
import { PathlightBackdrop } from "./PathlightBackdrop";
import { PathlightContent } from "./PathlightContent";
import { PathlightForm } from "./PathlightForm";

export const metadata: Metadata = {
  title: "Pathlight | Free Website Diagnostic",
  description:
    "Free website diagnostic for local businesses. Find the problems, find the money drain, find the fix. No credit card. Results in minutes.",
  alternates: { canonical: "https://dbjtechnologies.com/pathlight" },
  openGraph: {
    type: "website",
    url: "https://dbjtechnologies.com/pathlight",
    siteName: "DBJ Technologies",
    title: "Pathlight | Free Website Diagnostic",
    description:
      "Website diagnostic for local businesses. Find the problems. Find the money drain. Find the fix.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pathlight | Free Website Diagnostic",
    description:
      "Free website diagnostic. Find the problems. Find the money drain. Find the fix.",
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
