import { Hero } from "@/components/sections/Hero";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { StatsSection } from "@/components/sections/Stats";
import { ServicesSection } from "@/components/sections/Services";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { TestimonialsSection } from "@/components/sections/Testimonials";
import { TechStackSection } from "@/components/sections/TechStack";
import { PathlightCTA } from "@/components/sections/PathlightCTA";
import { CTASection } from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ClientLogos />
      <ServicesSection />
      <StatsSection />
      <ProcessSteps />
      <TestimonialsSection />
      <TechStackSection />
      <PathlightCTA />
      <CTASection />
    </>
  );
}
