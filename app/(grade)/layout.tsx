import type { Metadata } from "next";
import { CursorWrapper } from "@/components/layout/CursorWrapper";

export const metadata: Metadata = {
  title: {
    default: "Pathlight | Website Intelligence by DBJ Technologies",
    template: "%s | Pathlight",
  },
  description: "Free AI-powered website analysis for local businesses. See how your site performs, where you rank, and what it costs you.",
  robots: { index: true, follow: true },
};

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="relative min-h-screen">
      <CursorWrapper />
      {children}
    </main>
  );
}
