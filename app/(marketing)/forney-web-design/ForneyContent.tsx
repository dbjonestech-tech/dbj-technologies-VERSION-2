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

const SLUG = "/forney-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Forney, Texas",
  coords: "32.7482° N, 96.4719° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Forney service businesses.",
  subtitle:
    "Forney is the southeastern DFW exurb anchor in Kaufman County. The US 80 corridor running west into Mesquite and Dallas, the I-20 corridor on the southern edge, a population that has roughly doubled in a decade, and a service-business economy expanding faster than the local agency market can keep up with. The studio is twenty-five minutes northeast of Forney in Royse City, which makes the eastern DFW exurb corridor one of the closest engagement markets in the metroplex. This page covers who I work with in Forney, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "forney-buyer-profile",
    heading: "Who I work with in Forney",
    body: (
      <>
        <p>
          Forney runs a buyer profile that is structurally similar
          to Royse City but on the southern side of the I-30
          corridor. The U.S. Census Bureau tracks Forney as one of
          the fastest-growing cities in Texas by population growth
          rate, with the population expanding from roughly fifteen
          thousand in 2010 to over thirty thousand in 2024 (U.S.
          Census Bureau, 2024). The growth is driven by
          master-planned residential development on the western
          and northern edges of the city, plus the steady
          relocation of Dallas-and-Mesquite commuters looking for
          larger lots, lower property taxes, and a more rural feel
          than the Plano-Frisco corridor offers.
        </p>
        <p>
          The service-business buyer in Forney usually fits one of
          three profiles. First, the established practice firm
          (legal, financial, medical, dental) that has served the
          long-time Kaufman County household population for years
          and is now confronting a doubled potential customer base.
          Second, the trades and home-services business serving
          the master-planned residential populations along the FM
          548 corridor, the Heartland subdivision, the Devonshire
          subdivision, and the newer developments along US 80,
          where the housing stock supports premium pricing but the
          buyer base is new enough that vendor relationships are
          still being formed. Third, the consumer-services
          business clustered along the US 80 retail corridor and
          near the historic downtown Forney area, where the daily
          commuter traffic combines with the residential growth to
          produce meaningful volume.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Mesquite-based or Dallas-based agencies that
          treat Forney as an outlying market, this page is the
          right starting point.
        </p>
      </>
    ),
  },
  {
    id: "forney-economy",
    heading: "Why the Forney economy shapes the site",
    body: (
      <>
        <p>
          Forney sits at a structurally interesting point in the
          DFW corridor. The city is in Kaufman County, which is
          more rural and more agriculturally connected than
          Rockwall County to the north, but Forney itself is on
          the US 80 corridor that connects directly to Mesquite
          and to East Dallas. The result is a city that is
          simultaneously the eastern terminus of the Dallas
          commuter belt and the western terminus of a more rural
          East Texas economy. The Forney Texas Economic
          Development Corporation actively recruits retail,
          medical, and professional services tenants to keep up
          with the residential growth (Forney Texas EDC, 2024).
        </p>
        <p>
          What this means for the site you ship: the Forney buyer
          base is mixed in a way that is unique to the city. Some
          buyers are commuter-residents who spend their workdays
          in Mesquite or Dallas and bring metro-tier expectations
          home with them. Other buyers are long-time Kaufman
          County residents whose comparison set is more rooted in
          local relationships and the historic downtown culture.
          A site that serves both buyer tiers needs to read as
          professionally polished without losing the local
          credibility that long-time residents value. That
          balance is harder than either single register and is
          where templated agency work most often falls short.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks Kaufman
          County as part of the broader DFW employment market,
          which is one of the fastest-growing in the country
          (BLS, Dallas-Fort Worth Area Economic Summary, 2024).
          Competition for local-pack visibility on Forney
          queries is meaningfully lower than in Rockwall or
          Mesquite proper, which makes well-built sites with
          proper local schema and a healthy review profile a
          strong investment for the next three to five years
          while the agency market catches up to the residential
          growth.
        </p>
      </>
    ),
  },
  {
    id: "forney-neighborhoods",
    heading: "Forney geography and how the city actually divides",
    body: (
      <>
        <p>
          Forney divides along clear geographic lines. The
          dominant axis is US 80, which runs east-west through
          the heart of the city and connects directly to Mesquite
          and Dallas to the west and to the broader East Texas
          corridor to the east. State Highway 548 runs
          north-south through the historic downtown area; FM 740
          and FM 1641 carry much of the residential traffic on
          the western and northern edges of the city.
        </p>
        <p>
          Downtown Forney, around the historic main street and the
          Forney municipal buildings, is the civic and small-business
          center of the city. Long-tenured firms benefit from
          association with the downtown area; new arrivals usually
          need to establish credibility separately. The downtown
          retail and dining environment has improved meaningfully
          over the past decade and now anchors a real
          local-experience economy.
        </p>
        <p>
          Northern Forney covers the Heartland, Devonshire,
          Travis Ranch, and Diamond Creek master-planned
          subdivisions that have driven most of the recent
          residential growth. The buyer base here is the
          new-arrival demographic: more comparable to Frisco or
          Prosper buyer profiles than to long-time Forney
          profiles. Service businesses targeting these
          subdivisions need a digital-first conversion architecture
          because the buyer base does not have the local
          relationships that drive the downtown demographic.
        </p>
        <p>
          Southern Forney, along the I-20 corridor and the
          industrial-and-commercial corridors near the Forney
          Lake area, runs a different demographic pattern: more
          industrial and trades-driven, with a mix of legacy
          and new residential. Eastern Forney, along the US 80
          corridor extending toward Terrell, transitions into
          the more rural Kaufman County pattern.
        </p>
        <p>
          For Forney service businesses serving multiple
          sub-areas, a service-area zone page that names actual
          subdivisions and corridors (downtown, the Heartland
          and Devonshire master-planned area, the I-20 industrial
          corridor) outperforms generic city-name templated
          pages. The longer reference on this is the{" "}
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
    id: "forney-engagement-model",
    heading: "How the engagement runs for a Forney client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW
          client. Solo principal architect, fixed pricing at the
          start, full code ownership at delivery. The longer
          reference on the general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Forney specifically, the proximity advantage is real.
          The studio is twenty-five minutes northeast of Forney in
          Royse City along the I-30 and FM 548 corridor, which
          makes Forney one of the closer engagement markets in the
          metroplex. In-person scoping at the client&apos;s
          office, on-site photography sessions, and ongoing
          relationship work all run more efficiently for Forney
          clients than for Plano or Frisco clients. The local
          knowledge advantage is also meaningful. The studio sits
          twenty-five miles northeast of Forney on the eastern
          DFW corridor, which means working context for the city,
          which subdivisions are still actively building versus
          mature, which downtown corridors are working, which
          residential growth pockets are accelerating, is in
          scope rather than theoretical the way it is for an
          out-of-market vendor.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For published references for
          the verticals most common in Forney, the{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            medical and dental
          </Link>{" "}
          industry pages cover the architectural specifics.
        </p>
      </>
    ),
  },
  {
    id: "forney-where-im-based",
    heading: "Where I am based relative to Forney",
    body: (
      <>
        <p>
          The studio is based in Royse City, twenty-five minutes
          northeast of Forney along the FM 548 corridor and
          Interstate 30. Most engagements run over video calls
          and async work, with in-person scoping at the
          client&apos;s office, on-site photography, and ongoing
          relationship work scheduled when it helps the project.
          Travel inside DFW is included.
        </p>
        <p>
          For Forney buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it, and
          whether the studio actually understands the Forney
          context rather than treating it as an outlying Mesquite
          or Dallas market. Most Mesquite-based and Dallas-based
          agencies separate scoping from delivery and have only
          theoretical Forney knowledge; I do neither. If that
          model fits, this is the right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor
          are{" "}
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
            href="/dallas-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            Dallas proper
          </Link>
          , and the corporate-corridor cities (
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
            href="/prosper-web-design"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
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
      "Are you genuinely close to Forney, or is this a remote engagement?",
    answer:
      "Genuinely close. The studio is in Royse City, twenty-five minutes northeast of Forney along the FM 548 corridor. The closest Dallas-based or Mesquite-based agency office is roughly thirty-five minutes west. For Forney clients, the in-person scoping advantage and the local knowledge advantage are both real.",
  },
  {
    question:
      "How does your pricing compare to Mesquite or Dallas agencies that come east?",
    answer:
      "Total project cost is typically lower than equivalent Dallas-agency or Mesquite-agency work because there is no travel-time markup and no out-of-market premium. Quality and scope are equivalent. The structural difference is that I do all the work myself rather than running it through a coordination layer.",
  },
  {
    question: "Are master-planned residential developments a fit for the engagement model?",
    answer:
      "Yes. Service businesses targeting Heartland, Devonshire, Travis Ranch, Diamond Creek, and similar Forney master-planned developments often benefit disproportionately from a custom site because the buyer base is new-arrival and is doing aggressive vendor research. The conversion math leans heavily on visual sophistication and clear local context.",
  },
  {
    question:
      "Can you handle bilingual Spanish-language content for Forney?",
    answer:
      "Yes. The Spanish-speaking population in Forney and the surrounding Kaufman County corridor is meaningful, and bilingual content is a real conversion lift for many service businesses serving this market. Translation work is a real cost (a professional translator, not machine translation), and the customer base needs to support it. The discovery call covers whether the call mix justifies the work.",
  },
  {
    question: "What is the timeline for a typical Forney project?",
    answer:
      "Eight to twelve weeks for most Forney service-business engagements. Discovery sometimes runs slightly faster than the metro average because in-person scoping is logistically easy and the local context is already understood from regular drives through the area.",
  },
  {
    question: "Will the site rank in the Google local pack for Forney queries?",
    answer:
      "Local pack ranking is mostly a function of Google Business Profile health, review velocity, citations, and the relevance of your site content. Forney is generally less competitive than Mesquite or Rockwall, which means well-built sites with proper local schema and a healthy review profile typically rank into the top three of the local pack within three to six months.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Forney project?",
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
    title: "QuickFacts: Forney city, Texas",
    url: "https://www.census.gov/quickfacts/forneycitytexas",
  },
  {
    id: 2,
    org: "Forney Texas Economic Development Corporation",
    year: 2024,
    title: "Forney EDC: residential growth, retail recruitment, and community profile",
    url: "https://forneytexasedc.org/",
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

export function ForneyContent() {
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
