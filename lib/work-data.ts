/* ─── WORK / PROJECTS ──────────────────────────────── */

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectSection {
  heading: string;
  body: string;
  /** Optional. When present, the deep-dive section renders a quiet
   * "View this live" link at the bottom of the section body, pointing
   * to the matching live or showcase page for the capability the
   * section describes. Omit on narrative sections that have no
   * corresponding capability surface. */
  liveHref?: string;
  /** Optional. Path to a wide screenshot rendered between the section
   * body and the live link. Use for capability sections that benefit
   * from a visual proof point. */
  image?: string;
  /** Optional alt text for the section image. Defaults to the heading
   * when omitted. */
  imageAlt?: string;
  /** Optional. Architectural-narrative depth (~250 words) revealed via
   * a "Read the architecture" toggle below the section image. Renders as
   * paragraphs with whitespace-pre-line. Omit on narrative sections that
   * have no corresponding architectural depth to expose. The toggle UI
   * does not render at all when this is empty, so leaving the field
   * unset on a section keeps the existing layout untouched. */
  deepDive?: string;
  /** Optional. When populated, the open deep-dive panel renders a
   * "Read the full architecture of {heading} ->" link pointing at
   * /work/canopy/{deepDivePageSlug}. Used to escalate from Layer 2
   * (in-page toggle) to Layer 3 (dedicated 1.5k-3k word page) once the
   * matching Phase 3 page exists. Leave unset on sections that do not
   * yet have a Layer 3 page; the link only renders when set. */
  deepDivePageSlug?: string;
}

export interface ProjectTechDetail {
  name: string;
  reason: string;
}

export interface ProjectVideo {
  /** Path to the MP4 (h.264) source. Required. */
  mp4: string;
  /** Optional WebM (VP9) source for browsers that prefer it. */
  webm?: string;
  /** Path to a still-image poster shown before play and as fallback. */
  poster: string;
  /** Optional descriptor rendered as a small caption above the video. */
  caption?: string;
}

export interface ProjectDetail {
  slug: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  /** Optional. When provided, the deep-dive renders a "View Live Site"
   * button in the hero. Omit for projects that have no public-facing live
   * URL the visitor could meaningfully click through to. */
  liveUrl?: string;
  /** Optional. Override the hero CTA button text when "View Live Site"
   * does not fit the destination. Useful when liveUrl points at a tour or
   * showcase rather than a production live site. Defaults to
   * "View Live Site" when omitted. */
  liveUrlLabel?: string;
  metrics: ProjectMetric[];
  techStack: string[];
  notable: string;
  image: string;
  heroDescription: string;
  sections: ProjectSection[];
  techDetails: ProjectTechDetail[];
  timeline: string;
  /** Heading copy for the bottom CTA section. Question-shaped or
   * exhortation-shaped (e.g. "Ready for Results Like These?"), rendered
   * as a large H3 above the action button. */
  ctaText: string;
  ctaHref: string;
  /** Optional. Action-shaped label for the bottom CTA button (e.g.
   * "Start a Project", "Get in Touch", "Try Pathlight"). When omitted,
   * the layout falls back to "Try Pathlight" for /pathlight ctaHrefs and
   * "Start a Project" for everything else, preserving prior behavior. */
  ctaButtonText?: string;
  /** Optional brand mark to render in place of the text title in the
   * deep-dive hero. Use for projects whose wordmark is part of the logo. */
  logoImage?: string;
  /** Optional autoplay-loop showcase video rendered between hero and case
   * study sections on the deep-dive page. */
  showcaseVideo?: ProjectVideo;
}

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "pathlight",
    name: "Pathlight",
    description:
      "Find the problems. Find the money drain. Find the fix. Diagnostic analysis with industry specific revenue modeling, not generic scores.",
    category: "Internal Product",
    gradient: "from-violet-600 to-pink-500",
    liveUrl: "https://dbjtechnologies.com/pathlight",
    metrics: [
      { label: "Free Per Scan", value: "$0" },
      { label: "Scan Time", value: "~2 min" },
      { label: "Delivery", value: "Instant + Email" },
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "PostgreSQL",
      "Serverless",
    ],
    notable:
      "The only free tool that translates website problems into dollar signs, calibrated to your specific business type, with consistent results scan after scan.",
    image: "/images/pathlight-landing.webp",
    heroDescription:
      "A full stack diagnostic platform built from the ground up to scan any business website and produce a complete intelligence report: performance audit, design analysis, revenue impact estimate, and prioritized fix list. All in minutes, for free. Proof that proper engineering, not template scoring, delivers genuine business insight instead of generic summaries.",
    sections: [
      {
        heading: "The Problem",
        body: "Small business owners know their website 'could be better.' But they don't know what specifically is wrong, how much it's costing them, or what to fix first. Free tools like Lighthouse give technical scores that mean nothing to a restaurant owner. Agencies charge thousands for discovery calls before providing any insight. There's no middle ground. No tool translates technical website problems into business language with dollar signs attached.",
      },
      {
        heading: "The Solution",
        body: "Pathlight scans any business website and delivers a complete intelligence report in minutes. Not a Lighthouse score. Not a generic SEO checklist. A full analysis covering design quality, technical performance, estimated revenue impact modeled against real industry data, and a prioritized fix list ranked by business impact.",
      },
      {
        heading: "How It Works",
        body: "Submit your URL, get a complete report in roughly two minutes. The report covers performance, visual design, positioning, and search visibility, plus a revenue impact estimate calibrated for your specific business type. Everything runs automatically. No credit card. No back-and-forth.",
      },
      {
        heading: "Calibrated For Your Business",
        body: "Every business type converts differently. A law firm and an auto repair shop have nothing in common when it comes to deal value, traffic patterns, or what visitors are looking for on a homepage. Pathlight calibrates its revenue model to the kind of business you actually run, so the dollar number you see is grounded in what your customers actually pay, not a one-size-fits-all guess.",
      },
      {
        heading: "The Report",
        body: "Every scan produces a Pathlight Score (0-100) broken into four weighted pillars: Design (35%), Performance (25%), Positioning (25%), and Search Visibility (15%). Below the score, the top 3 fixes ranked by impact and difficulty, full desktop and mobile screenshots, and a revenue impact estimate with full methodology transparency. A built-in assistant lets business owners ask follow-up questions about their results.",
      },
    ],
    techDetails: [
      {
        name: "Full-Stack TypeScript",
        reason:
          "Next.js 16 with strict TypeScript from database schema to API response to frontend component. Type safety at every layer, not just the UI.",
      },
      {
        name: "Cloud Infrastructure",
        reason:
          "Serverless architecture with background job orchestration, automatic retry logic, rate limiting, and transactional email delivery. Built to handle concurrent scans without degradation.",
      },
      {
        name: "Data Architecture",
        reason:
          "PostgreSQL for scan persistence and analysis storage. Email event tracking for deliverability monitoring. Designed for fast historical lookups across scans.",
      },
    ],
    timeline:
      "Designed, architected, and built as a solo project. Iteratively hardened across multiple releases addressing accuracy, reliability, and scan consistency.",
    ctaText: "Scan Your Website Free",
    ctaHref: "/pathlight",
  },
  {
    slug: "star-auto-service",
    name: "The Star Auto Service",
    description:
      "A complete rebuild for a 28-year Richardson, TX auto repair shop. Six service-area pages, twelve service pages, five long-form guides, a fixed desktop call button after years of silently dropped leads, and a cinematic hero entrance. Next.js 16. Perfect Lighthouse 100s across every category, every page.",
    category: "Client Project",
    gradient: "from-blue-600 to-cyan-500",
    liveUrl: "https://thestarautoservice.com",
    metrics: [
      { label: "Performance", value: "100" },
      { label: "Accessibility", value: "100" },
      { label: "SEO", value: "100" },
    ],
    techStack: ["Next.js 16", "TypeScript", "Tailwind CSS", "Resend"],
    notable:
      "Six metros indexed for the searches their drivers run every day. Twelve services indexed for the problems their customers Google before they call. A phone number that finally rings on every device. Every Lighthouse category scores 100.",
    image: "/images/case-studies/star-auto-desktop.webp",
    heroDescription:
      "A complete digital rebuild for a family-owned, ASE-Certified auto repair shop serving Richardson, TX since 1998. Twenty-eight years of word-of-mouth trust, finally matched by a site that ranks where it should, converts on every device, and reflects the quality of the work the shop actually delivers. Six service-area pages, twelve service pages, five long-form guides, a fixed desktop call button after years of silently dropped leads, real photography sitewide, and a cinematic hero entrance that reads as a brand statement, not a template. Perfect Lighthouse 100s across every category, every page.",
    sections: [
      {
        heading: "The Client",
        body: "Miguel Ibarra runs The Star Auto Service in Richardson, Texas. ASE-Certified technicians, NAPA Auto Care Center, bilingual service, twenty-eight years on the corner of Belt Line Road. A 4.8-star Google rating across one hundred and thirty-six reviews, built customer by customer. The shop's reputation in person was unimpeachable. The shop's reputation online did not exist.",
      },
      {
        heading: "The Visibility Problem",
        body: "Every neighbor in Richardson, Garland, Plano, Allen, Murphy, and the surrounding metros searches for 'state inspection near me,' 'auto repair Richardson,' 'brake shop Plano,' and a hundred other variations every day. None of those searches were finding Miguel's shop. The previous website had no local SEO architecture: no service-area pages tied to the metros the team actually drives to, no service-specific landing pages tied to the problems customers actually have, no structured data telling Google what the business is or where it operates. The Google Business Profile sat in isolation, not connected to the website by any signal Google could read. Years of search traffic that should have landed on the shop's site landed on competitors instead.",
      },
      {
        heading: "The Phone That Did Not Ring",
        body: "Worse than a missing search rank: the previous site's phone link silently failed on desktop browsers. Every visitor on a laptop who saw the headline, scrolled past the trust signals, and clicked 'Call (972) 231-2886' hit either an unhandled tel-protocol dialog or nothing at all. Phone is the primary conversion channel for a local auto shop. Every desktop click that did not dial was a customer who had already done the work of finding the shop, decided they wanted to call, and was sent into a dead end by the website itself. There is no instrument left to measure how many years of leads were lost to that single broken link, but the math is grim.",
      },
      {
        heading: "The Foundation",
        body: "I rebuilt the site from zero on Next.js 16 with strict TypeScript end to end, Tailwind CSS for layout, and Vercel for deployment. Mobile-first from the first pixel. Sub-second time-to-interactive on the hero across every common device. Perfect Lighthouse scores across Performance, Accessibility, Best Practices, and SEO. The technical foundation is what makes everything that follows possible: when Google's crawler hits the site, every signal it needs to read renders cleanly in HTML, in JSON-LD, in the right place in the page, every time.",
      },
      {
        heading: "The Service Area Network",
        body: "Six dedicated service-area pages, one for each metro the shop actually services: Richardson, Garland, Plano, Dallas, Allen, Murphy. Each page leads with a real photo of the area, names the specific neighborhoods customers come from (Canyon Creek, Heights, J.J. Pearce, Cottonwood Heights for Richardson; equivalents for the rest), publishes drive-time and distance from the shop, lists the top services for that area's drivers, and embeds a Google Map referencing the verified business entity. Every area page carries complete LocalBusiness JSON-LD with geo coordinates, NAICS code, areaServed, and openingHoursSpecification. This is the architecture that tells Google 'this shop services this metro' in machine-readable terms, on a page indexed for the keywords that metro searches every day.",
      },
      {
        heading: "The Service Pages",
        body: "Twelve dedicated service pages, one for every common service the shop performs: brake repair, oil change, transmission, electrical systems, state inspections, HVAC and AC repair, tire repair, cooling systems, fuel injection, battery service, engine repair, and timing belts. Each page leads with a real photo from the shop, follows with a symptom checklist in the language a customer actually uses to describe what is wrong, explains what the service involves, sets honest price expectations, and answers four to six questions with FAQPage schema. Every page is internal-linked from the services index and from the relevant area page. This is the architecture that tells Google 'this shop fixes that thing' in machine-readable terms, on a page that ranks for the problem a customer is actually searching.",
      },
      {
        heading: "The Resources Hub",
        body: "Five long-form guides answering the questions customers Google before they ever pick up the phone: what gets checked at a Texas state inspection and what to do if you fail, season-by-season car care for North Texas drivers, the five signs you need new brakes, how often modern engines actually need an oil change, and what the check engine light really means. Each guide is written from the shop's actual diagnostic experience, hundreds of cars a year, the patterns the team sees that the typical 'top ten things to know' article never will. This is the architecture that tells Google 'this shop has authority on the topic,' not just 'this shop performs the service.'",
      },
      {
        heading: "Bilingual, Warranty, and Trust Signal",
        body: "'Hablamos Español' surfaces in the sitewide utility bar so Spanish-speaking customers see it the moment the page loads, before they have to read English to find out the shop speaks their language. A dedicated warranty page explains the NAPA AutoCare 24-month / 24,000-mile coverage plainly, with the actual NAPA sign on the storefront photographed and front and center. A sitewide reviews chip in the header shows the 4.8-star rating across 136 Google reviews and links to a real reviews page surfacing actual customer reviews. Trust signal lives on every page, not just the homepage.",
      },
      {
        heading: "The Phone, Fixed",
        body: "The desktop call failure is solved with a custom call modal. When any desktop visitor clicks any phone number anywhere on the site, a polished overlay opens with the number large and legible, a one-click copy button, and a clean exit. Mobile visitors continue to dial directly. The drop is closed. Every call attempt now resolves into either a placed call or a copyable number on screen. Every contact form submission also routes to Miguel's inbox in seconds via Resend, so neither channel leaves a lead unanswered.",
      },
      {
        heading: "Real Photography, Real Motion",
        body: "Twenty-one bespoke photos taken at the shop and across the metros, replacing every generic stock image: the storefront on Belt Line in golden hour, the NAPA sign mounted on the building, the bays in operation, the neighborhoods the shop services. The previous site pulled stock from a free CDN, identical to a hundred competitor sites and tied to nothing local. Every image on the new site is owned and unique to this business; no photo on the site appears twice. The homepage hero opens cinematically in roughly one and a half seconds: the eyebrow slides in from the left, 'Expert auto repair,' lifts up with a blur-to-clear effect, 'done right.' races in from the right trailing a gold streak that sweeps under the line and dissolves (the brand color, the brand metaphor, a car arriving with a touch of exhaust), the subhead fades up, the two CTAs spring into place with a tiny overshoot, the trust strip resolves last. Every gold star sitewide carries a subtle pulse and a quick twinkle on hover so the brand mark reads as alive across every page. Every animation respects prefers-reduced-motion: any visitor with that system preference set sees the same content with no motion at all.",
      },
      {
        heading: "Mobile, Down to 360px",
        body: "Type scale tuned so even the narrowest phone viewports render two-line hero headlines instead of word-per-line stacks. Section padding rebalanced from desktop-first stretches down to mobile-appropriate spacing that does not waste a screenful between sections. CTAs sized for thumbs. Maps that switch aspect ratio between mobile and desktop so the embed is legible on either form factor. Every route audited and tuned from a 360px viewport upward.",
      },
      {
        heading: "The Result",
        body: "The site went from a digital placeholder that Google could not parse and desktop visitors could not call into a complete local presence. Six metros indexed for the searches their drivers run every day. Twelve services indexed for the problems their customers Google before they call. Five guides ranking on the questions before the call ever happens. Bilingual signal on every page. NAPA warranty plainly explained. Real reviews one click away from any nav. A phone number that finally rings on every device. Performance, Accessibility, Best Practices, and SEO all 100, every page, every render. The shop's twenty-eight years of in-person trust now have a digital surface that matches.",
      },
    ],
    techDetails: [
      {
        name: "Next.js 16",
        reason:
          "App Router with static generation for instant page loads, server-rendered HTML for the SEO crawl, and Vercel deployment for global edge delivery. The substrate that lets every Lighthouse category score 100, every page, every render.",
      },
      {
        name: "TypeScript",
        reason:
          "Strict mode end to end, from data files (areas, services, resources) to component props to API handlers. Type errors caught at build time mean Miguel never gets a 'that page is broken' email.",
      },
      {
        name: "Tailwind CSS",
        reason:
          "Utility-first styling for precise, responsive design without CSS bloat. Every breakpoint tested on real devices, every spacing token tuned for mobile down to a 360px viewport.",
      },
      {
        name: "JSON-LD (LocalBusiness, Service, FAQPage)",
        reason:
          "Structured data on every page tells Google what the business is, where it operates, what services it performs, and what questions it answers. Critical for local pack ranking and rich results in search.",
      },
      {
        name: "Google Maps + Google Business Profile",
        reason:
          "Verified Maps embeds on every area page and on contact, all referencing the same business entity. NAP data (name, address, phone) consistent across the site, the GBP, and the schema. Entity alignment is what consolidates search authority instead of fragmenting it.",
      },
      {
        name: "Resend",
        reason:
          "Transactional email API for the contact form. Every inquiry hits Miguel's inbox within seconds. Combined with the desktop call modal, no lead leaves the site unanswered.",
      },
      {
        name: "Cloudflare DNS",
        reason:
          "Enterprise-grade DNS with DDoS protection, CDN caching, and global edge delivery. Professional infrastructure for a local business; the kind of resilience customers never have to know about.",
      },
    ],
    timeline:
      "Built across multiple focused engagements: zero-to-launch first, then iterative rebuilds adding the six service-area pages, the twelve service pages, the resources hub, the bilingual layer, the desktop call fix, the cinematic motion system, and a sitewide mobile optimization pass. Every iteration shipped to production with all Lighthouse 100s preserved.",
    ctaText: "Ready for Results Like These?",
    ctaHref: "/contact",
  },
  {
    slug: "soil-depot",
    name: "Soil Depot",
    description:
      "A complete digital presence for a Texas commercial soil brokerage serving five major metros. Zero organic visibility before this build. Now a working tool for the operation: city pages, a custom soil calculator, regional team profiles, and a foundation that surfaces in Google, Bing, and AI search alike.",
    category: "Client Project",
    gradient: "from-amber-600 to-yellow-500",
    liveUrl: "https://soil-depot.com",
    metrics: [
      { label: "Texas Metros", value: "5" },
      { label: "City Landing Pages", value: "5" },
      { label: "Compliance", value: "TDPSA" },
    ],
    techStack: [
      "WordPress",
      "Custom Soil Calculator",
      "Schema.org (JSON-LD)",
      "Google Business Profile",
    ],
    notable:
      "From zero local visibility to a foundation that earns organic traffic across Google, Bing, and AI search. Five Texas metros indexed. A custom soil calculator that turns curiosity into a number a contractor can act on. A regional team surfaced as named, photographed humans on every page where buyers actually look.",
    image: "/images/case-studies/soil-depot-desktop.webp",
    heroDescription:
      "A complete digital presence for a Texas commercial soil brokerage serving Dallas, Fort Worth, Houston, Austin, and San Antonio. The team's reputation on the ground was already strong; the digital footprint generated nothing. Now: a foundation that earns organic visibility across Google, Bing, and AI search, a custom soil calculator that turns 'how much dirt do I need?' into cubic yards, tons, and trucks in a single screen, and a regional team surfaced as named, photographed people on every page where buyers actually look. An ongoing engagement, not a one-time deliverable.",
    sections: [
      {
        heading: "The Client",
        body: "Soil Depot is a Texas commercial soil brokerage and logistics company that supplies fill dirt, topsoil, select fill, and sand to contractors, developers, and landscapers across five major metros: Dallas, Fort Worth, Houston, Austin, and San Antonio. The team brokers from vetted sources and delivers on schedule to active job sites, day in and day out. The operation is real, the relationships are real, the trucks are real. What was missing was a digital presence that matched the ground game.",
      },
      {
        heading: "Zero Visibility Before This Build",
        body: "Before DBJ Technologies, Soil Depot had a website but it earned zero organic visibility. None of the searches a Texas commercial soil buyer runs every day, 'fill dirt Dallas,' 'topsoil Houston,' 'bulk soil Austin,' 'select fill San Antonio,' 'commercial dirt Fort Worth,' were finding them. The Google Business Profile sat in isolation, disconnected from the website by any signal Google could read. Years of customer searches for the exact services this team performs every day were converting into business for someone else. The phone was ringing only because of who the team already knew, not because of anyone discovering them online.",
      },
      {
        heading: "The Goal",
        body: "Build a digital presence that earns ongoing organic visibility across every metro the team services, holds up under the scrutiny of Texas commercial buyers, and becomes a working part of the operation rather than a brochure. Not a redesign for the sake of looking new. A foundation for the next decade.",
      },
      {
        heading: "The Foundation",
        body: "The site stayed on WordPress because Tyler needed editorial control, and forcing a stack change for stack-change reasons would have been ego, not engineering. From there I built a complete technical SEO architecture: structured data on every page that tells Google exactly what the business is, where it operates, what services it performs, and which markets it serves. Google Business Profile wired into the site as a single business entity rather than two disconnected ones. A privacy and compliance layer that meets the Texas Data Privacy and Security Act head on. A technical foundation that compounds across both Google and Bing as the site is indexed and crawled month over month.",
      },
      {
        heading: "City-Level Search Architecture",
        body: "Five dedicated landing pages, one for each major Texas metro the team services. Each page is anchored to its market, written in the language a buyer in that city actually uses, optimized through a proper SEO toolset for the keywords the team actually wants to win, and connected back to the broader business entity through consistent name, address, and phone data. This is the architecture that tells Google 'this team services this market' in machine-readable terms, on a page that ranks for the searches that market runs every day.",
      },
      {
        heading: "The Soil Calculator",
        body: "The most practical thing on the site is the soil calculator. Turn 'how much dirt do I need?' into a single screen with cubic yards, tons, and a count of trucks. A quick mode for a contractor pulling out their phone on a job site (rectangle or acreage, dimensions, material, depth, calculate). A full mode for complex multi-zone projects with mixed shapes, materials, and depths, plus a 'how much dirt do I have to move?' export mode for jobs that move dirt off-site instead of on, sticky sidebar totals, and a complete summary the buyer can copy and forward to a project manager in two taps. Built to feel like a tool, not a marketing experience. The contractor who lands here from a Google search gets a number they can act on immediately. That number is the start of the conversation.",
      },
      {
        heading: "The Regional Team, Surfaced",
        body: "Real photographs of the regional managers across every market the team services, integrated into the service area pages, the contact page, and the parts of the site where buyers want to know who is going to pick up the phone. James in North Texas, Gordon in the Houston area, Charlie across Central and South Central Texas. The cards are not decoration. They convert anonymous 'some Texas company' into named human beings with faces and direct phone numbers. Trust signal where it matters, on every relevant page, not just the about us section.",
      },
      {
        heading: "An Ongoing Engagement",
        body: "This is not a build-and-leave engagement. The site keeps evolving. New regional team members get added when the team grows. The calculator gets refined as patterns emerge from how contractors actually use it. The compliance layer gets updated when Texas privacy law changes again. The technical SEO foundation gets fed with new content and fresh signals because the work compounds only if it keeps moving. Tyler now refers other Texas businesses to me organically because the relationship has held up through real iteration.",
      },
      {
        heading: "AI Search Validated the Architecture",
        body: "The clearest signal that the work is paying off arrived in a way no one was planning for: a major commercial developer found Soil Depot through an AI search engine, not Google, and reached out for a real-money project. That kind of inbound is not an accident. AI search models read the same structured data, the same entity wiring, the same authority signals that Google has always read, and they surface businesses whose digital presence is clean enough to be parsed as authoritative. The technical foundation built here is exactly that kind of foundation, and the lead it produced is the kind of validation a brochure site never delivers.",
      },
      {
        heading: "The Result",
        body: "The site went from generating zero organic business to becoming a working part of operations. Five Texas metros indexed for the searches their drivers run every day. A calculator that turns curiosity into conversation. A regional team surfaced as real people on every page that matters. Compliance and trust signals locked in. A foundation that earns visibility on Google, Bing, and now AI search engines, all at the same time. The operation's reputation in person, finally matched online.",
      },
    ],
    techDetails: [
      {
        name: "WordPress",
        reason:
          "Tyler runs the site day to day. WordPress gives the team full editorial control over service descriptions, city pages, calculator copy, and regional team profiles, without needing a developer for every content change. The right tool for an operation that needs to keep moving.",
      },
      {
        name: "Custom Soil Calculator",
        reason:
          "Built from the ground up for the way Texas commercial soil buyers actually estimate jobs. Quick mode for contractors on a phone, Full mode for complex multi-zone projects, an export mode for jobs that move dirt off-site instead of on, and a complete summary buyers can copy and forward. The conversion engine of the site.",
      },
      {
        name: "Schema.org (JSON-LD)",
        reason:
          "Full LocalBusiness markup with geo coordinates, areaServed across all five Texas metros, and openingHoursSpecification. The unambiguous machine-readable identity Google, Bing, and AI search engines all read to decide whether a business is authoritative for a given query.",
      },
      {
        name: "Google Business Profile + Maps",
        reason:
          "Entity-aligned with the website through consistent name, address, and phone data, a verified Maps embed, and structured data that confirms the relationship. Tells Google the business profile and the website are the same entity, consolidating search authority across every market the team services instead of fragmenting it.",
      },
      {
        name: "Technical SEO Foundation",
        reason:
          "Rank Math configured across the site for on-page optimization: city-specific titles, descriptions, Open Graph tags, canonical URLs, XML sitemaps, and breadcrumb structured data. Bing Webmaster Tools and Google Search Console connected for ongoing visibility into impressions, clicks, and indexing across both major search ecosystems.",
      },
    ],
    timeline:
      "An ongoing engagement that began with the digital foundation (structured data, city pages, compliance layer, Google Business Profile entity wiring) and continues through iterative improvements: the custom soil calculator, the regional team surfacing, a sitewide phone audit when the team changed, manager banner refinements when buyers asked for more breathing room. The work compounds because it never stops.",
    ctaText: "Ready for Results Like These?",
    ctaHref: "/contact",
  },
  {
    slug: "canopy",
    name: "Canopy",
    description:
      "An operating-system admin I built first for myself to run DBJ Technologies, then shipped as the first external install to The Star Auto Service. Visitors, recurring users, funnels, search behavior, performance, deals, contacts, sequences, automations, infrastructure health, deliverability, error volume, and budget headroom in one dashboard, on the buyer's domain, behind the buyer's auth.",
    category: "Internal Tooling",
    gradient: "from-cyan-500 to-blue-600",
    /* The live install at ops.thestarautoservice.com is auth-walled
     * per-client. The /showcase/canopy tour is the public-rendered
     * fixture-only demo of the same product. */
    liveUrl: "/showcase/canopy",
    liveUrlLabel: "Open the Showcase",
    metrics: [
      { label: "Sections", value: "9" },
      { label: "Live Install", value: "The Star Auto" },
      { label: "Categories Replaced", value: "6" },
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "Neon Postgres",
      "Auth.js",
      "Inngest",
      "Vercel",
      "Resend",
      "Sentry",
    ],
    notable:
      "Built first for myself to run DBJ Technologies. The Star Auto Service is install zero, the proving ground for the architecture before any wider productized rollout.",
    image: "/images/case-studies/canopy-showcase-poster.jpg",
    heroDescription:
      "An operating-system admin I built first for the studio that ships it, then deployed as install zero for a real client. The Star Auto Service in Richardson, TX is the first external Canopy, surfacing first-party visitor data, performance, pipeline, automation, operations health, and Pathlight-driven outreach, all on the client's own domain behind a Google sign-in. Not yet a productized offering for sale. Live as a working install, on the way to becoming one once the playbook proves out across more verticals.",
    sections: [
      {
        heading: "The Problem",
        body: "Most small businesses are running on a stack of separate SaaS subscriptions that do not talk to each other. Analytics in one tool. Performance monitoring in another. Error tracking in a third. Deliverability scattered across whatever email platform got chosen. A CRM nobody updates. Spreadsheets bridging the gaps.\n\nEach tool charges a monthly fee. Each tool owns the data. Each tool has its own login, its own admin UI, its own export limitations, its own 'we are sunsetting that feature' email. The cost compounds. The data fragments. And the buyer never gets the one thing they actually need: a single picture of their business that joins what marketing did to what customers actually became.\n\nThe standard advice is 'just use the integrations.' But the integrations break, the integrations stop being free, and the integrations leave the data in someone else's data center. By the time a small business is spending hundreds to thousands a month on SaaS subscriptions for capabilities they could own outright, the architectural alternative is no longer obvious. It just looks like the cost of doing business.\n\nIt is not the cost of doing business. It is the cost of accepting SaaS sprawl as inevitable.",
      },
      {
        heading: "What You Get",
        body: "One dashboard. One auth wall. One source of truth. On the buyer's domain, in the buyer's database, behind the buyer's auth.\n\nCanopy is the operating-system admin I built first to run DBJ Technologies, then shipped as the first external install to The Star Auto Service. Same codebase, same architecture, configured per install. Visitors, recurring users, funnels, search behavior, performance metrics, deals, contacts, sequences, automations, infrastructure health, deliverability, error volume, and budget headroom all live in one place. The buyer logs in to one URL, sees one banner that summarizes the worst of every signal across the whole stack, and drills into whichever section needs attention.\n\nNothing is rented. The Postgres database is the buyer's. The auth wall is the buyer's. The domain is the buyer's. The audit log captures every meaningful change so a wrong update is recoverable. The architecture is per-install, not multi-tenant, so there is no shared infrastructure to leak across customers and no vendor to call when something breaks.\n\nI built it for myself first, which means every decision is the one I made when the customer was me.",
      },
      {
        heading: "Analytics & Performance",
        body: "Buyers spend on analytics platforms, real-user-monitoring tools, and search-insight services and still cannot answer the question that matters: which visitor became which customer.\n\nCanopy captures first-party visitor data, recurring-user behavior, conversion funnels, search queries, and Web Vitals directly into the buyer's Postgres. Every event is timestamped and queryable. Performance data lives next to the conversion data, in the same database, with the same auth gate. When a regression shows up after a deploy, the buyer sees it in the same dashboard where they review pipeline.\n\nNo browser-tab switching. No SaaS-to-SaaS export reconciliation. No quarterly conversation about whether the analytics tool's numbers and the CRM's numbers agree. They are the same numbers, in the same database, owned by the same buyer.\n\nThe honest exclusion: Canopy is not built for systems with billions of events per day. It is built for small businesses doing thousands to tens of thousands of events per day, where architectural ownership matters more than horizontal scale.",
        liveHref: "/showcase/canopy/analytics",
        image: "/images/case-studies/canopy/canopy-analytics.webp",
        imageAlt: "Canopy Analytics and Performance dashboard showing first-party visitor counts, real-user Web Vitals, top pages, and top sources",
        deepDivePageSlug: "analytics",
        deepDive:
          "The question I asked first: what changes when the visitor data and the conversion data live in the same database under the same auth gate.\n\nThe answer is the kind of question you can ask. With third-party analytics, you can ask 'what was my bounce rate last week.' You cannot ask 'of the prospects who became deals last quarter, which marketing source did they come from, and what was their median time to close.' That second question requires joining two systems that the SaaS contract does not let you join, and the export reconciliation that pretends to support it never quite agrees.\n\nI considered the standard stack: an analytics SDK on the front end, the CRM through its API, a webhook bridge between them. I rejected it because every layer rents access to the buyer's data back to the buyer, and the bridge is what breaks first.\n\nWhat Canopy does instead: the visitor capture writes directly to the buyer's Postgres. The conversion capture writes there too. Web Vitals, scroll depth, and dwell time post to the same table. Bot pressure is separated from real visitors at the ingest layer so the headline numbers stay honest. The dashboard reads from already-aggregated views so it stays fast as the data grows.\n\nThe operational consequence: when a regression shows up after a deploy, the buyer can answer 'is this real or just bot pressure' against the same database that holds pipeline. No browser-tab switching. No quarterly meeting about whose numbers agree.",
      },
      {
        heading: "Pipeline & Relationships",
        body: "Deals scattered across spreadsheets. Follow-ups falling through the cracks. Contact records last updated whenever the team remembered. The CRM that nobody updates is the most expensive software a small business can buy, because it produces no value at full price.\n\nCanopy is deal-stage primary. The pipeline kanban board is the source of truth for where every prospect stands. The contact detail view brings together every interaction the buyer has ever had with that person, automatically: form submissions, scan reports, email replies, calls logged, notes added, deal-stage transitions. Nothing has to be manually copied between systems because there are no other systems.\n\nBulk actions handle the repetitive operations. Keyboard navigation works the way an operator who lives in the tool every day expects it to work. Every change writes a before-and-after snapshot to the audit log, so the question 'who marked this deal closed-lost and when' has a definitive answer instead of a Slack thread.\n\nThe pipeline rolls up weighted forecasts. The contact timeline reconciles with the audit log. The data is the buyer's, and the buyer's team can leave whenever they like and take the whole database with them.",
        liveHref: "/showcase/canopy/deals",
        image: "/images/case-studies/canopy/canopy-deals.webp",
        imageAlt: "Canopy Deals kanban board with weighted pipeline, unweighted pipeline, closed-won, and average cycle metrics across New, Contacted, Qualified, Proposal, Won, and Lost columns",
        deepDivePageSlug: "pipeline",
        deepDive:
          "The question that drives the data model: what does it mean to say a CRM is 'the source of truth.'\n\nFor most small-business CRMs the answer is 'whatever the most recent person to touch the record typed in.' That is not truth, that is the latest belief. Canopy treats truth as the audit log. Every meaningful change writes a before-and-after snapshot attributed to the user who made the change. The current state of any record is the projection of those events. The implication is the database can answer questions the team did not know to ask when they wrote the record, because the events are still there to replay.\n\nI considered making contact status the primary axis, with deal as a derived field on the contact. I rejected that because every real business has repeat customers and parallel opportunities. Collapsing deal state into contact state loses the second engagement, and the second engagement is where most of the revenue lives. So deals are primary; contact status is a denormalized mirror kept for backward compatibility, not the source of truth.\n\nThe contact detail view brings together every interaction the buyer has ever had with that person, automatically. Form submissions, email replies, scan reports, calls logged, notes added, deal-stage transitions, all on one timeline. Nothing has to be manually copied between systems because there are no other systems.\n\nThe operational consequence: a team member leaves, the database stays. The questions are queryable. The answers are verifiable. The export, if one ever happens, is the buyer's database itself.",
      },
      {
        heading: "Automation",
        body: "Manual follow-ups are how revenue leaks. The calendar reminder gets dismissed. The 'I will email them tomorrow' never happens. The deal-stage change does not trigger any of the things that should follow from it.\n\nCanopy runs sequences, workflows, and rule-based automations on top of the audit log. Sequences send multi-step outbound with reply-exit, so a prospect who replies stops receiving the next message in the chain. Workflows fire on domain events: a new deal hits a stage, an old deal goes silent for an extended window, a scan report flags a finding worth a follow-up. Rules condition on what changed in the audit log, which means I can express 'any time a deal moves to proposal, send the proof-of-craft email and assign a follow-up task' without writing custom code.\n\nEmail templates are versioned. Bulk actions cover the cases where automation is overkill. Every automated action writes to the audit log with the rule that fired it, so when something automates that should not have, the answer is one query away.\n\nThe honest exclusion: this is not a marketing automation suite for thousand-step lifecycle programs. It is built for small-team operators who need the next ten things to happen without remembering them.",
        liveHref: "/showcase/canopy/automation",
        image: "/images/case-studies/canopy/canopy-automation.webp",
        imageAlt: "Canopy Sequences and Workflows view listing active sequences, enrolled and replied counts, and rule-based workflow triggers",
        deepDivePageSlug: "automation",
        deepDive:
          "Two ways to wire automation rules: as side-effects on the writer's path, or as subscribers to a durable event log. I chose the second.\n\nEvery mutation in Canopy writes to the audit log first; rules read from the log and act. That is slower by a few hundred milliseconds than firing rules inline. It is also the reason a rule that fires wrong is recoverable. The action records the rule that fired it. The mutation records the actor. The audit log holds both. So the question 'why did this email send' has a query, not a debugging session against a vendor's internal logs.\n\nI considered a no-code automation builder with hundred-step branching lifecycle programs. I rejected it because the operator who needs that already bought Hubspot. The operator who has not bought anything yet needs the next ten things to happen without remembering them, not a hundred-step program nobody in the building understands by month four.\n\nThe mechanism: sequences are multi-step outbound with reply-exit, so a prospect who replies stops receiving the next message in the chain. Workflow rules condition on what changed in the audit log. Email templates are versioned so I can roll one back without losing the send history.\n\nThe honest exclusion: this is not lifecycle marketing software. It is built for small-team operators who need automation to be a memory aid, not a strategy. When something automates that should not have, the rule that fired is one query away from explaining itself.",
      },
      {
        heading: "Operations & Health",
        body: "Most small businesses cannot answer 'is everything okay right now' without checking five separate dashboards. The deploy status is in one place. The error volume is in another. The TLS certificate expiry is in nobody's hands. The deliverability is whatever the email provider's last bounce report said. The cost picture is a spreadsheet someone updates monthly.\n\nCanopy collapses all of it into one banner at the top of the dashboard. Worst of every signal, green when everything is fine, amber when something needs attention this week, red when something needs attention right now. Drill into the banner and the relevant subsystem opens with the underlying data: per-domain TLS expiry, WHOIS expiration, email-authentication status, real-time deliverability, function-level error volume, real-time spend against the configured budget ceilings.\n\nThe infrastructure-health checks run on a daily cron and write to the audit log, so a domain's TLS certificate going to expire gets surfaced well before it does. If deliverability degrades because a sender domain's authentication failed validation, the banner reflects it on the next check. The whole point of operations telemetry is to interrupt the operator when it matters and stay quiet when it does not.\n\nOperations is not a dashboard you visit. It is a banner you trust.",
        liveHref: "/showcase/canopy/operations",
        image: "/images/case-studies/canopy/canopy-operations.webp",
        imageAlt: "Canopy Operations and Health view showing the All Systems Normal banner across deployments, pipeline, budget, infrastructure, errors, and mobile RUM, plus a per-domain TLS, WHOIS, SPF, DKIM, and DMARC posture table",
        deepDivePageSlug: "operations",
        deepDive:
          "The question that shaped the surface: what does an operator actually need to see, and what is just dashboard porn.\n\nMost operations surfaces try to show everything. Five graphs, twelve gauges, a dozen widgets. The operator either trains themselves to ignore the page or they panic-respond to whichever gauge happens to be yellow. Neither outcome ships.\n\nI built Canopy's operations surface around the inverse discipline: stay quiet until something matters. The default state is one banner that summarizes the worst signal across the entire stack. Green means everything I bother to monitor is fine. Amber means something needs attention this week. Red means something needs attention right now. The operator visits the dashboard for the work they came to do, not because the operations page demanded their attention.\n\nI considered always-on real-time alerting. I rejected it because most small businesses get three alerts and then mute the channel, and a muted channel is worse than no channel because it manufactures false confidence. Daily cron is enough for everything I check at the operations layer: certificate expiry, domain expiry, email-authentication posture. Real-time is reserved for the signals that genuinely change minute-to-minute, deployment health and email deliverability among them.\n\nThe failure mode I built against: a TLS cert expiring at two in the morning. The banner reflected that risk on the previous day's check, before any visitor hit a broken site. The buyer was warned in working hours, when warnings can become tickets instead of incidents.",
      },
      {
        heading: "Pathlight Integration",
        body: "Pathlight is the AI-driven website-audit platform DBJ runs as the top of its sales funnel. Canopy is where Pathlight's signals become operator workflows: prospecting candidate research, change monitoring on existing customer sites with manual rescan triggers, competitive-intelligence scans on direct competitors of the buyer.\n\nEvery Pathlight call from inside Canopy passes through layered guardrails. Triggers are manual, or rules-bounded with explicit human approval. The monthly budget cap has to have headroom. Each capability has to be turned on per install. If any guardrail blocks the call, nothing fires and the operator sees why. The buyer never gets a surprise bill from a runaway loop because the architecture does not allow runaway loops.\n\nProspecting candidates flow into the pipeline with their scan context attached. Change-monitoring alerts surface in the operations banner. Competitive scans are stored next to the prospect record so the next conversation has context. The integration is opt-in, monitored, and capped, which is the only way an AI-cost line item belongs in a productized engagement.\n\nThe honest exclusion: this integration is bundled with Canopy, not sold separately. Pathlight as a standalone product has its own surface. This section describes how Canopy uses it.",
        liveHref: "/showcase/canopy/pathlight",
        image: "/images/case-studies/canopy/canopy-pathlight.webp",
        imageAlt: "Canopy Pathlight Integration view showing layered guardrails for capability, triggers, and monthly budget, plus a prospecting candidates table with scan scores and outreach status",
        deepDivePageSlug: "pathlight",
        deepDive:
          "The question that gates this section: how do you let an operator press a button that costs the studio real money, without exposing the buyer to a runaway bill.\n\nThe answer is three independent gates, each one capable of stopping the call. Capability has to be turned on per install. The trigger has to be manual or rule-bounded with explicit human approval, never a silent background scheduler. The monthly budget cap has to have headroom. If any one gate fails the call aborts and the operator sees why. The buyer never gets a surprise bill from a runaway loop because the architecture does not allow runaway loops.\n\nI considered scheduled background scans with usage-based billing. I rejected that because AI cost runs to runaway loops faster than any other line item I have ever shipped, and a small business cannot absorb 'the system scanned eight hundred sites in your sleep, your bill is four hundred and eighty dollars.' The honest framing: AI cost belongs in a productized engagement only when it is a known monthly maximum, not a wild-card.\n\nThe failure mode I most carefully guarded against: two admin clicks at the same instant when the budget has one scan of headroom remaining. Both passes have to not pass. Atomic check-and-reserve, not check-then-reserve. One scan fires, the other gets a user-facing block.\n\nThe operational consequence: the AI line item is a known monthly maximum, every month, by construction.",
      },
      {
        heading: "Architecture & Ownership",
        body: "Most small-business software lives in someone else's data center, behind someone else's auth, governed by someone else's terms of service. The buyer rents access to their own data and pays a monthly subscription for the privilege.\n\nCanopy inverts that. Per-install Postgres database, per-install Google sign-in with an admin-only allow-list, per-install deployment to a Vercel project the buyer owns. No shared infrastructure between customers. No multi-tenant database to leak across accounts. No 'we are migrating you to a new region' email. The buyer's data sits in a database the buyer pays for directly, behind a domain the buyer paid the registrar for directly, with an SSL certificate issued to the buyer.\n\nRole-based access control gates who can see what, with multiple permission tiers configurable per install. Every meaningful entity change writes a before-and-after snapshot to the audit log, attributed to the user who made the change. The audit log is queryable. The role assignments are revocable. The whole architecture is the buyer's to inspect, modify, audit, or migrate away from.\n\nIf I get hit by a bus, the buyer keeps their database, their auth, their domain, their data, and their operating system. That is what ownership actually means.",
        liveHref: "/showcase/canopy/audit",
        image: "/images/case-studies/canopy/canopy-audit.webp",
        imageAlt: "Canopy Audit log entries showing deal stage changes, contact follow-up updates, email sends, tag edits, and scan completions with key-by-key diffs",
        deepDivePageSlug: "architecture",
        deepDive:
          "The question that shaped every other answer: who owns the data after the engagement ends.\n\nMost small-business software answers that question with the phrase 'we do.' Canopy answers it with the phrase 'you do.' Per-install Postgres database, per-install Google sign-in with an admin-only allow-list, per-install deployment to a Vercel project the buyer owns. The buyer pays Neon directly. The buyer pays Vercel directly. The buyer pays their domain registrar directly. There is no shared infrastructure between customers. There is no multi-tenant database to leak across accounts. There is no 'we are migrating you to a new region' email.\n\nI considered multi-tenant SaaS with row-level security and a master billing dashboard. The infrastructure is cheaper to run that way and the support story is simpler for me. I rejected it because every multi-tenant system I have ever read about has eventually leaked across tenants, and the buyer who matters is the one who reads the postmortem and remembers it. If the worst case for the buyer is a row appearing in someone else's data, that is too bad a worst case.\n\nRole-based access control gates who can see what, with multiple permission tiers configurable per install. Every meaningful change is attributable. Role assignments are revocable. The audit log is queryable.\n\nThe operational consequence: a Canopy install can be inspected, modified, audited, or migrated away from without my permission. The buyer can fire me and keep operating tomorrow morning. That is the test ownership has to pass.",
      },
      {
        heading: "What Comes Next",
        body: "Canopy is install zero. The Star Auto Service is the first external customer, live now, running the full stack. The architecture is shipped. The product is real. The price is not yet productized.\n\nInstall zero is priced well below what the engagement is worth, in exchange for the right to point at it as the proof of craft for the next install. The plan is to ship the next few installs at progressively closer-to-market rates, learn what the configuration-per-vertical work actually costs in time, then publish a real productized engagement at a real price. Until then, every Canopy conversation is a custom-scoped engagement that starts with a discovery call.\n\nIf you have an operations problem that this kind of stack might solve, get in touch and I will scope a custom build. The honest framing: I am looking for the next install. A small business with revenue, SaaS sprawl, and the appetite to own the stack instead of renting it. The fastest way to find out if Canopy fits is a thirty-minute conversation.",
      },
    ],
    techDetails: [
      {
        name: "You Own the Whole Stack",
        reason:
          "Every install is its own database, its own auth wall, its own domain. No multi-tenant shared infrastructure that mixes one client's data with another's. No vendor login your team needs to remember. No SaaS contract to renew. The dashboard, the data, and the keys all live where the buyer keeps the rest of their business.",
      },
      {
        name: "First-Party Telemetry",
        reason:
          "Visitor analytics, Web Vitals, scroll depth, and dwell time captured from the buyer's own site and posted directly to the buyer's own dashboard. No third-party SDK loaded. No external script firing on every page. No data leaving the buyer's infrastructure to be aggregated elsewhere and resold. What is captured is what the buyer asked for, full stop.",
      },
      {
        name: "Real Visitors, Not Crawler Noise",
        reason:
          "Bot pressure is real and most dashboards either over-count it (inflating vanity numbers) or under-count it (hiding a problem). Canopy separates bot traffic from humans at the ingest layer so the headline numbers reflect actual potential customers, while bot pressure is still surfaced honestly when the buyer wants to see it.",
      },
      {
        name: "Privacy-First by Design",
        reason:
          "Raw visitor IPs are never persisted. Identifiers are first-party only, not third-party tracking cookies. The whole capture pipeline assumes the question 'can you defend this against a privacy challenge' will get asked, and the answer is yes. That stance also future-proofs the install against the next round of cookie deprecations.",
      },
      {
        name: "Surfaced Before It Bites",
        reason:
          "Certificate, domain, and email-auth posture checked daily per tracked domain. Deployment health and email deliverability ingested in real time. The dashboard is fast even when the underlying data is large because it reads from already-aggregated views. Issues surface as warnings before they become outages.",
      },
    ],
    timeline:
      "Built first for DBJ Technologies as my own internal operating-system admin. The Star Auto Service in Richardson, TX is install zero, the first external proof that the architecture transfers cleanly off the studio's stack and onto somebody else's. Each install is delivered as the client's own infrastructure, in their own accounts, structured so they keep deploying it themselves long after the work is done.",
    ctaText: "Ready for a stack like this?",
    ctaHref: "/contact",
    ctaButtonText: "Get in Touch",
    showcaseVideo: {
      mp4: "/images/case-studies/canopy-showcase.mp4",
      webm: "/images/case-studies/canopy-showcase.webm",
      poster: "/images/case-studies/canopy-showcase-poster.jpg",
    },
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
