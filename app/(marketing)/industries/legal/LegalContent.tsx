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

const SLUG = "/industries/legal";

const hero: IndustryHero = {
  eyebrow: "Industry · Law Firms",
  title: "Legal websites that sign the case,",
  highlight: "without tripping the Bar advertising rules.",
  lede:
    "A person hiring a lawyer is rarely browsing. They are reacting to a specific event, an accident, a citation, divorce papers, an IRS letter, a contract dispute, and they are reading the site in the first ninety seconds after typing a panicked search. The site that signs the case answers the case-fit question fast, treats the State Bar advertising rules as a feature rather than an afterthought, and reads like the firm it represents. This page covers what those sites do, anchored on a published design brief I wrote for a Dallas personal injury practice.",
  image: {
    src: "/design-briefs/pi-law.webp",
    alt: "Personal injury law design brief, the published reference architecture I wrote for a Dallas-area injury firm",
  },
  caption: "Personal injury law · Dallas · published design brief",
};

const sections: IndustrySection[] = [
  {
    id: "buyer-reality",
    number: "01",
    label: "Client reality",
    heading:
      "How a person actually picks a lawyer in the first ninety seconds",
    body: (
      <>
        <p>
          A legal client is almost never casual. They are choosing a
          personal injury attorney because they were rear-ended on
          Central Expressway on Tuesday, or choosing a family lawyer
          because divorce papers arrived Friday, or choosing a tax
          lawyer because the IRS letter is dated this month. The
          emotional state is fear plus time pressure, and the time
          pressure is the conversion blocker.
        </p>
        <p>
          The five questions a legal visitor needs answered before they
          will pick up the phone are: do you handle my specific kind
          of case, have you actually won cases like mine, who is going
          to be my lawyer (not my intake clerk), how fast can I talk to
          a real attorney, and what does this cost or how does the fee
          work. The site that answers those five questions above the
          fold gets the consultation. The site that buries any of them
          behind a generic contact form loses to the next listed firm
          on the search results page.
        </p>
        <p>
          The mobile context is heavier in legal than in most service
          categories. Pew Research reports that ninety-seven percent of
          American adults own a cellphone and ninety-one percent own a
          smartphone (Pew Research, 2024). Personal injury searches in
          particular happen disproportionately on phones, often from
          the scene of the accident, often in the emergency room
          waiting area, often in a car with an adjuster on the other
          line. A site that needs desktop-grade scrolling to surface a
          phone number is a site that loses signed cases.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "regulatory-layer",
    number: "02",
    label: "Compliance",
    heading:
      "State Bar advertising rules are the unique constraint and the unique advantage",
    body: (
      <>
        <p>
          Every other industry page on this site talks about
          regulation as a layer the site has to respect. For law firm
          sites, regulation is the dominant constraint. In Texas, Part
          VII of the Texas Disciplinary Rules of Professional Conduct
          governs everything a lawyer publishes about their services,
          including the firm website, every landing page, every
          social-media bio, and every paid advertisement (State Bar of
          Texas, Texas Disciplinary Rules of Professional Conduct,
          Rules 7.01 through 7.05). The American Bar Association Model
          Rules 7.1 through 7.3, which most other states adopt with
          minor variation, set a similar floor at the federal level
          (American Bar Association, Model Rules of Professional
          Conduct, Rule 7.1).
        </p>
        <p>
          The rules are stricter than most lawyers realize. Rule 7.02
          forbids false or misleading communication about the lawyer
          or the lawyer&apos;s services, which means the marketing copy
          that reads as energetic in other categories (best, top-rated,
          number one) is a disciplinary risk in legal unless it is
          backed by a verifiable third-party source and dated. Rule
          7.04 requires that any communication about a lawyer&apos;s
          services identify at least one lawyer responsible for the
          content, by name. Rule 7.03 restricts solicitation in
          specific ways that affect contact-form copy, lead-magnet
          copy, and follow-up email sequences.
        </p>
        <p>
          The right way to think about this is not as a compliance
          tax. It is as a positioning advantage. The settlement-mill
          firms that flood paid search with template copy frequently
          violate these rules in small but cumulative ways, and a site
          that visibly takes the rules seriously, with a named
          responsible attorney in the footer, dated and sourced
          credentials, and accurate practice descriptions, reads as
          more credible to the exact buyer who is choosing between
          firms. The architecture I publish below treats the
          advertising notice as a trust signal, not as fine print.
        </p>
      </>
    ),
    callouts: [
      {
        kind: "legal",
        title: "Texas advertising notice requirement",
        body: "Every law firm website published in Texas must identify at least one Texas-licensed attorney responsible for the content, by name. The advertising notice typically lives in the footer alongside the bar number and the office of record. It is the single most commonly missed compliance item I see on Texas legal sites.",
        source: {
          name: "State Bar of Texas, Texas Disciplinary Rules of Professional Conduct, Rule 7.04",
          url: "https://www.texasbar.com/AM/Template.cfm?Section=Texas_Disciplinary_Rules_of_Professional_Conduct",
        },
      },
      {
        kind: "trust",
        title: "ABA Model Rule 7.1: no false or misleading communication",
        body: "A lawyer shall not make a false or misleading communication about the lawyer or the lawyer's services. A communication is false or misleading if it contains a material misrepresentation of fact or law, or omits a fact necessary to make the statement considered as a whole not materially misleading. Most states have adopted Rule 7.1 verbatim or with minor variation. Adjective-heavy marketing copy fails this test routinely.",
        source: {
          name: "American Bar Association, Model Rules of Professional Conduct, Rule 7.1",
          url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/",
        },
      },
    ],
    break: { kind: "rule" },
  },
  {
    id: "failure-patterns",
    number: "03",
    label: "Failure patterns",
    heading: "What goes wrong on most law firm websites",
    body: (
      <>
        <p>
          Five failure patterns I see in nearly every legal site audit
          I run, in roughly descending order of cost.
        </p>
        <p>
          First, the settlement-mill template look. The firm pays for
          a templated legal-vertical site from a vendor that ships
          hundreds of nearly identical sites per year. The hero is a
          stock photograph of a courthouse or a gavel, the headline is
          a generic adjective string (aggressive, experienced, trusted),
          and the bio pages all read like LinkedIn profiles. The
          buyer comparing three firms on a phone in a parking lot
          cannot tell the firms apart, so they pick the one with the
          most reviews. Templated does not mean cheap. It means
          interchangeable.
        </p>
        <p>
          Second, false specificity. The firm lists fifteen practice
          areas on the homepage to capture every search query, but the
          attorneys actually focus on three. A buyer searching for a
          specific case type lands on the page, sees their case type
          listed, calls in, and discovers in the consultation that the
          firm does not actually take the case. The buyer feels
          deceived, the firm feels frustrated, and a paid click was
          burned. Listing only what you actually take, and being
          explicit about what you refer out, converts better and
          generates fewer no-fit calls.
        </p>
        <p>
          Third, the missing or minimized advertising notice. The Bar
          notice is required, so the firm includes it, but in
          eight-point gray text at the very bottom of the footer where
          no buyer will read it. Treating the notice as fine print
          rather than as a trust signal sends the wrong message to the
          buyer who is doing risk-math on you.
        </p>
        <p>
          Fourth, ego-led bio pages. Every attorney bio leads with
          twelve paragraphs of academic and professional history, and
          buries the actual answer to the buyer&apos;s question (what
          kinds of cases have you handled, what were the outcomes,
          what is your style, can I work with you) under the
          chronology. Buyers reading bios want a thesis, not a CV. The
          fix is to lead with practice focus, name two or three
          representative outcomes (when ethically allowed), and let
          the credential list serve as evidence rather than as
          headline.
        </p>
        <p>
          Fifth, slow on mobile. Core Web Vitals is a confirmed Google
          ranking input as part of the page experience update (Google
          Search Central, 2021), and legal is one of the most
          competitive paid-search categories in the country, which
          means organic local pack visibility is disproportionately
          valuable. A firm with a slow site is paying more per click
          on Google Ads than a competitor with a fast site, every
          single day. The performance difference shows up as both lost
          ad budget and lost organic position.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "$152K",
      label: "Median solo and small-firm law office annual revenue per attorney, Clio 2024 Legal Trends Report",
      source: {
        name: "Clio Legal Trends Report 2024",
        url: "https://www.clio.com/resources/legal-trends/",
      },
    },
  },
  {
    id: "design-principles",
    number: "04",
    label: "Design principles",
    heading: "What converts legal traffic",
    body: (
      <>
        <p>
          First, an above-the-fold answer to the case-fit question.
          For personal injury, that means the practice areas listed
          plainly, with named case types underneath each (rear-end
          collisions, commercial vehicle, premises liability),
          along with a same-business-day attorney callback offer. For
          family law, it means the practice areas listed with the
          specific situations underneath (contested divorce, custody
          modification, prenuptial agreement), and a clear path to
          schedule a consultation. The buyer should know within fifteen
          seconds whether the firm handles their case.
        </p>
        <p>
          Second, a verdicts and outcomes section, written within the
          rules. Texas Rule 7.02 and ABA Rule 7.1 both require that
          claims about prior results be presented accurately and
          without misleading implication. The architecture I use is a
          verdicts ledger: each entry names the dollar amount, the
          county, the year, the case type, and a one-sentence operational
          arc, with a disclaimer that prior results do not guarantee a
          similar outcome. This treats the rule as a feature. The
          ledger reads as substantive precisely because it is dated and
          sourced.
        </p>
        <p>
          Third, headline copy that uses the customer&apos;s actual
          search language, not internal legal jargon. &ldquo;Hit by a
          drunk driver in Dallas County&rdquo; and &ldquo;Slip and
          fall at a Dallas grocery store&rdquo; are not weak headlines.
          They are the exact phrases the customer typed into Google,
          and they are phrases Google rewards. Decorative headlines
          that read like a luxury watch ad are the wrong choice for
          this vertical. The longer reference on how Google scores
          local intent for DFW service businesses is{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Local SEO for Dallas Service Businesses
          </Link>
          .
        </p>
        <p>
          Fourth, named attorneys with named contact paths. The bio
          page leads with practice focus and representative outcomes,
          then the credentials. Each attorney has a direct phone
          number, a direct email, and a calendar link if appropriate,
          surfaced in the bio rather than buried in a generic contact
          form. Buyers want to talk to a person; the site that makes
          that obvious wins the call.
        </p>
        <p>
          Fifth, multi-office disambiguation when relevant. Firms with
          three offices need three separate location pages, each with
          a unique map, a unique direct phone, named attorneys
          assigned to that office, and substantive copy about the
          county and the courthouses that office serves. Templated
          location pages with a city name swapped trigger
          Google&apos;s doorway-page filter and demote the entire site
          (Google Search Central, 2024). A firm with three real
          location pages outperforms a firm with twelve fake ones.
        </p>
        <p>
          Sixth, accessibility as a floor, not a feature. Web Content
          Accessibility Guidelines 2.2 (W3C, 2023) is the published
          accessibility standard, and legal is one of the most
          frequently litigated industries for ADA web access claims.
          Building to WCAG 2.2 AA from the start is cheaper than
          retrofitting after a demand letter, and the firms that get
          targeted are most often the firms whose own sites visibly
          fail the standard.
        </p>
      </>
    ),
    break: {
      kind: "image",
      src: "/design-briefs/pi-law.webp",
      alt: "Personal injury law design brief layout, with verdicts ledger and bilingual urgent strip",
      caption: "Verdicts ledger, bilingual urgent strip, named responsible attorney in the footer",
    },
  },
  {
    id: "trust-signals",
    number: "05",
    label: "Trust signals",
    heading: "What signals the buyer is actually reading",
    body: (
      <>
        <p>
          Legal trust signals are stricter than in most categories
          because the buyer is risk-averse and the regulatory frame
          requires accuracy. The signals that matter most, in
          descending order of weight.
        </p>
        <p>
          Board certification, when the attorney holds it. In Texas, a
          Texas Board of Legal Specialization certification in a
          specific area (personal injury trial law, family law, tax
          law) is a meaningful credential because fewer than ten
          percent of Texas attorneys hold one in any given area. If
          the firm has a board-certified attorney, the certification
          should be visible in the hero, not buried in the bio.
        </p>
        <p>
          Year-stamped peer recognition. Super Lawyers, Best Lawyers,
          Texas Monthly, Martindale-Hubbell. Each one is allowed under
          Rule 7.02 if the recognition is real, the year is named, and
          the methodology is accurate. Year-stamping matters: a
          &ldquo;Super Lawyers 2018&rdquo; badge is honest; a generic
          &ldquo;Super Lawyers&rdquo; badge with no year is misleading
          and arguably violates Rule 7.02.
        </p>
        <p>
          The named responsible attorney in the footer, with bar
          number and office of record. This satisfies Texas Rule 7.04
          and reads as a trust signal at the same time. Treating the
          notice as a feature, in legible type next to the office
          address, signals confidence rather than apologetic
          compliance.
        </p>
        <p>
          Real reviews on Google, Avvo, and Justia, with responses
          from named attorneys. Quantity matters but velocity and
          response quality matter more. Generic responses copy-pasted
          across every review hurt rather than help; a genuine
          two-line reply that names the case type and thanks the
          client outperforms a wall of identical responses.
        </p>
        <p>
          Bilingual content where the client base supports it. For
          DFW personal injury and family law practices, a Spanish-
          language toggle, an explicit bilingual-staff promise, and
          intake forms in both languages reads as a real commitment
          rather than as a marketing veneer. The conversion lift in
          markets where Spanish-speaking clients form a meaningful
          share of intake is substantial.
        </p>
        <p>
          What buyers do not read as trust: stock courthouse
          photography, generic adjectives (aggressive, dedicated,
          passionate), and unverifiable superlatives. The Bar rules
          police the latter; the buyer&apos;s skepticism polices the
          rest.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
];

const proof: IndustryProof = {
  eyebrow: "Reference architecture",
  heading: "The personal injury law design brief",
  body: (
    <>
      <p>
        I have published an editorial-grade design brief for a Dallas
        personal injury law practice as part of the design-briefs
        series. The brief is not a template. It is a thesis on what a
        modern personal injury site should be, written in enough
        detail that any competent engineer could ship from it.
      </p>
      <p>
        The brief covers a 24/7 bilingual urgent strip with a verdicts
        ticker, an above-the-fold intake with a same-business-day
        attorney callback in the partner&apos;s first-person voice, a
        verdicts ledger that names the dollar amount and the county
        and the operational arc of every case, eight practice-area
        cards that read like briefs rather than like keyword stuffing,
        a settlement-mill positioning headline backed by board
        certification, year-stamped peer recognition, four contact
        channels with a bilingual human-not-bot commitment, three
        offices with three direct numbers, and a State Bar of Texas
        advertising notice that names the responsible attorney by
        name in legible type. It is the architecture that signs cases
        the same business day.
      </p>
      <p>
        The same architectural depth applies to family law, tax law,
        criminal defense, and business law practices. The trust
        signals shift (the certifications differ, the verdicts ledger
        becomes a representative-matters list when verdicts cannot be
        named, the urgent strip flexes from a 24/7 callback to a
        consultation booking), but the underlying principles hold:
        case-fit answer, accurate outcomes, named attorneys, fast
        performance, accessible design, visible compliance.
      </p>
    </>
  ),
  link: {
    label: "Read the full personal injury law design brief",
    href: "/work/design-briefs/pi-law",
  },
};

const cta: IndustryCTA = {
  eyebrow: "Next step",
  heading:
    "If your firm is ready for a real site, the first step is a 30-minute call.",
  body:
    "I do not run pressure sales. The first call is diagnostic. The goal is to confirm whether a custom build is even the right call for your firm, what scope of engagement makes sense, what the State Bar review timing looks like on both sides, and whether the practice areas align with the kind of work I do. If the project is not a fit, I will say so and recommend a better path. If you want a fast first read on what your current site is leaving on the table, run a free Pathlight scan against your live URL before the call.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "Run a free Pathlight scan", href: "/pathlight" },
};

const faq: { question: string; answer: string }[] = [
  {
    question:
      "Will the site comply with my state's bar advertising rules out of the box?",
    answer:
      "I build to the published Texas Disciplinary Rules of Professional Conduct, Part VII, by default, and to ABA Model Rules 7.1 through 7.3 as the federal floor. The advertising notice is treated as a trust signal in the footer, not as fine print. For practices outside Texas, the discovery call covers any state-specific variations to the rules I need to apply (a handful of states have stricter solicitation rules, a few require pre-publication review by the state bar). The legal review of the final copy is yours; the architectural compliance is mine.",
  },
  {
    question:
      "Can I list verdicts and settlements on the site?",
    answer:
      "In Texas, yes, within Rule 7.02. Each verdict or settlement entry should name the amount, the county, the year, the case type, and the operational arc, with a clear disclaimer that prior results do not guarantee a similar outcome. Vague banner claims like 'millions recovered' without a specific verdict ledger underneath read as misleading and are a Rule 7.02 risk. Practices in states with stricter rules (a few states limit verdict advertising) need a representative-matters list rather than a ledger; the architecture supports both.",
  },
  {
    question:
      "How is this different from the templated legal vendors that quote $300 per month?",
    answer:
      "The templated vendors ship hundreds of nearly identical sites per year. The architecture is the same across firms, the case-type pages are interchangeable, and the SEO ceiling is low because Google has seen the template ten thousand times. A custom build is more expensive up front but the marginal cost of adding a practice area, a verdict, or a new attorney is near-zero, and the SEO ceiling is meaningfully higher because the content is unique. The right call depends on practice scale and longevity.",
  },
  {
    question: "Do I need separate pages for each office location?",
    answer:
      "Yes if the offices are real. Multi-office firms benefit from a separate location page per office, each with a unique map, a direct phone, named attorneys assigned to that office, and substantive county and courthouse content. Templated location pages with the city swapped are a doorway-page violation that can demote the entire site. The discovery call confirms which offices have enough unique substance to warrant a real page and which should consolidate.",
  },
  {
    question: "How do you handle bilingual Spanish-language content?",
    answer:
      "For DFW personal injury and family law practices serving a substantial Spanish-speaking client base, a Spanish-language toggle and bilingual intake forms are a meaningful conversion lift. Translation work is a real cost (a professional legal translator, not a machine translation), and the client base needs to support it for the cost to make sense. The discovery call covers whether the firm&apos;s intake mix justifies the work.",
  },
  {
    question:
      "What does a custom legal site engagement actually cost?",
    answer:
      "Custom Next.js engagements start at four thousand five hundred dollars for the Starter tier and scale up from there based on practice areas, multi-office complexity, and bilingual content. The longer reference on what each tier should actually cost in 2026, with ranges and drivers of cost, is on the cost guide. If your firm is a true solo with one office and three practice areas and you are firmly under that budget, I will tell you that on the first call and recommend a templated path instead.",
  },
  {
    question: "Will my new site rank for searches like 'personal injury lawyer Dallas'?",
    answer:
      "Local pack ranking on competitive legal queries is a function of Google Business Profile health, review velocity and quality, citations across the legal directories (Avvo, Justia, FindLaw, Martindale, Super Lawyers), and the relevance of your site content. The site itself is a meaningful contributor through proper LegalService schema, fast mobile performance, and customer-language case pages. Legal is one of the most competitive paid-search categories in the country, so organic visibility takes time to build; expect six to twelve months for meaningful organic position on a competitive vertical.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "State Bar of Texas",
    year: 2024,
    title: "Texas Disciplinary Rules of Professional Conduct, Part VII (Information About Legal Services), Rules 7.01 through 7.05",
    url: "https://www.texasbar.com/AM/Template.cfm?Section=Texas_Disciplinary_Rules_of_Professional_Conduct",
  },
  {
    id: 2,
    org: "American Bar Association",
    year: 2024,
    title: "Model Rules of Professional Conduct, Rule 7.1: Communications Concerning a Lawyer's Services",
    url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/",
  },
  {
    id: 3,
    org: "Clio",
    year: 2024,
    title: "Legal Trends Report 2024: practice economics and client behavior",
    url: "https://www.clio.com/resources/legal-trends/",
  },
  {
    id: 4,
    org: "Pew Research Center",
    year: 2024,
    title: "Mobile Fact Sheet",
    url: "https://www.pewresearch.org/internet/fact-sheet/mobile/",
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

export function LegalContent() {
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
