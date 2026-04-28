import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About Joshua Jones — Principal Architect",
  description:
    "DBJ Technologies is a bespoke digital engineering studio in Dallas, TX. Production grade websites and applications built by a solo principal architect with full code ownership.",
  alternates: { canonical: "https://dbjtechnologies.com/about" },
  openGraph: {
    title: "About Joshua Jones — Principal Architect | DBJ Technologies",
    description:
      "A Dallas based digital engineering studio focused on precision, transparency, and production grade delivery.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
