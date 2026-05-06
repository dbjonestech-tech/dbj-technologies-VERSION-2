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

const SLUG = "/allen-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Allen, Texas",
  coords: "33.1032° N, 96.6706° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Allen service businesses.",
  subtitle:
    "Allen runs a quieter version of the DFW corporate-corridor pattern. Top-decile schools, mature residential growth, a lifestyle-center retail backbone at The Watters Creek, and a service-business buyer who has been comparing vendors here for fifteen years and is harder to impress than first-time corporate-corridor buyers in Frisco or Prosper. This page covers who I work with in Allen, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "allen-buyer-profile",
    heading: "Who I work with in Allen",
    body: (
      <>
        <p>
          Allen is the steadiest growth story in the eastern Collin
          County corridor. The city has been adding population
          consistently since the late 1990s and now sits at roughly
          one hundred eleven thousand residents (U.S. Census Bureau,
          2024). Unlike Frisco and Prosper, where most of the buyer
          base relocated within the last ten years, a meaningful
          share of Allen households have lived in the city long
          enough to have hired a service business locally three or
          four times. That makes the Allen buyer demonstrably more
          discerning than first-time-buyer markets where the
          conversion math leans on novelty.
        </p>
        <p>
          The service-business buyer in Allen usually fits one of
          three profiles. First, the established practice firm
          (medical, dental, legal, financial) serving the long-time
          household population. These firms compete less on visual
          flash and more on continuity, named-practitioner trust,
          and Google Business Profile health. Second, the high-end
          home services business: pool service, pool repair, custom
          builders, landscaping, exterior painting, where the Allen
          residential housing stock and the income tier support
          higher average tickets than the DFW metro-wide average.
          Third, the consumer-services business clustered around
          The Watters Creek, the Allen Premium Outlets, and the
          retail corridor along US 75: fitness, beauty, dining,
          urgent care, where the lifestyle-center demographic and
          the daily traffic past the storefront combine into a
          high-volume conversion environment.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Allen-area or Plano-area agencies that produced
          templated work without local taste, this page is the right
          starting point.
        </p>
      </>
    ),
  },
  {
    id: "allen-economy",
    heading: "Why the Allen economy shapes the site",
    body: (
      <>
        <p>
          Allen is structurally different from Plano and Frisco. The
          corporate density is meaningfully lower, the residential
          density is meaningfully higher, and the city has invested
          for two decades in lifestyle-center retail and civic
          infrastructure rather than in headquarters recruitment.
          The Allen Economic Development Corporation reports
          consistent diversification across professional services,
          healthcare, technology, and retail (Allen EDC, 2024). The
          Allen 2045 Comprehensive Plan, the city&apos;s active
          long-range planning document, treats land-use balance and
          transportation infrastructure as the dominant priorities
          rather than aggressive corporate recruitment.
        </p>
        <p>
          What this means for the site you ship: the Allen visual
          baseline is calibrated to a buyer who values quiet
          competence over flash. An Allen dental practice or legal
          firm is being compared to other long-tenured Allen firms,
          not to relocation-driven Frisco firms with Silicon Valley
          aesthetic expectations. The conversion math leans on
          credibility signals (years in business, named
          practitioners, real local reviews, named local
          references) more than on visual sophistication. A site
          that reads as carefully built rather than aggressively
          designed wins more often in this market.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks the
          Plano-Frisco-McKinney professional services submarket as
          one of the fastest-growing employment markets in the
          country, and Allen is structurally part of that submarket
          (BLS, Dallas-Fort Worth Area Economic Summary, 2024).
          Competition for local-pack visibility is meaningful but
          generally less intense than in Plano proper because the
          Allen population is more concentrated and the firm count
          per capita is lower.
        </p>
      </>
    ),
  },
  {
    id: "allen-neighborhoods",
    heading: "Allen geography and how the city actually divides",
    body: (
      <>
        <p>
          Allen divides along clearer geographic lines than Frisco
          but less starkly than Plano. The dominant axis is US 75,
          which separates the older established neighborhoods west
          of the highway from the newer high-density residential
          and retail growth east of the highway. The Sam Rayburn
          Tollway (SH 121) cuts across the southern edge and
          connects Allen to the broader Plano-Frisco corridor; the
          Stacy Road corridor on the eastern edge anchors much of
          the newer residential growth.
        </p>
        <p>
          The Watters Creek at Montgomery Farm is the cultural
          center of Allen retail. The lifestyle-center development
          on the eastern side of US 75, with named brand tenants,
          dining anchors, and a public-square design, draws
          consistent daily traffic and shapes the buyer&apos;s
          expectation of what a polished Allen business should
          look like. Adjacent retail along Stacy Road and Watters
          Road extends the same demographic environment.
        </p>
        <p>
          The Allen Event Center and Allen Premium Outlets along
          the SH 121 corridor anchor the entertainment and
          discount-retail ends of the city economy. Allen High
          School and the Allen Eagles football program are real
          civic anchors with national recognition, and businesses
          near the Eagle Stadium corridor benefit from the implied
          civic continuity. North Allen, around the Custer Road and
          Bethany Drive corridors, holds much of the older
          residential housing stock and the long-tenured
          professional services population.
        </p>
        <p>
          For Allen service businesses serving multiple sub-areas,
          a service-area zone page that names actual sub-zones
          (West Allen, East Allen near The Watters Creek, North
          Allen) outperforms generic city-name templated pages. The
          longer reference on this is the{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            local SEO hub
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "allen-engagement-model",
    heading: "How the engagement runs for an Allen client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW client.
          Solo principal architect, fixed pricing at the start, full
          code ownership at delivery. The longer reference on the
          general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Allen specifically, two things flex. First, the
          discovery work usually leans harder on continuity and
          legacy. Like McKinney, the Allen buyer more often has an
          existing site that has worked acceptably for five to ten
          years and a real concern about losing whatever has driven
          referral and repeat traffic. The discovery pass typically
          includes auditing what the existing site is currently
          doing well and protecting those signals through the
          rebuild. Second, the Allen residential service-business
          category (high-end home services serving the long-tenured
          residential population) is one of the strongest match
          cases for a custom build in DFW because the average
          ticket is high enough to justify the investment and the
          buyer base values craft over flash.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For published references for
          the verticals most common in Allen, the{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            medical and dental
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          industry pages cover the architectural specifics.
        </p>
      </>
    ),
  },
  {
    id: "allen-where-im-based",
    heading: "Where I am based relative to Allen",
    body: (
      <>
        <p>
          The studio is based in Royse City. The drive to Allen
          runs along SH 78 and the Sam Rayburn Tollway, roughly
          forty minutes in normal traffic. Most engagements run
          over video calls and async work, with occasional
          in-person scoping at the client&apos;s office in The
          Watters Creek area, along the US 75 corridor, or in the
          North Allen residential corridor when it helps the
          project. Travel inside DFW is included.
        </p>
        <p>
          For Allen buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it. Most
          Allen-area agencies separate the two; I do not. If that
          model fits, this is the right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor are{" "}
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
          , and{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Dallas proper
          </Link>
          . Each runs a structurally different buyer profile.
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question:
      "Do you only work with Allen businesses, or with all DFW?",
    answer:
      "I work across DFW. Allen is part of the same Collin County corridor as Plano, Frisco, and McKinney, and the engagement model is metro-wide. Allen is geographically close to the studio, which makes in-person scoping easier than for some of the western or northern markets.",
  },
  {
    question:
      "How does your pricing compare to Allen-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier Allen and Plano agencies, with a larger share of the budget on actual building rather than coordination overhead. Allen has fewer dedicated agency options than Plano, so the comparison is often against Plano-based or Dallas-based shops who treat Allen as an outlying market they will travel to occasionally.",
  },
  {
    question:
      "Can you handle a rebuild that protects what is already working on the existing site?",
    answer:
      "Yes, and Allen clients more often have this need than Frisco or Prosper buyers because the existing site has typically been live for five to ten years and has accumulated real organic search position. The discovery pass includes auditing what is currently converting and protecting those signals through the rebuild.",
  },
  {
    question:
      "Are high-end home services businesses a strong fit?",
    answer:
      "Yes, and Allen is one of the strongest match markets in DFW for that category. The combination of long-tenured residential demographics, high-tier housing stock, and a buyer base that values craft over flash makes Allen residential service businesses a consistent fit for the engagement model.",
  },
  {
    question: "What is the timeline for a typical Allen project?",
    answer:
      "Eight to twelve weeks for most Allen service-business engagements. Allen discovery sometimes runs slightly shorter than the Plano or Frisco average because the existing site usually has clearer baseline data to protect and the buyer is more decisive about scope.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about an Allen project?",
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
    title: "QuickFacts: Allen city, Texas",
    url: "https://www.census.gov/quickfacts/allencitytexas",
  },
  {
    id: 2,
    org: "Allen Economic Development Corporation",
    year: 2024,
    title: "Allen EDC: corporate investment, employment trends, and infrastructure",
    url: "https://www.allenedc.com/",
  },
  {
    id: 3,
    org: "City of Allen",
    year: 2024,
    title: "Allen 2045 Comprehensive Plan: land use and transportation priorities",
    url: "https://www.cityofallen.org/",
  },
  {
    id: 4,
    org: "U.S. Bureau of Labor Statistics",
    year: 2024,
    title: "Dallas-Fort Worth Area Economic Summary",
    publication: "Southwest Information Office",
    url: "https://www.bls.gov/regions/southwest/summary/blssummary_dallasfortworth.pdf",
  },
];

export function AllenContent() {
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
