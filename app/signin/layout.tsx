import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
