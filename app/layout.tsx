import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { CursorWrapper } from "@/components/layout/CursorWrapper";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

/* ─── FONTS ─────────────────────────────────────────── */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/* ─── METADATA ──────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL("https://dbjtechnologies.com"),
  title: {
    default: "DBJ Technologies — Web Development Studio in Dallas, TX",
    template: "%s | DBJ Technologies",
  },
  description:
    "DBJ Technologies is a web development studio in Dallas, TX. We build high-performance websites, modern web applications, and cloud infrastructure using Next.js, React, and TypeScript.",
  keywords: [
    "web development",
    "web design",
    "next.js",
    "react",
    "dallas web developer",
    "texas web development",
    "web application",
    "cloud infrastructure",
    "devops",
    "e-commerce development",
  ],
  authors: [{ name: "DBJ Technologies" }],
  creator: "DBJ Technologies",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dbjtechnologies.com",
    siteName: "DBJ Technologies",
    title: "DBJ Technologies — Web Development Studio in Dallas, TX",
    description:
      "High-performance websites, modern applications, and cloud infrastructure. Built by senior engineers in Dallas, TX.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DBJ Technologies — Web Development Studio",
    description: "High-performance websites and applications built by senior engineers in Dallas, TX.",
  },
  icons: {
    icon: [
      { url: "/brand/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/brand/apple_touch_icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/* ─── ROOT LAYOUT ───────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* Critical inline cursor rule — prevents native arrow flash before external CSS loads */}
        <style dangerouslySetInnerHTML={{ __html: '@media(pointer:fine) and (prefers-reduced-motion:no-preference){*,*::before,*::after{cursor:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=") 0 0,none!important}input:not([type="submit"]):not([type="button"]):not([type="reset"]),textarea,select,[contenteditable="true"]{cursor:auto!important}}' }} />
        <JsonLd type="organization" />
        <JsonLd type="website" />
        <JsonLd type="localBusiness" />
      </head>
      <body className="font-body bg-bg-primary text-text-primary antialiased selection:bg-accent-blue/20">
        {/* A11Y: Skip to content */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>

        {/* Grain texture overlay */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* Custom cursor (desktop only, no SSR) */}
        <CursorWrapper />

        <Navbar />
        <main id="main-content" className="relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
