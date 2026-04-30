import type { Metadata } from "next";
import { CursorWrapper } from "@/components/layout/CursorWrapper";

export const metadata: Metadata = {
  title: {
    default: "Pathlight | Website Intelligence by DBJ Technologies",
    template: "%s | Pathlight",
  },
  description: "Free website diagnostic for local businesses. Find the problems. Find the money drain. Find the fix. No credit card. Results in minutes.",
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
