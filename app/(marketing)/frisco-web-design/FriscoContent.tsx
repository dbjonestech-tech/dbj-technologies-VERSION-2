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

const SLUG = "/frisco-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Frisco, Texas",
  coords: "33.1507° N, 96.8236° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Frisco service businesses.",
  subtitle:
    "Frisco is the fastest-growing major suburb in DFW, the home of Sports City USA, and a buyer base whose visual baseline was reset the year The Star opened. The websites that fit Frisco are the ones that look like they belong on the same campus as the Cowboys headquarters, not the ones that look like a templated lead-generation funnel. This page covers who I work with in Frisco, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "frisco-buyer-profile",
    heading: "Who I work with in Frisco",
    body: (
      <>
        <p>
          Frisco runs a buyer profile that is younger, faster-growing,
          and more brand-sensitive than most DFW cities. The U.S.
          Census Bureau has consistently ranked Frisco among the
          fastest-growing cities of its size in the country, and the
          population effectively doubled between 2010 and 2024.
          Whatever a Frisco buyer was used to seeing in their previous
          city has been reset by what they see daily in their current
          one: The Star, the Frisco Square arts and dining district,
          Stonebriar Centre, the National Soccer Hall of Fame at
          Toyota Stadium, the under-construction Universal theme park,
          and the new PGA of America headquarters and resort.
        </p>
        <p>
          The service-business buyer in Frisco usually fits one of
          three profiles. First, the high-volume consumer-services
          firm: dental practices, urgent care clinics, fitness
          studios, med spas, where the household density and the
          household income both run ahead of the metro average and
          the conversion math depends on visual polish that matches
          the surrounding retail environment. Second, the
          executive-services firm working with the corporate growth
          tier: legal, financial advisory, executive coaching for the
          relocating-from-California population that has driven a
          substantial share of Frisco&apos;s growth since 2018.
          Third, the kid-economy business that defines Frisco
          specifically: youth sports academies, private tutoring,
          performing arts schools, and the long tail of services
          that exist because Frisco ISD ranks as one of the strongest
          public-school districts in Texas and the family
          demographics support intense enrichment spending.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Frisco-area agencies that under-delivered relative to
          the visual environment outside their windows, this page is
          the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "frisco-economy",
    heading: "Why the Frisco economy shapes the site",
    body: (
      <>
        <p>
          Frisco is structurally unique in DFW. The city pursued a
          deliberate sports-and-entertainment-anchored growth strategy
          starting in the late 1990s, and the result is a metropolitan
          rebrand that very few American cities have matched. The
          Dallas Cowboys headquarters and practice facility at The
          Star opened in 2016. FC Dallas plays at Toyota Stadium. The
          Texas Rangers Triple-A affiliate plays at Riders Field. The
          Frisco Roughriders and the National Soccer Hall of Fame
          anchor a sports-tourism economy. The PGA of America moved
          its headquarters and championship courses to Frisco in 2022.
          The Universal theme park is under construction with a
          planned 2026 opening. None of this is incidental.
        </p>
        <p>
          What this means for the site you ship: the visual baseline
          in Frisco is calibrated to a buyer who is daily exposed to
          national-brand polish in the immediate physical environment.
          A Frisco dental practice is being compared against the
          consumer-facing brands that surround Stonebriar and
          Frisco Square, not against templated dental-vendor sites.
          A Frisco advisor or attorney is being evaluated by a
          relocated household that brought California or Northeast
          expectations of professional-services polish with them.
          Templated lead-gen funnels read as cheap in this market,
          and the conversion math reflects it.
        </p>
        <p>
          The Frisco Economic Development Corporation reports
          consistent corporate investment growth and a diversifying
          employment base across professional services, healthcare,
          and retail (Frisco EDC, 2024). The U.S. Bureau of Labor
          Statistics tracks the Plano-Frisco-McKinney professional
          services submarket as one of the fastest-growing
          employment markets in the country (BLS, Dallas-Fort Worth
          Area Economic Summary, 2024). Competition for local-pack
          visibility is intense, and the per-customer revenue impact
          of a working site is meaningfully higher than in
          lower-density markets.
        </p>
      </>
    ),
  },
  {
    id: "frisco-neighborhoods",
    heading: "Frisco geography and how the city actually divides",
    body: (
      <>
        <p>
          Frisco does not divide along the same axes as Plano or
          Dallas. The city is younger, the residential build-out is
          newer, and the structural divide runs more along
          north-south development phases than along east-west income
          tiers. The areas around Stonebriar (south Frisco) and the
          Sam Rayburn Tollway corridor are the older, more
          consolidated retail and residential zones. The areas near
          The Star, Frisco Square, and the Dallas North Tollway
          corridor are the high-density entertainment and corporate
          development zones. The areas north of US 380 are the newest
          residential and master-planned communities (Phillips Creek
          Ranch, Newman Village, Latera).
        </p>
        <p>
          For a service-business buyer, the practical implication is
          that Frisco is genuinely large now (over 220,000
          population, projected to keep growing), and a site that
          surfaces the actual neighborhoods served, with named cross
          streets and named landmarks, beats a site that reads as
          generic Frisco. Stonebriar Centre, Frisco Square, The Star,
          Toyota Stadium, the PGA headquarters, the Frisco RoughRiders
          ballpark, and the Frisco Public Library are the named
          anchors that local-pack visitors will recognize.
        </p>
        <p>
          For Frisco service businesses with neighborhood-specific
          demand (dental practices in Phillips Creek Ranch, fitness
          studios near The Star, advisors near Stonebriar), a service
          area zone page outperforms templated city pills on every
          measurable axis. The longer reference on what actually
          works for local pack visibility is the{" "}
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
    id: "frisco-engagement-model",
    heading: "How the engagement runs for a Frisco client",
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
          For Frisco specifically, two things flex. First, the
          differentiation work in discovery is harder than in most
          DFW cities because the competitive set is sophisticated and
          the buyer is brand-trained. A Frisco dental practice is
          differentiating against not only the other Frisco dental
          practices but against the consumer-facing brand environment
          surrounding Stonebriar. The discovery pass needs to find
          real differentiation, not borrow generic positioning.
          Second, the kid-economy verticals (sports academies,
          tutoring, performing arts, dance studios) are an
          underserved-by-agencies category in Frisco specifically,
          and a custom site for one of those businesses can produce
          outsized returns on a relatively small investment.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For the published references for
          the verticals most common in Frisco, the{" "}
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
    id: "frisco-where-im-based",
    heading: "Where I am based relative to Frisco",
    body: (
      <>
        <p>
          The studio is based in Royse City. The drive to Frisco runs
          along US 380 through Princeton and McKinney, roughly fifty
          minutes in normal traffic. Most engagements run over video
          calls and async work, with occasional in-person scoping at
          the client&apos;s office near Stonebriar, The Star, Frisco
          Square, or one of the master-planned neighborhoods north of
          US 380 when it helps the project. Travel inside DFW is
          included.
        </p>
        <p>
          For Frisco buyers comparing local options, the differentiator
          is not address. It is whether the same person who scopes
          the project also builds it. Most Frisco-area agencies
          separate the two; I do not. If that model fits, this is the
          right place to talk.
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
            href="/prosper-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Prosper
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
      "Do you only work with Frisco businesses, or with all DFW?",
    answer:
      "I work across DFW. Frisco runs a high concentration of my client profile (consumer services, medical and dental, executive services, kid-economy verticals), but the engagement model is metro-wide and works equally well for a Plano or McKinney or Dallas-proper business.",
  },
  {
    question: "How does your pricing compare to Frisco-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier Frisco agencies, with a larger share of the budget on actual building rather than on coordination overhead. Frisco has high-end agencies that pitch national-scale work, and my engagement is structurally different from theirs because I work as a solo principal architect rather than as a sales-and-delivery team.",
  },
  {
    question:
      "Are kid-economy businesses (sports academies, tutoring, performing arts) a fit for your engagement model?",
    answer:
      "Yes, and Frisco is one of the strongest markets for those verticals in DFW. Kid-economy businesses tend to have substantial average lifetime values per family, high word-of-mouth conversion, and underserved digital experiences. A custom site can produce outsized returns on a relatively small investment in that category.",
  },
  {
    question:
      "Can you work with the Universal theme park opening in 2026 indirectly, by helping a Frisco hospitality or service business prepare?",
    answer:
      "Possibly. The 2026 Universal opening will reshape the Frisco visitor economy, and adjacent service businesses (hospitality, food, fitness, dental, urgent care) will see meaningful demand shifts. The discovery call covers whether the site you need now anticipates that demand or addresses existing volume.",
  },
  {
    question: "What is the timeline for a typical Frisco project?",
    answer:
      "Eight to twelve weeks for most Frisco service-business engagements. Frisco discovery tends to run on the longer end of that range because the differentiation work is harder than in less brand-saturated markets.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement. Beyond that, maintenance is a separate, lightweight conversation.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Frisco project?",
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
    title: "QuickFacts: Frisco city, Texas",
    url: "https://www.census.gov/quickfacts/friscocitytexas",
  },
  {
    id: 2,
    org: "Frisco Economic Development Corporation",
    year: 2024,
    title: "Frisco EDC: corporate investment, employment trends, and infrastructure",
    url: "https://friscoedc.com/",
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
    title: "Texas Economic Indicators: DFW corridor growth and population trends",
    url: "https://www.dallasfed.org/research/indicators/tei",
  },
];

export function FriscoContent() {
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
