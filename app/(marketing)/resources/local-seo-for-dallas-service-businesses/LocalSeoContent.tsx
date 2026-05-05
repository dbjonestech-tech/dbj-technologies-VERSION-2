"use client";

import Link from "next/link";
import { EditorialLayout } from "@/components/templates/EditorialLayout";
import type {
  EditorialCTA,
  EditorialHero,
  EditorialSection,
} from "@/components/templates/EditorialLayout";
import { getPageConfig } from "@/lib/page-system/resolve";
import type { SourceEntry } from "@/lib/page-system/types";

const SLUG = "/resources/local-seo-for-dallas-service-businesses";

const hero: EditorialHero = {
  eyebrow: "Local SEO · Hub page",
  title:
    "Local SEO for Dallas service businesses, without the snake oil.",
  subtitle:
    "Most local SEO advice for Dallas service businesses is either generic national content with the word Dallas pasted in, or vendor pitches dressed up as guides. This page is neither. It is what I have learned shipping production sites in this market, what Google itself says about local rankings, and the honest places where most shops are wasting money.",
};

const sections: EditorialSection[] = [
  {
    id: "what-local-seo-is",
    heading: "What local SEO actually means in DFW",
    body: (
      <>
        <p>
          Local SEO is the work of getting your service business to appear
          when somebody in your service area types a query that has local
          intent. The output you care about is two things: a position in
          the Google local pack (the map block with three businesses near
          the top of the page) and a rank in the standard organic results
          below it. Service businesses with a fixed address or service
          area almost always need both.
        </p>
        <p>
          The reason DFW is its own conversation rather than a generic
          case is the size and density of the metro. The Federal Reserve
          Bank of Dallas tracks DFW as one of the fastest-growing major
          metropolitan economies in the country, and the
          Dallas-Plano-Irving metropolitan division is the financial
          services hub for the South (Federal Reserve Bank of Dallas,
          2025). Search competition here looks more like Atlanta or
          Phoenix than like a typical mid-sized market, but the customer
          behavior is still local. People in McKinney search for things
          in McKinney. People in Park Cities search inside Park Cities.
          People in Royse City search for things in Royse City. Ranking
          everywhere from one Dallas-pinned listing is structurally
          impossible, and chasing it is one of the most common ways DFW
          service businesses waste money.
        </p>
        <p>
          The thing local SEO is not is a separate technical discipline
          that replaces normal SEO. It is normal SEO, plus a Google
          Business Profile, plus a layer of structured data, plus a
          strategy for location pages that does not look like spam to
          Google. Everything else is detail.
        </p>
      </>
    ),
  },
  {
    id: "three-signals",
    heading:
      "The three signals Google says actually move local rankings",
    body: (
      <>
        <p>
          Google publishes its local-ranking framework in plain English,
          which is something most SEO content treats as an inconvenient
          fact. The three signals Google states matter for local
          rankings are <strong>relevance</strong>,{" "}
          <strong>distance</strong>, and <strong>prominence</strong>{" "}
          (Google Search Central, 2025). Every other tactic in this
          category is downstream of one of those three.
        </p>
        <p>
          <strong>Relevance</strong> is how well your business profile
          and your site match what the searcher typed. If somebody
          searches for <em>dental implants in Plano</em>, the practice
          that explicitly covers dental implants on its site and
          Business Profile beats the general-dentistry listing that
          mentions implants once in a long paragraph. Relevance is
          mostly a content-and-categorization problem, and most service
          businesses lose ground here because they describe themselves
          the way they bill, not the way the customer searches.
        </p>
        <p>
          <strong>Distance</strong> is how far the searcher is from the
          business. Distance is calculated from the searcher&apos;s
          location to the business&apos;s pin, and the pin is set in
          your Google Business Profile. You cannot move your pin
          without changing your actual physical address, which is a
          feature, not a bug. Trying to place pins in cities you do
          not have a presence in is one of the fastest ways to get a
          Business Profile suspended and one of the slowest ways to
          recover it.
        </p>
        <p>
          <strong>Prominence</strong> is how well-known your business
          is. Prominence is what the local pack uses to break ties.
          Google builds prominence from a mix of your review count and
          rating, your backlinks, the number and quality of your
          citations across the web, your local news mentions, and the
          strength of your regular SEO signals. Prominence is the slow
          signal. Most of the tactical work in local SEO is about
          making prominence build faster than it would otherwise.
        </p>
      </>
    ),
    break: {
      kind: "quote",
      quote:
        "Trying to place pins in cities you do not have a presence in is one of the fastest ways to get a Business Profile suspended.",
    },
  },
  {
    id: "gbp",
    heading: "Google Business Profile, what to fill in and what to ignore",
    body: (
      <>
        <p>
          Google Business Profile is the single most important local
          SEO asset for a service business. It is also the asset most
          often left half-finished. The full-completeness checklist is
          short and worth executing without exception.
        </p>
        <p>
          Set the primary category to the most specific category Google
          offers. <em>Auto Repair Shop</em> beats <em>Auto Service</em>;
          {" "}<em>Cosmetic Dentist</em> beats <em>Dentist</em> if both
          are accurate. Add additional categories for every service
          line you actually deliver, but never categories you do not.
          Misleading categorization triggers Google&apos;s spam filter
          and gets the listing demoted or suspended. The vertical-specific
          take on how this plays out in one industry is on the{" "}
          <Link
            href="/industries/auto-service"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            auto service page
          </Link>
          .
        </p>
        <p>
          Write the business description in the customer&apos;s
          language. List every service that has its own customer query
          as its own item under <em>Services</em>. Add at least ten
          current photos of the inside of the shop, the team, the
          work, and the storefront. Hours of operation must be exact,
          including holiday hours, because Google tracks this and
          surfaces &ldquo;hours updated by this business&rdquo; as a
          freshness signal. The phone number must be your actual local
          number, not a tracked number, since tracking numbers can
          break NAP consistency across the web.
        </p>
        <p>
          The two GBP features that matter more than people realize are
          {" "}<em>Posts</em> and the <em>Q&amp;A</em> section. Posts
          are the closest thing GBP has to a content channel. Posting
          every week or two on actual updates, seasonal services, or
          recent work gives Google fresh business-side signal and keeps
          the listing looking active. Q&amp;A is public-facing, and
          abandoned Q&amp;A sections are where competitors and
          pranksters write answers for you. Answer your own most
          common questions there before anybody else does.
        </p>
        <p>
          The features that matter less than people sell them: chasing
          a specific badge, micro-formatting the description, or
          ticking every available attribute box. Spend the time on
          the fields that actually move rankings and the photos.
        </p>
      </>
    ),
  },
  {
    id: "technical-layer",
    heading: "NAP consistency, citations, and structured data",
    body: (
      <>
        <p>
          NAP stands for Name, Address, Phone. NAP consistency means
          the business name, address, and phone number are written
          exactly the same way everywhere on the web that Google
          checks. <em>Suite 200</em> versus <em>Ste 200</em> matters.
          {" "}<em>Joshua&apos;s Auto Repair</em> versus{" "}
          <em>Joshua&apos;s Auto Repair, LLC</em> matters. Citations
          are the third-party listings that publish your NAP, including
          Yelp, BBB, the Yellow Pages, Apple Maps, Bing Places, your
          local Chamber of Commerce, and dozens of niche industry
          directories. NAP-inconsistent citations confuse the local
          algorithm because Google is trying to figure out whether the
          listings are about the same business, and small text
          differences slow that decision down.
        </p>
        <p>
          The fix is to lock one canonical NAP string in writing, then
          audit every existing citation against it. Tools like Moz
          Local, BrightLocal, or Yext can do bulk audits and fixes,
          and so can a solo human with a spreadsheet and a few hours.
          Both approaches work. The mistake is to skip the
          canonical-string step, which is how shops end up with five
          slightly different versions of their own address scattered
          across forty directories.
        </p>
        <p>
          Structured data is the layer Google reads programmatically.
          The schema you want for a service business is{" "}
          <code>LocalBusiness</code> or one of its subtypes (such as
          {" "}<code>HVACBusiness</code>, <code>Dentist</code>,{" "}
          <code>LegalService</code>, <code>AutoRepair</code>),
          expressed as JSON-LD in the head of every page on the site
          (Schema.org, 2024; Google Search Central, 2025). At minimum
          the schema should include the legal business name, the
          canonical NAP, the URL, the precise geographic coordinates,
          opening hours, and the area served. Adding aggregate ratings
          is allowed only when the rating is first-party from your
          actual customers; faking review schema gets manual actions
          issued by Google&apos;s spam team.
        </p>
        <p>
          The thing structured data is not is a magic ranking boost.
          Schema does not directly raise position. What it does is
          help Google parse your page accurately, which raises the
          chance you appear in rich results, knowledge panels, and
          the local pack when the algorithm has a clean read on what
          you do.
        </p>
      </>
    ),
    break: {
      kind: "quote",
      quote:
        "Schema does not directly raise position. It helps Google parse your page accurately, which is a different thing.",
    },
  },
  {
    id: "reviews",
    heading: "Reviews, the prominence signal everyone underweights",
    body: (
      <>
        <p>
          Reviews are the prominence signal you have the most direct
          control over, and the one most service businesses fail to
          use systematically. According to BrightLocal&apos;s 2024
          Local Consumer Review Survey, the share of consumers who
          read online reviews for local businesses sits around three
          quarters or higher across major service verticals, and the
          share who say reviews influence which business they choose
          is similarly high (BrightLocal, 2024). The number of reviews
          and the average rating are both inputs to Google&apos;s
          prominence calculation, and review velocity matters too: a
          steady stream of fresh reviews reads more authentically than
          a pile of identical five-stars from one calendar month.
        </p>
        <p>
          The system that works for review velocity is not a campaign.
          It is a habit. After every successful service interaction,
          your team or your software sends one polite ask to the
          customer, by SMS or email, with a direct link to your
          Google Business Profile review page. Many shop-management
          platforms have this built in. For shops without it, a plain
          email-and-link pattern works fine. The volume target is one
          or two new reviews a week for a small shop, more for a
          larger one. Anything dramatically faster than your
          competitors&apos; baseline reads as suspicious to both
          Google and customers.
        </p>
        <p>
          The other half of reviews is responding. Respond to every
          review, positive or negative, in a calm and specific tone.
          Generic responses copy-pasted across every review hurt
          rather than help, because they read as template work. A
          genuine two-line reply that names the service performed and
          thanks the customer by first name does the work in fifteen
          seconds and reinforces the prominence signal at the same
          time.
        </p>
        <p>
          Negative reviews are not the disaster they feel like. A
          response that takes responsibility, offers a real path to
          make it right, and avoids defensiveness reads better to
          future customers than a flawless five-star wall does.
          Future customers are reading the response as much as they
          are reading the review.
        </p>
      </>
    ),
  },
  {
    id: "location-pages",
    heading: "When location pages help, when they look like spam",
    body: (
      <>
        <p>
          Location pages are pages on your site dedicated to a
          specific city or neighborhood you serve. Done well, they
          help you rank in markets you operate in but cannot place a
          Business Profile pin in. Done poorly, they trip
          Google&apos;s doorway-page filter and get the entire site
          demoted (Google Search Central, 2024). The line between the
          two is sharper than it looks.
        </p>
        <p>
          A real location page is genuinely useful to a customer in
          that specific market. It includes named local context, real
          local examples, an explanation of how you serve that
          geography, and something the reader cannot get from a
          generic services page. Two hundred or three hundred words
          of substance unique to that city is a working floor. A site
          I would write for an HVAC company serving the eastern DFW
          corridor would have a Forney page that mentions named local
          industries, the typical age of the housing stock, the real
          drive radius from the main shop, and the nearest local
          landmarks. None of that copy could appear on the Heath page
          or the Rockwall page without lying.
        </p>
        <p>
          A spam location page swaps the city name in a template and
          publishes a hundred copies. Google&apos;s helpful content
          system has been actively detecting and demoting this
          pattern for several years (Google Search Central, 2024).
          If your location page would still make sense to a reader if
          you swapped the city name out, it is not actually a
          location page; it is spam with a city name. Build fewer
          real ones rather than many fake ones.
        </p>
        <p>
          On this site I publish a hub page about local SEO (this
          one) and a small set of city pages for the specific markets
          I have a real connection to. The first one is{" "}
          <Link
            href="/dallas-web-design"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Dallas Web Design
          </Link>
          , and more come over time, each with substance unique
          to the city it covers. I am based in Royse City and brand
          as Dallas, which is the standard Texas pattern for a
          service business whose registered address is in an exurb
          but whose customer base is metro-wide. The honest framing
          is the differentiator. Hiding the real address would be
          the spam move, not naming it.
        </p>
      </>
    ),
    break: {
      kind: "quote",
      quote:
        "If your location page would still make sense if you swapped the city name out, it is not actually a location page. It is spam with a city name.",
    },
  },
  {
    id: "aeo",
    heading: "Answer Engine Optimization and the next wave of local search",
    body: (
      <>
        <p>
          The shape of search is changing. Google AI Overviews,
          ChatGPT, Perplexity, and the embedded answer surfaces in
          iOS, Chrome, and Microsoft Copilot all fetch answers from
          the open web, synthesize them into one direct response, and
          increasingly remove the need to click through to a site.
          The discipline that has emerged around this is called
          Answer Engine Optimization (AEO), and for local search it
          is going to matter a lot, because most local queries have
          a single best answer.
        </p>
        <p>
          The good news is that the AEO playbook is mostly the same
          playbook as solid SEO done a little more carefully. Clear,
          specific page content that answers a real question. Strong
          structured data so the answer engine can parse it. Honest
          authority signals (named author, real credentials, dated
          reviews). Internal links that establish topical depth. The
          discipline that gets demoted by AEO is the cheap-content
          playbook of the late 2010s: thin pages stuffed with
          keywords and AI-rewritten paraphrases of what other sites
          already say.
        </p>
        <p>
          For a Dallas service business, the practical move is to
          make sure your site can be the answer for the queries you
          care about. Specific service pages with named expertise. A
          clear, fast Google Business Profile. A handful of real,
          well-built location pages. A growing review velocity. The
          same things that work for the local pack today are the
          things that get you cited by an AI answer surface tomorrow,
          because the underlying retrieval and ranking math is
          similar.
        </p>
      </>
    ),
  },
  {
    id: "common-mistakes",
    heading: "Common local SEO mistakes I see across DFW service businesses",
    body: (
      <>
        <p>
          Five mistakes I see in nearly every audit I run for a DFW
          service business. First, primary GBP category set too
          broad. <em>Contractor</em> is not a category that wins; the
          specific subtype is. Second, NAP inconsistency across older
          citations from when the business changed phone numbers,
          suite numbers, or legal-entity names. Audit and fix. Third,
          no structured data on the actual pages of the site. The
          Business Profile alone is not enough; the site needs to
          mirror it in machine-readable form. Fourth, no review
          velocity system. Asking for reviews has to be a step in
          your post-service workflow, not an annual marketing
          campaign. Fifth, location pages that are templated rather
          than substantively unique. Cut the fake ones; keep and
          deepen the real ones.
        </p>
        <p>
          Three things that are overrated relative to the time
          invested in them. Hyper-tuned meta descriptions for service
          business pages do almost nothing for local rankings.
          Submitting your site to two hundred low-quality local
          directories is a spam-citation footprint that hurts more
          than it helps. Designing the site around a specific keyword
          phrase rather than a real customer journey produces a site
          that ranks for that one phrase and converts terribly for
          everything else.
        </p>
        <p>
          One thing that is underrated. A genuinely fast site, with a
          Lighthouse score in the high nineties on real mid-tier
          mobile hardware, helps both your standard rankings and your
          local rankings, because Core Web Vitals is a confirmed
          Google ranking input as part of the page experience update
          (Google Search Central, 2021). I cover the metric details
          in{" "}
          <Link
            href="/resources/core-web-vitals-explained"
            className="underline decoration-accent-violet/40 underline-offset-4 hover:decoration-accent-violet transition-colors"
          >
            Core Web Vitals Explained for Service Businesses
          </Link>
          .
        </p>
      </>
    ),
  },
];

const cta: EditorialCTA = {
  eyebrow: "Next step",
  headline: "Want to know exactly what your site is leaking right now?",
  body:
    "Run a free Pathlight scan against your live URL. The scan produces a scored report with revenue-impact estimates, design analysis, and a prioritized fix list, in roughly ninety seconds. It will not replace a real local SEO engagement, but it will tell you where to start, in plain English, before you spend money on anything.",
  primary: { label: "Run a free Pathlight scan", href: "/pathlight" },
  secondary: { label: "Or start a conversation", href: "/contact" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "How long does it take to see local SEO results?",
    answer:
      "Plan for three to six months for measurable movement on a clean foundation, longer in saturated North Dallas markets like Plano or Frisco. The single fastest signal is review velocity; the slowest is prominence built from backlinks and citations. There is no honest path that compresses this to weeks, and any vendor promising same-month rankings for competitive local queries is selling something else.",
  },
  {
    question: "Should I pay for a citation-building service?",
    answer:
      "Sometimes yes, usually no. A bulk citation-cleanup service is worth it when you have decades of inconsistent listings to fix and your time is more expensive than the tool subscription. Building hundreds of net-new citations on low-quality directories is a footprint Google reads as spammy. Quality matters; volume past the major directories does not.",
  },
  {
    question: "Do I need a separate page for every city I serve?",
    answer:
      "Only the cities where you have a real connection and at least two or three hundred words of substance you can write about specifically. Templated city pages with the city name swapped trigger Google's doorway-page filter and demote the entire site. Two real location pages outperform fifty fake ones.",
  },
  {
    question:
      "What if my legal address is in one city and my brand is another?",
    answer:
      "This is common and it is fine. Your Google Business Profile must use the legal address, but your brand language can describe the metro you serve. I am based in Royse City and brand as Dallas, which is the same pattern most DFW service businesses with exurb headquarters follow. The honest framing on the site reads as authentic; hiding the address reads as defensive.",
  },
  {
    question: "Are paid Google Ads a substitute for local SEO?",
    answer:
      "No, and they are not a replacement for the local pack either. Paid ads can fill gaps while organic local rankings build, and for some verticals (legal, urgent home services, time-sensitive medical) the math on paid is competitive with the math on rebuilding a site. The two work together. Neither cancels the other.",
  },
  {
    question:
      "How do AI search engines like ChatGPT and Perplexity factor in?",
    answer:
      "They factor in more every quarter. AI answer surfaces fetch from the open web and synthesize answers, and they tend to cite the same kinds of pages that win standard local rankings: clear, specific, well-structured, with strong authority signals. The same playbook that gets you into the local pack tends to get you cited by an AI answer engine. Cheap content gets demoted faster on AI surfaces than on classic Google.",
  },
  {
    question:
      "Is local SEO worth it for a one-location service business with five-figure revenue?",
    answer:
      "Yes for the foundation work (Business Profile, NAP consistency, basic schema, review velocity). Almost always no for an aggressive monthly retainer. The foundation is finite work that pays for years; an open-ended retainer at five hundred or a thousand a month rarely delivers proportional value at that revenue scale. I recommend a one-time foundation engagement, then maintenance.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "Google Search Central",
    year: 2025,
    title:
      "How Google determines local ranking: relevance, distance, and prominence",
    url: "https://developers.google.com/search/docs/appearance/ranking-systems-guide",
  },
  {
    id: 2,
    org: "Google Search Central",
    year: 2025,
    title:
      "Local business structured data: LocalBusiness schema documentation",
    url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  },
  {
    id: 3,
    org: "Schema.org",
    year: 2024,
    title: "LocalBusiness type definition and properties",
    url: "https://schema.org/LocalBusiness",
  },
  {
    id: 4,
    org: "BrightLocal",
    year: 2024,
    title: "Local Consumer Review Survey 2024",
    url: "https://www.brightlocal.com/research/local-consumer-review-survey/",
  },
  {
    id: 5,
    org: "Google Search Central",
    year: 2024,
    title: "Doorway pages and the helpful content system",
    url: "https://developers.google.com/search/docs/essentials/spam-policies",
  },
  {
    id: 6,
    org: "Google Search Central",
    year: 2021,
    title:
      "More time, tools, and details on the page experience update",
    url: "https://developers.google.com/search/blog/2021/04/more-details-page-experience",
  },
  {
    id: 7,
    org: "Federal Reserve Bank of Dallas",
    year: 2025,
    title: "Dallas-Fort Worth economic indicators and metro outlook",
    url: "https://www.dallasfed.org",
  },
  {
    id: 8,
    org: "Pew Research Center",
    year: 2024,
    title:
      "Mobile Fact Sheet: smartphone and mobile internet ownership in the U.S.",
    url: "https://www.pewresearch.org/internet/fact-sheet/mobile/",
  },
];

export function LocalSeoContent() {
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
    />
  );
}
