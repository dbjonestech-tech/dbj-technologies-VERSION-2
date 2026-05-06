"use client";

import Link from "next/link";
import { ReferenceLayout } from "@/components/templates/ReferenceLayout";
import type {
  ReferenceCTA,
  ReferenceHero,
  ReferenceSection,
} from "@/components/templates/ReferenceLayout";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { DecisionCriteria } from "@/components/sections/DecisionCriteria";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/resources/what-a-website-should-cost";

const hero: ReferenceHero = {
  eyebrow: "Decision · Pricing reference",
  title: "What a website should cost, anchored to real numbers.",
  subtitle:
    "Most pricing guides for websites are either national averages stripped of context, or sales pitches dressed up as ranges. This page is neither. It is the honest answer to what a website should cost in 2026, by buyer profile, with the tradeoffs named, anchored to the prices I publish on my own site so the math is auditable.",
};

const tierColumns = [
  { label: "DIY templated", sublabel: "Squarespace / Wix" },
  { label: "Freelancer", sublabel: "Single contractor" },
  { label: "Studio", sublabel: "Principal-architect", highlight: true },
  { label: "Agency", sublabel: "Multi-headcount shop" },
];

const tierRows = [
  {
    label: "Setup or build cost",
    values: [
      "$0 to $2,000",
      "$2,000 to $15,000",
      "$4,500 to $25,000+",
      "$15,000 to $80,000+",
    ],
  },
  {
    label: "Recurring platform fee",
    values: [
      "$200 to $500 / year",
      "Hosting only ($10 to $50 / mo)",
      "Hosting only ($10 to $50 / mo)",
      "Hosting only ($10 to $50 / mo)",
    ],
  },
  {
    label: "Ownership",
    values: [
      "Platform license (you cannot leave with it)",
      "Code is yours if contracted that way",
      "Full code ownership, transferred at launch",
      "Negotiated; varies by contract",
    ],
  },
  {
    label: "Ranking ceiling",
    values: [
      "Capped by template performance",
      "Depends on contractor",
      "High; performance and SEO are the build target",
      "High; depends on the team assigned",
    ],
  },
  {
    label: "Time to launch",
    values: [
      "Hours to days",
      "2 to 8 weeks",
      "8 to 14 weeks",
      "12 to 24+ weeks",
    ],
  },
  {
    label: "Best fit",
    values: [
      "Pre-revenue, brochure only",
      "Defined-scope tactical work",
      "Service businesses with real engineering needs",
      "Multi-stakeholder enterprise procurement",
    ],
  },
  {
    label: "Common failure mode",
    values: [
      "Outgrown in 18 months, switching cost is real",
      "Contractor unavailable for post-launch maintenance",
      "Wrong shop if scope is templated brochure work",
      "Coordination overhead eats the build budget",
    ],
  },
];

const decisionOptions = [
  {
    label: "Choose DIY templated if",
    bullets: [
      "Your entire web strategy is hours, address, and a phone number",
      "You have under $5K total budget and no engineering needs",
      "You are pre-revenue and prefer to spend on advertising or operations",
      "You can live with the platform's design and integration ceilings",
    ],
  },
  {
    label: "Choose a studio if",
    bullets: [
      "Your business actually runs through the website",
      "You want full code ownership, not a hosted-platform license you rent",
      "You need integrations beyond a contact form (booking, dashboards, CRM)",
      "You are spending $5K to $80K and want the work to last five years",
    ],
    highlight: true,
  },
  {
    label: "Choose an agency if",
    bullets: [
      "You have multiple stakeholders that need formal procurement",
      "Your project requires a multidisciplinary team beyond engineering",
      "Your budget is $80K+ and the coordination layer pays for itself",
      "You need regulatory, brand, or compliance review baked into the process",
    ],
  },
];

const sections: ReferenceSection[] = [
  {
    id: "the-honest-answer",
    heading: "The honest answer nobody publishes",
    body: (
      <>
        <p>
          Nobody can give you a real number for what your website should
          cost without knowing what your website is supposed to do. The
          questions that decide the answer are not technical, they are
          commercial. Does your business actually run through the
          website. Are your buyers researching for weeks before they
          contact you, or deciding in thirty seconds. How many years
          should this site last before the next rebuild. What
          integrations does the site need to do its job. None of those
          are pricing questions. All of them are pricing inputs.
        </p>
        <p>
          The other reason most pricing guides are useless is that they
          publish national averages stripped of buyer context. The
          mean cost of a small-business website rolled across DIY,
          freelancer, studio, and agency tiers is a number that
          describes nobody&apos;s actual decision. The right framing
          is by tier, with each tier&apos;s real range and a clear
          read on which buyer profile fits inside it. That is what
          this page does.
        </p>
        <p>
          The honest baseline is that a service business website in
          2026 should cost somewhere between zero and eighty thousand
          dollars to build, depending on the tier, and somewhere
          between two hundred and six thousand dollars per year to
          run. The five-figure span at the lower end and the
          six-figure span at the upper end exist because the work is
          genuinely different at each tier, not because anyone is
          inflating prices.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "$130,000",
      label:
        "U.S. median annual compensation for full-stack developers in 2024, per the Stack Overflow Developer Survey of 49,390 professional respondents. The freelancer hourly rate that produces a sustainable income at this median is roughly $90 to $130 per hour.",
      source: {
        name: "Stack Overflow Developer Survey, 2024",
        url: "https://survey.stackoverflow.co/2024/work",
      },
    },
  },
  {
    id: "the-four-tiers",
    heading: "The four tiers and what each actually costs in 2026",
    body: (
      <>
        <p>
          The market sorts into four tiers that each have a stable
          range. The boundaries are softer than the table below
          implies; a senior freelancer can deliver studio-tier work and
          a small studio can be priced like a freelancer. The framing
          still holds because the cost structure of each model is real
          and the failure modes of each model are predictable.
        </p>
        <p>
          <strong>DIY templated</strong> covers Squarespace, Wix,
          WordPress.com, and the like. The setup is a weekend. The
          recurring platform fee runs two hundred to five hundred
          dollars per year for the business plan. The ranking ceiling
          is whatever the platform&apos;s template performance allows,
          which is usually the lower bound of what Google rewards. For
          a brochure with hours, an address, and a phone number, this
          tier is a defensible choice and I will tell you so.
        </p>
        <p>
          <strong>Freelancer custom</strong> covers a single
          contractor or a two-person shop. Cost runs two thousand to
          fifteen thousand dollars for the build, depending on scope.
          Code ownership transfers if you contract for it. Time to
          launch runs two to eight weeks for tactical work. The
          predictable failure mode is post-launch: a freelancer is
          one person and people get sick, take other contracts, or
          stop returning emails. Studio engagements are usually
          stronger here because there is a published support
          arrangement.
        </p>
        <p>
          <strong>Studio</strong> covers principal-architect studios
          like this one. Build cost runs four thousand five hundred
          to twenty-five thousand dollars and up, depending on the
          engagement tier. The ranking and performance ceiling are
          high because the build target is real engineering, not a
          template. Time to launch runs eight to fourteen weeks. The
          best fit is service businesses that run through the website
          and want the site to last five years. The wrong fit is a
          one-page brochure where the studio premium is overpaying
          for engineering you do not need.
        </p>
        <p>
          <strong>Agency</strong> covers multi-headcount shops with
          coordinators, project managers, separate engineering and
          design teams, and procurement-friendly contracts. Build
          cost runs fifteen thousand to eighty thousand dollars and
          up, with enterprise engagements past one hundred thousand
          dollars. Time to launch runs twelve to twenty-four weeks
          and longer. The cost structure is real (real headcount,
          real overhead). The failure mode is paying agency rates for
          studio work, which I cover in the{" "}
          <Link
            href="/resources/agency-vs-studio-vs-freelancer"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            agency vs studio vs freelancer page
          </Link>
          .
        </p>
        <ComparisonTable
          accent="blue"
          columns={tierColumns}
          rows={tierRows}
          caption="Tier-by-tier ranges for a U.S. service-business website in 2026."
          source={{
            name: "Industry pricing surveys (Stack Overflow 2024, GoodFirms, Clutch) cross-checked against my own published rates",
            url: "https://survey.stackoverflow.co/2024/work",
          }}
        />
      </>
    ),
  },
  {
    id: "what-drives-cost-up",
    heading: "What actually drives cost up",
    body: (
      <>
        <p>
          Six factors push a website price up, in order of impact.
          Custom integrations beyond a contact form are first. A
          marketing site with a contact form is one cost. A site with
          a booking flow, a customer login, a payment processor, and
          a CRM sync is a different cost, because each integration
          is its own engineering surface to design, build, test, and
          maintain. Adding three integrations to a base scope can
          double the engagement.
        </p>
        <p>
          Content depth is second. A ten-page site is roughly a third
          of the build effort of a forty-page site. Page count is
          not just a content-modeling problem; each page is a
          performance, accessibility, and SEO surface to engineer.
          Sites that need fifty location pages or one hundred service
          pages cost more, and the cost is mostly engineering, not
          copywriting.
        </p>
        <p>
          Design specificity is third. A site that uses a clean
          design system applied across templates is one cost. A site
          where every page has bespoke art direction is a different
          cost, because each page is its own design and engineering
          pass. Most service businesses do not need bespoke art
          direction on every page; the ones that do (luxury, high-end
          professional services, hospitality) are paying the premium
          for a real reason.
        </p>
        <p>
          Performance and accessibility floor is fourth. A site
          targeting a Lighthouse score in the high seventies is one
          cost. A site targeting a high-nineties score across mobile
          and desktop, in the field, at the seventy-fifth
          percentile, is a different cost. The performance work is
          real engineering, and it compounds with every additional
          page and every additional integration. WCAG 2.2 AA
          conformance is similarly real work, not a checkbox (W3C,
          2023).
        </p>
        <p>
          Content management ergonomics is fifth. A site where the
          owner edits content directly in code is one cost. A site
          where a non-technical content team needs to ship updates
          weekly through a CMS with previews, scheduling, and
          version history is a different cost. Headless CMS
          integrations (Sanity, Payload, Contentful) add real
          engineering scope and ongoing license fees.
        </p>
        <p>
          Internal-tool surface is sixth and largest at the top. If
          the engagement is not just a marketing site but also a
          custom admin dashboard, a CRM, an ops console, or a
          customer portal, the cost spans into the high five and low
          six figures. That is a different category of work, and the
          right pricing reference is a custom-software engagement,
          not a website engagement.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "8%",
      label:
        "sales lift Vodafone Italy measured after improving Largest Contentful Paint by 31% on a single rebuilt landing page. Performance work has measurable revenue impact, which is part of why high-performance builds cost more than templated ones.",
      source: {
        name: "Google web.dev case study, 2022",
        url: "https://web.dev/case-studies/vodafone",
      },
    },
  },
  {
    id: "what-is-overpriced",
    heading: "What is worth paying for, and what is overpriced",
    body: (
      <>
        <p>
          Three things are worth paying for, almost always.
          Performance engineering, because the revenue impact is
          measurable and recurs forever. Accessibility, because the
          work shares root causes with performance and SEO and the
          legal exposure is real for any business serving the public.
          Code ownership, because what you cannot take with you is a
          recurring cost in disguise.
        </p>
        <p>
          Three things are usually overpriced. The first is custom
          motion design beyond what the brand actually requires.
          Animations are inexpensive to add, expensive to do well,
          and easy to overspend on without measurable benefit.
          Second is bespoke art direction on every page, which is a
          real cost for the rare buyer who needs it and a wasted
          cost for the buyers who do not. Third is design rounds
          past the third or fourth iteration. Past that point you
          are usually buying decision avoidance, not better design.
        </p>
        <p>
          Two things are commonly mispriced in both directions. SEO
          retainers at five hundred to one thousand dollars a month
          for a small service business rarely deliver proportional
          value at that revenue scale; a one-time foundation
          engagement plus maintenance is the right shape. CMS
          licenses are sometimes overpriced for small content teams
          (Contentful Enterprise is overkill for most service
          businesses) and sometimes underpriced (Sanity and Payload
          can deliver enterprise-grade ergonomics for under a
          thousand dollars per year).
        </p>
        <DecisionCriteria accent="blue" options={decisionOptions} />
      </>
    ),
  },
  {
    id: "how-my-tiers-map",
    heading: "How my published tiers map to this scale",
    body: (
      <>
        <p>
          The most useful pricing reference in any category is the
          one that names a real number. I publish four engagement
          tiers on this site so the math is auditable rather than
          obscured.
        </p>
        <p>
          <strong>Fix Sprint</strong> is two thousand nine hundred
          ninety-five dollars, two-week fixed-price, post-Pathlight
          engagement. The three highest-impact issues from your
          scan, shipped to production, with a Lighthouse
          before-and-after and a fresh Pathlight re-scan. The
          engagement model lives at{" "}
          <Link
            href="/pricing/fix-sprint"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            /pricing/fix-sprint
          </Link>
          ; the methodology is documented at{" "}
          <Link
            href="/services/website-performance-audit"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            the performance audit page
          </Link>
          .
        </p>
        <p>
          <strong>Starter</strong> at four thousand five hundred
          dollars covers a focused new-build for a service business
          with straightforward scope. <strong>Professional</strong>{" "}
          at nine thousand five hundred dollars covers a more
          substantial build with custom integrations.{" "}
          <strong>Enterprise</strong> starting at fifteen thousand
          dollars covers larger engagements where the scope is a
          per-engagement quote. Custom Next.js development for
          buyers who need a full rebuild is documented on the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Next.js development page
          </Link>
          .
        </p>
        <p>
          The reason I publish these prices is that opaque pricing
          is one of the most common failure modes in this category,
          and it costs everybody time. A buyer who knows my range up
          front can self-qualify in five minutes; a buyer who has
          to schedule a discovery call to learn whether I am even
          in their budget is being asked to pay for the privilege of
          finding out. The honest framing is the differentiator. The
          published number is the proof.
        </p>
      </>
    ),
  },
];

const cta: ReferenceCTA = {
  eyebrow: "Next step",
  headline:
    "If the tier math points to a studio engagement, the next move is a thirty-minute call.",
  body:
    "I do not run high-pressure sales conversations. The first call is diagnostic. The goal is to confirm which tier matches your scope, what timing looks like on both sides, and whether the engagement is a real fit. If the right answer for your business is a templated platform or a freelancer, I will say so and recommend a path. If the right answer is a studio build, the call covers scope, timeline, and whether Fix Sprint, Starter, Professional, or Enterprise is the right tier.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "See the published tiers", href: "/pricing" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "What is the cheapest legitimate option for a service business website?",
    answer:
      "Squarespace or Wix on the business plan, around two hundred to three hundred dollars per year, with one weekend of self-setup. This is the right answer when your entire strategy is a brochure and your budget is firmly under five thousand dollars. The tradeoff is the platform ceiling, which is real but is not your problem until your business actually outgrows it.",
  },
  {
    question:
      "How much should I budget for a redesign of my existing site?",
    answer:
      "If the existing site is structurally sound and the work is mostly visual, a redesign runs roughly half the cost of a rebuild at the same tier. If the existing site is structurally broken (legacy stack, no schema, brittle templating, poor mobile performance), the right call is usually a rebuild rather than a redesign, and the cost reflects the rebuild tier.",
  },
  {
    question: "Why is custom Next.js so much more expensive than WordPress?",
    answer:
      "Two reasons. WordPress shifts cost to the plugin marketplace and to ongoing patching, which makes the up-front number lower and the total-cost-of-ownership over five years comparable or higher. Custom Next.js shifts cost to engineering up front, in exchange for performance, security, and ownership posture that hold up over years. The right answer depends on whether you want the cost concentrated up front or spread across maintenance.",
  },
  {
    question:
      "Why does an agency quote three times what a studio quotes for the same scope?",
    answer:
      "Because the cost structure is different. An agency has account managers, project managers, designers, engineers, QA, and operations on payroll. Some share of every dollar pays for the coordination layer between you and the people writing the code. A studio is closer to the work and has less overhead. Both models are real; which one fits depends on whether you need the coordination layer or are paying for it without using it.",
  },
  {
    question: "Are SEO retainers worth the monthly fee?",
    answer:
      "Sometimes yes, mostly no, at the small-service-business scale. A one-time foundation engagement (Business Profile, NAP consistency, schema, review velocity) plus maintenance is the right shape for most service businesses. Open-ended retainers at five hundred to one thousand dollars per month rarely deliver proportional value at that revenue scale. The longer reference is on the local SEO hub.",
  },
  {
    question: "What if I have a mid-five-figure budget and do not know which tier fits?",
    answer:
      "Call any reputable studio in your market and ask for a thirty-minute scoping conversation. A good studio will tell you on that call whether your scope fits a Starter, a Professional, or a custom quote, and they will tell you if the right answer is a freelancer instead. Studios that cannot tell you which tier fits without a paid discovery are a yellow flag.",
  },
  {
    question:
      "How much should I spend on hosting after launch?",
    answer:
      "For a Vercel-deployed Next.js site for a small service business, ten to fifty dollars per month is typical, including bandwidth and edge functions. WordPress hosting on managed providers like Kinsta or WP Engine runs thirty to one hundred fifty dollars per month for comparable traffic. DIY platforms bundle hosting into their two hundred to five hundred dollar annual fee. Hosting is rarely the line item to optimize; the build is.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Stack Overflow",
    year: 2024,
    title:
      "Developer Survey 2024: compensation, work, and rates for professional developers",
    url: "https://survey.stackoverflow.co/2024/work",
  },
  {
    id: 2,
    org: "GoodFirms",
    year: 2024,
    title: "Web Development Pricing Report",
    url: "https://www.goodfirms.co/resources/web-development-pricing-report",
  },
  {
    id: 3,
    org: "Clutch",
    year: 2024,
    title: "Web Development Companies: rates and engagement reviews",
    url: "https://clutch.co/web-developers",
  },
  {
    id: 4,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: CMS and frameworks chapters",
    url: "https://almanac.httparchive.org/en/2024/cms",
  },
  {
    id: 5,
    org: "Google web.dev",
    year: 2022,
    title: "Vodafone Italy: a 31% improvement in LCP increased sales by 8%",
    url: "https://web.dev/case-studies/vodafone",
  },
  {
    id: 6,
    org: "W3C",
    year: 2023,
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
  },
];

export function WebsiteCostContent() {
  const config = getPageConfig(SLUG);
  if (!config) return null;
  return (
    <ReferenceLayout
      config={config}
      hero={hero}
      sections={sections}
      faq={faq}
      cta={cta}
      sources={sources}
    />
  );
}
