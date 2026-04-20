import { CursorWrapper } from "@/components/layout/CursorWrapper";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* A11Y: Skip to content */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Grain texture overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Cursor charge enhancement (desktop only, no SSR) */}
      <CursorWrapper />

      <Navbar />
      <main id="main-content" className="relative">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <SpeedInsights />
    </>
  );
}
