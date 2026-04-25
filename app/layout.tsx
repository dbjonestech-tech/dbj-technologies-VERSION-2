import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { JsonLd } from "@/components/layout/JsonLd";
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
    default: "DBJ Technologies | Architect The Impossible",
    template: "%s | DBJ Technologies",
  },
  description:
    "DBJ Technologies is a bespoke digital engineering studio in Dallas, TX. I build high-performance websites, production-grade web applications, and cloud infrastructure using Next.js, React, and TypeScript.",
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
  publisher: "DBJ Technologies",
  category: "technology",
  alternates: {
    canonical: "https://dbjtechnologies.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dbjtechnologies.com",
    siteName: "DBJ Technologies",
    title: "DBJ Technologies | Architect The Impossible",
    description:
      "High-performance websites, modern applications, and cloud infrastructure. Engineered by a solo principal architect in Dallas, TX.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DBJ Technologies | Architect The Impossible",
    description: "High-performance websites and applications engineered by a solo principal architect in Dallas, TX.",
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
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Anti-flicker (homepage): paint the html element dark BEFORE any
     stylesheet or script can run. Inline `style` on the <html> tag is
     applied at HTML parse time, ahead of CSS download. Next.js auto-
     hoists <link rel="stylesheet"> above any user-provided head tags,
     which means a head-level <script> is parser-blocked behind CSS and
     can't paint the canvas in time. The only mechanism that beats CSS
     to first paint is an attribute on the root element itself.
     Path is read via middleware.ts which forwards `x-pathname` on the
     request. Non-home routes get no inline style and behave as before. */
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isHome = pathname === "/";

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} ${jetbrains.variable}`}
      style={isHome ? { backgroundColor: "#06060a" } : undefined}
    >
      <head>
        <meta name="theme-color" content="#06060a" />
        {/* Repeat-visit fast-path: if HeroCinema has previously revealed,
            the inline html style above is no longer needed. Clear it so
            the page reads as the default light theme on subsequent loads. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.location.pathname==='/'&&sessionStorage.getItem('hero-revealed')==='true'){document.documentElement.style.removeProperty('background-color');}}catch(e){}",
          }}
        />
        <JsonLd type="organization" />
        <JsonLd type="website" />
        <JsonLd type="localBusiness" />
      </head>
      <body className="font-body text-text-primary antialiased selection:bg-accent-blue/20">
        {children}
      </body>
    </html>
  );
}
