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

const SLUG = "/prosper-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Prosper, Texas",
  coords: "33.2362° N, 96.8011° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Prosper service businesses.",
  subtitle:
    "Prosper is the fastest-growing exclusivity-focused suburb in the DFW corridor. The population has more than doubled in a decade, the master-planned communities along the Dallas North Tollway and US 380 read like nowhere else in the metro, and the buyer base is wealthier per capita than most of the established corporate-corridor cities. The websites that fit Prosper are the ones that look like they belong on the same campus as Windsong Ranch, not the ones that look templated. This page covers who I work with in Prosper, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "prosper-buyer-profile",
    heading: "Who I work with in Prosper",
    body: (
      <>
        <p>
          Prosper is the youngest distinct buyer profile in the DFW
          corridor. The city has grown from roughly ten thousand
          residents in 2010 to over forty thousand in 2024, and the
          dominant residential pattern is master-planned community
          development on previously undeveloped land (U.S. Census
          Bureau, 2024). The buyer profile is concentrated, wealthy,
          relocation-driven, and brand-trained in a way that even
          Frisco only partially matches. Prosper households more
          often arrived from California, the Northeast, or another
          major metro within the last five years, and they brought
          high-tier consumer-experience expectations with them.
        </p>
        <p>
          The service-business buyer in Prosper usually fits one of
          three profiles. First, the high-end home services business
          serving the master-planned residential population: custom
          builders, landscape design and installation, pool design
          and service, exterior painting, automation and smart-home,
          where the average ticket runs meaningfully above the metro
          average and the buyer is doing serious vendor research.
          Second, the consumer-services business clustered around
          the Windsong Ranch retail nodes, the Light Farms
          commercial corridors, and the US 380 corridor: med spas,
          dental practices, fitness studios, dining, where the
          household income tier supports premium pricing and the
          conversion math depends on visual polish. Third, the
          family-services business serving the Prosper Independent
          School District population: tutoring, sports academies,
          performing arts schools, and the long tail of family
          enrichment services that exists because PISD is one of
          the fastest-growing top-tier school districts in Texas.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Prosper-area agencies that produced templated work
          without local taste or visual sophistication, this page
          is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "prosper-economy",
    heading: "Why the Prosper economy shapes the site",
    body: (
      <>
        <p>
          Prosper is structurally unlike any of the other cities in
          this cluster. The economic base is overwhelmingly
          residential, the population growth rate has consistently
          run among the highest in Texas through the past decade,
          and the city has grown deliberately through master-planned
          community development rather than through corporate
          recruitment. Windsong Ranch, Light Farms, and similar
          large-format master-planned developments shape both the
          residential demographics and the visual environment of
          the city. The Prosper Economic Development Corporation
          continues to attract retail, healthcare, and
          professional-services tenants to support the residential
          population (Prosper EDC, 2024).
        </p>
        <p>
          What this means for the site you ship: the Prosper visual
          baseline is calibrated to a buyer who lives inside a
          master-planned community where every storefront, every
          park, and every signage system was design-coordinated.
          A Prosper service business is being compared to a
          consumer-experience standard set by Windsong Ranch and
          Light Farms developers, not to the templated SMB-vendor
          baseline. Generic agency-quality work that reads as
          plausible in McKinney or Allen reads as a tier below the
          surrounding environment in Prosper. The conversion math
          depends on visual polish, named local relationships, and
          a sense that the business shares the same standard of
          care as the development it sits inside.
        </p>
        <p>
          The U.S. Census Bureau ranks Prosper among the
          fastest-growing cities of its size in the country, and
          the U.S. Bureau of Labor Statistics tracks the
          Plano-Frisco-McKinney professional services submarket as
          one of the fastest-growing employment markets in the
          country (BLS, Dallas-Fort Worth Area Economic Summary,
          2024). Competition for local-pack visibility is meaningful
          but generally less intense than in Plano or Frisco
          because the firm count is lower, while the buyer
          expectations are calibrated higher.
        </p>
      </>
    ),
  },
  {
    id: "prosper-neighborhoods",
    heading: "Prosper geography and how the city actually divides",
    body: (
      <>
        <p>
          Prosper divides primarily along the master-planned
          community lines rather than along cardinal-direction
          axes. The dominant communities are Windsong Ranch
          (western Prosper, the most established master-planned
          development in the city), Light Farms (eastern Prosper,
          adjacent to the Frisco border), and Star Trail and
          Whispering Farms (newer developments). The US 380
          corridor along the southern edge of the city is the
          retail and professional services backbone; the Dallas
          North Tollway corridor on the western edge connects
          Prosper to Frisco and Plano.
        </p>
        <p>
          The Windsong Ranch community center area, with its named
          retail and dining tenants and the visible community
          design language, is the cultural anchor of western
          Prosper. Light Farms anchors eastern Prosper with a
          similar but distinct community design language. Both
          communities run private community calendars, named
          community newsletters, and active resident-only social
          channels that shape word-of-mouth dynamics for service
          businesses serving residents.
        </p>
        <p>
          For Prosper service businesses, named community-level
          targeting (Windsong Ranch service area, Light Farms
          service area) often outperforms generic Prosper city-level
          targeting because residents identify more strongly with
          the master-planned community than with the city as a
          whole. The conversion math depends on showing up cleanly
          inside community-specific channels, not on generic city
          search.
        </p>
        <p>
          For Prosper service businesses with broader coverage, a
          service-area zone page that names actual sub-zones
          outperforms generic city-name templated pages. The longer
          reference on this is the{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            local SEO hub
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "prosper-engagement-model",
    heading: "How the engagement runs for a Prosper client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW client.
          Solo principal architect, fixed pricing at the start, full
          code ownership at delivery. The longer reference on the
          general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Prosper specifically, two things flex. First, the
          visual direction usually leans warmer and more
          consumer-experience-driven than the harder-edged
          corporate-corridor work that fits Plano and Richardson.
          Prosper businesses benefit from a site that reads as
          carefully crafted, with attention to typography, photography,
          and motion design that matches the surrounding consumer
          environment. Second, the Prosper residential
          home-services category is one of the strongest match cases
          for a custom build in DFW because the average ticket is
          high enough to justify the investment and the buyer base
          values craft-led design over conversion-optimized
          templates.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For published references for the
          verticals most common in Prosper, the{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            medical and dental
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          industry pages cover the architectural specifics for those
          verticals.
        </p>
      </>
    ),
  },
  {
    id: "prosper-where-im-based",
    heading: "Where I am based relative to Prosper",
    body: (
      <>
        <p>
          The studio is based in Royse City. The drive to Prosper
          runs along US 380 through Princeton and McKinney, roughly
          fifty-five minutes in normal traffic. Most engagements run
          over video calls and async work, with occasional in-person
          scoping at the client&apos;s office in Windsong Ranch,
          Light Farms, or along the US 380 retail corridor when it
          helps the project. Travel inside DFW is included.
        </p>
        <p>
          For Prosper buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it, and whether
          the visual sophistication of the engagement matches the
          environment outside the buyer&apos;s window. Most
          Prosper-area agencies separate the two; I do not. If
          that model fits, this is the right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor are{" "}
          <Link
            href="/plano-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Plano
          </Link>
          ,{" "}
          <Link
            href="/frisco-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Frisco
          </Link>
          ,{" "}
          <Link
            href="/mckinney-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            McKinney
          </Link>
          ,{" "}
          <Link
            href="/allen-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Allen
          </Link>
          ,{" "}
          <Link
            href="/richardson-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Richardson
          </Link>
          ,{" "}
          <Link
            href="/rockwall-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Rockwall
          </Link>
          ,{" "}
          <Link
            href="/heath-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Heath
          </Link>
          ,{" "}
          <Link
            href="/royse-city-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Royse City
          </Link>
          ,{" "}
          <Link
            href="/forney-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Forney
          </Link>
          , and{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
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
      "Do you only work with Prosper businesses, or with all DFW?",
    answer:
      "I work across DFW. Prosper runs a high concentration of my client profile (high-end home services, premium consumer services, family-services for the PISD population), but the engagement model is metro-wide and works equally well for a Frisco, McKinney, or Dallas-proper business.",
  },
  {
    question:
      "How does your pricing compare to Prosper-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier Frisco and Plano agencies, with a larger share of the budget on actual building rather than coordination overhead. Prosper has very few dedicated agency options because of the city's recent growth, so most Prosper buyers compare against Frisco-based or Plano-based agencies.",
  },
  {
    question:
      "Are high-end home services businesses a strong fit for the engagement model?",
    answer:
      "Yes, and Prosper is one of the strongest match markets in DFW for that category. The combination of high-tier residential demographics, high-tier housing stock, and a buyer base that values craft-led design over conversion-optimized templates makes Prosper home services a consistent fit.",
  },
  {
    question:
      "Do master-planned community service-area pages work for Prosper businesses?",
    answer:
      "Yes, more so than in most DFW markets. Prosper residents identify more strongly with their master-planned community than with the city as a whole, and a service business with named-community service-area pages (Windsong Ranch, Light Farms, Star Trail) often outperforms generic city-level targeting. Each page needs at least 200 to 300 words of substance unique to that community to clear Google's doorway-page filter.",
  },
  {
    question: "What is the timeline for a typical Prosper project?",
    answer:
      "Eight to twelve weeks for most Prosper service-business engagements. Discovery sometimes runs slightly longer than the metro average because the visual direction work is deeper for buyers calibrated to a master-planned community standard, and the photography commission alone can add a week or two.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Prosper project?",
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
    title: "QuickFacts: Prosper town, Texas",
    url: "https://www.census.gov/quickfacts/prospertowntexas",
  },
  {
    id: 2,
    org: "Prosper Economic Development Corporation",
    year: 2024,
    title: "Prosper EDC: residential growth, retail and professional services tenants",
    url: "https://prosperedc.com/",
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
    title: "Texas Economic Indicators: DFW corridor population and employment",
    url: "https://www.dallasfed.org/research/indicators/tei",
  },
];

export function ProsperContent() {
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
