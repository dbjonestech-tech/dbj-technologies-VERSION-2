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

const SLUG = "/services/website-rebuild";

const hero: ServiceHero = {
  eyebrow: "Service · Website rebuild",
  title: "Website rebuild,",
  highlight: "without giving up the rankings you already earned.",
  lede:
    "A real rebuild is not a redesign with the wires hidden. It is a stack swap, a content migration, an integration rework, and a deliberate signal-preservation operation that protects the organic search position, the conversion architecture, and the customer behavior the existing site has accumulated. Done correctly, the new site launches faster, ranks at least as well, and converts measurably better. Done carelessly, the new site loses 25 to 60 percent of organic traffic on day one and takes a year to recover. This page covers the methodology that actually protects what is already working, what the engagement looks like, and how it sequences against the buyer journey.",
};

const sections: ServiceSection[] = [
  {
    id: "what-rebuild-actually-is",
    number: "01",
    label: "Definition",
    heading: "What a real website rebuild actually involves",
    body: (
      <>
        <p>
          A website rebuild is the operation that replaces the
          underlying system. New stack, new content management
          approach, new hosting, often new integrations, often new
          information architecture, plus a redesigned visual layer
          built on top. The visual layer is one of seven things that
          gets touched, not the only thing.
        </p>
        <p>
          The seven things a rebuild changes, in roughly the order
          they affect the engagement scope: the rendering stack
          (templated SaaS to a modern framework, or one framework to
          another), the content management approach (page-builder to
          headless CMS, or proprietary CMS to a more flexible one),
          the hosting and edge layer, the third-party integrations
          (payment, scheduling, CRM, marketing automation), the
          information architecture (URL structure, navigation, page
          hierarchy), the content itself (rewrites, consolidation,
          and deletion), and the visual layer.
        </p>
        <p>
          The longer reference on which operation fits which problem,
          and when a rebuild is the right call versus when a
          redesign is, lives at{" "}
          <Link
            href="/resources/redesign-vs-rebuild"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Redesign vs Rebuild
          </Link>
          . That page is the right starting point if you are not yet
          sure which operation your site needs. This page is for the
          buyer who has already concluded that a rebuild is the right
          call and wants to understand how the engagement actually
          runs.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "signal-preservation",
    number: "02",
    label: "Signal preservation",
    heading: "How I protect organic position through the rebuild",
    body: (
      <>
        <p>
          Signal preservation is the part of the rebuild methodology
          that vendor proposals consistently under-scope and that
          carelessly executed rebuilds consistently fail. The
          difference between a rebuild that loses 5 percent of
          organic traffic and a rebuild that loses 50 percent is not
          the framework choice, the visual quality, or the timeline.
          It is whether the rebuild was treated as a deliberate
          signal-preservation operation or as a throw-away-and-restart
          project.
        </p>
        <p>
          The methodology has six concrete pieces, all of which run
          before any new code ships to production.
        </p>
        <p>
          First, document every URL on the existing site, with its
          current page title, meta description, canonical tag,
          heading hierarchy, and the body word count. This is the
          baseline. For service business sites under five hundred
          pages, this takes one to two days. For larger sites, the
          tooling matters more but the operation is the same.
        </p>
        <p>
          Second, identify the URLs that actually carry organic
          traffic and conversion signal. Google Search Console plus
          analytics tells you which pages are doing the work. The
          high-traffic pages, the high-converting pages, and the
          high-authority pages (most external backlinks pointing in)
          are the protected set. Most of the engagement&apos;s
          signal-preservation effort focuses on these specific URLs.
        </p>
        <p>
          Third, map every old URL to a new URL. Most rebuilds are
          opportunities to clean up legacy URL structure, but every
          old URL needs a 301 redirect to a new URL of the same or
          better content. Lost or broken redirects are the single
          largest cause of post-rebuild traffic collapse.
        </p>
        <p>
          Fourth, preserve the heading hierarchy and the body
          content of the protected pages where possible. The visual
          presentation can change; the underlying content should
          rarely shrink without a deliberate reason. The new site
          can be more concise overall, but the high-traffic pages
          carrying the organic position deserve careful editing
          rather than wholesale rewriting.
        </p>
        <p>
          Fifth, run a parallel deployment for at least seventy-two
          hours before cutover. The new site lives on a staging URL
          while the old site continues to serve production traffic.
          The team validates rendering, redirects, integrations,
          and analytics on the staging URL against real workloads.
          Cutover happens during a low-traffic window with the old
          site held warm in case rollback is needed.
        </p>
        <p>
          Sixth, submit the new sitemap to Google Search Console at
          launch, monitor coverage and rendering for the first thirty
          days, and run a Pathlight scan against the new live URL
          weekly for the first ninety days. The first thirty days
          are when most signal loss surfaces; catching it early and
          patching while Google is still re-crawling is the
          difference between a 5 percent dip and a 50 percent
          collapse.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "5%",
      label: "Maximum acceptable organic position loss after a careful rebuild, versus the 25-to-60-percent loss commonly observed in rebuilds without explicit signal preservation.",
      source: {
        name: "Field-observed range across published rebuild post-mortems",
      },
    },
  },
  {
    id: "the-stack",
    number: "03",
    label: "The new stack",
    heading: "What I rebuild on, and why",
    body: (
      <>
        <p>
          The default stack for a service-business rebuild is Next.js
          on the App Router, deployed on Vercel, with a headless CMS
          when editorial workflow matters and Markdown-based content
          when it does not. The longer reference on what the stack
          buys you is the{" "}
          <Link
            href="/services/nextjs-development"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Next.js development page
          </Link>
          , which covers the architectural decisions in detail.
        </p>
        <p>
          For rebuilds specifically, three stack decisions deserve
          explicit attention. First, whether the new stack is
          headless or fully custom. Most service businesses are
          better served by a headless pattern (the existing CMS
          stays as the content source, the new front-end renders
          from it) because the editorial team is already trained on
          the existing CMS and the migration cost is far lower than
          a full content-management replacement. The exception is
          when the existing CMS is itself the binding constraint, in
          which case the rebuild includes a CMS migration to
          something the team can actually use.
        </p>
        <p>
          Second, whether the rebuild includes a custom internal
          tools layer. For service businesses with internal admin
          needs (inventory, scheduling, customer management), the
          rebuild is often the right window to add a small custom
          admin tier rather than continuing to subscribe to a
          third-party SaaS that does not quite fit. Whether that
          fits the engagement scope is a discovery-call decision.
        </p>
        <p>
          Third, the integration surface. Rebuilds are often
          motivated by integration ceiling pain (the existing stack
          could not integrate with the systems the business now
          relies on). The new stack should explicitly support the
          integrations the business has outgrown, with the
          integration work treated as first-class scope rather than
          as a bolted-on afterthought. Discovery covers the specific
          integrations and what their implementation looks like.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "engagement-arc",
    number: "04",
    label: "Engagement arc",
    heading: "How the rebuild engagement actually runs",
    body: (
      <>
        <p>
          A typical service-business rebuild runs ten to fourteen
          weeks from kickoff to launch, plus a thirty-day post-launch
          optimization window. The work splits into four phases.
        </p>
        <p>
          Discovery and baseline (one to two weeks). The protected
          URL set is identified, the existing performance and
          conversion baselines are documented, the integration
          surface is scoped, the content audit runs, and the
          information architecture proposal is approved. The
          deliverable is a baseline document the entire rest of the
          engagement runs against.
        </p>
        <p>
          Architecture and design (two to three weeks). The new
          stack is chosen and stood up, the headless or fully custom
          decision is made, the redirect map is drafted from the
          existing URL inventory, the visual system is designed
          against the actual content rather than against placeholder
          copy, and the first interior template is built end-to-end
          as a prototype.
        </p>
        <p>
          Build (four to seven weeks). Pages are built against real
          content, integrations are wired and tested, the redirect
          map is implemented and tested for every old URL, the
          performance budget is enforced page by page, and the
          accessibility audit runs continuously rather than as a
          launch-week check.
        </p>
        <p>
          Launch (one to two weeks). The parallel deployment runs
          for seventy-two hours minimum on a staging URL with real
          analytics and search console monitoring. Cutover happens
          during a low-traffic window. The first seventy-two hours
          post-cutover are watched closely for redirect failures,
          rendering issues, or analytics gaps. Most issues that
          surface in the first three days are fixable before they
          affect organic position.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "what-success-looks-like",
    number: "05",
    label: "Success criteria",
    heading: "What success looks like at thirty and ninety days",
    body: (
      <>
        <p>
          A successful rebuild is measurable at three checkpoints.
        </p>
        <p>
          At launch plus thirty days. Organic position has lost less
          than five percent on the protected URL set. Core Web Vitals
          are passing on at least seventy-five percent of pages.
          Conversion rate is at parity with the pre-rebuild baseline
          or higher. No redirect failures in Google Search Console.
          Analytics is reporting cleanly with the new event model
          mapped to the previous one.
        </p>
        <p>
          At launch plus ninety days. Organic position has recovered
          to pre-rebuild levels and started to grow on the
          protected URLs. Conversion rate has lifted ten to thirty
          percent on the high-traffic pages because the new site is
          measurably faster and the conversion architecture has been
          tightened. The team is shipping content updates without
          a developer, the integration surface is healthy, and the
          maintenance retainer is at or below pre-rebuild levels.
        </p>
        <p>
          At launch plus one year. The site is measurably ahead of
          where the pre-rebuild trajectory would have placed it on
          every business metric that matters: organic traffic,
          conversion rate, lead quality, maintenance cost, and
          per-change velocity. The compounding benefit of a clean
          rebuild is most visible at twelve months and beyond, which
          is why the lifetime of a careful rebuild is five to eight
          years before structural rework rather than two to four
          years for a redesign.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
];

const process: ServiceProcess = {
  heading: "The five-step rebuild process",
  lede:
    "Each step has a deliverable, an approval gate, and a baseline measurement. The methodology is documented because signal preservation depends on it being executed the same way every time.",
  steps: [
    {
      number: "01",
      title: "Discovery and baseline",
      duration: "1 to 2 weeks",
      body:
        "URL inventory, protected-set identification, performance baseline, conversion baseline, integration scoping, content audit, IA proposal. Pathlight scan against the live URL becomes the baseline document.",
    },
    {
      number: "02",
      title: "Architecture and prototype",
      duration: "2 to 3 weeks",
      body:
        "Stack decisions, headless or fully custom CMS choice, redirect map drafted from URL inventory, visual system designed against real content, one full interior template built end-to-end as a working prototype.",
    },
    {
      number: "03",
      title: "Build",
      duration: "4 to 7 weeks",
      body:
        "Pages built against real content, integrations wired and tested, redirect map implemented and tested for every old URL, performance budget enforced page by page, accessibility audit runs continuously.",
    },
    {
      number: "04",
      title: "Parallel deployment and launch",
      duration: "1 to 2 weeks",
      body:
        "Staging URL with real analytics and search console monitoring runs for 72 hours minimum. Cutover during a low-traffic window. Old site held warm for rollback if needed. Sitemap submitted to Google Search Console at launch.",
    },
    {
      number: "05",
      title: "Post-launch optimization",
      duration: "30 days included, 90 days monitored",
      body:
        "Daily redirect monitoring for 7 days, then weekly. Pathlight scans weekly for 90 days. Conversion and organic position tracked against baseline. Issues surfaced in the first 30 days are patched while Google is still re-crawling, which is the window where signal protection is most effective.",
    },
  ],
};

const scope: ServiceScope = {
  timeline: { label: "Typical timeline", value: "10 to 14 weeks" },
  pricing: {
    label: "Investment",
    value: "Starting at $15,000",
    note: "Final scope is a per-engagement quote based on URL count, integration surface, and content migration depth; full tier breakdown on /pricing",
  },
  deliverables: [
    "Custom Next.js 16 application on the App Router",
    "Documented redirect map covering every legacy URL",
    "Headless CMS or content migration depending on scope",
    "Performance budget enforced at the page level",
    "Accessibility audit to WCAG 2.2 AA",
    "Parallel deployment with staging URL for 72-hour pre-cutover validation",
    "Pathlight baseline scan plus 90-day weekly monitoring",
    "30-day post-launch optimization window",
    "Full code ownership at delivery, no platform lock-in",
  ],
};

const cta: ServiceCTA = {
  eyebrow: "Next step",
  heading: "If a rebuild is the right call, the next move is a 30-minute diagnostic.",
  body:
    "I do not run pressure sales. The first call is diagnostic. The goal is to confirm whether a rebuild is even the right call for your site, what the protected URL set looks like, what the integration surface is, and what the calendar window for a ten-to-fourteen-week engagement looks like on both sides. Run a free Pathlight scan against your live URL before the call so the conversation starts from the actual baseline rather than from theory.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "Run a free Pathlight scan", href: "/pathlight" },
};

const faq = [
  {
    question:
      "How is this different from the rebuild service that any agency offers?",
    answer:
      "Most agency rebuilds are scoped on visual and content work and treat signal preservation as an afterthought. The methodology I run treats signal preservation as the dominant constraint of the engagement. URL inventory, redirect mapping, parallel deployment, and 90-day post-launch monitoring are first-class scope, not add-ons. For service businesses with meaningful organic search position, the difference between a 5 percent and a 50 percent post-rebuild traffic loss is the difference between a profitable rebuild and a disastrous one.",
  },
  {
    question:
      "What if my existing site has very little organic traffic to protect?",
    answer:
      "Then signal preservation is less of a binding constraint and the rebuild can prioritize the new site over the old one more aggressively. The methodology still includes a redirect map for every old URL, because broken inbound links from elsewhere on the web hurt regardless of organic traffic levels. But the discovery phase is shorter and the engagement total is usually lower.",
  },
  {
    question:
      "Can you keep my existing CMS and just rebuild the front-end?",
    answer:
      "Yes, and this is one of the cleanest rebuild patterns. The existing CMS stays as the content source, the new front-end renders from it through the CMS API, and the editorial team continues to work in the system they already know. This captures most of the rebuild performance and developer-experience benefit at a fraction of the migration cost. The discovery call covers whether your specific CMS supports this pattern cleanly.",
  },
  {
    question:
      "How long does it take to recover organic position if the rebuild causes a drop?",
    answer:
      "If the drop is caught and patched within the first thirty days while Google is still actively re-crawling, recovery is typically four to twelve weeks. If the drop persists beyond ninety days, recovery can take six to eighteen months and may not return to the previous baseline. The methodology I run is designed to make this irrelevant by preventing the drop in the first place rather than recovering from it.",
  },
  {
    question:
      "Do you handle the content migration, or do I need a separate content team?",
    answer:
      "I handle the content audit and the technical migration. The actual content rewriting (where rewrites are needed) is usually a shared engagement: I supply the content gap analysis, the editorial team or a contracted writer handles the rewrites, and the technical migration runs against the rewritten content. For service businesses with lean marketing teams, I can recommend writers I have worked with previously.",
  },
  {
    question:
      "What does the engagement cost?",
    answer:
      "Custom rebuild engagements start at fifteen thousand dollars and scale up based on URL count, integration surface, and content migration depth. The longer reference on what each tier should actually cost is on the cost guide. Rebuild scope is more variable than redesign scope because the integration surface and the content migration both add real engineering hours that depend on the specific systems involved.",
  },
  {
    question:
      "What happens if I want to delay the rebuild but still need to fix urgent performance issues?",
    answer:
      "The Fix Sprint at $2,995 with a two-week timeline is the productized middle path. Fix Sprint addresses the highest-impact performance and conversion issues on the existing stack without a full rebuild. The longer reference is on the performance audit page. For most service businesses, Fix Sprint can buy 18 to 36 months of headroom before the full rebuild becomes the right call.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Google web.dev",
    year: 2021,
    title: "Vodafone Italy case study: 31 percent LCP improvement, 8 percent sales lift, 15 percent lead-rate increase",
    url: "https://web.dev/case-studies/vodafone",
  },
  {
    id: 2,
    org: "Google web.dev",
    year: 2024,
    title: "Core Web Vitals: thresholds, 75th-percentile measurement, and ranking signal",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 3,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: performance, CMS, and Jamstack chapters",
    url: "https://almanac.httparchive.org/en/2024/",
  },
  {
    id: 4,
    org: "Google Search Central",
    year: 2024,
    title: "Site moves and redirects: best practices for migration",
    url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
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
    org: "W3C",
    year: 2023,
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
  },
];

export function WebsiteRebuildContent() {
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
