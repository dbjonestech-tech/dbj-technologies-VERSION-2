import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "Sign in to the DBJ Technologies client portal, or request access if you have not been invited yet.",
  robots: { index: true, follow: true },
};

export default function PortalAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
