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

const SLUG = "/heath-web-design";

const hero: LocalLanderHero = {
  geoLabel: "Heath, Texas",
  coords: "32.8454° N, 96.4750° W",
  eyebrow: "Custom web design studio",
  title: "I build custom websites for Heath service businesses.",
  subtitle:
    "Heath is a deliberately low-density Lake Ray Hubbard waterfront city. Roughly nine thousand residents, an unusually high household income tier, a community that spent the last two decades building exactly what its comprehensive plan called for, and a buyer base that values restraint and craft over flash. The websites that fit Heath look like they belong on the lakefront, not on a templated corporate-corridor lead-gen funnel. The studio is twenty-five minutes east of Heath in Royse City. This page covers who I work with in Heath, how the engagement runs, and what the city-specific design considerations actually are.",
};

const sections: LocalLanderSection[] = [
  {
    id: "heath-buyer-profile",
    heading: "Who I work with in Heath",
    body: (
      <>
        <p>
          Heath runs the most distinctive buyer profile in the
          eastern Rockwall County corridor. The city has
          deliberately kept its population small (roughly nine
          thousand residents per the U.S. Census Bureau, 2024) and
          its residential density low. The Heath 2025
          Comprehensive Plan articulates an explicit preference
          for large-lot estate residential development over
          high-density alternatives, and the city has executed
          against that vision consistently. The result is an
          unusually high per-capita income tier, an unusually
          mature housing stock, and a buyer base that values
          discretion and quality more strongly than novelty.
        </p>
        <p>
          The service-business buyer in Heath usually fits one of
          three profiles. First, the high-end home services
          business serving the lakefront and large-lot residential
          population: custom builders, architectural design,
          landscape architecture, pool design and service, dock
          and boat services, exterior restoration, where the
          average ticket runs meaningfully higher than the metro
          average and the buyer base expects vendor sophistication
          to match the housing tier. Second, the established
          professional services firm (legal, financial, medical)
          with a small but high-tier Heath client base, often
          with offices in Rockwall proper or the Plano corridor.
          Third, the boutique consumer-services business: equine
          services, private fitness, in-home wellness, where the
          conversion math depends on word-of-mouth and visible
          local relationships rather than on volume.
        </p>
        <p>
          If your business fits one of those profiles and you have
          tried Rockwall-area or Dallas-based agencies that
          produced templated work without local taste, this page
          is the right starting point.
        </p>
      </>
    ),
  },
  {
    id: "heath-economy",
    heading: "Why the Heath economy shapes the site",
    body: (
      <>
        <p>
          Heath is structurally different from every other city in
          this cluster. The economic base is overwhelmingly
          residential and lifestyle-driven. The city has no real
          retail corridor of its own (most retail demand flows to
          neighboring Rockwall and to the broader I-30 corridor),
          and the commercial population is concentrated in
          professional services, home services, and small
          boutique consumer services. The Heath 2025
          Comprehensive Plan, the city&apos;s active long-range
          planning document, treats land-use restraint and
          neighborhood character preservation as the dominant
          priorities (City of Heath, 2025).
        </p>
        <p>
          What this means for the site you ship: the Heath visual
          baseline is calibrated to a buyer who values craft,
          restraint, and quiet sophistication over volume or
          aggressive branding. Generic agency-quality work that
          reads as plausible in Frisco or Allen reads as
          mismatched in Heath because the surrounding visual
          environment is intentionally understated. Stock
          photography, pop-up forms, and aggressive conversion
          architecture all feel inappropriate for the buyer
          context. The site that wins in Heath reads as carefully
          built, with custom photography of real local work,
          restrained typography, and a clear connection to the
          community character.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks Rockwall
          County (which contains Heath) as part of the broader
          DFW employment market (BLS, Dallas-Fort Worth Area
          Economic Summary, 2024). Competition for local-pack
          visibility on Heath-specific queries is meaningfully
          lower than in larger DFW markets because the population
          base is small, but the per-customer revenue impact of a
          working site is meaningfully higher because the average
          ticket runs ahead of the metro median.
        </p>
      </>
    ),
  },
  {
    id: "heath-neighborhoods",
    heading: "Heath geography and how the city actually divides",
    body: (
      <>
        <p>
          Heath divides primarily along the Lake Ray Hubbard
          waterfront axis. The dominant axis is Smirl Drive and
          FM 740, which run roughly parallel to the lake and
          define the residential corridors. The eastern third of
          the city, away from the waterfront, is more
          conventionally suburban; the western two-thirds, closer
          to and along the lake, is the large-lot estate
          residential pattern that defines Heath as a market.
        </p>
        <p>
          The Heath waterfront residential corridor (Buffalo Way,
          Lake Forest Drive, Hubbard Drive, the Buffalo Creek and
          Stoney Hollow neighborhoods) anchors the highest-tier
          residential population in the city and the highest-tier
          home-services demand. Buyers in this corridor have
          unusually consistent expectations about visual quality
          and craft, which makes the conversion math more
          predictable than in mixed-tier markets.
        </p>
        <p>
          Eastern Heath, around the FM 1140 corridor and the
          newer subdivisions away from the lake, runs a slightly
          more conventional suburban pattern but still on
          larger-than-typical lots. The buyer base here is a tier
          below the waterfront corridor in housing stock but
          consistent with the corporate-corridor demographic in
          income.
        </p>
        <p>
          For Heath service businesses, the practical implication
          is that the city is small enough that a single
          well-built site for the whole city usually outperforms
          multiple zone-specific pages. The exception is a service
          business with both Heath and Rockwall coverage, where
          two real city pages (Heath plus Rockwall) outperform a
          single Rockwall County zone page because the buyer
          identifies more strongly with the specific city. The
          longer reference on this is the{" "}
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
    id: "heath-engagement-model",
    heading: "How the engagement runs for a Heath client",
    body: (
      <>
        <p>
          The engagement model is identical to any other DFW
          client. Solo principal architect, fixed pricing at the
          start, full code ownership at delivery. The longer
          reference on the general engagement model is the{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Dallas studio page
          </Link>
          .
        </p>
        <p>
          For Heath specifically, two things flex. First, the
          visual direction usually leans warmer, more
          typographically considered, and more photography-driven
          than the harder-edged corporate-corridor work that fits
          Plano. Heath businesses benefit from a site that reads
          as quietly confident, with attention to materials,
          texture, and craft signals rather than to aggressive
          conversion architecture. Second, in-person scoping is
          easy. The studio is twenty-five minutes east of Heath
          in Royse City, which makes site visits, on-site
          photography sessions, and ongoing relationship work
          straightforward. For Heath businesses, this is a
          meaningful advantage over Dallas-based agencies who
          treat eastern Rockwall County as an outlying market.
        </p>
        <p>
          For the technical specifics of what I build, the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Next.js development page
          </Link>{" "}
          covers the architecture. For published references for
          the verticals most common in Heath, the{" "}
          <Link
            href="/industries/trades-and-hvac"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            trades and HVAC
          </Link>{" "}
          industry page covers the architectural specifics for the
          high-end home services category that dominates Heath
          demand.
        </p>
      </>
    ),
  },
  {
    id: "heath-where-im-based",
    heading: "Where I am based relative to Heath",
    body: (
      <>
        <p>
          The studio is based in Royse City, twenty-five minutes
          east of Heath along Interstate 30 and FM 740. Most
          engagements run over video calls and async work, with
          in-person scoping at the client&apos;s office or a
          waterfront location when it helps the project. Travel
          inside DFW is included.
        </p>
        <p>
          For Heath buyers comparing local options, the
          differentiator is not address. It is whether the same
          person who scopes the project also builds it, and
          whether the studio understands the Heath buyer&apos;s
          preference for restraint and craft over volume and
          flash. Most Dallas-based agencies separate scoping from
          delivery and produce work calibrated to a different
          buyer; I do neither. If that model fits, this is the
          right place to talk.
        </p>
        <p>
          The sibling city pages for the rest of the corridor
          are{" "}
          <Link
            href="/rockwall-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Rockwall
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
          ,{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Dallas proper
          </Link>
          , and the corporate-corridor cities (
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
            href="/richardson-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Richardson
          </Link>
          ,{" "}
          <Link
            href="/prosper-web-design"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
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
      "Heath is small. Is a custom site really worth the investment?",
    answer:
      "It depends on the average ticket. For high-end home services and professional services serving the Heath waterfront tier, the per-customer revenue impact of a well-built site is high enough that custom usually pays back faster than in higher-volume lower-ticket markets. For volume-driven retail or low-ticket consumer services, a templated path is often the right call. The discovery call covers honest fit on this question.",
  },
  {
    question:
      "Do you handle waterfront-business specifically?",
    answer:
      "Yes. Dock builders, lake-equipment service, marine services, waterfront landscape, and similar lakefront-economy businesses are a strong fit because the customer base values local imagery and lake-specific knowledge that a Dallas-only agency cannot credibly provide.",
  },
  {
    question: "What is the visual direction for a typical Heath project?",
    answer:
      "Warmer, more typographically considered, and more photography-driven than corporate-corridor work. Restraint, craft, and material-quality cues read as appropriate for the Heath buyer; aggressive conversion architecture and pop-up forms read as mismatched. The discovery phase usually includes mood-boarding against actual Heath context (real lake, real housing stock, real materials) rather than against generic visual references.",
  },
  {
    question:
      "How does your pricing compare to Dallas agencies?",
    answer:
      "Total project cost is typically lower than equivalent Dallas-agency work because there is no travel-time markup and no out-of-market premium. The structural difference is that I do all the work myself rather than running it through a coordination layer.",
  },
  {
    question: "What is the timeline for a typical Heath project?",
    answer:
      "Eight to twelve weeks for most Heath service-business engagements, with the photography work sometimes adding a week or two because Heath sites benefit disproportionately from custom photography of real local work, real local landmarks, and real local people.",
  },
  {
    question: "Do you offer ongoing maintenance after launch?",
    answer:
      "Optional. Most clients choose a small monthly maintenance arrangement that covers updates, monitoring, and minor improvements. The thirty-day post-launch optimization window is included in every engagement.",
  },
];

const cta: LocalLanderCTA = {
  eyebrow: "Ready to talk about a Heath project?",
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
    title: "QuickFacts: Heath city, Texas",
    url: "https://www.census.gov/quickfacts/heathcitytexas",
  },
  {
    id: 2,
    org: "City of Heath",
    year: 2025,
    title: "Heath 2025 Comprehensive Plan: land use, neighborhood character, and growth restraint",
    url: "https://www.heathtx.com/",
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

export function HeathContent() {
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
