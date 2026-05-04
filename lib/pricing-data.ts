/* ─── EXTENDED PRICING DATA ────────────────────────── */

export interface PricingDetailSection {
  heading: string;
  body: string;
}

export interface PricingDetailFaq {
  question: string;
  answer: string;
}

export interface PricingDetail {
  slug: string;
  name: string;
  price: string;
  timeline: string;
  heroDescription: string;
  idealFor: string;
  sections: PricingDetailSection[];
  faq: PricingDetailFaq[];
  ctaText: string;
  ctaHref: string;
}

export interface AddOn {
  slug: string;
  name: string;
  price: string;
  priceValue: number;
  perUnit: boolean;
  unitLabel?: string;
  description: string;
  tiers: string[];
}

export const PRICING_DETAILS: PricingDetail[] = [
  {
    slug: "fix-sprint",
    name: "Fix Sprint",
    price: "$2,995",
    timeline: "2 weeks",
    heroDescription:
      "The fastest path from a Pathlight report to fewer revenue leaks. I take the three highest-impact issues from your scan and ship the fixes in two weeks. Fixed price, full source code ownership, and a re-scan after launch so you can verify the difference.",
    idealFor:
      "Businesses who just ran a Pathlight scan, saw the revenue-impact estimate, and want the highest-leverage fixes shipped now without committing to a full rebuild. Ideal when your site mostly works but specific issues are quietly costing you leads.",
    sections: [
      {
        heading: "What Gets Fixed",
        body: "The three top-priority issues from your Pathlight report, ranked by revenue impact. That typically means a mix of trust signals, conversion paths, mobile rendering, page speed, or messaging clarity. I scope the exact list with you in a 30-minute kickoff so the two weeks are spent on the highest-leverage work, not guesswork.",
      },
      {
        heading: "How It Works",
        body: "You send your Pathlight report. I review it, propose the three fixes I would prioritize, and confirm the scope with you. Build happens in a focused two-week sprint with one mid-sprint check-in. At launch you get the deployed fixes, a before-and-after Lighthouse comparison, and a fresh Pathlight re-scan so you can see the score change.",
      },
      {
        heading: "What You Get at the End",
        body: "The three fixes deployed to production, full source code committed to your repository, a before-and-after report covering Lighthouse scores plus the relevant Pathlight pillar movement, and 30 days of post-launch support for any follow-up issues. If you want to keep going, the $2,995 is credited toward a Starter, Professional, or Enterprise engagement.",
      },
    ],
    faq: [
      {
        question: "What if my scan flagged more than three issues?",
        answer:
          "I prioritize the three with the highest revenue impact and clearest scope. If you want to ship more in one engagement, the Starter or Professional tier is usually the better fit, and the Fix Sprint fee is credited toward it.",
      },
      {
        question: "Do I have to use Pathlight to qualify?",
        answer:
          "Pathlight is the easiest path because it produces the exact diagnosis I work from. If you have an audit from another tool or a list of known issues, send them over and I will tell you whether the scope fits a Fix Sprint.",
      },
      {
        question: "What is not included?",
        answer:
          "New pages, brand redesigns, copywriting beyond the targeted fixes, and feature additions are out of scope. Fix Sprint is for repairing what is quietly broken on your existing site, not rebuilding it. If you need a rebuild, the Starter or Professional tier is the right fit.",
      },
    ],
    ctaText: "Start a Fix Sprint",
    ctaHref: "/contact",
  },
  {
    slug: "starter",
    name: "Starter",
    price: "$4,500",
    timeline: "3-4 weeks",
    heroDescription:
      "A complete custom website for businesses launching their digital presence or replacing an outdated site. I build it from scratch using the same architecture and performance standards as my larger projects. No templates. No page builders. You get a fast, professional, mobile-ready website that you fully own.",
    idealFor:
      "Small businesses, solo professionals, and personal brands that need a polished online presence without enterprise complexity. Restaurants, counselors, fitness studios, consultants, and anyone whose current site is a liability or who has no site at all.",
    sections: [
      {
        heading: "What Is Included",
        body: "Up to 5 custom-designed pages, responsive layout for all devices, basic SEO setup (meta tags, sitemap, schema markup), a contact form with email routing, and two rounds of design revisions. I handle the hosting setup, domain connection, SSL certificate, and launch checklist. You get the source code and full ownership on day one.",
      },
      {
        heading: "How It Works",
        body: "I start with a discovery conversation to understand your business, your customers, and what success looks like. Then I design and build the site in focused sprints, sharing progress along the way. Most Starter projects are live within 3-4 weeks of kickoff.",
      },
      {
        heading: "What You Get at the End",
        body: "A live, fast, fully responsive website with a 90+ Google Lighthouse score. Source code delivered to your GitHub or repository of choice. 30 days of post-launch support included for any issues or adjustments.",
      },
    ],
    faq: [
      {
        question: "Can I upgrade to Professional later?",
        answer:
          "Yes. The Starter site is built on the same architecture as Professional and Enterprise. Adding pages, features, or integrations later is straightforward because nothing needs to be rebuilt from scratch.",
      },
      {
        question: "Do I need to pay monthly after launch?",
        answer:
          "The $4,500 covers the full design, development, and launch. After that, hosting costs are typically $0-20/month. I offer an optional $299/month maintenance plan for ongoing updates, monitoring, and support.",
      },
      {
        question: "What if I need more than 5 pages?",
        answer:
          "The Professional tier at $9,500 includes up to 15 pages plus CMS integration, custom animations, and performance optimization. If you only need 6-7 pages, I can scope a custom quote between the two tiers.",
      },
    ],
    ctaText: "Start a Project",
    ctaHref: "/contact",
  },
  {
    slug: "professional",
    name: "Professional",
    price: "$9,500",
    timeline: "5-8 weeks",
    heroDescription:
      "For businesses that need more than a brochure site. I build a high performance website with content management, custom interactions, advanced SEO, and analytics. This is what I recommend for businesses that are actively growing and need their website to work as hard as they do.",
    idealFor:
      "Growing businesses, multi location companies, and established brands that need a site with real functionality. Law firms, dental practices, contractors, auto shops, and service businesses with 5+ employees that are investing in growth.",
    sections: [
      {
        heading: "What Is Included",
        body: "Up to 15 custom designed pages, CMS integration so you can update content without a developer, custom animations and interactions, advanced SEO with analytics dashboards, performance optimization targeting 95+ Lighthouse scores, and three rounds of design revisions. I also set up conversion tracking so you can measure what the site is actually doing for your business.",
      },
      {
        heading: "How It Works",
        body: "Same discovery process as Starter, but with deeper competitive analysis and conversion strategy. I map out the user journey before designing a single page. Build happens in focused sprints with weekly check-ins. Most Professional projects launch in 5-8 weeks.",
      },
      {
        heading: "What You Get at the End",
        body: "A complete digital presence with a CMS you can manage yourself, analytics tracking conversions, priority support with 48-hour response time, and a 30-day post-launch support window. Full source code ownership.",
      },
    ],
    faq: [
      {
        question: "What CMS do you use?",
        answer:
          "It depends on your needs. Most projects use a headless CMS that gives you a clean editing interface without slowing down the site. I recommend the best fit during discovery.",
      },
      {
        question: "Can I add e-commerce later?",
        answer:
          "Yes. The Professional architecture supports adding a store, booking system, or client portal without rebuilding the foundation.",
      },
      {
        question: "What does priority support mean?",
        answer:
          "Issues and requests are addressed within 48 hours. You have a direct line to me, not a support queue.",
      },
    ],
    ctaText: "Start a Project",
    ctaHref: "/contact",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "Starting at $15,000",
    timeline: "8-16 weeks",
    heroDescription:
      "For businesses that need a complete digital system, not just a website. Custom web applications, complex integrations, multi-user platforms, and infrastructure that scales. I scope every Enterprise project through a paid discovery phase so the architecture is right before a single line of code is written.",
    idealFor:
      "Businesses building custom platforms, SaaS products, multi-location operations, or complex internal tools. Companies that have outgrown template solutions and need systems-level architecture.",
    sections: [
      {
        heading: "What Is Included",
        body: "Unlimited pages, custom web application development, complete front-to-back system build, professional hosting and deployment, automated testing pipeline, dedicated project management, guaranteed uptime with monitoring, and 24/7 priority support. The scope is defined during a paid discovery phase ($1,500-$3,000) that produces a detailed technical specification and project plan before development begins.",
      },
      {
        heading: "How Discovery Works",
        body: "I spend 1-2 weeks understanding your business requirements, technical constraints, integration needs, and growth plans. The output is a comprehensive specification document, architecture diagram, timeline, and fixed price quote. If you proceed, the discovery fee is credited toward the project.",
      },
      {
        heading: "What You Get at the End",
        body: "A production grade system built to your exact specifications, fully documented, with source code ownership, deployment infrastructure, monitoring, and ongoing support. The system is built to run independently. You are never locked in.",
      },
    ],
    faq: [
      {
        question: "Why does Enterprise require paid discovery?",
        answer:
          "Complex systems fail when the scope is unclear. The discovery phase protects both sides: you get a detailed plan and fixed price before committing, and I get the clarity needed to build it right the first time.",
      },
      {
        question: "What is the typical timeline?",
        answer:
          "8-16 weeks depending on complexity. The discovery phase produces an accurate timeline before any development commitment.",
      },
      {
        question: "Can I start with Professional and upgrade?",
        answer:
          "Sometimes. If your needs are genuinely complex from the start, trying to fit them into a Professional scope creates problems. I will be honest about which tier is the right fit during the initial conversation.",
      },
    ],
    ctaText: "Contact Me",
    ctaHref: "/contact",
  },
  /* Canopy intentionally pulled from public pricing on 2026-04-30. The
   * first install (The Star Auto Service) shipped April 29 but Canopy is not
   * yet ready to be sold as a productized engagement: 1 install, no
   * proven case studies across multiple verticals, no testimonials, ICP
   * still being validated. Lives on the Work page as proof-of-craft until
   * 2-3 installs prove the playbook. Restore from git if/when ready. */
  {
    slug: "maintenance",
    name: "Maintenance",
    price: "$299/month",
    timeline: "Ongoing",
    heroDescription:
      "Your website is not finished when it launches. It needs updates, security patches, performance monitoring, and content changes. I handle all of it for a flat monthly fee so you can focus on running your business instead of worrying about whether your site is working.",
    idealFor:
      "Any business with a live website that needs ongoing care. Especially valuable for businesses that do not have an in-house developer and do not want to scramble to find one when something breaks.",
    sections: [
      {
        heading: "What Is Included",
        body: "Monthly software updates and security patches, uptime monitoring with immediate response, performance monitoring to catch slowdowns before they affect visitors, automated backups with tested restore procedures, content updates (text, images, minor layout changes), quarterly Pathlight re-scan to track your site's health over time, and priority support with same-day response for urgent issues.",
      },
      {
        heading: "Why It Matters",
        body: "An unmonitored website gradually degrades. Software gets outdated, security vulnerabilities appear, performance slows as content grows, and small problems compound into expensive emergencies. The $299/month prevents all of that.",
      },
      {
        heading: "What Is Not Included",
        body: "Major feature additions, full page redesigns, and new integrations are scoped as separate projects. The maintenance plan covers keeping your existing site healthy, fast, and current.",
      },
    ],
    faq: [
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. Month to month, no long term contract. I keep clients by delivering value, not by locking them in.",
      },
      {
        question: "What if I need a bigger change?",
        answer:
          "Anything beyond routine updates gets scoped as a mini project with a fixed quote. The maintenance relationship means I already know your codebase, so those projects are faster and cheaper than starting cold.",
      },
      {
        question: "Do I need this if I just launched?",
        answer:
          "The first 30 days of post launch support are included with every project. After that, the maintenance plan is optional but recommended. Most clients sign up after the first time they need a change and realize they do not want to do it themselves.",
      },
    ],
    ctaText: "Get Started",
    ctaHref: "/contact",
  },
  {
    slug: "consulting",
    name: "Consulting",
    price: "$175/hour",
    timeline: "2-hour minimum",
    heroDescription:
      "Sometimes you do not need a full project. You need an experienced architect to look at what you have, tell you what is wrong, and give you a plan. I offer hourly consulting for businesses that need expert guidance without a long term commitment.",
    idealFor:
      "Businesses that already have a website or development team but need senior level guidance. Second opinions on agency proposals, technical audits, architecture reviews, vendor evaluations, and strategic planning for digital initiatives.",
    sections: [
      {
        heading: "What I Cover",
        body: "Website and application audits, performance analysis, conversion strategy, architecture reviews, vendor and platform evaluations, technical due diligence, and strategic planning for digital projects. I can also review proposals from other agencies or developers and tell you whether the scope, price, and approach make sense.",
      },
      {
        heading: "How It Works",
        body: "Book a session through my calendar. Minimum engagement is 2 hours. I review your materials beforehand so the time is used well. You get a written summary of recommendations after every session.",
      },
      {
        heading: "When Consulting Becomes a Project",
        body: "If the consulting reveals work that needs to be done, I can scope it as a Starter, Professional, or Enterprise project. Consulting hours already spent are credited toward the project fee.",
      },
    ],
    faq: [
      {
        question: "Is there a minimum?",
        answer:
          "2 hours minimum per engagement. Most initial consultations run 2-3 hours.",
      },
      {
        question: "Can I book recurring sessions?",
        answer:
          "Yes. Some clients book monthly advisory sessions to keep a senior architect on call without a full-time hire.",
      },
      {
        question: "What if I just need a quick question answered?",
        answer:
          "If it is truly quick (under 15 minutes), email me at joshua@dbjtechnologies.com. I will answer if I can or suggest a session if it needs deeper discussion.",
      },
    ],
    ctaText: "Book a Consultation",
    ctaHref: "/contact",
  },
];

/* ─── ADD-ONS (TIER-AWARE) ─────────────────────────── */
/* Filtered at render time by tier slug. Maintenance and consulting
   pages do not surface add-ons. */

export const ADD_ONS: AddOn[] = [
  {
    slug: "cms",
    name: "Content Management System",
    price: "+$500",
    priceValue: 500,
    perUnit: false,
    description:
      "Update your own text, images, and pages anytime without needing a developer.",
    tiers: ["starter"],
  },
  {
    slug: "additional-pages",
    name: "Additional Pages",
    price: "+$300/page",
    priceValue: 300,
    perUnit: true,
    unitLabel: "page",
    description:
      "Extra pages beyond what is included in your package, built to the same quality and speed standards.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "blog-setup",
    name: "Blog Setup",
    price: "+$400",
    priceValue: 400,
    perUnit: false,
    description:
      "A fully designed blog section where you can publish articles, news, or updates to attract search traffic.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "booking",
    name: "Online Booking and Scheduling",
    price: "+$800",
    priceValue: 800,
    perUnit: false,
    description:
      "Let customers book appointments, consultations, or services directly from your website.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "ecommerce",
    name: "E-Commerce and Online Store",
    price: "+$1,500",
    priceValue: 1500,
    perUnit: false,
    description:
      "Sell products or services online with a custom storefront, cart, and secure checkout.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "email-marketing",
    name: "Email Marketing Integration",
    price: "+$300",
    priceValue: 300,
    perUnit: false,
    description:
      "Connect your website to Mailchimp, ConvertKit, or your email platform so new leads go straight to your list.",
    tiers: ["starter", "professional", "enterprise"],
  },
  {
    slug: "custom-animations",
    name: "Custom Animations and Interactions",
    price: "+$400",
    priceValue: 400,
    perUnit: false,
    description:
      "Scroll effects, hover animations, and interactive elements that make your site feel polished and memorable.",
    tiers: ["professional", "enterprise"],
  },
  {
    slug: "analytics",
    name: "Analytics and Conversion Tracking",
    price: "+$200",
    priceValue: 200,
    perUnit: false,
    description:
      "Know exactly how many people visit your site, where they come from, and what they do. Tracks form submissions, calls, and purchases.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "gbp-setup",
    name: "Google Business Profile Setup",
    price: "+$200",
    priceValue: 200,
    perUnit: false,
    description:
      "Set up and optimize your Google Business listing so you show up in local search results and Google Maps.",
    tiers: ["starter", "professional", "enterprise"],
  },
  {
    slug: "content-writing",
    name: "Content Writing",
    price: "+$150/page",
    priceValue: 150,
    perUnit: true,
    unitLabel: "page",
    description:
      "Professional copywriting for your website pages, written to convert visitors into customers.",
    tiers: ["starter", "professional"],
  },
  {
    slug: "multi-language",
    name: "Multi-Language Support",
    price: "+$800",
    priceValue: 800,
    perUnit: false,
    description:
      "Serve your website in two or more languages to reach a broader customer base.",
    tiers: ["professional", "enterprise"],
  },
  {
    slug: "client-portal",
    name: "Client Portal",
    price: "+$1,200",
    priceValue: 1200,
    perUnit: false,
    description:
      "A secure login area where your customers can view orders, track progress, manage their account, or access documents.",
    tiers: ["professional", "enterprise"],
  },
];

export function getAddOnBySlug(slug: string): AddOn | undefined {
  return ADD_ONS.find((a) => a.slug === slug);
}

export function getPricingBySlug(slug: string): PricingDetail | undefined {
  return PRICING_DETAILS.find((p) => p.slug === slug);
}

export function getPricingSlugs(): string[] {
  return PRICING_DETAILS.map((p) => p.slug);
}

export function getAddOnsByTier(slug: string): AddOn[] {
  return ADD_ONS.filter((a) => a.tiers.includes(slug));
}
