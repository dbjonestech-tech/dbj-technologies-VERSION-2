"use client";

import Link from "next/link";
import { ServiceDeepDiveLayout } from "@/components/templates/ServiceDeepDiveLayout";
import type {
  ServiceCTA,
  ServiceHero,
  ServiceProcess,
  ServiceScope,
  ServiceSection,
} from "@/components/templates/ServiceDeepDiveLayout";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/services/website-performance-audit";

const hero: ServiceHero = {
  eyebrow: "Service · Website Performance Audit",
  title: "A real performance audit measures the things most tools miss,",
  highlight: "and ranks the fixes by revenue.",
  lede:
    "Most performance audits in the wild are a screenshot of a Lighthouse score and a list of generic suggestions. That is not an audit. A real audit segments lab measurements from field measurements, separates symptoms from causes, ranks fixes by revenue impact, and ends with a written plan. This page covers what that work actually contains, what most tools miss, and how my audit work maps to the productized engagement tiers I publish elsewhere on this site.",
};

const sections: ServiceSection[] = [
  {
    id: "what-an-audit-is",
    number: "01",
    label: "Definition",
    heading: "What a real performance audit actually contains",
    body: (
      <>
        <p>
          A performance audit is a written diagnosis of why a site is
          slower or less reliable than it should be, ranked by the
          severity of the impact and the cost to fix. The output is not
          a score; the output is a prioritized list of changes with
          confidence levels, expected metric movement, and an estimate
          of the revenue impact of leaving each one alone.
        </p>
        <p>
          The work has five orthogonal layers. <strong>Network</strong>
          {" "}covers TLS, HTTP version, server response time, CDN
          configuration, and time-to-first-byte under real conditions.
          {" "}<strong>Render</strong> covers the critical rendering
          path, render-blocking resources, font loading strategy, and
          how quickly the largest visible element actually paints.
          {" "}<strong>Interactivity</strong> covers JavaScript
          execution, main-thread blocking, third-party scripts, and the
          pattern of visual feedback when the user clicks or types.
          {" "}<strong>Stability</strong> covers cumulative layout
          shift, unexpected content reflow, and the late-loading
          surprise patterns that make a page feel cheap. <strong>
          Backlogs</strong> covers everything that is technically not
          one of the above but quietly costs you, including image
          formats, accessibility blockers that double as performance
          problems, and the long tail of scripts your team forgot they
          installed.
        </p>
        <p>
          The deeper measurement covers all five layers in both lab
          conditions (controlled environment, repeatable, easy to debug)
          and field conditions (real users on real devices, sampled
          across the 75th percentile, the threshold Google itself uses
          to grade Core Web Vitals) (Google web.dev, 2024). Auditing
          only one half of that pairing is how plausible-looking
          Lighthouse reports cover for sites that are actually broken
          for most visitors.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "75%",
      label:
        "of real user sessions must hit the good Core Web Vitals threshold for a page to count as passing, measured at the 75th percentile across mobile and desktop devices.",
      source: { name: "Google web.dev (2024)", url: "https://web.dev/articles/vitals" },
    },
  },
  {
    id: "what-tools-miss",
    number: "02",
    label: "Tool gaps",
    heading: "What free tools quietly miss",
    body: (
      <>
        <p>
          PageSpeed Insights, Lighthouse, and the Chrome DevTools
          performance panel are real tools. I use all three in every
          audit. They each have known gaps, and in 2026 the gaps matter
          more than they used to.
        </p>
        <p>
          <strong>Lab vs field divergence.</strong> A Lighthouse score
          run on a fast desktop with simulated throttling is not what
          your visitors experience. Real users run on a mid-tier
          Android with a flaky LTE connection at the corner of an
          intersection. The 75th percentile field measurement, drawn
          from the Chrome User Experience Report, frequently disagrees
          with the lab score by twenty to forty points (HTTP Archive
          Web Almanac, 2024). When the two diverge, the field number
          is what Google ranks against. The lab number is the
          decoration.
        </p>
        <p>
          <strong>INP under stress.</strong> Lighthouse simulates
          interaction in lab conditions only at a single moment. INP,
          the metric that replaced FID in March 2024, captures the
          worst observed interaction across the entire session
          (Sullivan and Viscomi, 2024). A Lighthouse INP score that
          looks fine can hide a single brutal interaction during a
          form submission or modal open that destroys the actual
          user experience.
        </p>
        <p>
          <strong>Third-party flakiness.</strong> Chat widgets, A/B
          test scripts, analytics SDKs, ad tags, and consent managers
          are often loaded asynchronously, which means they do not
          appear in a single lab snapshot the same way every run.
          Their cost is measurable only across many real sessions.
          Most audits ignore this. A real audit catalogs every
          third-party script, measures its observed cost, and
          recommends a defer or remove decision per script.
        </p>
        <p>
          <strong>What the score does not score.</strong> Lighthouse
          accessibility, SEO, and best-practice categories are
          shallow. A site can score 100 on Lighthouse accessibility
          and fail WCAG 2.2 in real audit conditions, because the
          tool checks roughly thirty conditions and WCAG 2.2 has
          eighty-six (W3C, 2023). A site can score 100 on SEO and
          have no schema, no canonicalization, and no internal-link
          strategy. The score is a starting point, not a verdict.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "53%",
      label:
        "of mobile site visits abandoned when a page takes longer than three seconds to load.",
      source: {
        name: "Think with Google, 2017",
        url: "https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/page-load-time-statistics/",
      },
    },
  },
  {
    id: "what-it-buys-you",
    number: "03",
    label: "Revenue impact",
    heading: "What a real audit actually buys you in dollars",
    body: (
      <>
        <p>
          The revenue case for performance is not subtle. Akamai&apos;s
          retail performance research found that a one-hundred
          millisecond delay in load time reduced conversion rates by
          seven percent in their dataset of e-commerce sites (Akamai,
          2017). Deloitte&apos;s 2020 study of mobile site speed and
          retail outcomes, working with Google, found that a tenth-of-
          a-second improvement in mobile site speed delivered an
          eight to ten percent lift in conversion across categories,
          including service businesses (Deloitte and Google, 2020).
          Vodafone Italy&apos;s rebuild of one of their pages on
          modern stack improved largest contentful paint by thirty-one
          percent and lifted sales by eight percent in the measurement
          window (Google, 2022).
        </p>
        <p>
          For a service business, the math is similar but the
          mechanism is slightly different. Slow service sites lose
          high-intent visitors who arrived from a Google search and
          had a specific question. The visitor reads two seconds of
          loading, hits the back button, and the next-listed
          competitor gets the call. The rate at which this happens
          rises sharply between two and five seconds of perceived
          load time (Akamai, 2017; Deloitte and Google, 2020). For a
          shop generating fifty inbound leads a month, a ten percent
          conversion lift from performance work is five additional
          customers, every month, forever. At an average ticket of
          three to seven hundred dollars, that math justifies the
          audit and the fixes inside the first quarter.
        </p>
        <p>
          The reverse is also true: an audit that returns a clean
          bill of health is also valuable, because it forces the
          conversation to where the actual revenue leak lives. Most
          sites I scan have at least one performance issue costing
          measurable revenue. A small share have none, in which case
          the audit redirects attention to conversion design, copy,
          or trust signals, which are diagnosed by the same tooling.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "8 to 10%",
      label:
        "average mobile conversion lift per 0.1 second improvement in site speed across retail and service categories.",
      source: {
        name: "Deloitte and Google, Milliseconds Make Millions, 2020",
        url: "https://web.dev/case-studies/milliseconds-make-millions",
      },
    },
  },
  {
    id: "the-three-tier-path",
    number: "04",
    label: "How this maps to engagements",
    heading: "The three-tier path from audit to shipped fixes",
    body: (
      <>
        <p>
          I publish three productized engagement tiers that map
          cleanly to the audit-and-fix arc. The choice depends on what
          your scan turns up, your timeline, and how much you want to
          ship in one sweep.
        </p>
        <p>
          <strong>Tier one, free first read.</strong>{" "}
          <Link
            href="/pathlight"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Pathlight
          </Link>
          {" "}runs a scored scan against any URL in roughly ninety
          seconds. The output is a written report covering performance,
          conversion, trust, and revenue-impact estimates with a
          prioritized fix list. The scan is free, the report is yours,
          and there is no follow-up obligation. Most audits I run start
          here, because Pathlight is the diagnostic tool I built for
          exactly this purpose.
        </p>
        <p>
          <strong>Tier two, productized fix.</strong>{" "}
          <Link
            href="/pricing/fix-sprint"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Fix Sprint
          </Link>
          {" "}is the post-scan engagement when the report identifies a
          handful of clear, high-impact issues that can be shipped
          without a full rebuild. Two-week fixed-price engagement.
          Three top-priority issues from your scan, ranked by revenue
          impact, deployed to production. Includes a Lighthouse
          before-and-after and a fresh Pathlight re-scan so the
          movement is verifiable rather than asserted. The fee is
          credited toward a larger engagement if you decide to keep
          going.
        </p>
        <p>
          <strong>Tier three, full rebuild.</strong> When the audit
          surfaces structural problems (legacy stack, deep technical
          debt, no schema layer, brittle templating, poor mobile
          rendering across the board), the right answer is a rebuild
          rather than another round of patches. The full Next.js
          development engagement is covered on the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Next.js development page
          </Link>
          , with engagement scope, deliverables, and the honest case
          for when a rebuild is the right call versus when it is
          overkill.
        </p>
        <p>
          The honest framing is that not every site needs all three
          tiers, or even any of them. If your scan returns a clean
          report and you are happy with the conversion outcomes, the
          right next step is no engagement at all. I will tell you
          that on the discovery call, and I have told it to enough
          buyers in the past that it is part of how I sell the
          posture.
        </p>
      </>
    ),
  },
];

const process: ServiceProcess = {
  heading: "How I run an audit, end to end",
  lede:
    "Five phases, in order. The phases scale with the engagement tier: a Pathlight scan is automated and runs phases 1 to 3 in ninety seconds. A Fix Sprint runs all five with me in the loop. A full rebuild folds these phases into the Discovery and Architecture stages of the larger engagement.",
  steps: [
    {
      number: "01",
      title: "Triage",
      duration: "15 to 30 minutes",
      body:
        "I read the URL the way a buyer would. What loads on first paint, what loads after, what feels off in the first ten seconds, where my eye goes, what I cannot find. The triage notes go straight into the audit before any tool runs, because the human-perception read is the layer the tools cannot replicate.",
    },
    {
      number: "02",
      title: "Lab measurement",
      duration: "1 to 2 hours",
      body:
        "Lighthouse runs across the canonical pages on mobile and desktop. WebPageTest runs against multiple connection profiles and three geographic regions. Chrome DevTools performance panel for one detailed flame-graph capture per representative page. Output is a structured table of lab metrics with one column per page, one row per metric, color-coded by severity.",
    },
    {
      number: "03",
      title: "Field measurement",
      duration: "30 to 60 minutes",
      body:
        "Chrome User Experience Report 75th-percentile field metrics for every URL with sufficient traffic. Real-user monitoring from the site's own analytics if it is wired. The field numbers are what Google ranks against; the lab numbers are what I debug against. Both go into the report, side by side, because divergence between them is itself a finding.",
    },
    {
      number: "04",
      title: "Prioritization",
      duration: "1 to 2 hours",
      body:
        "Every finding gets three numbers: severity (1 to 5), implementation cost (S, M, L), and confidence in the revenue impact estimate (low, medium, high). The list sorts by severity divided by cost. Top of the list is what ships first. Bottom of the list goes into the backlog or gets cut entirely if the cost-to-impact ratio is wrong.",
    },
    {
      number: "05",
      title: "Written plan",
      duration: "1 to 2 hours",
      body:
        "The report is a single PDF or Notion page covering executive summary, lab table, field table, prioritized findings, recommended action plan, and a small appendix on what was checked and why specific tactics were skipped. The plan is the deliverable. The fixes happen in the engagement tier you choose.",
    },
  ],
};

const scope: ServiceScope = {
  timeline: { label: "Audit timeline", value: "90 seconds to 2 weeks" },
  pricing: {
    label: "Productized tier",
    value: "Pathlight free · Fix Sprint $2,995",
    note: "Audit work folds into Fix Sprint when fixes are shippable in two weeks; folds into Starter or larger when a rebuild is the right call",
  },
  deliverables: [
    "Pathlight scan covering performance, conversion, trust, and revenue impact",
    "Lighthouse and WebPageTest lab measurements for canonical pages",
    "Chrome User Experience Report 75th-percentile field measurements",
    "Prioritized fix list ranked by severity divided by implementation cost",
    "Lab versus field divergence analysis where it matters",
    "Third-party script catalog with defer or remove recommendations",
    "Lighthouse before-and-after if engagement proceeds to Fix Sprint",
    "Fresh Pathlight re-scan post-launch to verify the score movement",
    "Written plan as PDF or Notion page, yours to keep regardless",
    "Discovery-call alignment on which tier matches the findings",
  ],
};

const cta: ServiceCTA = {
  eyebrow: "Next step",
  heading:
    "The fastest first read is a free Pathlight scan against your live URL.",
  body:
    "The scan produces the same lab and field measurements I open every paid engagement with, in roughly ninety seconds. If the report surfaces fixable issues, Fix Sprint ships the top three in two weeks at a fixed price. If it surfaces structural problems, the conversation moves to a full rebuild. Either way, the diagnostic is yours and the next move is yours.",
  primary: { label: "Run a free Pathlight scan", href: "/pathlight" },
  secondary: { label: "Or jump to Fix Sprint", href: "/pricing/fix-sprint" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "Do I need a paid audit, or is the free Pathlight scan enough?",
    answer:
      "For most service businesses, the free Pathlight scan is enough to identify the top issues and decide what to ship. The paid audit work is useful when you want a written plan with prioritized findings, when stakeholders need a formal report to approve a rebuild, or when the scan surfaces an unusual pattern that needs human-led debugging. Start with the free scan and decide from there.",
  },
  {
    question: "What is the difference between an audit and a Fix Sprint?",
    answer:
      "An audit is the diagnosis. Fix Sprint is the productized treatment for buyers who already have an audit and want the top three fixes shipped in two weeks at a fixed price. Most buyers move directly from a Pathlight scan into Fix Sprint without a separate paid audit step. The full audit methodology is folded into Fix Sprint or into a larger rebuild engagement.",
  },
  {
    question: "Can you audit a WordPress, Squarespace, Wix, or Webflow site?",
    answer:
      "Yes for all four, with caveats. WordPress audits often surface plugin-driven issues that the platform makes hard to fix without rebuild-level work. Squarespace and Wix audits are constrained by the platforms' template engines, so the actionable list is smaller. Webflow audits are usually the most fixable, since the platform exposes more of the underlying performance levers. The Pathlight scan tells you which category your site is in.",
  },
  {
    question: "How do you handle third-party scripts?",
    answer:
      "Catalog every script, measure observed cost in real session data when available, classify each as essential, defer-eligible, or remove-candidate. The cost of a chat widget that fires on every pageview is rarely worth the conversion impact, and the data usually agrees. The catalog goes in the report; the action plan recommends what to keep and what to drop.",
  },
  {
    question: "Will the audit cover SEO, accessibility, and conversion design?",
    answer:
      "Yes for the parts that overlap with performance. Performance, accessibility, and SEO share root causes more often than they have separate ones, especially around render-blocking, image strategy, semantic HTML, and structured data. Conversion design is partially in scope; the deeper conversion-specific work (CTA copy, hero design, trust signals) is a separate discipline that I cover on the Pathlight report and in dedicated engagement tiers.",
  },
  {
    question: "How recent is the data the audit relies on?",
    answer:
      "Lab measurements are run live during the audit. Field measurements come from the most recent Chrome User Experience Report dataset Google publishes, which trails real-time by about a month. For sites with low traffic that do not appear in CrUX, I supplement with on-page real-user monitoring from the site's analytics or a one-week scheduled scan series.",
  },
  {
    question: "What if the audit recommends a rebuild and I cannot afford one?",
    answer:
      "I will tell you that on the discovery call. The honest framing is that some sites are so structurally constrained that incremental fixes have a low ceiling, and pushing past that ceiling costs more than a rebuild. If a rebuild is genuinely the right call but the budget is not there yet, the audit becomes a roadmap for the next budget cycle and Fix Sprint covers the immediate-impact items in the meantime.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Google web.dev",
    year: 2024,
    title: "Core Web Vitals: thresholds and 75th-percentile measurement",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 2,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: Performance chapter",
    url: "https://almanac.httparchive.org/en/2024/performance",
  },
  {
    id: 3,
    authors: "Sullivan, B., and Viscomi, R.",
    year: 2024,
    title: "INP becomes a stable Core Web Vital on March 12",
    url: "https://web.dev/blog/inp-cwv-march-12",
  },
  {
    id: 4,
    org: "Akamai",
    year: 2017,
    title:
      "Akamai Online Retail Performance Report: Milliseconds are critical",
    url: "https://www.akamai.com/newsroom/press-release/akamai-releases-spring-2017-state-of-online-retail-performance-report",
  },
  {
    id: 5,
    org: "Deloitte and Google",
    year: 2020,
    title: "Milliseconds Make Millions",
    url: "https://web.dev/case-studies/milliseconds-make-millions",
  },
  {
    id: 6,
    org: "Google",
    year: 2022,
    title: "Vodafone Italy: a 31% improvement in LCP increased sales by 8%",
    url: "https://web.dev/case-studies/vodafone",
  },
  {
    id: 7,
    org: "W3C",
    year: 2023,
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
  },
];

export function PerformanceAuditContent() {
  const config = getPageConfig(SLUG);
  if (!config) return null;
  return (
    <ServiceDeepDiveLayout
      config={config}
      hero={hero}
      sections={sections}
      process={process}
      scope={scope}
      faq={faq}
      cta={cta}
      sources={sources}
    />
  );
}
