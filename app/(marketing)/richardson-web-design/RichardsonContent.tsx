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

const SLUG = "/richardson-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Richardson, Texas",
  coords: "32.9484° N, 96.7297° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Richardson service businesses.",
  subtitle:
    "Richardson is the original DFW Telecom Corridor, the deepest concentration of technology and engineering talent in the metro outside of headquarters cities, and a buyer base that knows the difference between marketing copy and real engineering. The websites that fit Richardson are the ones that read as substantive to a buyer who has spent twenty years inside the corporate IT machine. This page covers who I work with in Richardson, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "richardson-buyer-profile",
    heading: "Who I work with in Richardson",
    body: (
      <>
        <p>
          Richardson is structurally different from every other DFW
          city in this cluster. The city has been the center of the
          DFW technology economy since the Telecom Corridor branding
          took hold in the 1990s, and the corporate density along
          the US 75 and Spring Valley corridors reflects that
          history. Cisco, Texas Instruments adjacent properties,
          Lennox International, Fossil Group, Blue Cross Blue
          Shield of Texas, MetLife, USAA, Geico, and the University
          of Texas at Dallas anchor an employment base that runs
          deeper in technology and engineering than any other DFW
          city outside of Plano.
        </p>
        <p>
          The service-business buyer in Richardson usually fits one
          of three profiles. First, the technology-adjacent
          consulting firm: software development, IT services, data
          analytics, cybersecurity, where the buyer base is
          internal corporate technology decision-makers and the
          conversion math depends on a site that reads as
          substantive to a senior engineer. Second, the executive
          professional services firm (legal, financial, accounting,
          executive search) serving the corporate population, where
          the buyer is comparing vendors against firms that pitch
          national accounts and the visual baseline is high.
          Third, the consumer-services and home-services business
          serving the Richardson and Far North Dallas residential
          population, where the household density and household
          income both run ahead of the metro average.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Richardson-area or Plano-area agencies that
          produced templated work without engineering substance,
          this page is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "richardson-economy",
    heading: "Why the Richardson economy shapes the site",
    body: (
      <>
        <p>
          Richardson runs on a different economic base than any
          other DFW suburb. The Telecom Corridor branding traces
          back to the Texas Industrial Corridor of the late 1950s
          and the technology cluster that grew up around Texas
          Instruments and Collins Radio Company. By the late 1990s
          the corridor along US 75 from the LBJ Freeway north to
          Bush Turnpike had become one of the densest technology
          employment markets outside of Silicon Valley and the
          Boston area. The city actively rebranded the area as the
          Richardson IQ technology hub, and the Richardson Economic
          Development team continues to attract technology and
          professional services tenants today (Richardson Economic
          Development, 2024).
        </p>
        <p>
          What this means for the site you ship: the Richardson
          visual baseline is calibrated to a buyer who has personally
          shipped software, who has personally chosen vendors based
          on technical merit, and who recognizes the difference
          between a templated SaaS marketing site and a custom
          build. Generic agency-quality work that reads as
          plausible in Frisco or Allen reads as transparent in
          Richardson because the buyer has built or audited dozens
          of sites in their own career. The conversion math leans
          on technical substance (architecture choices, performance
          metrics, accessibility commitments, named integrations)
          much more than on visual flash.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks the broader
          DFW technology employment market as one of the
          fastest-growing in the country, and Richardson is the
          historical center of that market (BLS, Dallas-Fort Worth
          Area Economic Summary, 2024). Competition for local-pack
          visibility on technology and professional services
          queries is intense, and the technical depth of the
          competing sites is meaningfully higher than in
          consumer-only markets.
        </p>
      </>
    ),
  },
  {
    id: "richardson-neighborhoods",
    heading: "Richardson geography and how the city actually divides",
    body: (
      <>
        <p>
          Richardson divides along clearer geographic and
          demographic lines than most DFW suburbs. The dominant
          axis is US 75, which separates the older established
          neighborhoods west of the highway from the corporate and
          academic corridor east of the highway around the
          University of Texas at Dallas campus and the Richardson
          IQ technology zone. The Bush Turnpike on the northern
          edge of the city connects Richardson to the broader Plano
          and Garland markets.
        </p>
        <p>
          West Richardson covers the older residential corridors
          along Coit Road, Custer Road, and Campbell Road. The
          buyer here is more locally rooted, the housing stock is
          older, and the conversion path leans on neighborhood
          word-of-mouth and Google Business Profile health. The
          long-tenured professional services firms that serve this
          population have client relationships measured in decades
          rather than years.
        </p>
        <p>
          East Richardson covers the Telecom Corridor itself, the
          UT Dallas adjacent corridor, and the higher-density
          residential and corporate zones along the Spring Valley
          and Greenville Avenue corridors. The buyer here is more
          directly comparable to the Plano corporate-corridor
          buyer: brand-trained, technically sophisticated, and
          comparing vendors at a national rather than local
          standard.
        </p>
        <p>
          The downtown Richardson area near the DART Red Line
          stations (Arapaho Center, Galatyn Park, Bush Turnpike)
          anchors the consumer-services economy with a
          transit-oriented development pattern uncommon in most
          DFW suburbs. Restaurants, fitness studios, retail, and
          consumer services clustered near these stations benefit
          from daily commuter foot traffic.
        </p>
        <p>
          For Richardson service businesses serving multiple
          sub-areas, a service-area zone page that names actual
          sub-zones (West Richardson, the Telecom Corridor, the
          DART corridor) outperforms generic city-name templated
          pages. The longer reference on this is the{" "}
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
    id: "richardson-engagement-model",
    heading: "How the engagement runs for a Richardson client",
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
          For Richardson specifically, two things flex. First, the
          discovery work usually leans harder on technical
          substance and architectural choices. Richardson buyers
          want to see the stack named (Next.js 16, React 19, the
          specific CMS, the hosting platform, the integration
          approach) because they recognize the names and have
          opinions about them. Skipping the technical layer in
          discovery to focus on visual direction reads as light to
          this buyer. Second, the proof points that work in
          Richardson are technical proof points. A Lighthouse
          performance score in the high nineties on real mid-tier
          mobile hardware reads as more credible than a
          beautifully art-directed case study, because the
          Richardson buyer can independently verify the score in
          fifteen seconds.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture in the kind of detail Richardson
          buyers expect. For published references for the
          verticals most common in Richardson, the{" "}
          <Link
            href="/industries/legal"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            legal
          </Link>{" "}
          and{" "}
          <Link
            href="/industries/medical-and-dental"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            medical and dental
          </Link>{" "}
          industry pages cover the architectural specifics. The
          live{" "}
          <Link
            href="/industries/auto-service"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            auto service production proof
          </Link>{" "}
          is at Star Auto Service in Richardson itself, on Belt
          Line Road, and is the closest geographic example to a
          Richardson buyer comparing studios.
        </p>
      </>
    ),
  },
  {
    id: "richardson-where-im-based",
    heading: "Where I am based relative to Richardson",
    body: (
      <>
        <p>
          The studio is based in Royse City. The drive to Richardson
          runs along Interstate 30 and the President George Bush
          Turnpike, roughly forty minutes in normal traffic.
          Richardson is one of the closer corporate-corridor DFW
          markets to the studio geographically, and the live
          production proof at Star Auto Service is in Richardson
          itself, which makes in-person scoping and ongoing
          engagement work easier than for some of the western or
          northern markets. Travel inside DFW is included.
        </p>
        <p>
          For Richardson buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it, and whether
          the technical substance of the engagement holds up under
          real engineering scrutiny. Most Richardson-area agencies
          separate scoping from delivery; I do not. If that model
          fits, this is the right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor are{" "}
          <Link
            href="/plano-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Plano
          </Link>
          ,{" "}
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
          ,{" "}
          <Link
            href="/allen-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Allen
          </Link>
          ,{" "}
          <Link
            href="/prosper-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Prosper
          </Link>
          ,{" "}
          <Link
            href="/rockwall-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Rockwall
          </Link>
          ,{" "}
          <Link
            href="/heath-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Heath
          </Link>
          ,{" "}
          <Link
            href="/royse-city-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Royse City
          </Link>
          ,{" "}
          <Link
            href="/forney-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Forney
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
      "Do you only work with Richardson businesses, or with all DFW?",
    answer:
      "I work across DFW. Richardson is geographically close to the studio and is the location of the live Star Auto Service production proof, which means it sits at one of the strongest match points in the whole metro. The engagement model is metro-wide.",
  },
  {
    question:
      "How does your pricing compare to Richardson-area agencies?",
    answer:
      "Total project cost is typically competitive with mid-tier Richardson agencies and Plano agencies, with a larger share of the budget on actual building rather than coordination overhead. Richardson has a meaningful concentration of technology-adjacent agencies that pitch enterprise clients, and the engagement structure I run is closer to a senior internal engineer than to those agencies.",
  },
  {
    question:
      "Do you have published proof of the technical substance of what you build?",
    answer:
      "Yes. The live Star Auto Service site is the cleanest available production proof. It is on Belt Line Road in Richardson, runs on Next.js 16, scores at the top of the Lighthouse range, passes Core Web Vitals at the 75th percentile, and serves both customer-facing booking and an internal operations layer. The auto service industry page covers the architectural details. For published reference architectures, the design briefs cover eight verticals.",
  },
  {
    question: "Are technology-adjacent consulting firms a fit for the engagement model?",
    answer:
      "Yes, especially Richardson-based consulting firms whose buyer base is internal corporate technology decision-makers. The engagement structure works well when the client's buyer expects technical substance in the marketing layer, because that matches how I scope and present the work. The discovery call covers whether the specific niche fits.",
  },
  {
    question: "What is the timeline for a typical Richardson project?",
    answer:
      "Eight to twelve weeks for most Richardson service-business engagements. Discovery sometimes runs slightly longer than the metro average because Richardson buyers more often have specific technical requirements (single sign-on, custom integrations, data residency) that require explicit scoping work before architecture decisions are final.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Richardson project?",
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
    title: "QuickFacts: Richardson city, Texas",
    url: "https://www.census.gov/quickfacts/richardsoncitytexas",
  },
  {
    id: 2,
    org: "Richardson Economic Development",
    year: 2024,
    title: "Richardson IQ technology hub: corporate density and industry profile",
    url: "https://richardsoneconomicdevelopment.com/",
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
    title: "Texas Economic Indicators: DFW technology corridor employment",
    url: "https://www.dallasfed.org/research/indicators/tei",
  },
];

export function RichardsonContent() {
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
