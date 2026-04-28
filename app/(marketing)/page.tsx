import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { TestimonialBand } from "@/components/sections/TestimonialBand";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { StatsSection } from "@/components/sections/Stats";
import { ServicesSection } from "@/components/sections/Services";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { TechStackSection } from "@/components/sections/TechStack";
import { PathlightCTA } from "@/components/sections/PathlightCTA";
import { CTASection } from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Web Development & Digital Systems Studio | Dallas, TX",
  description:
    "DBJ Technologies builds high performance websites, production grade web applications, and cloud infrastructure for Dallas area businesses. Principal level engineering, fixed pricing, full code ownership.",
  alternates: { canonical: "https://dbjtechnologies.com" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TestimonialBand />
      <PathlightCTA />
      <ClientLogos />
      <ServicesSection />
      <StatsSection />
      <ProcessSteps />
      <TechStackSection />
      <CTASection />
    </>
  );
}
