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

const SLUG = "/services/nextjs-development";

const hero: ServiceHero = {
  eyebrow: "Service · Next.js Development",
  title: "Production Next.js, built by the same person who designs it.",
  lede:
    "Most service businesses do not need a Next.js site. The ones that do tend to share a few traits: they want to own their code, they sell on trust more than impulse, and they have plans that go beyond a brochure. This page covers when Next.js is the right call, when it is not, and what an engagement actually looks like when I am the one building it.",
};

const sections: ServiceSection[] = [
  {
    id: "what-this-is",
    number: "01",
    label: "Definition",
    heading: "What Next.js development actually means in practice",
    body: (
      <>
        <p>
          Next.js is the production framework for React. It is maintained by
          Vercel and is the default choice in the React documentation for new
          full-stack applications. The current programming model is the App
          Router with React Server Components, which colocates server-side
          data fetching with the components that render it and ships almost no
          unused JavaScript to the browser by default (Next.js docs, 2026).
        </p>
        <p>
          When most agencies say <em>Next.js development</em>, they mean a
          one-page or multi-page marketing site that happens to be built on
          Next.js instead of WordPress. That is a small slice of what the
          framework is for. The work I do under this header is custom
          application development: server-rendered pages, typed data layers,
          custom authentication where it is needed, integrations with the
          third-party services a business actually uses, and a maintenance
          surface I will still understand a year from now.
        </p>
        <p>
          The proof points are public. This site runs on Next.js 16.{" "}
          <Link
            href="/pathlight"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Pathlight
          </Link>
          , the website intelligence product I built, runs on the same
          framework. The two systems share a codebase, a deployment pipeline,
          and a Postgres database. That is the level I work at, and it is the
          level of system I am proposing when you hire me. For a worked example
          in a specific vertical, the{" "}
          <Link
            href="/industries/auto-service"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            auto service industry page
          </Link>{" "}
          covers the Star Auto Service rebuild in production detail.
        </p>
      </>
    ),
    break: { kind: "gradient-rule" },
  },
  {
    id: "when-it-fits",
    number: "02",
    label: "Fit",
    heading: "When Next.js is the right call, and when it is not",
    body: (
      <>
        <p>
          Next.js is the right call when at least two of these are true. You
          want full ownership of your code, not a hosted-platform license you
          rent. Your buyers do real research before contacting you, which
          means the site needs to rank in Google and answer questions
          confidently. You have or expect to have integrations beyond a
          contact form, such as scheduling, internal dashboards, customer
          portals, or a custom CRM you do not want to glue together with
          third-party widgets. You expect the site to evolve over multiple
          years, not get rebuilt every twenty-four months.
        </p>
        <p>
          Next.js is the wrong call when you genuinely need a brochure.{" "}
          <Link
            href="/resources/agency-vs-studio-vs-freelancer"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Squarespace and Wix
          </Link>{" "}
          are real products and they are good at what they do. If your entire
          internet strategy is a one-page address, hours, and a phone number,
          paying twenty-five thousand dollars for a custom application is
          straightforward overspending and I will tell you that directly. The
          honest framing here is that most local service businesses fall on
          the line between the two, and the right answer depends on what you
          plan to do with the site over the next five years, not what you
          want it to look like next month.
        </p>
        <p>
          A second wrong-fit case is the marketing-blog-only site. If the
          entire purpose is a content stream and you do not need any custom
          server logic, a static-site generator like Astro or Hugo will ship
          faster, cost less to host, and require less ongoing care than a
          full Next.js application. I will say so when that is what fits.
        </p>
      </>
    ),
    break: { kind: "gradient-rule" },
  },
  {
    id: "why-this-stack",
    number: "03",
    label: "Why this stack",
    heading: "Why Next.js for a service business specifically",
    body: (
      <>
        <p>
          Service businesses get four things from this stack that they
          struggle to get from page-builder platforms. Server-side rendering
          and Server Components mean the HTML the search engine sees is the
          HTML the customer sees, with no client-side JavaScript required to
          read your services and prices. That posture passes Core Web Vitals
          by default rather than as an afterthought, which Google has used as
          a ranking input since the page experience update became a
          rolling-out signal in mid-2021 (Google Search Central, 2021). When
          Vodafone Italy rebuilt one of their pages on Next.js and improved
          LCP by thirty-one percent, sales rose by eight percent and lead
          rate by fifteen percent in their measurement window (Google, 2022).
        </p>
        <p>
          The second benefit is integration depth. The same codebase that
          renders your marketing pages can run your booking flow, your admin
          dashboard, your customer login, and the queue that sends your
          transactional email. You do not need to glue together five vendors
          and pay each of them a monthly fee that adds up to more than a
          principal architect&apos;s annual retainer. You also do not need a
          plugin marketplace, which is the failure mode that takes most
          WordPress sites down.
        </p>
        <p>
          The third benefit is type safety end to end. With TypeScript and
          Drizzle or Prisma, the shape of your database matches the shape of
          your forms, which matches the shape of your API responses. A
          rename in one place propagates through the whole system at compile
          time, which is why a one-person studio can maintain a system over
          many years without it drifting into chaos.
        </p>
        <p>
          The fourth benefit is the one that matters most for a small
          business: the framework is well-supported and is not going to be
          abandoned. According to the State of JS 2024 survey of more than
          fifteen thousand developers, Next.js retained the top spot for
          metaframework usage and the highest retention rate in its category
          (Devographics, 2024). The HTTP Archive Web Almanac&apos;s 2024 CMS
          and frameworks chapters track its adoption growth across the
          public web (HTTP Archive, 2024). The downside risk of building on
          Next.js, on Vercel infrastructure, with first-party React, is
          lower than the downside risk of betting on a niche stack.
        </p>
      </>
    ),
    break: { kind: "gradient-rule" },
  },
  {
    id: "what-you-give-up",
    number: "04",
    label: "Tradeoffs",
    heading: "What you give up choosing this path",
    body: (
      <>
        <p>
          Three honest tradeoffs. First, this is not the cheapest option, and
          the cheapest option is sometimes the right one. Templated builds on
          Squarespace start under one thousand dollars in setup. Custom
          Next.js work under my engagement model starts at twenty-five
          thousand. If your ceiling is the former, choose the former and
          spend the difference on advertising.
        </p>
        <p>
          Second, this is not the fastest path to a public URL. A custom
          Next.js application takes weeks of design and engineering, where a
          template-based site can be online inside a weekend. The speed gap
          is real and the right answer is not always to wait. If your
          deadline is two weeks, hire a templater and revisit the custom
          build later when the timing is right.
        </p>
        <p>
          Third, the dependency surface is real. A modern Next.js
          application pulls in React, the framework runtime, TypeScript, a
          build toolchain, and whatever client libraries you choose for data
          access, authentication, and email. Each of those has its own
          release cadence and its own breaking-change schedule. Maintenance
          is part of the engagement, not an afterthought. I budget for it,
          and I price retainers around it, because pretending it does not
          exist is what produces the four-year-old framework version on a
          live site that an attacker eventually finds.
        </p>
      </>
    ),
  },
];

const process: ServiceProcess = {
  heading: "How an engagement actually moves",
  lede:
    "Five phases, one principal architect through all of them. No handoffs to a junior team, no account manager triangulating requirements between you and the people writing the code.",
  steps: [
    {
      number: "01",
      title: "Discovery and alignment",
      duration: "1 to 2 weeks",
      body:
        "I read your existing site, your reviews, your competitors, and your analytics. We meet two or three times. I produce a written brief covering the buyer journey, the conversion goal, the integrations in scope, and the success criteria. If the brief surfaces a reason this is the wrong project for you to fund, I say so before any contract gets signed.",
    },
    {
      number: "02",
      title: "Architecture and content model",
      duration: "1 to 2 weeks",
      body:
        "I design the data model, the page structure, the navigation, and the integration boundaries. You see the structure as a navigable sitemap and the content model as a typed schema. We agree on the spine of the site before any pixel design begins, because re-architecting after design is twice as expensive.",
    },
    {
      number: "03",
      title: "Design and prototype",
      duration: "2 to 3 weeks",
      body:
        "I work on hero, navigation, and one full interior template, then iterate based on your feedback before propagating the system. You see real screens, not mood boards. The design lives in a Next.js prototype from week one so you can check responsiveness, motion, and load behavior on actual devices, not in Figma.",
    },
    {
      number: "04",
      title: "Implementation",
      duration: "3 to 6 weeks",
      body:
        "I build the production application, integrate the third-party services in scope, write the database migrations, ship to a Vercel preview environment, and review weekly with you. You always have a live URL to look at. Quality gates: TypeScript clean, lint clean, Lighthouse 95 or above on the major pages, accessibility audit on each template.",
    },
    {
      number: "05",
      title: "Launch and handoff",
      duration: "1 week",
      body:
        "DNS cutover, redirects from the old site, search-engine reindex prompts, analytics verification, and a written runbook. You receive the GitHub repository, the Vercel project, a documented deployment process, and a recorded walkthrough of how to update content yourself. From day one of launch, you own the system.",
    },
  ],
};

const scope: ServiceScope = {
  timeline: { label: "Typical timeline", value: "8 to 14 weeks" },
  pricing: {
    label: "Investment",
    value: "Starting at $25,000",
    note: "Final scope is a per-engagement quote, not a fixed-price tier",
  },
  deliverables: [
    "Custom Next.js 16 application on the App Router",
    "TypeScript codebase with shared component library",
    "Server Components, server actions, and typed data access",
    "Responsive design system tuned to your brand",
    "Lighthouse performance, accessibility, and SEO 95 plus",
    "Structured data, sitemap, robots, canonical tagging",
    "Vercel hosting setup with preview deploys per branch",
    "Postgres or managed-database integration where needed",
    "Resend transactional email and contact-form delivery",
    "Documented runbook and a recorded codebase walkthrough",
    "Full GitHub repository ownership transferred to you",
    "Optional retainer for maintenance and feature work",
  ],
};

const cta: ServiceCTA = {
  eyebrow: "Next step",
  heading: "If this sounds like the right fit, the next move is a 30-minute call.",
  body:
    "I do not run high-pressure sales conversations. The first call is diagnostic. The goal is to confirm whether Next.js is even the right call for your business, what scope of engagement makes sense, and what timing looks like on both sides. If the project is not a fit, I will say so and point you at a better option.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "See the work", href: "/work" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "Is Next.js overkill for a small service business?",
    answer:
      "Sometimes yes, sometimes no. If your entire site is hours, address, and a contact form, a hosted page builder is the right call. If you need search rankings, custom integrations, future product features, or full code ownership, the math reverses. The honest answer depends on what you actually need the site to do for you over the next five years.",
  },
  {
    question: "How is this different from hiring a WordPress developer?",
    answer:
      "WordPress is a content management system with a plugin ecosystem and a long history. Next.js is a programming framework with a typed data layer and no plugin marketplace. Custom Next.js applications tend to perform better, get attacked less often, and cost more upfront. WordPress tends to ship faster, cost less upfront, and require more ongoing patching.",
  },
  {
    question: "What if I outgrow what you build?",
    answer:
      "You should outgrow it. The codebase is yours, the GitHub repository is yours, the documentation is yours. Any competent React or Next.js engineer can pick the project up. I deliberately avoid bespoke abstractions that would lock you to me, because lock-in is bad for clients and is a poor long-term business model for a solo studio.",
  },
  {
    question: "Where does it get hosted?",
    answer:
      "Vercel by default. Vercel is the company that maintains Next.js, and the framework is engineered around Vercel infrastructure. Self-hosting is technically possible and I will set it up if you have a strong reason, but I usually recommend Vercel because the integration is mature and the pricing for a small business is reasonable.",
  },
  {
    question: "Do I actually own the code?",
    answer:
      "Yes. The contract transfers full ownership of the source code, the design assets, the deployment configuration, and any custom integrations to you on launch. You do not lease the site from me. You can take the repository to another developer at any time without my involvement.",
  },
  {
    question: "How do you handle dependency updates after launch?",
    answer:
      "Two options. The first is a maintenance retainer where I patch dependencies on a quarterly cadence and apply security updates as they ship. The second is a transfer where I document the upgrade path and you or another developer take it forward. I will recommend the first if your stack has a meaningful attack surface, the second if your site is primarily static and the risk is low.",
  },
  {
    question: "Can I add a CMS later if I want non-technical content editing?",
    answer:
      "Yes. Sanity, Payload, and Contentful all integrate cleanly with Next.js. The architecture I deliver is designed so a CMS can be slotted in without re-platforming. Most service businesses I work with do not need this on day one, but the option stays open.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Vercel",
    year: 2026,
    title: "Next.js documentation: App Router and Server Components",
    url: "https://nextjs.org/docs/app",
  },
  {
    id: 2,
    org: "Google Search Central",
    year: 2021,
    title:
      "More time, tools, and details on the page experience update",
    url: "https://developers.google.com/search/blog/2021/04/more-details-page-experience",
  },
  {
    id: 3,
    org: "Google",
    year: 2022,
    title: "Vodafone Italy: a 31% improvement in LCP increased sales by 8%",
    url: "https://web.dev/case-studies/vodafone",
  },
  {
    id: 4,
    org: "Devographics",
    year: 2024,
    title: "State of JavaScript 2024: Frameworks and Metaframeworks",
    url: "https://2024.stateofjs.com/en-US/libraries/meta-frameworks/",
  },
  {
    id: 5,
    org: "HTTP Archive",
    year: 2024,
    title: "Web Almanac 2024: Frameworks chapter",
    url: "https://almanac.httparchive.org/en/2024/jamstack",
  },
  {
    id: 6,
    org: "Vercel",
    year: 2026,
    title: "Vercel platform documentation: deployments, functions, and edge",
    url: "https://vercel.com/docs",
  },
];

export function NextjsDevelopmentContent() {
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
