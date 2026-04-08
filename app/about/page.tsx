import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "DBJ Technologies is a bespoke digital engineering studio in Dallas, TX. Production-grade websites and applications built by a solo principal architect with full code ownership.",
  openGraph: {
    title: "About | DBJ Technologies",
    description:
      "A Dallas-based digital engineering studio focused on precision, transparency, and production-grade delivery.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
