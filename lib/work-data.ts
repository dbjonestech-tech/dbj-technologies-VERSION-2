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
      "Find the problems. Find the money drain. Find the fix. AI-powered analysis with industry-specific revenue modeling, not generic scores.",
    category: "Internal Product",
    gradient: "from-violet-600 to-pink-500",
    liveUrl: "https://dbjtechnologies.com/pathlight",
    metrics: [
      { label: "AI Pipeline Stages", value: "5" },
      { label: "Curated Verticals", value: "206" },
      { label: "Scan Time", value: "~2 min" },
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "AI/LLM Integration",
      "PostgreSQL",
      "Serverless",
    ],
    notable:
      "The only free tool that translates website problems into dollar signs. 206 industry benchmarks. Zero scan-to-scan variance for covered verticals.",
    image: "/images/case-studies/pathlight-landing.webp",
    heroDescription:
      "A full-stack AI platform built from the ground up to scan any business website and produce a complete intelligence report: performance audit, design analysis, revenue impact estimate, and prioritized fix list. All in minutes, for free. Proof that AI-powered analysis, when properly engineered, delivers genuine business insight instead of generic summaries.",
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
        body: "Every scan runs through a multi-stage AI analysis pipeline. The system captures full-page screenshots on desktop and mobile, runs a comprehensive performance audit, evaluates design and competitive positioning using computer vision, matches the business to its industry for accurate revenue modeling, and generates prioritized recommendations. The entire process is automated with built-in quality checks at every stage.",
      },
      {
        heading: "The Curated Database",
        body: "Pathlight maintains a curated database of industry-specific benchmarks covering hundreds of business verticals. Each benchmark has been validated across multiple independent research sources and reviewed for accuracy. When a scan identifies a business's industry, Pathlight pulls validated data rather than relying on a single web search. This eliminates the variance and inconsistency that plague other automated analysis tools.",
      },
      {
        heading: "The Report",
        body: "Every scan produces a Pathlight Score (0-100) broken into four weighted pillars: Design (35%), Performance (25%), Positioning (25%), and Findability (15%). Below the score, the top 3 fixes ranked by impact and difficulty, full desktop and mobile screenshots, and a revenue impact estimate with full methodology transparency. The built-in chatbot lets business owners ask follow-up questions about their results, and it's transparent about confidence levels rather than pretending precision.",
      },
    ],
    techDetails: [
      {
        name: "AI & Machine Learning",
        reason:
          "Multiple large language models handle different stages of analysis, from visual design evaluation to revenue impact modeling. Each model is prompted with specialized instructions tuned to its task.",
      },
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
          "PostgreSQL for scan persistence and analysis storage. A curated industry benchmark database for accurate revenue modeling. Email event tracking for deliverability monitoring.",
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
      "Production website for a 25-year Richardson, TX auto repair shop. Perfect Lighthouse scores across the board, automated lead capture, and local SEO architecture. Built and deployed from zero in a single focused session.",
    category: "Client Project",
    gradient: "from-blue-600 to-cyan-500",
    liveUrl: "https://thestarautoservice.com",
    metrics: [
      { label: "Performance", value: "100" },
      { label: "Accessibility", value: "100" },
      { label: "SEO", value: "100" },
    ],
    techStack: ["Next.js 16", "Tailwind CSS 4", "Resend", "Google Analytics"],
    notable:
      "Every inquiry hits the owner's inbox instantly. Every page loads in under a second. Every Lighthouse category scores 100.",
    image: "/images/case-studies/star-auto-desktop.webp",
    heroDescription:
      "A complete digital presence for a family-owned, ASE-certified auto repair shop serving Richardson, TX since 1998. Engineered from zero to production with perfect Lighthouse scores, automated email delivery, and local SEO architecture that puts Miguel's shop in front of every nearby search.",
    sections: [
      {
        heading: "The Client",
        body: "Miguel Ibarra runs The Star Auto Service, a family-owned, ASE-certified auto repair shop in Richardson, TX that's been serving the community since 1998. With a 4.8-star rating, bilingual service, and NAPA Auto Care certification, the shop had decades of trust built in person. What it didn't have was a web presence that matched.",
      },
      {
        heading: "The Challenge",
        body: "Every local auto repair search in Richardson returns shops with modern websites, online booking, and Google reviews front and center. Without a professional site, Star Auto was invisible to anyone who didn't already drive past the shop. The goal was clear: build a site that ranks for local searches, converts visitors to phone calls, and reflects the quality of the work Miguel's team actually delivers.",
      },
      {
        heading: "The Approach",
        body: "Mobile-first, because over 60% of local service searches happen on phones. Sub-second load times, because every extra second of load time costs conversions. Local SEO from day one, not as an afterthought. The site was architected around a single conversion goal: get the visitor to call (972) 231-2886 or submit the contact form. Every design decision serves that goal.",
      },
      {
        heading: "What I Delivered",
        body: "A 4-page production website with hero imagery, service breakdowns, about page with trust signals, and a contact form wired to automated email delivery via Resend. JSON-LD structured data for local business schema. Google Analytics for traffic visibility. Security headers, custom 404 page, skip navigation for accessibility, and Cloudflare DNS for speed and protection. Every page responsive across all device sizes.",
      },
    ],
    techDetails: [
      {
        name: "Next.js 16",
        reason:
          "Server-side rendering for instant first paint and SEO-friendly HTML. App Router with static generation for zero-latency page loads.",
      },
      {
        name: "Tailwind CSS 4",
        reason:
          "Utility-first styling for precise, responsive design without CSS bloat. Every breakpoint tested on real devices.",
      },
      {
        name: "Resend",
        reason:
          "Transactional email API for the contact form. Every inquiry hits Miguel's inbox within seconds. No missed leads.",
      },
      {
        name: "Google Analytics",
        reason:
          "Traffic and conversion visibility from day one. Miguel can see exactly where visitors come from and what they click.",
      },
      {
        name: "Cloudflare DNS",
        reason:
          "Enterprise-grade DNS with DDoS protection, CDN caching, and global edge delivery. Professional infrastructure for a local business.",
      },
      {
        name: "JSON-LD",
        reason:
          "Structured data markup tells Google exactly what this business is, where it is, and what it does. Critical for local pack ranking.",
      },
    ],
    timeline:
      "Built and deployed from zero to production in a single focused session.",
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
      "Full LocalBusiness JSON-LD coverage with geo coordinates, NAICS codes, and areaServed for every market. Google Business Profile entity-aligned with the website. TDPSA-compliant privacy policy built for the actual data practices, not a template.",
    image: "/images/soil-depot-screenshot.png",
    heroDescription:
      "Building local search dominance for a Texas commercial soil logistics broker. A complete local SEO infrastructure and digital presence buildout covering structured data architecture, Google Business Profile entity wiring, city-specific landing pages across five major Texas metros, TDPSA legal compliance, and a technical SEO foundation engineered to compound organic growth across both Google and Bing.",
    sections: [
      {
        heading: "The Client",
        body: "Soil Depot is a commercial soil brokerage and logistics company serving contractors, developers, and landscapers across five major Texas markets: Dallas, Fort Worth, Houston, Austin, and San Antonio. They supply fill dirt, topsoil, select fill, and sand, brokered from vetted sources and delivered on schedule to active job sites. The team needed their digital infrastructure to match their operational scale. The website existed but had no structured data, no local SEO strategy, no legal compliance with Texas data privacy requirements, and no connection between their Google Business Profile and their website. Google had no clear signal about what the business was, where it operated, or how it related to the search profile prospects were finding.",
      },
      {
        heading: "The Challenge",
        body: "Three core problems. First, Google could not connect the website to the Google Business Profile. There was no entity wiring: no matching NAP data, no structured markup, no Maps integration linking the two. This meant the website and the business profile were functioning as two separate entities in Google's eyes, splitting authority instead of building it. Second, city-level search terms were completely untapped. Contractors searching for 'fill dirt delivery Houston' or 'topsoil supplier Austin' had no Soil Depot page to find. The site was a single domain with no geographic targeting, competing against local suppliers who had dedicated pages for each service area. Third, the site had no privacy policy and no compliance with the Texas Data Privacy and Security Act (TDPSA). For a business that collects contact information through quote request forms, this was a legal gap that needed closing.",
      },
      {
        heading: "Structured Data Architecture",
        body: "Implemented comprehensive LocalBusiness schema markup using JSON-LD, giving Google an unambiguous machine-readable definition of the business. The markup includes precise geo coordinates, NAICS industry classification codes, areaServed definitions covering all five Texas metros, and openingHoursSpecification. When Google crawls Soil Depot, it now knows exactly what the business is, where it operates, what industry it serves, and when it is open. This is the foundation that every other local SEO improvement builds on.",
      },
      {
        heading: "Google Business Profile Entity Wiring",
        body: "Connected the Google Business Profile to the website with consistent NAP (name, address, phone) data across every touchpoint. Embedded a Google Maps widget that references the verified business entity, creating a closed loop: the GBP points to the website, the website references the GBP, and the structured data confirms the relationship. This entity alignment is what tells Google these are the same business, consolidating search authority instead of fragmenting it.",
      },
      {
        heading: "City-Level Search Targeting",
        body: "Built dedicated landing pages targeting commercial soil and fill dirt keywords in each of Soil Depot's five primary markets. Each page is optimized through Rank Math with city-specific meta titles, descriptions, and content targeting terms like 'fill dirt delivery [city]', 'topsoil supplier [city]', and 'bulk soil [city]'. Set up Bing Webmaster Tools in parallel to ensure the site is indexed and optimized for Microsoft's search engine, which handles a meaningful share of B2B searches.",
      },
      {
        heading: "Legal Compliance",
        body: "Deployed a TDPSA-compliant privacy policy configured for Soil Depot's specific data collection practices. This is not a generic template paste. The policy addresses the actual forms on the site, the types of data collected through quote requests and the soil calculator, cookie usage, and third-party service integrations. It meets the requirements of the Texas Data Privacy and Security Act that took effect in 2024.",
      },
      {
        heading: "Technical SEO Foundation",
        body: "Configured Rank Math across the entire site for on-page SEO optimization: XML sitemap generation, Open Graph and Twitter Card meta tags, canonical URL management, and breadcrumb structured data. Set up Google Search Console and Bing Webmaster Tools for ongoing performance monitoring. The site now has a complete technical SEO foundation that compounds over time as Google indexes new content and processes the structured data.",
      },
      {
        heading: "The Outcome",
        body: "The site went from zero structured data to complete LocalBusiness schema coverage. Five city-specific landing pages now target previously untapped local search terms. Google Business Profile and website are entity-aligned with consistent NAP data. TDPSA compliance is in place. The technical SEO foundation supports long-term organic growth across both Google and Bing.",
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
