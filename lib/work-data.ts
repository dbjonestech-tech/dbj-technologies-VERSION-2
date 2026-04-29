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
      "Local SEO infrastructure and full digital presence buildout for a Texas commercial soil logistics broker serving Dallas, Fort Worth, Houston, Austin, and San Antonio.",
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
      "Rank Math SEO",
      "Schema.org (JSON-LD)",
      "Google Business Profile",
      "Bing Webmaster Tools",
      "Google Maps API",
    ],
    notable:
      "Full LocalBusiness JSON-LD coverage with geo coordinates, NAICS codes, and areaServed for every market. Google Business Profile entity aligned with the website. TDPSA compliant privacy policy built for the actual data practices, not a template.",
    image: "/images/case-studies/soil-depot-desktop.webp",
    heroDescription:
      "Building local search dominance for a Texas commercial soil logistics broker. A complete local SEO infrastructure and digital presence buildout covering structured data architecture, Google Business Profile entity wiring, city specific landing pages across five major Texas metros, TDPSA legal compliance, and a technical SEO foundation engineered to compound organic growth across both Google and Bing.",
    sections: [
      {
        heading: "The Client",
        body: "Soil Depot is a commercial soil brokerage and logistics company serving contractors, developers, and landscapers across five major Texas markets: Dallas, Fort Worth, Houston, Austin, and San Antonio. They supply fill dirt, topsoil, select fill, and sand, brokered from vetted sources and delivered on schedule to active job sites. The team needed their digital infrastructure to match their operational scale. The website existed but had no structured data, no local SEO strategy, no legal compliance with Texas data privacy requirements, and no connection between their Google Business Profile and their website. Google had no clear signal about what the business was, where it operated, or how it related to the search profile prospects were finding.",
      },
      {
        heading: "The Challenge",
        body: "Three core problems. First, Google could not connect the website to the Google Business Profile. There was no entity wiring: no matching NAP data, no structured markup, no Maps integration linking the two. This meant the website and the business profile were functioning as two separate entities in Google's eyes, splitting authority instead of building it. Second, city level search terms were completely untapped. Contractors searching for 'fill dirt delivery Houston' or 'topsoil supplier Austin' had no Soil Depot page to find. The site was a single domain with no geographic targeting, competing against local suppliers who had dedicated pages for each service area. Third, the site had no privacy policy and no compliance with the Texas Data Privacy and Security Act (TDPSA). For a business that collects contact information through quote request forms, this was a legal gap that needed closing.",
      },
      {
        heading: "Structured Data Architecture",
        body: "Implemented comprehensive LocalBusiness schema markup using JSON-LD, giving Google an unambiguous machine readable definition of the business. The markup includes precise geo coordinates, NAICS industry classification codes, areaServed definitions covering all five Texas metros, and openingHoursSpecification. When Google crawls Soil Depot, it now knows exactly what the business is, where it operates, what industry it serves, and when it is open. This is the foundation that every other local SEO improvement builds on.",
      },
      {
        heading: "Google Business Profile Entity Wiring",
        body: "Connected the Google Business Profile to the website with consistent NAP (name, address, phone) data across every touchpoint. Embedded a Google Maps widget that references the verified business entity, creating a closed loop: the GBP points to the website, the website references the GBP, and the structured data confirms the relationship. This entity alignment is what tells Google these are the same business, consolidating search authority instead of fragmenting it.",
      },
      {
        heading: "City Level Search Targeting",
        body: "Built dedicated landing pages targeting commercial soil and fill dirt keywords in each of Soil Depot's five primary markets. Each page is optimized through Rank Math with city specific meta titles, descriptions, and content targeting terms like 'fill dirt delivery [city]', 'topsoil supplier [city]', and 'bulk soil [city]'. Set up Bing Webmaster Tools in parallel to ensure the site is indexed and optimized for Microsoft's search engine, which handles a meaningful share of B2B searches.",
      },
      {
        heading: "Legal Compliance",
        body: "Deployed a TDPSA compliant privacy policy configured for Soil Depot's specific data collection practices. This is not a generic template paste. The policy addresses the actual forms on the site, the types of data collected through quote requests and the soil calculator, cookie usage, and third party service integrations. It meets the requirements of the Texas Data Privacy and Security Act that took effect in 2024.",
      },
      {
        heading: "Technical SEO Foundation",
        body: "Configured Rank Math across the entire site for on page SEO optimization: XML sitemap generation, Open Graph and Twitter Card meta tags, canonical URL management, and breadcrumb structured data. Set up Google Search Console and Bing Webmaster Tools for ongoing performance monitoring. The site now has a complete technical SEO foundation that compounds over time as Google indexes new content and processes the structured data.",
      },
      {
        heading: "The Outcome",
        body: "The site went from zero structured data to complete LocalBusiness schema coverage. Five city specific landing pages now target previously untapped local search terms. Google Business Profile and website are entity aligned with consistent NAP data. TDPSA compliance is in place. The technical SEO foundation supports long term organic growth across both Google and Bing.",
      },
    ],
    techDetails: [
      {
        name: "WordPress",
        reason:
          "Battle-tested CMS that gives the owners full editorial control over service descriptions, city pages, and quote request flows without needing a developer for every content change.",
      },
      {
        name: "Rank Math SEO",
        reason:
          "On-page SEO configured at scale: city-specific meta titles, descriptions, Open Graph tags, canonical URLs, XML sitemaps, and breadcrumb structured data wired into every page template.",
      },
      {
        name: "Schema.org (JSON-LD)",
        reason:
          "Full LocalBusiness markup with geo coordinates, NAICS industry codes, areaServed definitions for all five Texas metros, and openingHoursSpecification. The unambiguous machine-readable identity Google uses for local pack ranking.",
      },
      {
        name: "Google Business Profile",
        reason:
          "Entity-aligned with the website through consistent NAP data, structured markup, and a verified Maps embed. Tells Google the business profile and the website are the same entity, consolidating search authority instead of splitting it.",
      },
      {
        name: "Google Maps API",
        reason:
          "Embedded map referencing the verified business entity, closing the loop between the Google Business Profile and the website. Visitors get instant location context, Google gets reinforced entity signals.",
      },
      {
        name: "Bing Webmaster Tools",
        reason:
          "Indexing and optimization for Microsoft's search engine, which handles a meaningful share of B2B and contractor search traffic that Google-only setups miss entirely.",
      },
      {
        name: "Google Search Console",
        reason:
          "Ongoing performance visibility into impressions, clicks, average position, and indexing status. The dashboard the owners check to watch their organic footprint grow.",
      },
    ],
    timeline:
      "Delivered across a focused engagement covering structured data architecture, Google Business Profile entity wiring, five city-specific landing pages, TDPSA legal compliance, and a complete technical SEO foundation.",
    ctaText: "Ready for Results Like These?",
    ctaHref: "/contact",
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return PROJECT_DETAILS.find((p) => p.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_DETAILS.map((p) => p.slug);
}
