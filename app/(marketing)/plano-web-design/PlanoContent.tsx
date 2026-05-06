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

const SLUG = "/plano-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Plano, Texas",
  coords: "33.0198° N, 96.6989° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Plano service businesses.",
  subtitle:
    "Plano is a city of corporate headquarters, top-decile public schools, and high-expectation buyers. The websites that fit Plano are the ones that look like they belong on Legacy West, not the ones that look like a templated lead-generation funnel. This page covers who I work with in Plano, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "plano-buyer-profile",
    heading: "Who I work with in Plano",
    body: (
      <>
        <p>
          Plano runs a different buyer profile than most DFW cities.
          The corporate density along the Legacy and Tollway corridors
          is a national-scale concentration. Toyota Motor North America
          relocated its headquarters to Plano in 2017, joining JCPenney,
          Frito-Lay, Liberty Mutual, Cinemark, Capital One, Dr Pepper
          Snapple, and a long list of regional headquarters and
          divisional offices. The buyer in Plano has worked with
          national brands for years, has internal marketing teams that
          have seen the work agencies actually ship, and is comparing
          your studio against firms in San Francisco and New York
          rather than against the next agency on US 75.
        </p>
        <p>
          The service-business buyer in Plano usually fits one of
          three profiles. First, the executive-services firm: legal,
          financial advisory, accounting, executive coaching, with
          high deal values and a buyer base drawn from the corporate
          population. These firms need a site that reads as serious
          to a Toyota or PepsiCo executive evaluating advisors for a
          high-net-worth conversation. Second, the medical or dental
          practice in West Plano or Stonebriar, where the patient
          base expects polished consumer experiences and the
          competitive set is dense. Third, the high-end home services
          business serving the Plano residential market: roofing,
          landscaping, custom builders, pool service, where the
          average ticket is meaningfully higher than the DFW
          metro-wide average and the buyer is doing serious vendor
          research.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Plano-area agencies that were sales-led and
          junior-delivered, this page is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "plano-economy",
    heading: "Why the Plano economy shapes the site",
    body: (
      <>
        <p>
          Plano is structurally different from the rest of DFW. The
          Plano Economic Development team has spent twenty years
          recruiting Fortune 500 anchor tenants, and the result is a
          metropolitan-scale corporate corridor running along the
          Dallas North Tollway between SH 121 and Park Boulevard. The
          Legacy West development alone hosts the Toyota North America
          campus, the JPMorgan Chase regional campus, and the FedEx
          Office headquarters, and it sits adjacent to the Shops at
          Legacy retail and dining district that absorbs a substantial
          share of the Plano evening and weekend economy.
        </p>
        <p>
          What this means for the site you ship: the visual baseline
          in Plano is higher than the DFW metro-wide baseline. A
          Plano-area dental practice is being compared against the
          consumer-facing brands those Toyota and JPMorgan executives
          interact with daily. A Plano financial advisor is being
          evaluated by a buyer who reads the JPMorgan and Goldman
          sites in their inbox every morning. Templated lead-gen
          funnels read as cheap in this market. The site that
          converts in Plano is the one that looks like it belongs in
          the corporate corridor it sits inside.
        </p>
        <p>
          The U.S. Census Bureau ranks Plano as the eighth-largest
          city in Texas by population, and the Bureau of Labor
          Statistics tracks the broader Plano-Frisco-McKinney
          submarket as one of the fastest-growing professional
          services employment markets in the country (BLS,
          Dallas-Fort Worth Area Economic Summary, 2024). The
          implication is twofold. Competition for local-pack
          visibility is intense, especially in legal, medical, and
          financial services. And the per-customer revenue impact
          of a working site is meaningfully higher than in
          lower-density markets, which is what makes a custom build
          economically defensible.
        </p>
      </>
    ),
  },
  {
    id: "plano-neighborhoods",
    heading: "Plano neighborhoods and how they shape buyer geography",
    body: (
      <>
        <p>
          Plano is not one buyer base. The structural divide between
          West Plano (west of US 75, generally newer construction,
          higher household income, dense corporate proximity) and
          East Plano (east of US 75, older neighborhoods, more
          economically diverse) shapes how local search behaves and
          how a site should describe its service area.
        </p>
        <p>
          West Plano covers Willow Bend, Stonebriar, the Legacy
          Drive corridor, and the high-density residential pockets
          around the Tollway. The buyer here is doing the most
          aggressive vendor research in the metroplex; the conversion
          path on a Plano West service business site needs to assume
          three or four competing tabs are open. Stonebriar Centre
          and the Shops at Legacy are the two retail anchors;
          businesses near them benefit from the implied prestige but
          have to earn the consumer comparison fairly.
        </p>
        <p>
          East Plano covers Downtown Plano (around the Plano DART
          station and the K Avenue arts district), Old Town Plano,
          and the residential corridor along Spring Creek Parkway and
          15th Street. The buyer here is more value-conscious but
          also more locally loyal; the conversion math leans on
          neighborhood word-of-mouth and Google review velocity rather
          than on visual sophistication. A site that surfaces the
          neighborhood the business actually serves, with named cross
          streets and named landmarks, beats a site that reads as
          generic Plano.
        </p>
        <p>
          For Plano service businesses serving both halves of the
          city, the cleanest move is a service-area zone page rather
          than two separate location pages. Templated city pills that
          repeat the city name with no city-unique substance are a
          textbook doorway-page violation. The longer reference on
          this is the{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            local SEO hub
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "plano-engagement-model",
    heading: "How the engagement runs for a Plano client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW client.
          Solo principal architect, fixed pricing at the start, full
          code ownership at delivery. The longer reference on the
          general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Plano specifically, two things flex. First, the
          discovery scope tends to run a week longer because the
          competitive set is larger and the differentiation work is
          harder. A Plano dental practice has dozens of competitors
          inside a five-mile radius; a Plano financial advisor sits
          inside one of the densest advisor markets in the country.
          The discovery pass needs to find the actual differentiation
          rather than borrow generic positioning. Second, in-person
          scoping is genuinely useful for Plano clients because most
          of the buyer population is within thirty minutes of the
          Royse City studio along US 380 and the Tollway. Travel
          inside DFW is included; I do not bill it separately.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For the published references for
          the verticals most common in Plano, the{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            medical and dental
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/legal"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            legal
          </Link>{" "}
          industry pages cover the architectural specifics for those
          verticals, which together account for a meaningful share of
          Plano service-business demand.
        </p>
      </>
    ),
  },
  {
    id: "plano-where-im-based",
    heading: "Where I am based relative to Plano",
    body: (
      <>
        <p>
          The studio is based in Royse City, on the eastern edge of
          the DFW metroplex. The drive to Plano is roughly forty
          minutes along Interstate 30 and the President George Bush
          Turnpike, less in off-peak hours. Most engagements run over
          video calls and async work, with occasional in-person
          scoping at the client&apos;s office in West Plano,
          Stonebriar, or Downtown Plano when it helps the project.
          Travel inside DFW is included.
        </p>
        <p>
          For Plano buyers comparing local options, the differentiator
          is not address. It is whether the same person who scopes
          the project also builds it. Most Dallas-area agencies
          separate the two; I do not. If that model fits, this is the
          right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor are{" "}
          <Link
            href="/frisco-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Frisco
          </Link>
          ,{" "}
          <Link
            href="/mckinney-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            McKinney
          </Link>
          , and{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
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
      "Do you only work with Plano businesses, or with all DFW?",
    answer:
      "I work across DFW. Plano is one of the densest concentrations of my client profile (executive services, medical and dental, high-end home services), but the engagement model is metro-wide and works equally well for a Frisco or McKinney or Dallas-proper business.",
  },
  {
    question:
      "How does your pricing compare to Plano-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier Plano agencies, with a larger share of the budget on actual building rather than on coordination overhead. Plano has more agency density than most Texas markets, which is good for buyers because it forces honest comparison; it also means a lot of templated work shows up at premium pricing, which is the gap I usually fill.",
  },
  {
    question: "Can you handle Plano local SEO specifically?",
    answer:
      "Yes. Every site I ship includes proper LocalBusiness schema, Google Business Profile alignment, and on-page elements that the local pack algorithm rewards. The longer reference on what actually moves DFW local rankings is on the local SEO hub in the Resources section.",
  },
  {
    question:
      "Do you have published examples of Plano-relevant verticals?",
    answer:
      "The published Design Briefs cover dental practices, medical practices, legal firms, financial advisors, and real estate. All five are common Plano service-business categories. The auto service production proof at Star Auto Service in Richardson is the closest live example geographically; the Industry pages cover what the architecture actually looks like for each vertical.",
  },
  {
    question: "What is the timeline for a typical Plano project?",
    answer:
      "Eight to twelve weeks for most Plano service-business engagements. Discovery and architecture take one to two weeks, design and content two to three weeks, build three to five weeks, launch and the thirty-day post-launch optimization window the rest. Plano discovery tends to run a week longer than the Dallas average because the competitive set is more demanding.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement. Beyond that, maintenance is a separate, lightweight conversation.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Plano project?",
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
    title: "QuickFacts: Plano city, Texas",
    url: "https://www.census.gov/quickfacts/planocitytexas",
  },
  {
    id: 2,
    org: "Plano Economic Development",
    year: 2024,
    title: "Plano Texas: economic overview, corporate headquarters and major employers",
    url: "https://www.planotexas.org/",
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
    title: "Texas Economic Indicators: DFW professional services growth",
    url: "https://www.dallasfed.org/research/indicators/tei",
  },
];

export function PlanoContent() {
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
