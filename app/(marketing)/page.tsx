import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { TestimonialBand } from "@/components/sections/TestimonialBand";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { StatsSection } from "@/components/sections/Stats";
import { ServicesSection } from "@/components/sections/Services";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { DiagnoseFixGrow } from "@/components/sections/DiagnoseFixGrow";
import { PathlightCTA } from "@/components/sections/PathlightCTA";
import { CTASection } from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Find Where Your Website Loses Leads. Fix It. | DBJ Technologies",
  description:
    "Pathlight scans your website and shows you exactly where it's losing trust, leads, and revenue. DBJ Technologies fixes the highest-impact issues first. Free scan, fixed-price engagements, full code ownership.",
  alternates: { canonical: "https://dbjtechnologies.com" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TestimonialBand />
      <DiagnoseFixGrow />
      <PathlightCTA />
      <ClientLogos />
      <ServicesSection />
      <StatsSection />
      <ProcessSteps />
      <CTASection />
    </>
  );
}
