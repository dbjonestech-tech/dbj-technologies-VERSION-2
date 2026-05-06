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

const SLUG = "/resources/redesign-vs-rebuild";

const hero: ReferenceHero = {
  eyebrow: "Decision",
  title:
    "Redesign or rebuild: which one your site actually needs in 2026.",
  subtitle:
    "These are not the same operation. A redesign changes how the site looks. A rebuild changes what the site is. Choosing the wrong one is one of the most expensive mistakes a service business can make, because the lipstick-on-a-failing-stack version costs almost as much as the rebuild and produces compounding tech debt instead of a foundation. This page is a working framework for deciding which one fits your situation, anchored on engineering economics rather than on a vendor pitch.",
};

const sections: ReferenceSection[] = [
  {
    id: "the-distinction",
    heading: "Redesign and rebuild are not the same operation",
    body: (
      <>
        <p>
          The vendor market deliberately blurs these terms because the
          margin on a templated &ldquo;redesign&rdquo; that quietly
          ships on top of an unfixed underlying stack is much higher
          than the margin on an honest rebuild. Buyers who think they
          are comparing apples to apples are usually comparing two
          different operations with different cost structures and
          different lifetimes.
        </p>
        <p>
          A <strong>redesign</strong> changes the visual layer. New
          typography, new layout, new photography, new copy, new
          color system. The underlying stack stays the same. The
          content management system stays the same. The hosting
          stays the same. The third-party integrations stay the
          same. Most redesigns are correctly scoped at four to eight
          weeks of work, anchored on visual design and content
          rewriting rather than on engineering.
        </p>
        <p>
          A <strong>rebuild</strong> changes the system. New stack,
          new content management approach, new hosting, often new
          integrations, and a meaningful chance of new information
          architecture. The visual design is rewritten because the
          underlying constraints have changed, but the visual layer
          is one of seven things that gets touched, not the only
          thing. Rebuilds are correctly scoped at eight to sixteen
          weeks, anchored on engineering rather than on visual
          design alone.
        </p>
        <p>
          The cleanest test for which one your site needs is to ask
          what would happen if you only did the visual layer. If a
          new visual would noticeably outperform the current site
          for the next three to five years, you need a redesign. If
          a new visual on the current stack would still feel slow,
          still fail mobile, still be brittle to update, and still
          require the same six platforms duct-taped together to ship
          a single page, you need a rebuild and a redesign is
          deferred maintenance dressed as a strategic project.
        </p>
      </>
    ),
    break: {
      kind: "quote",
      quote:
        "If a new visual on the current stack would still feel slow, still fail mobile, and still be brittle to update, you do not need a redesign. You need a rebuild.",
    },
  },
  {
    id: "when-redesign",
    heading: "When a redesign is the correct call",
    body: (
      <>
        <p>
          Redesigns are the right answer more often than the
          rebuild-first vendor market suggests, especially for
          businesses whose underlying technology is fundamentally
          sound and whose problem is genuinely visual or
          editorial.
        </p>
        <p>
          The clearest case for a redesign is brand drift. The site
          was built well three to five years ago, the company has
          since updated its positioning, its services, its target
          customer, or its visual identity, and the visual layer has
          drifted out of alignment with where the business is now.
          The underlying stack still ships fast pages, the content
          model is still flexible, the integrations still work. The
          problem is purely that the site looks like a different
          company. A redesign closes that gap.
        </p>
        <p>
          The second clearest case is content rot. The architecture
          is sound, but the actual content has accumulated five years
          of patch jobs, dead links, half-finished pages, and copy
          written by three generations of marketing leads. The fix is
          a content audit, an information architecture rework, and a
          systematic content rewrite. Visual changes are a downstream
          effect of the content work, not the goal.
        </p>
        <p>
          The third case is conversion drift. The visual is fine, the
          stack is fine, but the conversion path has decayed because
          the buyer journey has moved and the site has not. A
          redesign focused on funnel architecture, lead capture, and
          social proof can recover meaningful conversion without
          touching the engineering layer. For service businesses,
          this is usually where a redesign engagement actually pays
          for itself.
        </p>
      </>
    ),
  },
  {
    id: "when-rebuild",
    heading: "When a rebuild is the correct call",
    body: (
      <>
        <p>
          Rebuilds are the right answer when the underlying system is
          structurally limiting what the business can do, when the
          performance ceiling is materially below where it needs to
          be, or when the cost of patching the existing stack exceeds
          the cost of replacing it.
        </p>
        <p>
          The clearest case for a rebuild is performance debt. The
          site is on a stack that cannot reach Core Web Vitals
          thresholds without heroic per-page tuning. The HTTP Archive
          Web Almanac tracks Core Web Vitals pass rates by content
          management system and by framework, and the gap between
          the top-performing stacks and the long tail is meaningful
          (HTTP Archive, Web Almanac 2024). For a competitive
          local-search business, a stack that caps at a Lighthouse
          performance score in the 60s while competitors run in the
          90s is a cost that compounds every month the rebuild is
          deferred. Vodafone documented a 31 percent LCP improvement
          producing an 8 percent sales lift and a 15 percent lead
          rate increase on a rebuild from a templated stack to a
          modern framework (web.dev, Vodafone case study, 2021).
          That kind of impact is not available through a redesign.
        </p>
        <p>
          The second clearest case is the &ldquo;six platforms duct-
          taped together&rdquo; pattern. The site started simple and
          has accumulated a CMS, a separate landing-page builder, a
          form vendor, a popup tool, an analytics layer, a
          chat widget, and a hosting platform that need monthly
          coordination just to keep the site online. Every new
          feature requires a vendor change in two or three of those
          systems, and the marketing team can no longer ship a page
          without a developer. A rebuild on a unified stack
          collapses the vendor count and the per-change overhead
          back to a sustainable level.
        </p>
        <p>
          The third case is platform end-of-life. The site is on a
          CMS that is deprecated, no longer actively maintained, or
          has had a meaningful security breach in the past two
          years. A redesign on a deprecated platform is throwing
          good money at a stack that will need replacing within
          eighteen to thirty-six months anyway.
        </p>
        <p>
          The fourth case is the integration ceiling. The business
          has outgrown what the current stack can integrate with.
          ServiceTitan, Tekmetric, Dentrix, Salesforce, HubSpot,
          Stripe, Twilio, custom internal tools, none of these
          integrate cleanly with most templated SMB platforms, and
          the workarounds (Zapier chains, screen scraping, manual
          CSV exports) accumulate hidden cost faster than buyers
          usually notice.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "8%",
      label: "Sales lift Vodafone documented after rebuilding from a templated stack to a modern framework, plus a 15 percent lead-rate increase.",
      source: {
        name: "web.dev, Vodafone case study, 2021",
        url: "https://web.dev/case-studies/vodafone",
      },
    },
  },
  {
    id: "compounding-debt",
    heading: "The compounding-tech-debt warning sign",
    body: (
      <>
        <p>
          The most expensive scenario in this category is the
          business that ships a redesign every two to three years,
          each one sitting on top of the previous one without ever
          replacing the underlying stack, until the cost of one more
          redesign exceeds what a rebuild would have cost a decade
          ago.
        </p>
        <p>
          The pattern is consistent. A six-figure spend in 2018, on
          top of a stack from 2014, on top of a hosting decision
          from 2011. A six-figure spend in 2021, on top of the 2018
          redesign, on top of the 2014 stack, on top of the 2011
          hosting. By 2024 the marketing team is shipping changes
          through three layers of duct tape, no developer wants to
          touch the codebase, and the business is paying a
          maintenance retainer that costs more annually than a
          rebuild would have cost as a one-time expense. The
          redesigns are not the problem. The unwillingness to do
          the rebuild is.
        </p>
        <p>
          The clearest indicator that you are inside this pattern is
          the maintenance economics. If your current site requires
          more than a few hours a month of developer time just to
          stay healthy, or if every minor change feels
          disproportionately expensive, the underlying stack is the
          binding constraint. No redesign fixes binding constraints
          on the underlying stack. Only a rebuild does.
        </p>
      </>
    ),
  },
  {
    id: "comparison-table",
    heading: "Redesign vs rebuild, across the dimensions that matter",
    body: (
      <>
        <p>
          Side by side, across the seven dimensions that actually
          decide which operation fits a given business.
        </p>
        <ComparisonTable
          accent="cyan"
          columns={[
            { label: "Dimension", sublabel: "What the buyer is comparing" },
            { label: "Redesign" },
            { label: "Rebuild", highlight: true },
          ]}
          rows={[
            {
              label: "What changes",
              values: [
                "Visual layer, content, sometimes information architecture",
                "Stack, content management approach, hosting, often integrations, plus everything a redesign changes",
              ],
            },
            {
              label: "Typical timeline",
              values: ["4 to 8 weeks", "8 to 16 weeks"],
            },
            {
              label: "Typical cost range",
              values: ["$5K to $25K for service businesses", "$15K to $80K+ depending on scope and integrations"],
            },
            {
              label: "Performance ceiling",
              values: ["Whatever the existing stack can reach", "Top of the modern framework range"],
            },
            {
              label: "Maintenance economics after launch",
              values: ["Same as before, plus the new visual layer", "Lower per-change cost, fewer vendor moving parts"],
            },
            {
              label: "Lifetime",
              values: ["2 to 4 years before the next refresh", "5 to 8 years before structural rework"],
            },
            {
              label: "Right call when",
              values: [
                "Underlying stack is sound, problem is brand drift, content rot, or conversion drift",
                "Stack is the binding constraint, performance is capped, or integrations have outgrown the platform",
              ],
            },
          ]}
          caption="Redesign vs rebuild, the operating differences"
        />
        <p>
          The numbers are ranges, not promises. A complex rebuild
          with deep custom integrations and substantial content
          migration runs higher; a focused rebuild on a well-
          architected source can run lower. The longer reference on
          what each tier should actually cost is on the{" "}
          <Link
            href="/resources/what-a-website-should-cost"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            cost guide
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "decision-picker",
    heading: "Which one fits your situation",
    body: (
      <>
        <p>
          A working self-test, calibrated for service businesses in
          the $1M to $20M revenue range. Pick the option that best
          matches the dominant problem.
        </p>
        <DecisionCriteria
          accent="cyan"
          options={[
            {
              label: "Redesign",
              bullets: [
                "The site looks dated but loads fast and converts acceptably",
                "Brand has drifted, services have evolved, or the buyer profile has shifted",
                "The marketing team can ship most changes without a developer",
                "Core Web Vitals are passing or close to passing on the existing stack",
                "Maintenance is cheap and predictable",
                "Integrations are working and the platform is not deprecated",
              ],
            },
            {
              label: "Rebuild",
              highlight: true,
              bullets: [
                "Mobile performance is materially behind competitors and cannot be patched",
                "Every new feature requires a vendor change in two or more platforms",
                "The marketing team cannot ship a page without a developer",
                "The existing CMS is deprecated, end-of-life, or recently breached",
                "Maintenance retainer exceeds the annualized cost of a rebuild",
                "The business has outgrown what the platform can integrate with",
              ],
            },
            {
              label: "Honest middle path",
              bullets: [
                "Two or three rows from each side describe the situation",
                "Performance is the dominant pain but the rest of the stack is fine",
                "The CMS is acceptable but the front-end is the bottleneck",
                "A targeted Fix Sprint or partial rebuild can buy 18-36 months",
                "The full rebuild is deferred to a calendar window that fits the business",
                "Pathlight scan first to confirm where the actual leakage is",
              ],
            },
          ]}
        />
        <p>
          If the decision still feels close after this exercise, the
          honest move is a Pathlight scan against your live URL plus
          a 30-minute diagnostic call. Most close calls resolve with
          one or the other inside a week.
        </p>
      </>
    ),
  },
  {
    id: "honest-middle-ground",
    heading: "The honest middle ground that vendors rarely suggest",
    body: (
      <>
        <p>
          Most vendor conversations frame redesign and rebuild as the
          only two options. Three middle-path operations are real and
          often the right call for the business that is between
          versions.
        </p>
        <p>
          The first is the audit-and-fix sprint. The site has
          identifiable performance and conversion issues, the stack
          is reasonable, and the right operation is two to four
          weeks of targeted engineering on the specific bottlenecks
          rather than a full rebuild. I ship this as a productized
          tier called Fix Sprint at $2,995 with a two-week timeline,
          and the longer reference on what a real audit covers is on
          the{" "}
          <Link
            href="/services/website-performance-audit"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            performance audit page
          </Link>
          .
        </p>
        <p>
          The second is the partial rebuild. The marketing site is
          fine, but the application layer (booking, member portal,
          internal tools) is the bottleneck. A targeted rebuild of
          the application layer on a modern framework, while leaving
          the marketing pages on the existing CMS, can deliver most
          of the rebuild value at a fraction of the rebuild cost and
          a fraction of the risk.
        </p>
        <p>
          The third is the staged rebuild. The full rebuild is the
          right answer, but the calendar window for a sixteen-week
          engagement does not exist this year. Instead, the rebuild
          is sequenced as visual layer first (rebuilt as a static
          export from the new stack, served alongside the legacy
          CMS), then content migration, then dynamic features, then
          full cutover. This costs more in total than a single-shot
          rebuild but distributes the cost across multiple budgets
          and the team has more time to absorb the migration.
        </p>
      </>
    ),
  },
  {
    id: "common-mistakes",
    heading: "Common mistakes I see across both operations",
    body: (
      <>
        <p>
          Five mistakes I see in nearly every redesign-or-rebuild
          conversation, in roughly descending order of cost.
        </p>
        <p>
          First, doing a redesign when the underlying constraint is
          the stack. The visual is rewritten on top of the same
          binding limits, the launch ships, and within twelve months
          the new visual is performing the same as the old visual
          because the constraints did not change. The redesign was
          deferred maintenance.
        </p>
        <p>
          Second, doing a rebuild when the underlying constraint is
          the content. The stack is rewritten, the visual is
          rewritten, the launch ships, and within six months the new
          site is converting the same as the old site because the
          conversion problem was always copy and information
          architecture. A redesign anchored on content rewriting
          would have produced more outcome at lower cost.
        </p>
        <p>
          Third, killing organic search position through a careless
          rebuild. URL structure changes without redirects, page
          titles drift, content gets shortened, and the new site
          launches with a 25 to 60 percent organic traffic loss that
          takes six to eighteen months to recover. The rebuild
          methodology that protects organic signal is real
          engineering work, not a bullet point in a vendor proposal.
          The companion service page on{" "}
          <Link
            href="/services/website-rebuild"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            website rebuild methodology
          </Link>{" "}
          covers what signal-preservation actually means.
        </p>
        <p>
          Fourth, scoping based on visual only. The visual scope is
          the easiest to estimate, so vendor proposals anchor on it,
          and the integration work, the content migration work, and
          the testing work all get under-scoped. Halfway through the
          project the calendar slips, the budget grows, or the launch
          quality drops. Scope the rebuild on the integration and
          migration work, not on the page count.
        </p>
        <p>
          Fifth, not measuring the baseline before starting. Without
          a documented baseline of current performance, current
          conversion, current organic position, and current
          maintenance cost, neither the team nor the buyer can tell
          whether the new site actually outperformed the old one.
          Run a Pathlight scan against the existing live URL before
          any work starts; the report becomes the comparison
          baseline for everything that ships afterward.
        </p>
      </>
    ),
  },
];

const cta: ReferenceCTA = {
  eyebrow: "Next step",
  headline:
    "If the decision still feels close, the honest move is a fast diagnostic.",
  body:
    "Run a free Pathlight scan against your live URL. The scan takes about ninety seconds and produces a scored report with revenue-impact estimates, performance analysis, and a prioritized fix list. Most close redesign-or-rebuild calls resolve cleanly once the actual leakage shows up in writing. If you want a 30-minute conversation about which operation actually fits, the contact form is the right place after the scan.",
  primary: { label: "Run a free Pathlight scan", href: "/pathlight" },
  secondary: { label: "Read the rebuild methodology", href: "/services/website-rebuild" },
};

const faq = [
  {
    question: "Is a redesign always cheaper than a rebuild?",
    answer:
      "Usually, but not always. A complex enterprise redesign on a heavily customized stack can run higher than a focused rebuild on a clean source. The cost framing only works when both operations are scoped honestly. A vendor quoting a $25K 'redesign' that secretly involves rebuilding the stack underneath is doing rebuild work at redesign pricing, and the project will overrun.",
  },
  {
    question: "Can I keep my CMS and just rebuild the front-end?",
    answer:
      "Yes, and this is one of the cleanest middle-path operations. A headless CMS pattern, where the existing CMS becomes the content source and a modern front-end framework renders the pages, captures most of the rebuild performance and developer-experience benefits while preserving the editorial workflow your team is already trained on. Whether this is the right move depends on the specific CMS and the integration surface.",
  },
  {
    question: "How do I protect my Google rankings through a rebuild?",
    answer:
      "Document every URL, every page title, every meta description, and every canonical tag on the existing site before any rebuild work starts. Map every old URL to a new URL with a 301 redirect, even if the content is identical. Preserve the heading hierarchy and the body content where possible. Submit the new sitemap to Google Search Console at launch. Done correctly, a rebuild loses less than 5 percent of organic position; done carelessly, the loss can be 50 percent or more and recovery takes a year. The companion service page covers the methodology in detail.",
  },
  {
    question: "What if I am locked into a long-term hosting or CMS contract?",
    answer:
      "The contract is a constraint, not a fatal one. Most CMS and hosting contracts allow you to begin a rebuild and run a parallel deployment without breaking the contract; you cut over at contract expiration. If the contract is on a percentage-of-revenue basis, the math is more sensitive and the cutover timing matters more. The discovery call covers contractual constraints as part of scoping.",
  },
  {
    question: "Should I redesign first and then rebuild later?",
    answer:
      "Almost never. Doing a redesign on a stack that needs replacing within two years means paying for the visual work twice, because the rebuild will redo the visual work anyway. The exception is the staged-rebuild path, where the visual layer is built on the new stack from day one and shipped alongside the legacy CMS until the migration completes. That is a rebuild sequenced differently, not a redesign followed by a rebuild.",
  },
  {
    question: "What does a Pathlight scan tell me before I commit?",
    answer:
      "Pathlight runs a live scan against your URL and produces a scored report covering performance, mobile experience, conversion architecture, and search visibility, with revenue-impact estimates calibrated to your industry. For the redesign-or-rebuild decision specifically, the scan typically clarifies whether the site is leaking on visual factors (redesign) or on technical factors (rebuild) within ninety seconds. It does not replace a real engagement, but it sharpens the question.",
  },
  {
    question: "How does the engagement work if I decide on a rebuild?",
    answer:
      "I work as a solo principal architect. The same person scopes the rebuild, executes the migration, ships the new site, and runs the post-launch optimization window. The full rebuild methodology, including signal preservation, parallel deployment, and the 90-day post-launch window, is on the website rebuild service page.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: performance, CMS, and Jamstack chapters",
    url: "https://almanac.httparchive.org/en/2024/",
  },
  {
    id: 2,
    org: "Google web.dev",
    year: 2021,
    title: "Vodafone Italy case study: 31 percent LCP improvement, 8 percent sales lift, 15 percent lead-rate increase",
    url: "https://web.dev/case-studies/vodafone",
  },
  {
    id: 3,
    org: "Google web.dev",
    year: 2024,
    title: "Core Web Vitals: thresholds, 75th-percentile measurement, and ranking signal",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 4,
    org: "Akamai",
    year: 2017,
    title: "Online retail performance report: page-load delay impact on conversion and bounce",
    url: "https://www.akamai.com/newsroom/press-release/akamai-releases-spring-2017-state-of-online-retail-performance-report",
  },
  {
    id: 5,
    org: "Google Search Central",
    year: 2021,
    title: "Page experience update: Core Web Vitals as a ranking signal",
    url: "https://developers.google.com/search/blog/2021/04/more-details-page-experience",
  },
  {
    id: 6,
    org: "Stack Overflow",
    year: 2024,
    title: "Developer Survey 2024: framework adoption and developer experience",
    url: "https://survey.stackoverflow.co/2024/",
  },
  {
    id: 7,
    org: "BuiltWith",
    year: 2024,
    title: "CMS technology trends and market share by category",
    url: "https://trends.builtwith.com/cms",
  },
];

export function RedesignVsRebuildContent() {
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
