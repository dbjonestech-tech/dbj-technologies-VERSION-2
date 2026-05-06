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

const SLUG = "/rockwall-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Rockwall, Texas",
  coords: "32.9312° N, 96.4597° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Rockwall service businesses.",
  subtitle:
    "Rockwall is the eastern anchor of the DFW corridor. Lake Ray Hubbard on the western edge, the I-30 corridor running through the heart of the city, the Harbor District as the consumer-experience anchor, and a buyer base that has watched the city double in twenty years and is now sophisticated about vendor selection. The studio is fifteen minutes east of Rockwall in Royse City, which makes this one of the closest engagement markets in the entire metroplex. This page covers who I work with in Rockwall, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "rockwall-buyer-profile",
    heading: "Who I work with in Rockwall",
    body: (
      <>
        <p>
          Rockwall runs a buyer profile that sits structurally
          between the corporate-corridor cities (Plano, Frisco) and
          the truer exurban markets (Royse City, Forney). The
          Rockwall County population is concentrated heavily in
          Rockwall city and Heath, with smaller anchor towns
          extending east along Interstate 30. The Rockwall
          Economic Development Corporation reports a county
          population that has more than doubled since 2000, and the
          per-capita household income tier runs meaningfully ahead
          of most exurban Texas markets thanks to a combination of
          waterfront residential development, commuter access to
          Dallas proper, and an unusually strong school district
          (Rockwall EDC, 2025 Community Profile).
        </p>
        <p>
          The service-business buyer in Rockwall usually fits one
          of three profiles. First, the established practice firm
          (legal, financial, accounting, medical) serving the
          long-time household population around Lake Ray Hubbard
          and the historic downtown square. Second, the high-end
          home services business: pool design and service, custom
          builders, landscape design, exterior painting, dock and
          boat services on the lakefront, where the average ticket
          runs ahead of the metro average and the buyer base
          expects vendor sophistication that matches the
          residential housing tier. Third, the consumer-services
          business clustered along the I-30 corridor and around
          the Harbor District: dining, fitness, retail, urgent
          care, and the long tail of services that exists because
          Rockwall sits at the intersection of a high-density
          residential population and a daily commuter highway.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Dallas-based agencies that treat Rockwall as an
          outlying market, this page is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "rockwall-economy",
    heading: "Why the Rockwall economy shapes the site",
    body: (
      <>
        <p>
          Rockwall is structurally different from the corporate-
          corridor cities west of US 75. The economic base is
          largely residential and commuter-driven, with a layer of
          tourism and recreation tied to Lake Ray Hubbard and the
          waterfront economy. Rockwall County is geographically the
          smallest county in Texas by area, but the per-capita
          income, the school district performance, and the housing
          stock tier all run ahead of the Texas median (Rockwall
          EDC, 2025 Community Profile; U.S. Census Bureau, 2024).
        </p>
        <p>
          What this means for the site you ship: the Rockwall
          visual baseline is calibrated to a buyer who shops
          regularly in Plano and Frisco, vacations on the lake,
          drives Interstate 30 to a downtown Dallas job at least
          some weekdays, and has formed strong opinions about what
          professional-services polish should look like. Templated
          lead-gen funnels read as cheap in this market. A site
          that reads as carefully considered, with named local
          context, real waterfront photography rather than stock
          imagery, and a clear connection to the Rockwall
          community wins the buyer comparison.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks Rockwall
          County as part of the broader DFW employment market,
          which is one of the fastest-growing in the country (BLS,
          Dallas-Fort Worth Area Economic Summary, 2024).
          Competition for local-pack visibility on Rockwall service
          queries is meaningful but generally less intense than in
          the Plano-Frisco-McKinney corridor because the firm
          count per capita is lower and many Rockwall buyers also
          consider Dallas-based providers for higher-stakes work.
        </p>
      </>
    ),
  },
  {
    id: "rockwall-neighborhoods",
    heading: "Rockwall geography and how the city actually divides",
    body: (
      <>
        <p>
          Rockwall divides along clearer geographic lines than most
          DFW suburbs. The dominant axis is Lake Ray Hubbard, which
          forms the entire western boundary of the city and shapes
          residential, retail, and recreation patterns across
          almost every quadrant. Interstate 30 cuts through the
          city east-west; State Highway 205 runs north-south
          through the historic downtown square.
        </p>
        <p>
          The Harbor District at the southern end of the city is
          the consumer-experience anchor: marina, waterfront
          dining, retail, and the entertainment economy that draws
          Rockwall County residents and Dallas-day-trip traffic on
          weekends. Businesses near the Harbor benefit from the
          implied lifestyle association but compete in a denser
          retail environment than the rest of the county.
        </p>
        <p>
          The downtown Rockwall historic square, anchored on the
          1875 Rockwall County Courthouse, is the civic and
          professional-services center of the city. Long-tenured
          legal, financial, and medical firms cluster around the
          square; a site for one of these firms benefits from
          continuity-and-tradition framing rather than
          modern-corporate framing.
        </p>
        <p>
          The Ridge Road corridor, the FM 740 corridor, and the
          newer residential subdivisions north of I-30 carry much
          of the post-2010 residential growth and the higher-tier
          housing stock. The buyer base here is more directly
          comparable to West Plano or northwest Frisco
          demographics, and the conversion math is closer to the
          corporate-corridor pattern.
        </p>
        <p>
          For Rockwall service businesses serving multiple
          sub-areas, a service-area zone page that names actual
          sub-zones (Harbor District, downtown, Ridge Road
          corridor, FM 740 north) outperforms generic city-name
          templated pages. The longer reference on this is the{" "}
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
    id: "rockwall-engagement-model",
    heading: "How the engagement runs for a Rockwall client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW
          client. Solo principal architect, fixed pricing at the
          start, full code ownership at delivery. The longer
          reference on the general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Rockwall specifically, the proximity advantage is
          real. The studio is fifteen minutes east of Rockwall in
          Royse City, which makes Rockwall the closest meaningful
          engagement market in the entire DFW metroplex. In-person
          scoping at the client&apos;s office, on-site
          photography sessions, and ongoing relationship work all
          run more efficiently for Rockwall clients than for
          Plano or Frisco clients. The local knowledge advantage
          is also meaningful. The studio sits ten miles east of
          Rockwall on the same I-30 corridor, which means working
          context for the city, which Harbor District retail is
          current versus dated, which subdivisions are mature
          versus actively building, which county-level demographic
          shifts are real, is in scope rather than theoretical the
          way it is for an out-of-market vendor.
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
          the verticals most common in Rockwall, the{" "}
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
    id: "rockwall-where-im-based",
    heading: "Where I am based relative to Rockwall",
    body: (
      <>
        <p>
          The studio is based in Royse City, fifteen minutes east
          of Rockwall along Interstate 30. For Rockwall buyers,
          this is the closest custom-build studio to your front
          door anywhere in the metroplex. Travel inside DFW is
          included, and the proximity makes in-person scoping at
          the client&apos;s office, on-site photography, and
          ongoing engagement work meaningfully easier than for
          clients in the western or northern markets.
        </p>
        <p>
          For Rockwall buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it, and
          whether the studio actually understands the Rockwall
          context rather than treating it as an outlying Dallas
          market. Most Dallas-based agencies separate scoping from
          delivery and have only theoretical Rockwall knowledge;
          I do neither. If that model fits, this is the right
          place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor
          are{" "}
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
          ,{" "}
          <Link
            href="/forney-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Forney
          </Link>
          ,{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Dallas proper
          </Link>
          , and the corporate-corridor cities (
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
          ).
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question:
      "Are you genuinely closer to Rockwall than the Dallas agencies?",
    answer:
      "Yes. The studio is in Royse City, fifteen minutes east of Rockwall on Interstate 30. The closest Dallas-based agency office is roughly thirty-five minutes west. For Rockwall clients, the in-person scoping advantage and the local knowledge advantage are both real.",
  },
  {
    question:
      "How does your pricing compare to Dallas agencies that come east?",
    answer:
      "Total project cost is typically lower than equivalent Dallas-agency work because there is no travel-time markup and no out-of-market premium. Quality and scope are equivalent. The structural difference is that I do all the work myself rather than running it through a coordination layer.",
  },
  {
    question: "Do you handle Lake Ray Hubbard waterfront-business specifically?",
    answer:
      "Yes. Marina services, waterfront restaurants, lake-adjacent retail, dock builders, and similar lakefront-economy businesses are a strong fit because the customer base values local imagery and local context that a Dallas-only agency cannot credibly provide.",
  },
  {
    question:
      "What is the timeline for a typical Rockwall project?",
    answer:
      "Eight to twelve weeks for most Rockwall service-business engagements. Discovery sometimes runs slightly faster than the metro average because in-person scoping is logistically easy and the buyer is usually decisive about scope.",
  },
  {
    question: "Will the site rank in the Google local pack for Rockwall queries?",
    answer:
      "Local pack ranking is mostly a function of Google Business Profile health, review velocity, citations, and the relevance of your site content. Rockwall is generally less competitive than Plano or Frisco, which means well-built sites with proper local schema and a healthy review profile typically rank into the top three of the local pack within three to nine months.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Rockwall project?",
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
    title: "QuickFacts: Rockwall city, Texas",
    url: "https://www.census.gov/quickfacts/rockwallcitytexas",
  },
  {
    id: 2,
    org: "Rockwall Economic Development Corporation",
    year: 2025,
    title: "Rockwall County 2025 Community Profile: demographics, employment, and growth",
    url: "https://rockwalledc.com/",
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
    org: "City of Rockwall",
    year: 2024,
    title: "City of Rockwall: civic and economic information",
    url: "https://www.rockwall.com/",
  },
];

export function RockwallContent() {
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
