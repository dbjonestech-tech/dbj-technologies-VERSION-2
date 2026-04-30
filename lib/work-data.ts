/* ─── WORK / PROJECTS ──────────────────────────────── */

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectSection {
  heading: string;
  body: string;
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
  liveUrl: string;
  metrics: ProjectMetric[];
  techStack: string[];
  notable: string;
  image: string;
  heroDescription: string;
  sections: ProjectSection[];
  techDetails: ProjectTechDetail[];
  timeline: string;
  ctaText: string;
  ctaHref: string;
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
      "Find the problems. Find the money drain. Find the fix. AI powered analysis with industry specific revenue modeling, not generic scores.",
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
      "A full stack AI platform built from the ground up to scan any business website and produce a complete intelligence report: performance audit, design analysis, revenue impact estimate, and prioritized fix list. All in minutes, for free. Proof that AI powered analysis, when properly engineered, delivers genuine business insight instead of generic summaries.",
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
    name: "Star Auto Service",
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
      "An operations dashboard I built first for myself to run DBJ Technologies, then deployed for a client as the first install. Visitor analytics, real-user performance, deployment lifecycle, infrastructure watchers, error tracking, email deliverability, and an admin audit log. One dashboard, on the client's own domain, with one auth wall and one source of truth.",
    category: "Internal Tooling",
    gradient: "from-cyan-500 to-blue-600",
    liveUrl: "https://dbjtechnologies.com/work/canopy",
    metrics: [
      { label: "Sections", value: "9" },
      { label: "Live Install", value: "Star Auto" },
      { label: "Built In", value: "Two days" },
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "PostgreSQL",
      "Auth.js",
    ],
    notable:
      "Built first for myself to run DBJ Technologies. Star Auto Service is install zero, the proving ground for the architecture before any wider productized rollout.",
    image: "/images/case-studies/canopy-dashboard.webp",
    heroDescription:
      "An operations dashboard built first for the studio that ships it, then deployed as install zero for a real client. Star Auto Service in Richardson, TX is the first external Canopy: visitor analytics, real-user Web Vitals, Vercel deployment lifecycle, infrastructure watchers, error tracking, email deliverability, and an admin audit log, all on the client's own domain at ops.thestarautoservice.com behind a Google sign-in. Not yet a productized offering for sale. Live as a working install, on the way to becoming one once the playbook proves out across more verticals.",
    sections: [
      {
        heading: "The Problem",
        body: "Walk into most operating businesses and ask 'how many of last week's visitors actually became customers' and the answer is a shrug, plus a guess from somebody who watches one dashboard and somebody else who watches a different one. Analytics, performance monitoring, error tracking, deliverability, and infrastructure all live in separate SaaS products with separate logins, separate billing, separate data shapes, and zero ability to join across them. Each one charges a recurring fee, each one owns a slice of the truth, and none of them speak to the business outcomes the operator actually cares about. That is what fifteen thousand dollars or more per year on observability subscriptions buys most businesses: noise across five to seven tabs, no single source of truth, no answers when it matters.",
      },
      {
        heading: "The Solution",
        body: "Canopy is a single operations dashboard that replaces the SaaS sprawl. One login, one domain, one Postgres, one place to look. Visitor analytics that join the same session across page-views, performance, and conversion events. Real-user Web Vitals captured from every visitor with thresholds tied to the actual Core Web Vitals spec. Vercel deployment lifecycle posted in real time from the platform's webhook. Infrastructure watchers running daily TLS, WHOIS, MX, SPF, DKIM, and DMARC checks per domain. Error tracking grouped by fingerprint with affected-user counts. Email deliverability ingested directly from the sending platform's webhook. An admin audit log so every sign-in is accountable. Nine sections of operations intelligence, all on the buyer's domain, in the buyer's database, under the buyer's auth.",
      },
      {
        heading: "What the Star Auto Install Includes",
        body: "Miguel runs the auto repair shop. He signs into ops.thestarautoservice.com with his Google account and sees the worst-of-status banner first: any failing deploys, any spiking errors, any infrastructure that needs attention. Below that, eight headline stat cards with sparkline trends and signed deltas against the prior period, then real-time feeds for recent deploys, recent errors, infrastructure status, and live visitor sessions. Each section drills into its own page: Visitors with top pages, top referrers, UTM source breakdown, devices, and a recent-sessions table; Real-User Performance with p75 LCP, INP, CLS, TTFB, and FCP plus per-page and per-device breakdowns; Platform with deploy outcomes, build cadence, function p95, and a hot-functions table; Infrastructure with a per-domain check grid and TLS expiry countdowns; Errors grouped by fingerprint with affected users; Email with delivery and bounce rates plus the 30-day trend; an admin Audit log of every sign-in. Same architecture I run for the studio, productized so the install path is repeatable.",
      },
      {
        heading: "How It Is Different",
        body: "Datadog, PostHog, Sentry, and the rest are excellent products. The reason to build in-house is when the buyer needs data joined to their specific business outcomes (visitor-to-customer attribution across marketing, product, and sales) or when SaaS sprawl is costing them more annually than the build pays back in. Canopy is for the cases where a single SaaS does not work. Owned by the buyer, not rented. On the buyer's domain, not a third-party subdomain. In the buyer's database, not someone else's data center. Behind the buyer's auth, not a vendor login. Walking away cleanly is the productized promise: every install is structured so the buyer keeps deploying it themselves long after the engagement ends.",
      },
      {
        heading: "What Comes Next",
        body: "Star Auto is install zero, the first proof that the architecture transfers cleanly off DBJ's stack and onto somebody else's. Before this becomes a productized engagement on the pricing page, the playbook needs to prove out across more verticals (a tech-forward business with five to seven SaaS subscriptions, an operations team that wants funnel attribution, at least one install with a year of data behind it). Until then it lives here as proof of craft. If you have an operations problem that this kind of stack might solve, get in touch and we can scope a custom build.",
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
        name: "Daily Watchers, Surfaced Before They Bite",
        reason:
          "TLS expiry, WHOIS, MX, SPF, DKIM, DMARC checked daily per tracked domain. Email deliverability rolled up from the sending platform. Deploy lifecycle ingested in real time. The dashboard reads from already-aggregated tables, so opening it is instant even when the underlying data is large. Issues surface before they become outages.",
      },
    ],
    timeline:
      "Built first for DBJ Technologies as my own internal operations cockpit. Productized into a per-client engagement after the patterns proved durable across a year of running my own studio on it. The first external install lives at ops.thestarautoservice.com for Star Auto Service in Richardson, TX. Each engagement is delivered as the buyer's own infrastructure, in their own accounts, transferred cleanly so the buyer keeps deploying it themselves long after the work is done.",
    ctaText: "Get in Touch",
    ctaHref: "/contact",
    showcaseVideo: {
      mp4: "/images/case-studies/canopy-showcase.mp4",
      webm: "/images/case-studies/canopy-showcase.webm",
      poster: "/images/case-studies/canopy-showcase-poster.jpg",
      caption: "Live from ops.thestarautoservice.com",
    },
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
