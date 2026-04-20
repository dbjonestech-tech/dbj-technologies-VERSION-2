import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/Hero";
import { ClientLogos } from "@/components/sections/ClientLogos";
import { StatsSection } from "@/components/sections/Stats";

/* ─── DYNAMIC IMPORTS ───────────────────────────────
 * Below-fold sections are dynamically imported so they
 * don't block the initial bundle. The Hero, ClientLogos,
 * and Stats load immediately because they're above or
 * near the fold and critical for LCP / first impression.
 * ──────────────────────────────────────────────────── */
const ServicesSection = dynamic(
  () => import("@/components/sections/Services").then((m) => m.ServicesSection),
  { loading: () => <SectionSkeleton /> }
);
const ProcessSteps = dynamic(
  () => import("@/components/sections/ProcessSteps").then((m) => m.ProcessSteps),
  { loading: () => <SectionSkeleton /> }
);
const TestimonialsSection = dynamic(
  () => import("@/components/sections/Testimonials").then((m) => m.TestimonialsSection),
  { loading: () => <SectionSkeleton /> }
);
const TechStackSection = dynamic(
  () => import("@/components/sections/TechStack").then((m) => m.TechStackSection),
  { loading: () => <SectionSkeleton /> }
);
const CTASection = dynamic(
  () => import("@/components/sections/CTA").then((m) => m.CTASection),
  { loading: () => <SectionSkeleton /> }
);

function SectionSkeleton() {
  return (
    <div className="min-h-[500px] py-32" aria-hidden="true">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading skeleton */}
        <div className="mx-auto max-w-xs mb-16">
          <div className="h-4 w-24 mx-auto rounded bg-gray-200 animate-pulse mb-4" />
          <div className="h-8 w-64 mx-auto rounded bg-gray-200 animate-pulse mb-3" />
          <div className="h-4 w-48 mx-auto rounded bg-gray-200 animate-pulse" />
        </div>
        {/* Content grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse mb-4" />
              <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-3" />
              <div className="h-3 w-full rounded bg-gray-200 animate-pulse mb-2" />
              <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <CTASection />
    </>
  );
}
