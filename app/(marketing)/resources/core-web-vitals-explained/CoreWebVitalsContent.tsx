"use client";

import { EditorialLayout } from "@/components/templates/EditorialLayout";
import type {
  EditorialCTA,
  EditorialHero,
  EditorialSection,
} from "@/components/templates/EditorialLayout";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/resources/core-web-vitals-explained";

const hero: EditorialHero = {
  eyebrow: "Performance",
  title: "Core Web Vitals, explained for service businesses.",
  subtitle:
    "What LCP, INP, and CLS actually measure, what scores Google rewards, and how to fix a slow site without burning a quarter on it. Written from the field, with citations.",
  stat: {
    value: "53%",
    label:
      "of mobile site visits abandoned when a page takes longer than three seconds to load.",
    source: {
      name: "Think with Google, 2017",
      url: "https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/page-load-time-statistics/",
    },
  },
};

const sections: EditorialSection[] = [
  {
    id: "what-they-measure",
    heading: "What Core Web Vitals actually measure",
    body: (
      <>
        <p>
          Core Web Vitals are three metrics Google publishes as the public
          summary of how your site feels to a real visitor on a real
          connection. <strong>LCP</strong> (Largest Contentful Paint) is the
          time from navigation start until the largest visible element renders,
          with a &ldquo;good&rdquo; threshold at 2.5 seconds (Google, 2024).{" "}
          <strong>INP</strong> (Interaction to Next Paint) is the time from a
          user input to the next visual update, with a &ldquo;good&rdquo;
          threshold at 200 milliseconds (Google, 2024). <strong>CLS</strong>{" "}
          (Cumulative Layout Shift) is the cumulative score of unexpected
          layout movement during a page&rsquo;s lifecycle, with a
          &ldquo;good&rdquo; threshold at 0.1 (Google, 2024).
        </p>
        <p>
          The bar Google grades you against is the 75th percentile of real
          user sessions, segmented across mobile and desktop devices, sampled
          over the most recent 28 days (Google, 2024). Three quarters of your
          visitors must hit &ldquo;good&rdquo; on every metric for the page to
          count as passing. A site that scores well in lab tests but slowly in
          production will fail this gate. A site that loads well on a high-end
          laptop and badly on a mid-tier Android will fail this gate.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "75%",
      label:
        "of real user sessions must hit the good threshold for a page to pass, measured at the 75th percentile across mobile and desktop.",
      source: {
        name: "Google web.dev (2024)",
        url: "https://web.dev/articles/vitals",
      },
    },
  },
  {
    id: "why-these-three",
    heading: "Why these three numbers, and not others",
    body: (
      <>
        <p>
          Google introduced Core Web Vitals in May 2020 as the visible portion
          of the page experience signal, replacing the older &ldquo;site
          speed&rdquo; rumor with three field metrics grounded in real visitor
          data (Walton, 2020). LCP captures whether the page loaded. INP
          captures whether the page responds when touched. CLS captures whether
          content stays where the user expects it. Three numbers, three
          orthogonal failure modes, three different code paths to fix.
        </p>
        <p>
          INP replaced First Input Delay (FID) as a stable Core Web Vital in
          March 2024 (Sullivan and Viscomi, 2024). The reason matters. FID
          measured only the delay before the first input was processed, which
          most sites passed easily because browsers schedule the first event
          handler quickly. INP measures every interaction across the visit and
          reports the slowest, weighted toward the high percentile of
          observations, which exposes the long tasks and hydration costs that
          FID had been masking. The metric got harder. Most sites that passed
          FID do not pass INP today.
        </p>
      </>
    ),
  },
  {
    id: "what-good-buys",
    heading: "What “good” actually buys you",
    body: (
      <>
        <p>
          Page speed pays for itself in conversions. Akamai&rsquo;s State of
          Online Retail Performance report (2017) found that every
          100-millisecond delay in load time correlated with a 7% drop in
          conversion across thousands of online retailers. Deloitte
          Digital&rsquo;s Milliseconds Make Millions study (2020), commissioned
          by Google and run across 30 mobile retail sites, measured an average
          8.4% conversion lift in retail and a 10.1% lift in travel for every
          0.1-second improvement in mobile site speed.
        </p>
        <p>
          The effect compounds for service businesses with high-intent traffic.
          A plumber whose mobile site loads in five seconds instead of two does
          not lose 60% of their leads in a single jump; the loss is gradual
          across the funnel, with the largest cuts on first impressions where
          bounce decisions happen in the first three seconds (An, 2017). The
          headline figure that gets cited everywhere, that 53% of mobile users
          abandon a site that takes longer than three seconds to load, is from
          Daniel An&rsquo;s 2017 Think with Google analysis of mobile speed
          benchmarks.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "8.4%",
      label:
        "Average mobile retail conversion lift per 0.1-second improvement in site speed, measured across 30 retail sites.",
      source: {
        name: "Deloitte Digital, 2020",
        url: "https://www2.deloitte.com/ie/en/pages/consulting/articles/milliseconds-make-millions.html",
      },
    },
  },
  {
    id: "lcp",
    heading: "LCP: what it is, what kills it, what fixes it",
    body: (
      <>
        <p>
          LCP is the time from navigation start until the largest above-the-fold
          visible element finishes rendering. On most service-business sites,
          that element is the hero image or the H1 headline. If the hero is a
          video, it is whichever element rendered before the video poster. The
          metric ignores anything below the fold and anything off-screen
          (Google, 2024).
        </p>
        <p>
          LCP fails for a small number of identifiable reasons. The hero image
          is too large or unoptimized. A render-blocking script in the head
          delays first paint. A web font swap pushes the headline render past
          the LCP candidate threshold. Server response time is slow because the
          page is rendered on demand from a database query that should have
          been cached. The fix sequence I follow on every audit is:
        </p>
        <ul>
          <li>
            Serve the hero image in a modern format (AVIF or WebP) at a sensible
            size for the breakpoint.
          </li>
          <li>
            Eliminate render-blocking JavaScript above the fold. Defer or
            async-load anything not needed for first paint.
          </li>
          <li>
            Preload the LCP image with{" "}
            <code>&lt;link rel=&quot;preload&quot;&gt;</code> so the browser
            fetches it in parallel with the HTML.
          </li>
          <li>
            Move expensive server-side work to a background path or a cache
            layer so the HTML response time stays under 200 milliseconds.
          </li>
        </ul>
        <p>
          On a typical small-business site, these four changes move LCP from
          the 4-to-6-second range into the under-2.5-second range without any
          framework changes underneath.
        </p>
      </>
    ),
  },
  {
    id: "inp",
    heading: "INP: the metric most sites fail today",
    body: (
      <>
        <p>
          INP measures the responsiveness of the page across the entire visit.
          Every click, tap, or keystroke fires the metric; the reported value
          is weighted toward the slowest observed interactions (Sullivan and
          Viscomi, 2024). A site can pass LCP and CLS comfortably and still
          fail INP, because all three metrics measure orthogonal things.
        </p>
        <p>
          Most INP failures I see in the field come from one of three sources.
        </p>
        <ul>
          <li>
            <strong>Hydration cost</strong> on the first interaction after a
            React, Vue, or Angular page renders, where the page looks ready but
            the framework has not yet attached event handlers.
          </li>
          <li>
            <strong>Long tasks in third-party scripts</strong>, especially
            analytics, chat widgets, and tag managers, that block the main
            thread for hundreds of milliseconds at unpredictable times.
          </li>
          <li>
            <strong>Heavy synchronous work in the click handler itself</strong>,
            especially on pages that re-render large component trees on a
            single state change.
          </li>
        </ul>
        <p>
          The fixes are different for each. The first wants framework-level
          work like deferred or selective hydration. The second wants a
          third-party script audit and aggressive lazy loading. The third wants
          React&rsquo;s <code>useTransition</code> and component memoization.
          INP rewards discipline, not heroics.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "200ms",
      label:
        "INP threshold for a good Core Web Vitals score. Most sites that passed FID do not pass INP.",
      source: {
        name: "Google web.dev (2024)",
        url: "https://web.dev/articles/inp",
      },
    },
  },
  {
    id: "cls",
    heading: "CLS: the most fixable of the three",
    body: (
      <>
        <p>
          CLS is a cumulative score, not a time. It sums the impact of every
          unexpected layout shift during the page&rsquo;s life, weighted by how
          much screen area moved and how far it moved. The &ldquo;good&rdquo;
          threshold is 0.1, which means small shifts are tolerated, but a
          single mid-load shift of an entire hero block will fail you on its
          own (Google, 2024).
        </p>
        <p>
          CLS is the most fixable of the three Core Web Vitals because the
          failure modes are well-known and the fixes are mechanical.
        </p>
        <ul>
          <li>
            Images and videos without explicit width and height attributes
            shift content when they load. Declare both, even on responsive
            assets.
          </li>
          <li>
            Web fonts with FOIT or FOUT swap behaviors push text down when the
            font loads. Use <code>font-display: optional</code> or{" "}
            <code>size-adjust</code> to keep swaps from changing line height.
          </li>
          <li>
            Ads and embeds inserted above existing content shove the rest of
            the page down. Reserve the slot with a <code>min-height</code>{" "}
            container before the embed loads.
          </li>
          <li>
            Cookie banners and consent gates that animate in from the top
            should slide over the page, not push it.
          </li>
        </ul>
        <p>
          Most sites can move from a CLS of 0.3 to under 0.05 in one focused
          day of work. CLS is the metric to fix first when you need a quick
          win before a bigger performance project.
        </p>
      </>
    ),
  },
  {
    id: "how-to-measure",
    heading: "How to actually measure your own site",
    body: (
      <>
        <p>
          Three tools matter. <strong>PageSpeed Insights</strong> at
          pagespeed.web.dev returns both lab data, generated on a simulated
          mid-tier device with throttled connectivity, and field data, pulled
          from the Chrome User Experience Report (CrUX) for sites with enough
          real traffic. <strong>Lighthouse</strong>, the same engine PSI uses
          for lab data, runs locally in Chrome DevTools and is what you want
          when iterating on a fix because it is fast and reproducible. The{" "}
          <strong>Chrome User Experience Report itself</strong>, queryable via
          BigQuery for production sites, is the underlying source of truth
          Google uses for its ranking signals (Google Search Central, 2021).
        </p>
        <p>
          Lab data and field data disagree often. A page can score 95 in
          Lighthouse and fail Core Web Vitals in CrUX because Lighthouse
          simulates a fast 4G connection on a mid-tier device while real
          traffic includes slower devices, slower networks, and longer sessions
          where INP failures accumulate. Field data is what Google uses to rank
          you. Always trust CrUX over Lighthouse for what your search ranking
          actually depends on.
        </p>
        <p>
          Pathlight automates the measurement and the diagnostic in 90 seconds,
          returning a scored report against your own URL with the prioritized
          fixes underneath. Worth running before a four-hour DIY audit if only
          to confirm what you are about to spend the four hours on.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "28",
      label:
        "Days of rolling field data Google uses to compute your Core Web Vitals ranking signal.",
      source: {
        name: "Google web.dev (2024)",
        url: "https://web.dev/articles/vitals",
      },
    },
  },
  {
    id: "common-mistakes",
    heading: "Common mistakes I see in the field",
    body: (
      <>
        <p>
          <strong>Optimizing for Lighthouse score over CrUX.</strong> A perfect
          Lighthouse score that fails CrUX is a vanity metric. A 78 Lighthouse
          that passes CrUX is the one that ranks. Treat Lighthouse as the
          iteration loop, CrUX as the source of truth.
        </p>
        <p>
          <strong>Treating INP like FID.</strong> Sites that passed FID often
          inherited the assumption that &ldquo;interactivity is fine, we passed
          the test.&rdquo; INP is a stricter test that includes every
          interaction across the visit. If you have not measured INP since
          March 2024, you have not measured INP.
        </p>
        <p>
          <strong>Ignoring third-party scripts.</strong> Most service-business
          sites carry between five and twelve third-party scripts: analytics,
          tag managers, chat widgets, schedulers, social pixels, customer
          review embeds. Each one runs JavaScript on the main thread. The 2024
          Web Almanac reports that the median site loads 22 third-party
          requests, and the 90th percentile loads more than 100 (HTTP Archive,
          2024). INP failures cluster around these requests. Audit ruthlessly.
          Remove what you cannot justify.
        </p>
        <p>
          <strong>Optimizing only the homepage.</strong> Core Web Vitals are
          page-by-page, not site-wide. A homepage scoring 95 with twelve
          service-detail pages scoring 60 gets ranked on the service-detail
          pages for service-detail queries. Audit every commercially-important
          URL, not just the front door.
        </p>
      </>
    ),
  },
];

const faq = [
  {
    question: "Do Core Web Vitals affect Google rankings?",
    answer:
      "Yes, since June 2021. Core Web Vitals are part of Google's page experience ranking signal for both desktop and mobile search. The effect is most visible on competitive queries where multiple sites have similar content quality.",
  },
  {
    question: "What counts as a good Core Web Vitals score?",
    answer:
      "All three metrics must hit their good threshold for at least 75% of real-user sessions, measured at the 75th percentile across mobile and desktop, over the most recent 28 days. LCP good is 2.5 seconds. INP good is 200 milliseconds. CLS good is 0.1.",
  },
  {
    question: "Should I use Lighthouse or PageSpeed Insights?",
    answer:
      "PageSpeed Insights returns both lab data (Lighthouse) and field data (CrUX). Field data is what Google uses for ranking. Use Lighthouse during fixes for fast iteration, then verify the result has reached CrUX before declaring victory, which can take up to 28 days because of the rolling window.",
  },
  {
    question: "Why did Google replace FID with INP?",
    answer:
      "First Input Delay only measured the delay before the first input was processed, which most sites passed because the first event handler runs quickly. INP measures every interaction across the visit and reports the slowest, which exposes long tasks and hydration costs that FID was missing. The metric got harder.",
  },
  {
    question: "How long until my fixes show up in CrUX?",
    answer:
      "Up to 28 days. CrUX uses a rolling 28-day window, so a fix you ship today shows partial improvement in field data within a few days and full improvement only after the older data ages out.",
  },
  {
    question: "Do Core Web Vitals matter for service businesses or just e-commerce?",
    answer:
      "They matter for any business with organic search traffic. Google's mobile-first indexing means your mobile experience is what gets ranked, and Core Web Vitals are how Google quantifies that experience. For service businesses competing on local search, the bar is the same as for e-commerce. The Resources section has the longer playbook on what actually moves the local pack in DFW, and Core Web Vitals is one of the inputs.",
  },
  {
    question: "Can a WordPress site hit good Core Web Vitals?",
    answer:
      "Yes, but it requires more discipline than on a modern framework. The 2024 Web Almanac reports that WordPress sites trail non-WordPress sites on every Core Web Vital, primarily due to plugin sprawl, render-blocking themes, and unoptimized media. The fixes are the same as on any platform: image optimization, render-blocking script audit, INP profiling. The friction is higher because more of the work has to be done against the platform, not with it.",
  },
];

const cta: EditorialCTA = {
  eyebrow: "Skip the four-hour DIY",
  headline: "Get the same diagnostic in ninety seconds.",
  body: "Pathlight runs the audit you would otherwise spend an afternoon on, returns a scored report against your own URL, and surfaces the fixes ranked by impact. Free. No signup. Built on the same field-grade methodology described above.",
  primary: { label: "Run a free Pathlight scan", href: "/pathlight" },
  secondary: {
    label: "Talk to me about a performance audit",
    href: "/contact",
  },
};

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Google",
    year: 2024,
    title: "Web Vitals",
    publication: "web.dev",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 2,
    org: "Google",
    year: 2024,
    title: "Largest Contentful Paint (LCP)",
    publication: "web.dev",
    url: "https://web.dev/articles/lcp",
  },
  {
    id: 3,
    org: "Google",
    year: 2024,
    title: "Interaction to Next Paint (INP)",
    publication: "web.dev",
    url: "https://web.dev/articles/inp",
  },
  {
    id: 4,
    org: "Google",
    year: 2024,
    title: "Cumulative Layout Shift (CLS)",
    publication: "web.dev",
    url: "https://web.dev/articles/cls",
  },
  {
    id: 5,
    authors: "Sullivan, A., & Viscomi, R.",
    year: 2024,
    title: "Introducing INP to Core Web Vitals",
    publication: "Chrome for Developers Blog",
    url: "https://developer.chrome.com/blog/inp-cwv-march-12",
  },
  {
    id: 6,
    authors: "An, D.",
    year: 2017,
    title:
      "Find out how you stack up to new industry benchmarks for mobile page speed",
    publication: "Think with Google",
    url: "https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/page-load-time-statistics/",
  },
  {
    id: 7,
    org: "Akamai Technologies",
    year: 2017,
    title: "Akamai Online Retail Performance Report: Milliseconds Are Critical",
    url: "https://www.akamai.com/newsroom/press-release/akamai-releases-spring-2017-state-of-online-retail-performance-report",
  },
  {
    id: 8,
    org: "Deloitte Digital",
    year: 2020,
    title:
      "Milliseconds Make Millions: A study on how improvements in mobile site speed positively affect a brand's bottom line",
    url: "https://www2.deloitte.com/ie/en/pages/consulting/articles/milliseconds-make-millions.html",
  },
  {
    id: 9,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: Performance",
    url: "https://almanac.httparchive.org/en/2024/performance",
  },
  {
    id: 10,
    authors: "Walton, P.",
    year: 2020,
    title: "Web Vitals: essential metrics for a healthy site",
    publication: "web.dev",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 11,
    org: "Google Search Central",
    year: 2021,
    title: "More details about the page experience update for Google Search",
    url: "https://developers.google.com/search/blog/2021/04/more-details-page-experience",
  },
];

export function CoreWebVitalsContent() {
  const config = getPageConfig(SLUG);
  if (!config) return null;

  return (
    <EditorialLayout
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
