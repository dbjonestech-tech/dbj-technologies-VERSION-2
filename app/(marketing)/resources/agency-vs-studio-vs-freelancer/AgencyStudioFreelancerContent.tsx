"use client";

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

const SLUG = "/resources/agency-vs-studio-vs-freelancer";

const hero: ReferenceHero = {
  eyebrow: "Decision",
  title: "Agency, studio, or freelancer: how to pick one for your website rebuild.",
  subtitle:
    "Three buyer profiles, three cost structures, three failure modes. An honest framing of which model fits your business, with industry data and a recommendation I would give my own family.",
};

const sections: ReferenceSection[] = [
  {
    id: "the-three-profiles",
    heading: "The three buyer profiles, in plain language",
    body: (
      <>
        <p>
          The three vendor models for a website rebuild are agency, studio, and
          freelancer. They differ in headcount, cost structure, and how the
          buyer interacts with the people doing the work. Most marketing copy
          blurs these intentionally, because the markup at one end of the
          spectrum disappears when buyers can see the structural differences
          clearly.
        </p>
        <p>
          An <strong>agency</strong> is typically 10 to 200 staff, with
          dedicated account management, sales, design, development, project
          management, and quality assurance. The buyer signs with a sales team
          and runs day-to-day work through an account manager who relays to the
          team. The agency owns the relationship; the named designer or
          developer pitched in the proposal is rarely the named designer or
          developer who actually delivers.
        </p>
        <p>
          A <strong>studio</strong> is typically one to ten people, often
          principal-led. The buyer signs with the principal and works with the
          principal directly. There is no account manager between the buyer and
          the work. The studio owns the relationship, and the named principal
          is the same person who delivers.
        </p>
        <p>
          A <strong>freelancer</strong> is one person, no team. The buyer hires
          on hourly or fixed-bid terms for a defined scope. The freelancer is
          the same person across pitch, delivery, and follow-up. Hourly rates
          are the lowest of the three; project complexity is capped by what one
          person can hold in their head.
        </p>
        <p>
          The U.S. Bureau of Labor Statistics tracks Web Developers (SOC
          15-1254) at strong projected employment growth through 2032 (BLS,
          2024), and the Stack Overflow Developer Survey 2024 sampled 49,390
          professional developers across the categories that staff all three
          models (Stack Overflow, 2024). The talent pool is the same; the
          packaging is different.
        </p>
      </>
    ),
  },
  {
    id: "what-you-pay-for",
    heading: "What you actually pay for at each tier",
    body: (
      <>
        <p>
          The honest cost question is not &ldquo;what is the hourly rate&rdquo;
          but &ldquo;how much of every dollar you spend goes into building the
          thing.&rdquo; Each model has a different answer.
        </p>
        <p>
          At an <strong>agency</strong>, a meaningful share of your spend funds
          overhead the buyer never directly sees. Sales commission, account
          management, office lease, project management software, recruiting and
          onboarding, internal QA, and partner-channel margin all draw against
          the project budget before any code is written. Industry surveys at
          Clutch and similar B2B services directories show typical agency
          billing rates ranging from roughly $100 to $300 per hour, with the
          higher end concentrated in coastal and brand-led shops (Clutch,
          2024). The portion that actually pays the people building your site
          is often 50 to 70 percent of the invoice. Buyers paying $200 per hour
          to an agency are paying $100 to $140 of it to people building the
          thing and $60 to $100 of it to people coordinating it.
        </p>
        <p>
          At a <strong>studio</strong>, overhead is lean. Solo or small-studio
          principals carry the same coordination work the agency account
          manager would carry, but as a part of their own week, not as a
          separate cost center. Studio hourly rates of $125 to $225 are common,
          with the difference between a studio rate and an agency rate
          accounted for almost entirely by the absence of the agency
          coordination layer. The portion that funds the actual build is
          typically 85 to 95 percent.
        </p>
        <p>
          At a <strong>freelancer</strong>, the rate is lowest because
          coordination is not a cost line. The Stack Overflow Developer Survey
          2024 reported a U.S. median compensation of $130,000 for full-stack
          developers (Stack Overflow, 2024), which translates to roughly $62
          per hour at full utilization. Independent freelancer hourly rates
          quoted on hiring marketplaces (Upwork, 2024; GoodFirms, 2024) cluster
          across a wide range from $30 to $150 per hour, with the variance
          driven by experience, specialization, and geography. The portion that
          funds the build is essentially the entire rate, but you are also
          paying for one person&rsquo;s judgment, not a team&rsquo;s.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "$130K",
      label:
        "U.S. median annual compensation for full-stack developers in 2024, per the Stack Overflow Developer Survey of 49,390 professional respondents.",
      source: {
        name: "Stack Overflow Developer Survey, 2024",
        url: "https://survey.stackoverflow.co/2024/work",
      },
    },
  },
  {
    id: "what-you-give-up",
    heading: "What you give up at each tier",
    body: (
      <>
        <p>
          Every vendor model trades something off. The honest framing is what
          you lose, not what you gain.
        </p>
        <p>
          With an <strong>agency</strong>, you give up direct access to the
          person doing the work. The senior people pitched in the proposal are
          often pulled to bigger accounts; the junior team that delivers your
          project is rarely named in the contract. You also give up speed.
          Every change request routes through an account manager, gets logged,
          gets scoped, and comes back as a change order. Communication
          half-life is measured in business days, not hours. In my own field
          experience, agency-client churn tracks communication friction more
          than it tracks delivery quality. Clients leave agencies they cannot
          reach, even when the work itself is good.
        </p>
        <p>
          With a <strong>studio</strong>, you give up redundancy. If the
          principal is sick, on vacation, or in a deep block on another
          project, you wait. Studios scale work by sequencing, not by adding
          headcount, which means the calendar is the constraint. You also give
          up breadth. A studio that is excellent at custom-built service
          business sites may be the wrong shop for a 50,000-product e-commerce
          replatform. The principal&rsquo;s judgment is the asset; pushing it
          outside its zone of fit is how studio engagements fail.
        </p>
        <p>
          With a <strong>freelancer</strong>, you give up architectural review.
          One person making every call without a peer to push back is how scope
          drifts, performance regressions go unnoticed, and post-launch
          maintenance gaps appear. You also give up senior strategic framing.
          The best freelancers are excellent at a defined scope you bring them.
          They are not, in most cases, the right shop for a strategic rebuild
          that requires a thesis on what the site should be in the first place.
        </p>
      </>
    ),
  },
  {
    id: "side-by-side",
    heading: "A side-by-side comparison",
    body: (
      <>
        <p>
          Numbers are ranges, gathered from public industry surveys (Clutch,
          2024; GoodFirms, 2024; Upwork, 2024) and the Stack Overflow Developer
          Survey 2024. Geographic and specialization variance is meaningful;
          the table reports the central two-thirds of typical observed values.
        </p>
        <ComparisonTable
          accent="violet"
          columns={[
            { label: "Agency", sublabel: "10 to 200+ staff" },
            { label: "Studio", sublabel: "1 to 10 people, principal-led", highlight: true },
            { label: "Freelancer", sublabel: "Solo, no team" },
          ]}
          rows={[
            {
              label: "Typical hourly rate",
              values: ["$100 to $300", "$125 to $225", "$30 to $150"],
            },
            {
              label: "Typical full-build budget",
              values: [
                "$50K to $500K+",
                "$25K to $200K",
                "$3K to $40K",
              ],
            },
            {
              label: "Who you talk to day-to-day",
              values: [
                "Account manager",
                "Principal directly",
                "The freelancer",
              ],
            },
            {
              label: "Time-to-start",
              values: [
                "4 to 12 weeks (procurement)",
                "2 to 6 weeks",
                "Same week to 2 weeks",
              ],
            },
            {
              label: "Decision velocity",
              values: ["Days, via email chain", "Hours, often same call", "Hours"],
            },
            {
              label: "Senior judgment in delivery",
              values: [
                "Pitched, often not delivered",
                "Same person from pitch to launch",
                "One person, no peer review",
              ],
            },
            {
              label: "Post-launch maintenance",
              values: ["Retainer required", "Negotiable", "Often unavailable"],
            },
            {
              label: "Best fit for project size",
              values: [
                "Multi-property brand programs",
                "Single high-craft sites",
                "Bounded, well-defined scopes",
              ],
            },
          ]}
          caption="Ranges reflect U.S. market, 2024."
          source={{
            name: "Compiled from Clutch, GoodFirms, Upwork, Stack Overflow 2024",
            url: "https://survey.stackoverflow.co/2024/work",
          }}
        />
      </>
    ),
  },
  {
    id: "decision-criteria",
    heading: "Decision criteria: who should pick which",
    body: (
      <>
        <p>
          The right vendor depends on the project shape, the budget, and how
          the buyer wants to spend their attention. Three rules cover most
          cases.
        </p>
        <DecisionCriteria
          accent="violet"
          options={[
            {
              label: "Choose an agency if",
              bullets: [
                "Project budget is over $200,000 and growing",
                "Multiple stakeholders need to sign off",
                "You need a single contracted vendor for legal or procurement reasons",
                "The work spans multiple properties (sites, apps, brand systems)",
                "You want a quarterly retainer with named SLAs",
              ],
            },
            {
              label: "Choose a studio if",
              bullets: [
                "Project budget is between $25,000 and $200,000",
                "You want senior judgment from the person doing the work",
                "You value direct communication with the builder",
                "The site is the front door of the business and craft matters",
                "You want one person accountable across pitch, delivery, and launch",
              ],
              highlight: true,
            },
            {
              label: "Choose a freelancer if",
              bullets: [
                "Scope is well-defined and bounded",
                "Project budget is under $25,000",
                "You can manage the project yourself",
                "You have an existing site that needs incremental changes",
                "Speed-to-start matters more than strategic framing",
              ],
            },
          ]}
        />
        <p>
          The middle option is where most service businesses with a real
          dependence on their website actually fit. Service businesses below
          $1M in revenue rarely justify an agency budget. Service businesses
          above $5M in revenue with a working website rarely justify the
          freelancer model when the website goes wrong. The studio range
          covers most of the buyers in between.
        </p>
      </>
    ),
  },
  {
    id: "failure-modes",
    heading: "Common failure modes for each",
    body: (
      <>
        <p>
          Each vendor model has a characteristic way it goes wrong. Recognizing
          the failure mode in advance makes it easier to interview against.
        </p>
        <p>
          <strong>Agency bait-and-switch.</strong> The senior team named in the
          proposal is the team you meet at pitch. The team that delivers is
          junior. The fix is to demand named delivery staff in the contract,
          with weekly time-on-project reporting. Any agency unwilling to commit
          to named individuals is signaling that the named individuals will not
          be on your account.
        </p>
        <p>
          <strong>Agency scope-creep billing.</strong> Change requests routed
          through account management become change orders, and change orders
          become invoices. The fix is to define done in the contract before
          signing. Any agency that resists writing &ldquo;done&rdquo; into the
          scope is signaling that &ldquo;done&rdquo; is the revenue model.
        </p>
        <p>
          <strong>Studio principal bottleneck.</strong> The principal
          architect&rsquo;s calendar is the gating constraint. If a project
          needs three months of focused build, the principal is unavailable for
          a third project for that period. The fix is to confirm calendar
          before signing and to prefer studios who are honest about availability
          rather than studios who promise everyone everything.
        </p>
        <p>
          <strong>Freelancer scope discipline failure.</strong> The freelancer
          starts on a defined scope, hits an architectural decision the original
          scope did not contemplate, and either makes the call alone (often
          wrong) or stalls waiting for direction. The fix is to either keep the
          scope tightly bounded or accept that a freelance engagement may need
          a senior reviewer brought in for architectural calls, which often
          erodes the cost advantage that drove the freelance choice.
        </p>
      </>
    ),
  },
  {
    id: "honest-closer",
    heading: "What I would tell my own family",
    body: (
      <>
        <p>
          If your business runs on the website, hire a studio. If the website
          is a digital pamphlet that occasionally generates an inbound, a good
          freelancer is the right tool. If you are already at agency budget and
          have a real reason to be there (multiple properties, multiple
          stakeholders, procurement requirements), hire the agency, but
          contract for named senior people on your account day-to-day.
        </p>
        <p>
          The trap is paying agency rates for studio work, which is the most
          common mistake I see. Buyers in the $40,000 to $150,000 range often
          default to agency procurement because that is who they have heard of,
          and they end up paying 30 to 50 percent of their budget for
          coordination layers that do not improve the outcome. A studio at the
          same total price spends 30 to 50 percent more on the actual build,
          which shows up as a better site.
        </p>
        <p>
          The other trap is paying freelancer rates for studio work. Buyers
          with a defined budget often optimize for hourly rate alone, which
          rewards the cheapest available freelancer, which produces a site that
          launches but does not stand up under real traffic, real edge cases,
          and real maintenance. The lowest hourly rate is not the lowest total
          cost when the lifetime of the site is two years instead of seven.
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question: "How do I tell a real studio from a freelancer who calls themselves a studio?",
    answer:
      "Look at the work. A real studio shows a portfolio of projects with clear authorship and craft consistency. A freelancer using studio language usually has a thinner portfolio with stylistic variance reflecting the platform constraints of each project. Either can be the right hire; the labels matter less than the actual work.",
  },
  {
    question: "What is a realistic budget for a service-business website?",
    answer:
      "For a service business with under $5M in revenue and a single primary website, $25,000 to $80,000 is the realistic studio-tier range. Below that, you are in freelancer territory, which is fine for bounded scopes. Above that, you are funding scope expansion or agency overhead, both of which can be justified but should be explicit.",
  },
  {
    question: "Do studios charge more per hour than freelancers?",
    answer:
      "Yes, on average. Studio principals carry coordination work the freelancer does not, plus they bring senior architectural judgment to every call. The hourly rate is higher; the total project cost is often comparable because the studio finishes faster and the result holds up longer.",
  },
  {
    question: "Why would I pick a studio over an agency if money is no object?",
    answer:
      "Direct access to the builder. At an agency, you talk to the account manager. At a studio, you talk to the principal who is making the calls. For a high-craft project where the buyer wants the site to reflect their actual judgment back to them, that direct line is the entire point.",
  },
  {
    question: "Is offshore agency cheaper enough to be worth it?",
    answer:
      "Sometimes. Offshore agency can deliver competent work for half the price, but you pay it back in coordination cost: timezone latency, communication friction, intellectual-property risk, post-launch availability. For a bounded scope with clear specs and a long timeline, offshore can work. For a high-craft project that needs senior judgment in real time, the math rarely closes.",
  },
  {
    question: "How do I avoid the bait-and-switch problem at agencies?",
    answer:
      "Demand named delivery staff in the contract. Ask for weekly time-on-project reporting per named person. Ask the agency to commit, in writing, that the named senior staff will be on your account for at least the percentage of hours they implied at pitch. Agencies unwilling to do this are agencies you should not sign.",
  },
  {
    question: "Can a freelancer build me a Next.js site with a CMS?",
    answer:
      "Yes, technically. A senior freelancer can build a competent Next.js site with a headless CMS in two to four weeks for a service business. The risk is not capability; the risk is post-launch. Six months later, when the site needs maintenance, the freelancer may not be available. Studio engagements typically include or offer a maintenance arrangement that survives the launch.",
  },
];

const cta: ReferenceCTA = {
  eyebrow: "Want to talk about a project?",
  headline: "I build for service businesses, $25K and up.",
  body: "If the studio model fits and you want to see how I would scope your specific project, the contact form is the right place to start. No quote engine, no lead-form questionnaire. Just a real conversation.",
  primary: { label: "Get in touch", href: "/contact" },
  secondary: { label: "See what I have built", href: "/work" },
};

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Stack Overflow",
    year: 2024,
    title: "2024 Developer Survey: Work and Compensation",
    url: "https://survey.stackoverflow.co/2024/work",
  },
  {
    id: 2,
    org: "Stack Overflow",
    year: 2024,
    title: "2024 Developer Survey: Methodology",
    url: "https://survey.stackoverflow.co/2024/methodology",
  },
  {
    id: 3,
    org: "U.S. Bureau of Labor Statistics",
    year: 2024,
    title:
      "Occupational Outlook Handbook: Web Developers and Digital Designers (SOC 15-1254)",
    publication: "U.S. Department of Labor",
    url: "https://www.bls.gov/ooh/computer-and-information-technology/web-developers.htm",
  },
  {
    id: 4,
    org: "Clutch",
    year: 2024,
    title: "Web Developers: Reviews, Rankings, and Pricing Data",
    url: "https://clutch.co/web-developers",
  },
  {
    id: 5,
    org: "GoodFirms",
    year: 2024,
    title: "Web Development Companies and Pricing Research",
    url: "https://www.goodfirms.co/directory/services/web-development",
  },
  {
    id: 6,
    org: "Upwork",
    year: 2024,
    title: "Hiring Web Developers: Cost and Rate Guide",
    url: "https://www.upwork.com/hire/web-developers/",
  },
];

export function AgencyStudioFreelancerContent() {
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
      backLink={{ label: "All resources", href: "/resources" }}
    />
  );
}
