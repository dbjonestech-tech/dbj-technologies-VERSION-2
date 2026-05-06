"use client";

import Link from "next/link";
import { IndustryVerticalLayout } from "@/components/templates/IndustryVerticalLayout";
import type {
  IndustryCTA,
  IndustryHero,
  IndustryProof,
  IndustrySection,
} from "@/components/templates/IndustryVerticalLayout";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/industries/auto-service";

const hero: IndustryHero = {
  eyebrow: "Industry · Auto Service",
  title: "Auto service websites that earn the bay,",
  highlight: "not just the click.",
  lede:
    "An auto repair customer is rarely casual. They are stranded, frustrated, or trying to keep an aging car running for one more year. The site that earns their trust in the first ninety seconds is the site that gets the call. This page covers what those sites do, what most shop sites get wrong, and the working production proof of a real shop in Richardson that I rebuilt myself.",
  image: {
    src: "/images/case-studies/star-auto-desktop.webp",
    alt: "Star Auto Service homepage on desktop, the live production site I built for the Richardson auto shop",
  },
  caption: "Star Auto Service · Richardson, Texas · live build by DBJ Technologies",
};

const sections: IndustrySection[] = [
  {
    id: "what-buyers-need",
    number: "01",
    label: "Buyer reality",
    heading: "What an auto service buyer actually needs from your site",
    body: (
      <>
        <p>
          The auto service buyer arrives in a different emotional state from a
          legal client or a dental patient. They have heard a noise, watched a
          warning light come on, or had something fail outright on the way to
          work. They are in a hurry, they are wary of being upsold, and they
          are searching from a phone in a parking lot. According to Pew
          Research, ninety-seven percent of American adults own a cellphone
          and ninety-one percent own a smartphone (Pew Research, 2024). For
          this vertical specifically, mobile is not the dominant case. It is
          almost the entire case.
        </p>
        <p>
          The four things they need to verify in those first ninety seconds
          are: that you are open today, that you can fix what is wrong with
          their car, that you are not going to take advantage of them, and
          that they can reach you in one tap. A site that fails any of those
          four checks loses to the next result in the local pack, and the
          driver never returns. Everything below derives from those four
          checks.
        </p>
        <p>
          The Bureau of Labor Statistics tracks roughly seven hundred
          thousand automotive service technicians and mechanics employed
          nationally (U.S. Bureau of Labor Statistics, 2024), and the
          competition for any individual customer is brutal. The work of an
          auto service site is to convert a moment of stress into a booked
          appointment before the driver hits the back button.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "common-failures",
    number: "02",
    label: "Failure patterns",
    heading: "What I see most auto service sites get wrong",
    body: (
      <>
        <p>
          Most independent auto shop sites make the same five mistakes, and I
          have seen them in every market I work with. The first is a hero
          image of a wrench, a generic mechanic stock photo, or a rotating
          carousel that buries the only thing the visitor actually wanted to
          read. The headline should answer the question on the visitor&apos;s
          mind, which is some version of <em>can you help me today, and how
          fast</em>. The first screen should answer that question without
          scrolling.
        </p>
        <p>
          The second mistake is hiding the phone number. Every additional
          tap between a stranded driver and your shop is a tap during which
          they could be calling the shop next to yours. The phone number
          belongs in the header, in the hero, in a sticky mobile bar, and on
          every long page. Burying it in a contact form is a misread of how
          this vertical actually converts.
        </p>
        <p>
          The third mistake is unspecific service lists. <em>General
          repair</em> tells the visitor nothing. <em>Transmission rebuilds,
          state inspections, A/C recharge, and pre-purchase inspections</em>
          {" "}tells them you can fix what is wrong with their car. Specific
          services also align with how Google interprets local intent for
          ranking, since the search engine matches the searcher&apos;s exact
          symptom or service phrase to your page content (Google Search
          Central, 2025).
        </p>
        <p>
          The fourth mistake is missing or fake-feeling proof. A wall of
          identical five-star reviews with no names reads as suspicious. A
          live link to your real Google Business Profile, with the actual
          review count, the actual rating, and the actual recent reviews,
          reads as honest. ASE certifications, NAPA Auto Care affiliation,
          and any chamber or BBB credentials should be stated plainly with
          the verifying body named (ASE, 2025; NAPA Auto Care, 2025).
        </p>
        <p>
          The fifth mistake is a contact form that demands too much. A name,
          a phone number, and a brief description of the problem is the
          maximum you need to qualify a lead. Asking for the model year, the
          make, the VIN, and the preferred date all in one form is how you
          turn a panicked driver into a bounce.
        </p>
      </>
    ),
    break: {
      kind: "image",
      src: "/images/case-studies/star-auto-desktop.webp",
      alt: "Star Auto Service site in production, showing the homepage hero",
      caption: "Production build · thestarautoservice.com",
    },
  },
  {
    id: "design-principles",
    number: "03",
    label: "What works",
    heading: "Design principles that actually convert in this vertical",
    body: (
      <>
        <p>
          The design system I use for auto service sites is built around six
          principles, in priority order. First, mobile is the canonical
          target, not a downscaled version of the desktop layout. Buttons
          must hit the WCAG 2.2 minimum target size of twenty-four by
          twenty-four CSS pixels at the absolute floor, and I default to
          forty-four by forty-four because the use case is one-handed in
          poor lighting (W3C, 2023).
        </p>
        <p>
          Second, the call-to-action is a phone number, not a form. The form
          is the secondary path for customers who cannot call right now or
          who want to schedule for next week. The primary path is a
          tap-to-call button in the sticky mobile header that fires
          immediately. Click-to-call is a single line of HTML and it
          consistently outperforms every other CTA pattern in this vertical.
        </p>
        <p>
          Third, the hero text answers the local-intent query directly.
          &quot;Auto repair in Richardson, Texas&quot; or &quot;Honest
          mechanic in McKinney&quot; are not weak headlines. They are the
          exact phrases the customer typed into Google and they are the
          phrases Google will reward. Decorative headlines that sound like
          a luxury watch ad are the wrong choice for this vertical. The
          longer reference on how Google actually scores local intent for
          DFW service businesses is{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
          >
            Local SEO for Dallas Service Businesses
          </Link>
          .
        </p>
        <p>
          Fourth, services are listed as the customer thinks about them, not
          as you bill them. <em>Brakes squealing</em>, <em>check engine
          light is on</em>, <em>state inspection</em>, and <em>oil change</em>
          {" "}are how the customer searches. Translating internal service
          codes into customer language is half of the conversion work.
        </p>
        <p>
          Fifth, the trust block is real, named, and dated. The shop&apos;s
          ASE certifications, the technicians&apos; names, the year the shop
          opened, the live Google rating with the live review count, and a
          handful of recent reviews quoted with the reviewer&apos;s real
          first name. Every shortcut on this section reads as defensive,
          which is the opposite of trustworthy.
        </p>
        <p>
          Sixth, the page loads fast. The performance target on a real auto
          service site is a Lighthouse score in the high nineties on a
          mid-tier mobile device on a slow LTE connection. That is the
          baseline I ship at, and it is not optional. A twenty-second hero
          video is a luxury you cannot afford on a site whose user is
          stranded in a parking lot.
        </p>
      </>
    ),
    callouts: [
      {
        kind: "accessibility",
        title: "Accessibility is not optional in this vertical",
        body:
          "Auto service buyers skew older than the population average, and a meaningful share of them have low vision, motor control challenges, or cognitive load from the stress of car trouble. WCAG 2.2 Level AA is the floor I build to: high-contrast text, large hit targets, focus states that are never obscured, and forms that do not require re-entering information already provided.",
        source: { name: "W3C, WCAG 2.2", url: "https://www.w3.org/TR/WCAG22/" },
      },
    ],
    break: { kind: "rule" },
  },
  {
    id: "trust-and-truth",
    number: "04",
    label: "Trust",
    heading: "Trust signals that actually move the needle",
    body: (
      <>
        <p>
          The auto service vertical has a generational trust deficit, and
          customers know it. Decades of bait-and-switch jokes, hidden fees,
          and unnecessary upsells have made the average driver suspicious by
          default. The site has thirty seconds to undo that suspicion.
        </p>
        <p>
          The trust signals that actually work in this vertical are
          verifiable, specific, and visible above the fold. ASE-Certified
          technicians, named (ASE, 2025). Affiliation badges that link to
          the issuing body, not floating logos with no link target (NAPA
          Auto Care, 2025). The shop&apos;s full physical address with a
          working Google Maps link and the actual hours, including the
          Saturday hours since auto buyers disproportionately search on
          weekends. A real phone number with a real area code, not a
          tracking number that reads as out of state.
        </p>
        <p>
          One other piece is underrated: bilingual content where it
          matches the local population. Many shops in the Dallas-Fort Worth
          metro serve a substantial Spanish-speaking customer base, and a
          Spanish-language toggle costs almost nothing technically while
          reading as a serious commitment to the community. Star Auto runs
          bilingual service in person and the site reflects that.
        </p>
      </>
    ),
    callouts: [
      {
        kind: "trust",
        title: "Don't fake what you can prove",
        body:
          "If your shop has ASE-Certified technicians, link to ASE.com. If your shop is a NAPA Auto Care Center, link to NAPA. If you have a current BBB rating, link to it. Trust is not built by saying you are trustworthy. Trust is built by handing the visitor the exact link they need to verify the claim themselves, and showing you are willing to.",
      },
    ],
    break: { kind: "gradient-rule" },
  },
];

const proof: IndustryProof = {
  eyebrow: "The proof",
  heading: "Star Auto Service: twenty-eight years on Belt Line Road, rebuilt online",
  body: (
    <>
      <p>
        Miguel Ibarra runs Star Auto Service in Richardson, Texas.
        ASE-Certified technicians. NAPA Auto Care Center. Bilingual service.
        Twenty-eight years on the corner of Belt Line Road. A 4.8-star
        Google rating across more than one hundred thirty-six reviews,
        built customer by customer over decades. The shop&apos;s reputation
        in person was unimpeachable. The shop&apos;s reputation online did
        not exist.
      </p>
      <p>
        I rebuilt the site from scratch on{" "}
        <Link
          href="/services/nextjs-development"
          className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
        >
          Next.js 16
        </Link>
        . Mobile-first hero
        with the location, the phone number, and the actual services
        listed in customer language. ASE and NAPA badges with live links
        to the issuing bodies. The current Google rating surfaced from
        the Business Profile, not hand-typed. A bilingual content layer.
        A sticky mobile call bar that fires in one tap. A Lighthouse
        performance score in the high nineties on real mid-tier mobile
        hardware. The site is in production today at{" "}
        <a
          href="https://thestarautoservice.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
        >
          thestarautoservice.com
        </a>
        .
      </p>
      <p>
        That is the level of build I am proposing for any independent or
        franchise auto service shop that hires me. Not a templated theme.
        Not a generic local-business builder. A custom Next.js application
        engineered for the way the auto service buyer actually behaves on
        a phone in a parking lot.
      </p>
      <p>
        The same architectural depth applies to other service verticals.
        The trust signals shift, but the underlying principles hold:
        case-fit answer, accurate outcomes, named practitioners, fast
        performance, accessible design. The vertical-specific takes for{" "}
        <Link
          href="/industries/medical-and-dental"
          className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
        >
          medical and dental practices
        </Link>
        ,{" "}
        <Link
          href="/industries/legal"
          className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
        >
          law firms
        </Link>
        , and{" "}
        <Link
          href="/industries/trades-and-hvac"
          className="underline decoration-accent-blue/40 underline-offset-4 hover:decoration-accent-blue transition-colors"
        >
          trades and HVAC contractors
        </Link>{" "}
        cover how those constraints change the architecture.
      </p>
    </>
  ),
  link: { label: "Read the full Star Auto case study", href: "/work/star-auto-service" },
};

const cta: IndustryCTA = {
  eyebrow: "Next step",
  heading: "If your shop is ready for a real site, the first step is a 30-minute call.",
  body:
    "I do not run pressure sales. The first call is diagnostic. The goal is to confirm whether a custom build is even the right call for your shop, what scope of engagement makes sense, and what timing looks like on both sides. If the project is not a fit, I will say so and recommend a better path. If you want a fast first read on what your current site is leaving on the table, run a free Pathlight scan against your live URL before the call.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "Run a free Pathlight scan", href: "/pathlight" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "I already have a website. Do I need a rebuild or a redesign?",
    answer:
      "Depends on what is wrong. If the site loads fast on mobile, your phone number is one tap away, and your services are listed in customer language, you may only need a refresh. If the site is on an old WordPress build with a slow theme and a dated trust section, a rebuild is usually the better return. The way to find out without committing is to run a free Pathlight scan against your URL, which produces a scored report and a prioritized fix list in about ninety seconds.",
  },
  {
    question: "Why custom Next.js instead of a templated auto-shop builder?",
    answer:
      "Templated auto-shop builders work for shops that want a generic site fast and cheap. They do not work as well when you want full ownership of your code, custom integrations with your shop management software, or a level of performance and SEO that templated builders cannot consistently deliver. The honest answer depends on what you need the site to do for you over the next five years.",
  },
  {
    question: "Will the site rank in the Google local pack?",
    answer:
      "Ranking in the local pack is mostly a function of your Google Business Profile health, your review velocity, your citations across the web, and the relevance of your site content to the search query. The site itself is not the only factor, but it is a meaningful one. I build with proper LocalBusiness schema, fast mobile performance, and customer-language service pages because those are the inputs Google uses to interpret your shop. The longer reference on what actually moves DFW local rankings is the local SEO hub in the Resources section.",
  },
  {
    question: "Do you handle bilingual content?",
    answer:
      "Yes. Star Auto runs bilingual content in person and on the site. For shops that serve a Spanish-speaking customer base in the Dallas-Fort Worth metro, a Spanish-language toggle on the site reads as a serious commitment to the community and is technically straightforward to ship.",
  },
  {
    question: "What does an auto service site engagement actually cost?",
    answer:
      "Custom Next.js engagements start at twenty-five thousand dollars. Final scope is a per-engagement quote based on the integrations, the content depth, and the timeline. If the site is exclusively a brochure with hours and a phone number and you are firmly under that budget, I will tell you that on the first call and recommend a templated path instead.",
  },
  {
    question: "Can you integrate with my shop management software or scheduling system?",
    answer:
      "Most likely yes. Tekmetric, Mitchell 1, Shopmonkey, and similar shop management platforms expose APIs or embed widgets that integrate cleanly with a Next.js application. The discovery call is where I confirm what your specific stack supports and what the integration scope looks like.",
  },
  {
    question: "What about ongoing maintenance after launch?",
    answer:
      "Two paths. The first is a maintenance retainer where I patch dependencies on a quarterly cadence and apply security updates as they ship. The second is a clean handoff where the GitHub repository, the Vercel project, and a recorded codebase walkthrough are transferred to you. I will recommend whichever fits your shop better, not whichever earns me more.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Pew Research Center",
    year: 2024,
    title: "Mobile Fact Sheet",
    url: "https://www.pewresearch.org/internet/fact-sheet/mobile/",
  },
  {
    id: 2,
    org: "U.S. Bureau of Labor Statistics",
    year: 2024,
    title:
      "Occupational Outlook Handbook: Automotive Service Technicians and Mechanics",
    url: "https://www.bls.gov/ooh/installation-maintenance-and-repair/automotive-service-technicians-and-mechanics.htm",
  },
  {
    id: 3,
    org: "ASE",
    year: 2025,
    title:
      "National Institute for Automotive Service Excellence: certification overview",
    url: "https://www.ase.com",
  },
  {
    id: 4,
    org: "NAPA Auto Care",
    year: 2025,
    title: "NAPA Auto Care Center program",
    url: "https://www.napaautocare.com",
  },
  {
    id: 5,
    org: "Google Search Central",
    year: 2025,
    title: "Local search results: rankings and how Google interprets relevance",
    url: "https://developers.google.com/search/docs/appearance/ranking-systems-guide",
  },
  {
    id: 6,
    org: "W3C",
    year: 2023,
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
  },
];

export function AutoServiceContent() {
  const config = getPageConfig(SLUG);
  if (!config) return null;
  return (
    <IndustryVerticalLayout
      config={config}
      hero={hero}
      sections={sections}
      proof={proof}
      faq={faq}
      cta={cta}
      sources={sources}
    />
  );
}
