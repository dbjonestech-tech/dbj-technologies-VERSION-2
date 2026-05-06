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

const SLUG = "/royse-city-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Royse City, Texas",
  coords: "32.9748° N, 96.3325° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Royse City service businesses.",
  subtitle:
    "Royse City is the studio's actual home. I live here. I drive Interstate 30 every day, I eat at the local restaurants, I use the local trades, and I have watched the population roughly double in five years from the inside. The websites I build for Royse City businesses are built by an actual neighbor, not by an out-of-market vendor pretending to know the city. That distinction matters more in a fast-growing exurb than in any other category of DFW market. This page covers who I work with in Royse City, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "royse-buyer-profile",
    heading: "Who I work with in Royse City",
    body: (
      <>
        <p>
          Royse City has roughly doubled its population in the past
          five years and now sits at over twenty thousand
          residents, with the U.S. Census Bureau tracking the city
          as one of the fastest-growing in Texas (U.S. Census
          Bureau, 2024). The growth is driven by master-planned
          residential development on the Hunt County and Rockwall
          County side of the I-30 corridor, plus the steady
          relocation of Dallas-and-Plano commuters looking for
          larger lots and lower property tax rates. The
          service-business economy is still catching up to the
          residential growth, which means the firms that get the
          digital basics right now will compound advantage over
          the next decade.
        </p>
        <p>
          The service-business buyer in Royse City usually fits
          one of three profiles. First, the established practice
          firm that has served the long-time Royse City and Rockwall
          County household population for years and is now
          confronting a quintupled potential customer base it
          cannot serve through word-of-mouth alone. Second, the
          new-arrival service business: home services, fitness,
          dental, urgent care, that opened a Royse City location
          in 2020-2024 to capture the residential-growth wave and
          needs to compete for local-pack visibility immediately.
          Third, the trades and home-services business serving
          the master-planned residential populations along the
          FM 35 corridor, the Westridge developments, and the
          newer subdivisions north of I-30, where the housing
          stock supports premium pricing but the buyer base is
          new enough that vendor relationships are still being
          formed.
        </p>
        <p>
          If your business fits one of those profiles and you
          have tried Dallas-based or Rockwall-based agencies that
          treat Royse City as an afterthought, this page is the
          right starting point.
        </p>
      </>
    ),
  },
  {
    id: "royse-economy",
    heading: "Why the Royse City economy shapes the site",
    body: (
      <>
        <p>
          Royse City sits structurally where the established DFW
          metroplex meets the genuinely-still-rural eastern
          corridor. The dominant axis is Interstate 30, which
          gives Royse City direct commuter access to Dallas (forty
          minutes west under normal traffic) and to the East Texas
          corridor. Hunt County, where most of Royse City sits,
          is structurally less developed than Rockwall County to
          the west, with much of the residential growth happening
          on previously rural land. The Royse City Community
          Development Corporation actively recruits retail,
          medical, and professional services tenants to keep pace
          with the residential growth (Royse City CDC, 2024).
        </p>
        <p>
          What this means for the site you ship: the Royse City
          buyer base is bifurcated. The long-time residents have
          fifteen to thirty years of history with the local
          businesses they trust, and the conversion math for
          them depends almost entirely on visible local
          credibility (named streets, named landmarks, named
          local relationships). The new residents (more than half
          the population now arrived since 2018) are still
          building local relationships and are doing the kind of
          aggressive vendor research that comparison-shoppers in
          Plano or Frisco run. A site that serves both buyer
          tiers needs to read as locally credible to the long-time
          residents and as polished and substantive to the new
          arrivals. That dual register is harder to hit than
          either single register on its own.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks the broader
          DFW employment market as one of the fastest-growing in
          the country, and Royse City is part of that market
          (BLS, Dallas-Fort Worth Area Economic Summary, 2024).
          Competition for local-pack visibility on Royse City
          queries is meaningfully lower than in larger DFW
          markets, which means well-built sites with proper local
          schema and a healthy review profile typically rank into
          the top of the local pack within three to six months.
        </p>
      </>
    ),
  },
  {
    id: "royse-neighborhoods",
    heading: "Royse City geography and how the city actually works",
    body: (
      <>
        <p>
          Royse City divides along clear geographic lines, and I
          drive every one of them on a regular basis. The dominant
          axis is Interstate 30, which cuts the city into a
          northern half (most of the residential growth) and a
          southern half (the historic downtown and older
          residential corridors). FM 35 connects Royse City to
          Caddo Mills to the northeast and Lavon to the
          northwest; State Highway 66 runs east-west through the
          downtown area.
        </p>
        <p>
          Downtown Royse City, around the Royse City municipal
          buildings and the historic main street, is the civic
          and small-business center of the city. The downtown is
          smaller and quieter than Rockwall&apos;s historic square,
          but the same continuity-and-tradition framing applies:
          long-tenured firms benefit from association with the
          downtown area; new arrivals usually need to establish
          credibility separately.
        </p>
        <p>
          Northern Royse City covers the Westridge, Bay Park,
          Magnolia, Verandah, and other master-planned
          subdivisions that have driven most of the recent
          residential growth. The buyer base in these
          subdivisions is the new-arrival demographic: more
          comparable to Frisco or Prosper buyer profiles than to
          long-time Royse City profiles. Service businesses
          targeting these subdivisions need a digital-first
          conversion architecture because the buyer base does
          not have the local relationships that drive the
          downtown demographic.
        </p>
        <p>
          Southern Royse City and the FM 548 corridor extend the
          residential population toward Fate and the broader
          I-30 east corridor. Eastern Royse City along SH 66
          extends toward Caddo Mills, which is structurally
          different (smaller, more rural, less residential
          growth) but shares some of the Royse City service-
          business economy.
        </p>
        <p>
          For Royse City service businesses serving multiple
          sub-areas, a service-area zone page that names actual
          subdivisions (Westridge, Bay Park, Magnolia,
          Verandah, the downtown corridor) outperforms generic
          city-name templated pages. The longer reference on
          this is the{" "}
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
    id: "royse-engagement-model",
    heading: "How the engagement runs for a Royse City client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW
          client. Solo principal architect, fixed pricing at the
          start, full code ownership at delivery. The longer
          reference on the general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Royse City specifically, the studio is a five-minute
          drive away. There is no other custom-build studio
          closer to a Royse City buyer&apos;s front door, and that
          proximity changes the engagement texture in real ways.
          In-person scoping at the client&apos;s office is
          trivially easy. On-site photography sessions are
          scheduled in days rather than weeks. Ongoing
          relationship work runs through coffee meetings rather
          than through Zoom. For Royse City businesses, this is
          the closest thing to a true local engagement available
          anywhere in the DFW metroplex.
        </p>
        <p>
          The local-knowledge advantage is also unusually strong
          for Royse City clients. I know which subdivisions are
          newer than they look, which are still selling out,
          which are actively building, and which are mature.
          I know which restaurants are working and which are not.
          I know which trades have honest reputations and which
          have not. That level of community knowledge shows up in
          the discovery phase and in the editorial content
          decisions throughout the project.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For published references for
          the verticals most common in Royse City, the{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            medical and dental
          </Link>{" "}
          industry pages cover the architectural specifics.
        </p>
      </>
    ),
  },
  {
    id: "royse-where-im-based",
    heading: "Where I am based relative to Royse City",
    body: (
      <>
        <p>
          The studio is in Royse City. This is the home market.
          For Royse City buyers comparing local options, I am the
          only custom-build studio actually based in the city. The
          DFW agency market is concentrated in Dallas, Plano, and
          Frisco, all forty-plus minutes to the west, and Rockwall
          has a small handful of agencies that treat Royse City
          as an outlying market they will visit if asked.
        </p>
        <p>
          The differentiator is not just address. It is local
          investment. I am building this studio in Royse City
          because I live here and intend to keep living here, not
          because Royse City is a market I happened to be working
          in this quarter. That kind of long-term local stake is
          rare in the DFW agency market and is worth something to
          buyers who plan to be in the market for the long run
          themselves.
        </p>
        <p>
          The sibling city pages for the rest of the corridor
          are{" "}
          <Link
            href="/rockwall-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Rockwall
          </Link>
          ,{" "}
          <Link
            href="/heath-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Heath
          </Link>
          ,{" "}
          <Link
            href="/forney-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Forney
          </Link>
          ,{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Dallas proper
          </Link>
          , and the corporate-corridor cities (
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
          ,{" "}
          <Link
            href="/mckinney-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            McKinney
          </Link>
          ,{" "}
          <Link
            href="/allen-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Allen
          </Link>
          ,{" "}
          <Link
            href="/richardson-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Richardson
          </Link>
          ,{" "}
          <Link
            href="/prosper-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Prosper
          </Link>
          ).
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question:
      "You actually live in Royse City?",
    answer:
      "Yes. The studio is in Royse City and so am I. This is not an out-of-market vendor pretending local; I live in the city, drive its highways daily, use its trades and restaurants, and have watched its growth from the inside. For most Royse City buyers comparing studios, that distinction matters more than any other.",
  },
  {
    question:
      "Is the Royse City market big enough to justify a custom build?",
    answer:
      "It depends on the average ticket and the growth trajectory. For an established practice firm or a service business positioned to capture the residential-growth wave, the per-customer revenue impact of a working site is high enough that custom usually pays back within two to four years. For volume-driven low-ticket consumer services, a templated path may be the right call. The discovery call covers honest fit on this question.",
  },
  {
    question:
      "Can you handle bilingual Spanish-language content for Royse City?",
    answer:
      "Yes. The Spanish-speaking population in Royse City and the surrounding eastern Hunt County corridor is growing alongside the broader residential growth, and bilingual content is a meaningful conversion lift for many service businesses. Translation work is a real cost (a professional translator, not machine translation), and the customer base needs to support it. The discovery call covers whether the call mix justifies the work.",
  },
  {
    question:
      "How does your pricing compare to Dallas or Rockwall agencies that come east?",
    answer:
      "Total project cost is typically lower than equivalent Dallas-agency or Rockwall-agency work because there is no travel-time markup and no out-of-market premium. The structural difference is that I do all the work myself rather than running it through a coordination layer, and I am genuinely in the market rather than visiting it.",
  },
  {
    question: "What is the timeline for a typical Royse City project?",
    answer:
      "Eight to twelve weeks for most Royse City service-business engagements. Discovery sometimes runs faster than the metro average because in-person scoping is trivially easy and the local context is already understood. Photography and on-site work are usually scheduled in days rather than weeks.",
  },
  {
    question: "Will the site rank in the Google local pack for Royse City queries?",
    answer:
      "Local pack ranking is mostly a function of Google Business Profile health, review velocity, citations, and the relevance of your site content. Royse City is a less competitive market than Rockwall or Plano, which means well-built sites with proper local schema and a healthy review profile typically rank into the top three of the local pack within three to six months.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Royse City project?",
  headline: "Let's see if my model fits your business.",
  body: "If the principal-architect approach makes sense for what you are building, the contact form is the right place to start. I read every submission personally and respond within one business day. If you would rather grab coffee in town, the contact form notes field works for that too.",
  primary: { label: "Get in touch", href: "/contact" },
  secondary: { label: "See what I have built", href: "/work" },
};

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "U.S. Census Bureau",
    year: 2024,
    title: "QuickFacts: Royse City city, Texas",
    url: "https://www.census.gov/quickfacts/roysecitycitytexas",
  },
  {
    id: 2,
    org: "Royse City Community Development Corporation",
    year: 2024,
    title: "Royse City CDC: economic development, retail recruitment, and community profile",
    url: "https://www.roysecitycdc.org/",
  },
  {
    id: 3,
    org: "Rockwall Economic Development Corporation",
    year: 2025,
    title: "Rockwall County 2025 Community Profile",
    url: "https://rockwalledc.com/",
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

export function RoyseCityContent() {
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
