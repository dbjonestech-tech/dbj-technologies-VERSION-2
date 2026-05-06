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

const SLUG = "/mckinney-web-design";

const hero: LocalLanderHero = {
  geoLabel: "McKinney, Texas",
  coords: "33.1972° N, 96.6397° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for McKinney service businesses.",
  subtitle:
    "McKinney is the Collin County seat, the historic-square city, and the place in DFW where craft consistently beats scale. The websites that fit McKinney are the ones that look like they belong on the courthouse square, not the ones that look like they were templated for a generic suburb. This page covers who I work with in McKinney, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "mckinney-buyer-profile",
    heading: "Who I work with in McKinney",
    body: (
      <>
        <p>
          McKinney runs a different buyer profile than Plano or
          Frisco. The city has been the Collin County seat since 1848,
          and the historic downtown square (anchored by the
          well-preserved 1876 Collin County Courthouse) shapes both
          the literal geography and the buyer&apos;s sense of what a
          credible local business looks like. Where Plano runs on
          corporate corridor density and Frisco runs on national-brand
          polish, McKinney runs on a quieter preference for craft,
          continuity, and named local relationships. Money magazine
          named McKinney one of the &ldquo;Best Places to Live in
          America&rdquo; in both 2010 and 2014, and the criteria that
          drove those rankings (quality of life, school strength,
          historic preservation, civic cohesion) still describe the
          buyer base today.
        </p>
        <p>
          The service-business buyer in McKinney usually fits one of
          three profiles. First, the established-practice firm: legal,
          financial, accounting, medical, with a long client history
          in the county and a buyer base that values continuity over
          flash. The website work for these firms usually involves
          modernizing a site that has not been touched in five to
          eight years without losing the signal of stability and
          local authority. Second, the downtown McKinney business:
          boutique retail, restaurants, professional services in or
          adjacent to the historic square, where the buyer expects
          the site to feel as carefully designed as the storefront.
          Third, the Stonebridge Ranch or Adriatica Village business:
          newer master-planned-community development, more comparable
          to Plano or Frisco residential demographics, but
          geographically and culturally tied to McKinney rather than
          to the corporate-corridor cities.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried McKinney-area agencies that produced templated work
          without local taste, this page is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "mckinney-economy",
    heading: "Why the McKinney economy shapes the site",
    body: (
      <>
        <p>
          McKinney is structurally different from the corporate-corridor
          cities along the Tollway. The city has actively diversified
          its economic base over the past decade, attracting Globe Life
          (which moved its headquarters to McKinney in 2021),
          Independent Financial Group, Encore Wire, and a growing
          medical and professional services population. The result is
          a meaningfully more diverse employment mix than Plano or
          Frisco, with stronger representation in financial services,
          insurance, manufacturing, and healthcare. The McKinney
          Economic Development Corporation reports steady corporate
          investment growth and an expanding professional services
          sector through 2024 (McKinney EDC, 2024).
        </p>
        <p>
          What this means for the site you ship: the visual baseline
          in McKinney is calibrated to a buyer who values
          well-executed work over flashy work. A McKinney financial
          advisor or attorney is not being compared to the JPMorgan
          and Goldman sites; the comparison set is closer to
          professional services firms in Plano and Frisco, and the
          differentiator is usually warmth and continuity rather than
          institutional polish. A McKinney downtown business is being
          compared to the carefully curated retail environment around
          the historic square, where any sign of cheap templated work
          is visible immediately.
        </p>
        <p>
          The U.S. Census Bureau ranks McKinney among the
          fastest-growing cities in the country by population growth
          rate, and the U.S. Bureau of Labor Statistics tracks the
          Plano-Frisco-McKinney professional services submarket as
          one of the fastest-growing employment markets in the
          country (BLS, Dallas-Fort Worth Area Economic Summary,
          2024). Competition for local-pack visibility is meaningful
          but typically less intense than in Plano or Frisco proper.
        </p>
      </>
    ),
  },
  {
    id: "mckinney-neighborhoods",
    heading: "McKinney geography and how the city actually divides",
    body: (
      <>
        <p>
          McKinney divides along clearer geographic lines than Frisco.
          Downtown McKinney (around the historic square, between
          Virginia and Louisiana streets, anchored on the courthouse)
          is the cultural and visual center of the city. The buyer
          base around downtown is concentrated, retail-heavy, and
          aesthetically demanding; a site for a downtown business
          needs to read as carefully designed as the surrounding
          storefronts.
        </p>
        <p>
          West McKinney covers Stonebridge Ranch, Adriatica Village
          (a planned Croatian-themed development that reads like
          nothing else in DFW), and the master-planned communities
          near US 380 and SH 121. The buyer here is more directly
          comparable to West Plano or northwest Frisco: high-income,
          high-expectation, brand-trained. The site work is closer to
          what a Plano or Frisco engagement looks like.
        </p>
        <p>
          East McKinney covers the older residential corridors near
          US 75 and the McKinney National Airport area. The buyer
          here is more locally rooted, more value-conscious, and the
          conversion path leans on Google Business Profile health,
          review velocity, and visible local connection rather than
          on visual polish. North McKinney is the newer development
          tier, expanding rapidly along SH 121 and the Trinity Falls
          corridor.
        </p>
        <p>
          For McKinney service businesses serving multiple sub-areas,
          a service-area zone page that names actual neighborhoods
          (Stonebridge Ranch, Adriatica, Trinity Falls, Downtown
          McKinney, Eldorado) outperforms generic city-name templated
          pages. The longer reference on this is the{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            local SEO hub
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "mckinney-engagement-model",
    heading: "How the engagement runs for a McKinney client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW client.
          Solo principal architect, fixed pricing at the start, full
          code ownership at delivery. The longer reference on the
          general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For McKinney specifically, two things flex. First, the
          discovery work usually leans harder on continuity and
          legacy. McKinney buyers more often have an existing site
          that has worked acceptably for years and a real concern
          about losing whatever has made the existing site work. The
          discovery pass often includes auditing what is currently
          converting and protecting it through the rebuild rather
          than starting from a blank slate. Second, the visual
          direction usually leans warmer and more typographically
          considered than the harder-edged corporate-corridor work
          that fits Plano and Frisco. Downtown McKinney businesses
          in particular benefit from a site that reads as quietly
          confident rather than as aggressively polished.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For the published references for
          the verticals most common in McKinney, the{" "}
          <Link
            href="/industries/legal"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            legal
          </Link>
          ,{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            medical and dental
          </Link>
          , and{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          industry pages cover the architectural specifics.
        </p>
      </>
    ),
  },
  {
    id: "mckinney-where-im-based",
    heading: "Where I am based relative to McKinney",
    body: (
      <>
        <p>
          The studio is based in Royse City. The drive to McKinney
          runs along SH 78 and US 380, roughly thirty-five minutes in
          normal traffic. McKinney is one of the closer corporate-tier
          DFW markets to the studio geographically, which makes
          in-person scoping at the client&apos;s office in Downtown
          McKinney, Stonebridge Ranch, or one of the newer corridors
          along SH 121 genuinely practical when the project benefits
          from it. Travel inside DFW is included.
        </p>
        <p>
          For McKinney buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it. Most
          McKinney-area agencies separate the two; I do not. If that
          model fits, this is the right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor are{" "}
          <Link
            href="/plano-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Plano
          </Link>
          ,{" "}
          <Link
            href="/frisco-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Frisco
          </Link>
          , and{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
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
      "Do you only work with McKinney businesses, or with all DFW?",
    answer:
      "I work across DFW. McKinney is one of the closer markets to the Royse City studio geographically, but the engagement model is metro-wide and works equally well for a Plano or Frisco or Dallas-proper business.",
  },
  {
    question:
      "How does your pricing compare to McKinney-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier McKinney agencies, with a larger share of the budget on actual building rather than on coordination overhead. McKinney has fewer agency options than Plano or Frisco, so the comparison is often against Dallas-based or Plano-based shops who treat McKinney as an outlying market.",
  },
  {
    question:
      "Can you handle a rebuild that protects what is already working on the existing site?",
    answer:
      "Yes, and McKinney clients more often have this need than buyers in newer cities. The discovery pass includes auditing what is currently converting (specific pages, specific traffic sources, specific Google Business Profile signals) and protecting those signals through the rebuild rather than rebuilding from a blank slate.",
  },
  {
    question:
      "Are downtown McKinney businesses a strong fit for your engagement model?",
    answer:
      "Yes. Downtown McKinney is one of the strongest match cases for a custom build in DFW because the visual environment around the historic square rewards careful design and penalizes templated work. A custom site for a downtown McKinney business consistently outperforms templated alternatives on conversion and on perceived quality.",
  },
  {
    question: "What is the timeline for a typical McKinney project?",
    answer:
      "Eight to twelve weeks for most McKinney service-business engagements. McKinney discovery sometimes runs slightly shorter than the Plano or Frisco average because the existing site usually has clearer baseline data to protect, which speeds the architectural decisions.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement. Beyond that, maintenance is a separate, lightweight conversation.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a McKinney project?",
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
    title: "QuickFacts: McKinney city, Texas",
    url: "https://www.census.gov/quickfacts/mckinneycitytexas",
  },
  {
    id: 2,
    org: "McKinney Economic Development Corporation",
    year: 2024,
    title: "McKinney EDC: corporate investment, employment, and infrastructure",
    url: "https://www.mckinneyedc.com/",
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
    org: "City of McKinney",
    year: 2024,
    title: "Strategic goals and TIRZ project plans",
    url: "https://www.mckinneytexas.org/",
  },
];

export function McKinneyContent() {
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
