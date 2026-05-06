"use client";

import Link from "next/link";
import { LocalLanderLayout } from "@/components/templates/LocalLanderLayout";
import type {
  LocalLanderCTA,
  LocalLanderHero,
  LocalLanderSection,
} from "@/components/templates/LocalLanderLayout";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/dallas-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Dallas, Texas",
  coords: "32.7767° N, 96.7970° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Dallas service businesses.",
  subtitle:
    "I'm a solo principal architect based in the Dallas-Rockwall corridor. If you run a service business that lives or dies by what visitors do in the first ten seconds on your site, this page is for you.",
};

const sections: LocalLanderSection[] = [
  {
    id: "who-i-work-with",
    heading: "Who I work with in Dallas",
    body: (
      <>
        <p>
          I work with service businesses across the Dallas-Fort Worth
          metroplex. Most of my clients run businesses generating between
          $1M and $20M in annual revenue: legal practices in Park Cities
          and Uptown, dental and medical groups in Preston Hollow and around
          Bishop Arts, automotive service shops along the eastern corridor
          through Richardson and Rockwall, hospitality and restaurant groups
          in Knox-Henderson and Lower Greenville, professional services
          firms in Las Colinas and Plano, and trades businesses across the
          broader DFW area.
        </p>
        <p>
          The buyer profile is consistent. The owner has tried agency
          engagements that were sales-led, junior-delivered, and slower
          than promised. Or they have tried a freelancer who shipped a
          passable site and disappeared on month four. They want one
          experienced architect who shows up, scopes the project honestly,
          builds the site themselves, and stays accountable through launch
          and beyond.
        </p>
        <p>
          If that profile fits you, this is the right place to talk.
        </p>
      </>
    ),
  },
  {
    id: "how-my-model-differs",
    heading: "How my model differs from Dallas's agency market",
    body: (
      <>
        <p>
          The Dallas web design and digital agency market is large.
          Industry directories like Built In and Clutch list hundreds of
          agencies serving DFW, ranging from 50-person creative shops in
          Deep Ellum to multi-office digital firms in the Telecom Corridor.
          Most are competent. Some are excellent. None of them are me.
        </p>
        <p>
          The structural difference is simple. Most Dallas agencies are
          sales-led teams. The senior people pitched in the proposal are
          rarely the senior people who deliver. Communication routes
          through an account manager. Scope decisions happen as change
          orders that compound the budget. The work product can be
          excellent, but the buyer pays for a coordination layer that does
          not improve the outcome.
        </p>
        <p>
          I work as a solo principal architect. The same person scopes the
          project, builds it, and launches it. Engagements start at $25,000
          with full code ownership at delivery. There is no account
          manager, no junior delivery team, and no quarterly retainer trap.
          If that model fits, I am usually the right call. If you need a
          200-person team for a multi-property brand program, I am
          genuinely not.
        </p>
      </>
    ),
  },
  {
    id: "local-proof",
    heading: "Work I have shipped in the Dallas area",
    body: (
      <>
        <p>
          The clearest local proof is{" "}
          <Link
            href="/work"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Star Auto Service in Richardson
          </Link>
          . It is a full custom build on{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Next.js
          </Link>
          , in production, used by an active automotive repair business in
          the eastern DFW corridor.
          The site scores at the top of the Lighthouse range, passes Core
          Web Vitals at the 75th percentile, and serves both the
          customer-facing booking flow and the internal operations
          dashboard. The longer-form discussion of how I build for that
          vertical specifically lives on the{" "}
          <Link
            href="/industries/auto-service"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            auto service industry page
          </Link>
          .
        </p>
        <p>
          Beyond Star Auto, my published{" "}
          <Link
            href="/work"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Design Briefs
          </Link>{" "}
          cover eight verticals that show up regularly in the Dallas
          market: dental practices, automotive shops, law firms, financial
          advisors, restaurants, retail, real estate, and hospitality. Each
          brief is an image-anchored reference architecture for that
          vertical, drawn from the same studio that builds the production
          sites.
        </p>
        <p>
          <Link
            href="/pathlight"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Pathlight
          </Link>
          , the AI-powered website intelligence product I built, is the
          deepest piece of my own work and runs on the same Next.js
          architecture I would build for you. You can run a free scan
          against your current site to see exactly what it surfaces.
        </p>
      </>
    ),
  },
  {
    id: "engagement-model",
    heading: "Engagement model and pricing",
    body: (
      <>
        <p>
          Engagements start at $25,000. The exact number depends on page
          count, integrations, content volume, and any custom internal-tool
          work the project includes. Pricing is fixed at the start, not
          hourly. You own the code at delivery, with no platform lock-in
          and no recurring license fees.
        </p>
        <p>
          A typical Dallas service-business engagement runs 8 to 12 weeks
          from kickoff to launch. The work splits into discovery and
          architecture, design and content, build, and launch with a
          30-day post-launch optimization window included. The same person
          stays on the project from the first scoping call through the
          launch retrospective.
        </p>
      </>
    ),
  },
  {
    id: "where-im-based",
    heading: "Where I am based and how local I really am",
    body: (
      <>
        <p>
          The studio is based in Royse City, Texas, in Hunt County, on the
          eastern edge of the DFW metroplex along the Interstate 30
          corridor. The U.S. Census Bureau ranks Dallas-Fort Worth-Arlington
          as the fourth-largest metropolitan statistical area in the
          United States by population, and the U.S. Bureau of Labor
          Statistics tracks DFW as one of the fastest-growing major
          employment markets in the country (BLS, 2024).
        </p>
        <p>
          I serve the entire metroplex with deepest concentration on
          Dallas proper, Park Cities, North Dallas, Uptown, the Telecom
          Corridor in Richardson, and the eastern corridor through
          Rockwall County. For Rockwall County and Hunt County buyers, I
          am the closest custom-build studio to your front door. For DFW
          proper buyers, the engagement runs over video calls and async
          work, with occasional in-person scoping when it helps. Travel
          inside DFW is included; I do not bill it separately.
        </p>
        <p>
          The longer-form playbook on what actually moves the local
          pack and the standard organic results in DFW lives at{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Local SEO for Dallas Service Businesses
          </Link>
          . That page is the hub the city pages link up to, and it is
          the right starting point if you are still figuring out what
          local SEO is actually buying you.
        </p>
        <p>
          For city-specific takes on how the engagement and the
          design considerations flex to fit a particular DFW market,
          the live city pages cover{" "}
          <Link
            href="/plano-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Plano
          </Link>
          ,{" "}
          <Link
            href="/frisco-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Frisco
          </Link>
          ,{" "}
          <Link
            href="/mckinney-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            McKinney
          </Link>
          ,{" "}
          <Link
            href="/allen-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Allen
          </Link>
          ,{" "}
          <Link
            href="/richardson-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Richardson
          </Link>
          ,{" "}
          <Link
            href="/prosper-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Prosper
          </Link>
          ,{" "}
          <Link
            href="/rockwall-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Rockwall
          </Link>
          ,{" "}
          <Link
            href="/heath-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Heath
          </Link>
          ,{" "}
          <Link
            href="/royse-city-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Royse City
          </Link>
          , and{" "}
          <Link
            href="/forney-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Forney
          </Link>
          . Each city runs a structurally different buyer profile
          and the architectural response is different.
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question: "Do you only work with Dallas businesses?",
    answer:
      "No, but most of my clients are based in Dallas-Fort Worth. I have shipped projects for businesses outside Texas; the engagement runs the same way over video calls and async collaboration. Local proximity is a nice-to-have, not a requirement.",
  },
  {
    question: "How does your pricing compare to Dallas agencies?",
    answer:
      "My total project costs are typically competitive with mid-tier Dallas agencies, but a larger share of the budget goes into actual building rather than coordination overhead. The starting price of $25,000 is honest; agencies often quote lower starting prices that grow through change orders.",
  },
  {
    question: "Do you handle local SEO for Dallas businesses?",
    answer:
      "Yes. Every site I ship includes proper local schema (LocalBusiness, Service, FAQPage), Google Business Profile alignment, and on-page elements that the local search algorithm rewards. I also ship Pathlight scans free for any prospect, which surfaces specific local SEO gaps. The Resources section of the site has the longer reference on what actually moves DFW local rankings.",
  },
  {
    question: "What does the engagement timeline look like?",
    answer:
      "Most Dallas service-business projects run 8 to 12 weeks from signed contract to launch. Discovery and architecture take 1 to 2 weeks. Design and content take 2 to 3 weeks. Build takes 3 to 5 weeks. Launch and the 30-day optimization window take the remainder.",
  },
  {
    question: "Can I see your work before I commit?",
    answer:
      "Yes. The /work page on this site shows the projects I am willing to discuss publicly, including Star Auto and the eight Design Briefs. For a private walkthrough of more sensitive client work or the Canopy admin product, the contact form is the right entry.",
  },
  {
    question: "Do you offer maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The 30-day post-launch optimization window is included in every engagement. Beyond that, maintenance is a separate, lightweight conversation.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Dallas project?",
  headline: "Let's see if my model fits your business.",
  body: "If the principal-architect approach makes sense for what you are building, the contact form is the right place to start. I read every submission personally and respond within one business day.",
  primary: { label: "Get in touch", href: "/contact" },
  secondary: { label: "See what I have built", href: "/work" },
};

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "U.S. Census Bureau",
    year: 2024,
    title: "QuickFacts: Dallas city, Texas",
    url: "https://www.census.gov/quickfacts/dallascitytexas",
  },
  {
    id: 2,
    org: "U.S. Census Bureau",
    year: 2024,
    title:
      "Population Estimates: Dallas-Fort Worth-Arlington Metropolitan Statistical Area",
    url: "https://www.census.gov/programs-surveys/popest.html",
  },
  {
    id: 3,
    org: "U.S. Bureau of Labor Statistics",
    year: 2024,
    title: "Dallas-Fort Worth Area Economic Summary",
    publication: "Southwest Information Office",
    url: "https://www.bls.gov/regions/southwest/summary/blssummary_dallasfortworth.pdf",
  },
  {
    id: 4,
    org: "Federal Reserve Bank of Dallas",
    year: 2024,
    title: "Texas Economic Indicators",
    url: "https://www.dallasfed.org/research/indicators/tei",
  },
];

export function DallasContent() {
  const config = getPageConfig(SLUG);
  if (!config) return null;

  return (
    <LocalLanderLayout
      config={config}
      hero={hero}
      sections={sections}
      faq={faq}
      cta={cta}
      sources={sources}
    />
  );
}
