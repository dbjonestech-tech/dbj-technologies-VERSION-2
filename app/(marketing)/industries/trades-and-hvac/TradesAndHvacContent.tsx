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

const SLUG = "/industries/trades-and-hvac";

const hero: IndustryHero = {
  eyebrow: "Industry · Trades and HVAC",
  title: "Trades sites that fill the dispatch board,",
  highlight: "before the heat dome breaks the phones.",
  lede:
    "When the air conditioning dies on a hundred-and-five-degree Dallas afternoon, the homeowner is not browsing. They are typing one panicked search and calling whoever answers first. The site that fills the dispatch board treats urgency as the dominant design driver, leads with a tap-to-call phone, surfaces the license number as a trust signal, and reads like a real local business rather than a templated lead-generation funnel. This page covers what those sites do, anchored on the published HVAC contractor design brief.",
  image: {
    src: "/design-briefs/hvac-contractor.webp",
    alt: "HVAC contractor design brief, the published reference architecture for a Dallas-Fort Worth HVAC business",
  },
  caption: "HVAC contractor · Dallas-Fort Worth · published design brief",
};

const sections: IndustrySection[] = [
  {
    id: "homeowner-reality",
    number: "01",
    label: "Homeowner reality",
    heading:
      "How a homeowner actually picks a contractor in a heat or cold emergency",
    body: (
      <>
        <p>
          The trades buyer is rarely shopping. For HVAC, plumbing, and
          electrical, the common case is a no-warning failure: the
          compressor that died Wednesday at three p.m., the water
          heater that flooded the garage, the breaker that tripped
          and will not reset. The emotional state is fear plus
          discomfort plus time pressure, and the buyer is reading the
          site one-handed on a phone in a hot living room while a
          spouse paces in the background.
        </p>
        <p>
          The four questions a trades visitor needs answered before
          they will pick up the phone are: do you actually answer the
          phone right now, can you come today, are you a real licensed
          business, and roughly what does this cost. The site that
          answers those four questions above the fold gets the
          dispatch. The site that requires scrolling to find a phone
          number, or buries the license behind a contact form, or
          hides pricing entirely, loses to the next listed competitor
          in the local pack.
        </p>
        <p>
          The mobile context is overwhelming. Pew Research reports
          that ninety-seven percent of American adults own a cellphone
          and ninety-one percent own a smartphone (Pew Research,
          2024). Trades searches happen at the moment of failure,
          which means almost always on a phone, often in a degraded
          environment (hot, dim, anxious). A site that needs
          desktop-grade scrolling to surface the phone number is a
          site that loses dispatches.
        </p>
        <p>
          For Dallas-Fort Worth specifically, the seasonal demand
          curve is steeper than in most metros. The U.S. Bureau of
          Labor Statistics tracks HVAC mechanic and installer demand
          as growing roughly nine percent through 2033, faster than
          the average occupation, and the heat-dome summer pattern in
          North Texas means a single contractor can handle multiples
          of the average daily call volume in July and August (U.S.
          Bureau of Labor Statistics, Occupational Outlook Handbook,
          2024). The site is a dispatch surface, not a brand
          brochure.
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
      "Texas licensing, EPA refrigerant rules, and the trust signals they create",
    body: (
      <>
        <p>
          Trades work in Texas is licensed work. HVAC contractors
          operate under the Texas Department of Licensing and
          Regulation Air Conditioning and Refrigeration program, which
          issues TACLA (Air Conditioning and Refrigeration
          Contractor) licenses with required surety bonds and
          continuing education (Texas Department of Licensing and
          Regulation, 2024). Plumbers operate under the Texas State
          Board of Plumbing Examiners. Electricians operate under
          TDLR&apos;s Electricians program. Each program issues a
          public license number that the buyer can verify on the
          state&apos;s website in roughly fifteen seconds.
        </p>
        <p>
          A site that surfaces the license number prominently in the
          footer and ideally also above the fold reads as a real
          business rather than as a fly-by-night operator. The trust
          differential between a site with a visible TACLA number and
          a site without one is one of the most measurable signals in
          the trades buyer&apos;s mental checklist. Treating the
          license as a marketing asset, not as fine print, is the
          design move.
        </p>
        <p>
          The federal layer is the EPA Section 608 refrigerant
          handling certification. Anyone servicing equipment that
          contains refrigerants must be 608-certified, and the levels
          (Type I for small appliances, Type II for high-pressure,
          Type III for low-pressure, Universal for all) actually
          shape what the technician can legally do (U.S.
          Environmental Protection Agency, 2024). Sites that name
          which technicians hold which 608 certification levels read
          as more credible to buyers who know the difference, and the
          buyers who know are usually the buyers who have been burned
          before and are choosing carefully.
        </p>
      </>
    ),
    callouts: [
      {
        kind: "legal",
        title: "Texas TACLA licensing requirement",
        body: "HVAC contractors operating in Texas must hold a TACLA license issued by the Texas Department of Licensing and Regulation, with a surety bond, current insurance, and ongoing continuing education. The license number must appear on every advertisement, including the website. Sites that hide it or print it in unreadable footer-gray text read as either careless or unlicensed, and neither reading helps the conversion math.",
        source: {
          name: "Texas Department of Licensing and Regulation, Air Conditioning and Refrigeration program",
          url: "https://www.tdlr.texas.gov/acr/acr.htm",
        },
      },
      {
        kind: "trust",
        title: "EPA Section 608 refrigerant certification",
        body: "Federal law requires every technician who services equipment containing refrigerants to hold a current EPA Section 608 certification at the appropriate level. Naming which technicians hold which 608 levels (Type I, II, III, or Universal) is a legitimate trust signal, especially for high-end equipment work and commercial refrigeration. Vague claims about being 'EPA certified' without specifying levels read as light on detail.",
        source: {
          name: "U.S. Environmental Protection Agency, Section 608",
          url: "https://www.epa.gov/section608",
        },
      },
    ],
    break: { kind: "rule" },
  },
  {
    id: "failure-patterns",
    number: "03",
    label: "Failure patterns",
    heading: "What goes wrong on most trades and HVAC websites",
    body: (
      <>
        <p>
          Five failure patterns I see in nearly every trades site
          audit, in roughly descending order of cost.
        </p>
        <p>
          First, the buried phone number. The site has a clever hero
          animation, a stock photograph of a smiling technician
          giving a thumbs-up, and a long scroll before the phone
          number is reachable. The buyer with a flooded basement does
          not have time for any of this. Tap-to-call as the loudest
          element in the hero is the conversion lever in this
          vertical, and most trades sites bury it under marketing
          copy that the panicked buyer skips entirely.
        </p>
        <p>
          Second, the &ldquo;24/7 emergency service&rdquo; promise
          that goes to voicemail at eight p.m. Either the promise is
          real and answered live by a human or a real after-hours
          dispatch service, or the promise should not be on the site.
          Buyers who hit a voicemail after seeing a 24/7 banner stop
          trusting the rest of the site immediately, and the
          conversion is gone for the entire repeat-customer lifetime.
        </p>
        <p>
          Third, SEO city pills that pretend to be service-area
          pages. The footer lists thirty-five cities the contractor
          claims to serve, each linking to a templated page with the
          city name swapped and one paragraph of identical copy. This
          is a textbook doorway-page violation that gets the entire
          site demoted (Google Search Central, 2024). Real
          service-area pages, written with city-unique substance, are
          a meaningful asset; templated city pills are SEO debt
          dressed up as content. The longer reference on what
          actually moves the local pack is on the{" "}
          <Link
            href="/resources/local-seo-for-dallas-service-businesses"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            local SEO hub
          </Link>
          .
        </p>
        <p>
          Fourth, no pricing transparency at all. Sites that hide
          every dollar amount lose to sites that publish even partial
          pricing, because the buyer is doing risk-math on whether
          the visit will end with a $5,000 estimate they cannot
          decline. A diagnostic-fee figure, a published service-call
          range, a Comfort Club membership price, or a flat-rate
          repair table reads as confidence. Hiding everything reads
          as evasive.
        </p>
        <p>
          Fifth, slow on mobile. Core Web Vitals is a confirmed
          Google ranking input as part of the page experience update
          (Google Search Central, 2021), and trades is one of the
          most paid-search-saturated categories in the country. A
          slow site costs more per click on Google Ads and ranks
          worse organically, every single day. Performance is not a
          luxury; it is the line between a healthy dispatch board and
          a dead one.
        </p>
      </>
    ),
    break: {
      kind: "stat",
      value: "9%",
      label: "Projected ten-year growth in HVAC mechanic and installer employment, U.S. Bureau of Labor Statistics, faster than the average occupation",
      source: {
        name: "U.S. Bureau of Labor Statistics, Occupational Outlook Handbook 2024",
        url: "https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm",
      },
    },
  },
  {
    id: "design-principles",
    number: "04",
    label: "Design principles",
    heading: "What converts a panicked homeowner",
    body: (
      <>
        <p>
          First, tap-to-call as the loudest element in the hero. Not
          a contact form, not a quote builder, not a clever headline
          first. The phone number in display type, with a tap target
          that is an actual phone-handle action on mobile, the area
          code visible, and a concrete promise next to it (live
          answer, average answer time under two minutes, real
          dispatcher rather than a call center).
        </p>
        <p>
          Second, an honest live-answer promise. If the business
          actually answers twenty-four hours a day, name it
          explicitly with the actual coverage hours and how
          after-hours is staffed (in-house dispatcher, partner
          dispatch service, on-call rotation). If the business
          answers eight to six weekdays, say that and offer an
          after-hours form that goes to a real text message, not to
          a generic mailbox. Honest scope of service is a trust
          signal; over-promising is a corrosive one.
        </p>
        <p>
          Third, service-area zones rather than SEO city pills. A map
          showing the actual coverage area, with named cities listed
          inside the zone, beats a list of forty city-named templated
          pages on every measurable axis. For a DFW HVAC contractor,
          the zone might be drawn around the eastern corridor
          (Rockwall, Heath, Royse City, Forney, Rowlett) or the
          northern corridor (Plano, Frisco, McKinney, Allen) and
          listed as a real service territory rather than as a
          keyword-stuffed list. The vertical-specific take on this
          design move is consistent with what works in{" "}
          <Link
            href="/industries/auto-service"
            className="underline decoration-accent-amber/40 underline-offset-4 hover:decoration-accent-amber transition-colors"
          >
            auto service
          </Link>{" "}
          and other DFW-corridor-specific verticals.
        </p>
        <p>
          Fourth, a Comfort Club or maintenance membership offer
          surfaced as a primary path. The membership economy in
          trades is real: HVAC contractors with healthy maintenance
          memberships have predictable revenue floors that one-off
          repair contractors do not. The site that pitches the
          membership clearly, with the included services named and
          the price published, converts a higher share of visitors
          into recurring customers. ENERGY STAR maintenance program
          framing aligns with this: regular maintenance extends
          equipment life and is a buyer-friendly value pitch
          (ENERGY STAR, 2024).
        </p>
        <p>
          Fifth, license and bond numbers in legible type, in the
          footer and in the hero strip if possible. TACLA-license-
          number-as-trust-signal is one of the cleanest design moves
          in the trades vertical because the buyer can verify the
          number on TDLR&apos;s website in fifteen seconds. Treating
          the number as a feature rather than as fine print signals
          confidence.
        </p>
        <p>
          Sixth, accessibility as a floor. Web Content Accessibility
          Guidelines 2.2 (W3C, 2023) is the published accessibility
          standard, and trades is one of the increasingly litigated
          categories for ADA web access claims. Building to WCAG 2.2
          AA from the start is cheaper than retrofitting, and the
          accessible site is a faster site for everyone, panicked
          buyer included.
        </p>
      </>
    ),
    break: {
      kind: "image",
      src: "/design-briefs/hvac-contractor.webp",
      alt: "HVAC contractor design brief layout, with tap-to-call hero, Comfort Club membership, and TACLA license in the footer",
      caption: "Tap-to-call hero, Comfort Club membership, TACLA license number in legible type",
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
          Trades trust signals are stricter than in most categories
          because the buyer has been burned. The signals that matter
          most, in descending order of weight.
        </p>
        <p>
          The TACLA, plumbing, or electrical license number,
          surfaced in legible type, with the issuing-state link to
          verify. This is the single highest-impact trust signal in
          the vertical because it converts skepticism to confidence
          in fifteen seconds. License-as-marketing-asset.
        </p>
        <p>
          Year-stamped customer reviews on Google Business Profile,
          with responses from named technicians or the owner. Quantity
          matters but velocity and response quality matter more.
          Buyers reading reviews are reading the responses as much
          as they are reading the reviews; a defensive response to a
          three-star review reads worse to future buyers than the
          original review did.
        </p>
        <p>
          NATE certification (North American Technician Excellence)
          for HVAC, when the technicians hold it. NATE is the
          industry-recognized certification body for HVAC technician
          competence. Naming which technicians hold NATE
          certification, and at what level, reads as a real trust
          signal to buyers who know the difference. For
          non-NATE-certified technicians, the equivalent is naming
          state-licensure tiers and any manufacturer-specific
          certifications (Trane Comfort Specialist, Carrier Factory
          Authorized Dealer, Lennox Premier Dealer).
        </p>
        <p>
          The named owner or dispatcher in the hero. Trades is a
          relationship business, and the buyer wants to know who
          they are calling. Photos of the actual owner, the actual
          dispatcher, and the actual lead technicians, with names
          underneath, beats stock photography of generic technicians
          on every measurable axis.
        </p>
        <p>
          Real photographs of real trucks, real technicians, and real
          jobs in progress. Stock photography of perfectly clean
          technicians in white uniforms reads as a templated lead-gen
          site, not as a real local trades business. Phone-quality
          photos of the actual fleet, taken at the actual office,
          read as a hundred times more credible.
        </p>
        <p>
          Bilingual content where the customer base supports it. For
          DFW trades businesses, a Spanish-language toggle and
          bilingual dispatch capability is a meaningful conversion
          lift in markets where Spanish-speaking homeowners form a
          substantial share of the call volume.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
];

const proof: IndustryProof = {
  eyebrow: "Reference architecture",
  heading: "The HVAC contractor design brief",
  body: (
    <>
      <p>
        I have published an editorial-grade design brief for a
        Dallas-Fort Worth HVAC contractor as part of the design-briefs
        series. The brief is not a template. It is a thesis on what a
        modern trades site should be, written in enough detail that
        any competent engineer could ship from it.
      </p>
      <p>
        The brief covers a tap-to-call phone as the loudest element
        in the hero, a 24/7 live-answer promise that is actually
        live, a Comfort Club membership offer with the included
        services named and the price published, regional service
        area zones rather than SEO city pills, multimodal contact
        (phone, text, form, after-hours text-to-dispatch), a TACLA
        license number in legible type in the footer, and a
        seasonal-demand-aware page architecture that flexes between
        emergency-call mode in July and August and
        consultative-replacement mode in October and February. It
        is the dispatch desk that fills the board in the heat dome.
      </p>
      <p>
        The same architectural depth applies to plumbing,
        electrical, garage door, and pool service businesses. The
        license programs differ (Texas State Board of Plumbing
        Examiners for plumbers, TDLR Electricians for electricians,
        no state license for garage door or pool service in most
        states), but the underlying principles hold: tap-to-call
        hero, honest live-answer promise, named owner, license as
        trust signal, real photography, fast performance,
        accessible design.
      </p>
    </>
  ),
  link: {
    label: "Read the full HVAC contractor design brief",
    href: "/work/design-briefs/hvac-contractor",
  },
};

const cta: IndustryCTA = {
  eyebrow: "Next step",
  heading:
    "If your shop is ready for a real site, the first step is a 30-minute call.",
  body:
    "I do not run pressure sales. The first call is diagnostic. The goal is to confirm whether a custom build is even the right call for your shop, what scope of engagement makes sense, what the seasonal-demand curve looks like for your business, and whether the integrations you depend on (ServiceTitan, Housecall Pro, Jobber, FieldEdge) will play nicely with the architecture I build. If the project is not a fit, I will say so and recommend a better path. If you want a fast first read on what your current site is leaving on the table, run a free Pathlight scan against your live URL before the call.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "Run a free Pathlight scan", href: "/pathlight" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "How fast can the new site be live before peak season?",
    answer:
      "For an HVAC contractor heading into a Dallas summer, the realistic window is six to ten weeks from kickoff to launch on a Starter or Professional tier engagement. The architecture is proven, so most of the calendar is on content (real photographs, real bios, the Comfort Club pitch, accurate license numbers and bond data) and on integrations with shop management software. If the deadline is tighter than that and the existing site is functional, the audit-and-fix path is faster.",
  },
  {
    question: "Will the site integrate with ServiceTitan, Housecall Pro, Jobber, or FieldEdge?",
    answer:
      "Yes. All four expose APIs or embeddable widgets that play cleanly with a Next.js application. The discovery call confirms which platform you run, which integrations you actually need (online booking, technician dispatch, customer review automation, membership management), and what the integration scope looks like. ServiceTitan in particular has a deep API surface that supports real custom integrations for shops that have outgrown the off-the-shelf widget.",
  },
  {
    question: "Do I need a separate page for every city I serve?",
    answer:
      "No. Real service-area zone pages, written with city-unique substance and at least two to three hundred words of content unique to that geography, are valuable. Templated city pills with the city name swapped trigger Google's doorway-page filter and demote the entire site. For most DFW trades businesses, two to four real zone pages outperform thirty templated city pills, and the maintenance cost is dramatically lower.",
  },
  {
    question: "How do you handle bilingual Spanish-language content?",
    answer:
      "For DFW trades businesses serving a substantial Spanish-speaking customer base, a Spanish-language toggle plus bilingual dispatch capability is a meaningful conversion lift. Translation work is a real cost (a professional translator, not machine translation, especially for technical and warranty language), and the customer base needs to support it for the cost to make sense. The discovery call covers whether the call mix supports the work.",
  },
  {
    question: "What does a custom trades or HVAC site engagement actually cost?",
    answer:
      "Custom Next.js engagements start at four thousand five hundred dollars for the Starter tier and scale up from there based on integrations, service-area complexity, and bilingual content. The longer reference on what each tier should actually cost in 2026, with ranges and drivers of cost, is on the cost guide. If your business is a true two-truck shop with one zip code of coverage and you are firmly under that budget, I will tell you that on the first call and recommend a templated path instead.",
  },
  {
    question:
      "Will my new site rank in the Google local pack for searches like 'HVAC repair near me'?",
    answer:
      "Local pack ranking on competitive trades queries is a function of Google Business Profile health, review velocity and quality, citations across trades-specific directories, and the relevance of your site content. The site itself is a meaningful contributor through proper LocalBusiness schema, fast mobile performance, and customer-language service pages. Trades is one of the most competitive paid-search categories in DFW, so organic visibility takes time to build; expect three to nine months for meaningful organic position depending on the competition in your zone.",
  },
  {
    question: "What about ongoing maintenance and seasonal updates?",
    answer:
      "Trades sites flex with the season: July and August lean hard into emergency-call mode, October and February lean into consultative-replacement mode, and the holidays are quiet. The site should support a simple content calendar that lets you swap hero copy seasonally, surface different membership offers, and pin priority pages without a developer in the loop. I build a small admin layer for this when scope permits, or recommend a CMS-backed approach when the volume warrants it.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "U.S. Bureau of Labor Statistics",
    year: 2024,
    title: "Occupational Outlook Handbook: Heating, Air Conditioning, and Refrigeration Mechanics and Installers",
    url: "https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm",
  },
  {
    id: 2,
    org: "Texas Department of Licensing and Regulation",
    year: 2024,
    title: "Air Conditioning and Refrigeration program: TACLA license and continuing education",
    url: "https://www.tdlr.texas.gov/acr/acr.htm",
  },
  {
    id: 3,
    org: "U.S. Environmental Protection Agency",
    year: 2024,
    title: "Section 608: Stationary Refrigeration Technician Certification",
    url: "https://www.epa.gov/section608",
  },
  {
    id: 4,
    org: "ENERGY STAR",
    year: 2024,
    title: "Heating, ventilating, and air conditioning maintenance and equipment programs",
    url: "https://www.energystar.gov/",
  },
  {
    id: 5,
    org: "Pew Research Center",
    year: 2024,
    title: "Mobile Fact Sheet",
    url: "https://www.pewresearch.org/internet/fact-sheet/mobile/",
  },
  {
    id: 6,
    org: "Google Search Central",
    year: 2021,
    title: "Page experience update: Core Web Vitals as a ranking signal",
    url: "https://developers.google.com/search/blog/2021/04/more-details-page-experience",
  },
];

export function TradesAndHvacContent() {
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
