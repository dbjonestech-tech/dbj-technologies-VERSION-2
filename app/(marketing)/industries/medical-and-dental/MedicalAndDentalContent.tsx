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

const SLUG = "/industries/medical-and-dental";

const hero: IndustryHero = {
  eyebrow: "Industry · Medical and Dental Practices",
  title: "Healthcare websites that earn the chair,",
  highlight: "without trading trust for traffic.",
  lede:
    "A patient choosing a dentist or a doctor is doing risk math, not shopping. They are anxious, they have been burned before, and they are reading the site in the eight minutes between a chipped tooth and a phone call. The site that books the chair answers the appointment question in ninety seconds, treats HIPAA seriously, and reads like the practice it represents. This page covers what those sites do, and is anchored on a real published design brief I wrote for a West Plano dental practice.",
  image: {
    src: "/design-briefs/dental-practice.webp",
    alt: "Ridgeview Dental design brief, the published reference architecture I built for a West Plano family dental practice",
  },
  caption: "Ridgeview Dental · West Plano · published design brief",
};

const sections: IndustrySection[] = [
  {
    id: "what-buyers-need",
    number: "01",
    label: "Patient reality",
    heading:
      "What a healthcare buyer actually needs from your site in the first ninety seconds",
    body: (
      <>
        <p>
          A healthcare buyer is rarely casual. They are choosing a
          dentist because a tooth chipped on Tuesday, or choosing a
          doctor because a referral expires Friday, or choosing a
          specialist because their primary just gave them a diagnosis
          they did not understand. The emotional state is anxiety, and
          the anxiety is the conversion blocker.
        </p>
        <p>
          The five questions a healthcare visitor needs answered before
          they will pick up the phone are: can you see me soon, do you
          take my insurance, what does this actually cost, who is going
          to be in the room, and have other people like me had a good
          experience here. The site that answers those five questions
          above the fold gets the appointment. The site that buries any
          of them behind a contact form loses to the next listed
          competitor.
        </p>
        <p>
          The mobile context is heavy. Pew Research reports that
          ninety-seven percent of American adults own a cellphone and
          ninety-one percent own a smartphone (Pew Research, 2024).
          Healthcare searches happen disproportionately on phones, in
          waiting rooms, in parking lots, between meetings. A site that
          requires desktop-grade scrolling to find a phone number is
          a site that loses appointments.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "regulatory-and-trust",
    number: "02",
    label: "Compliance",
    heading: "HIPAA, regulatory considerations, and the trust premium",
    body: (
      <>
        <p>
          Healthcare websites are not generic marketing sites. Any
          form that collects personally identifiable information
          combined with health context (a contact form that asks for
          a name, an email, and the reason for the visit) creates
          Protected Health Information under HIPAA, which means the
          form processing, the email transport, the database, and
          every third-party vendor that touches the data must be
          covered by an executed Business Associate Agreement (HHS
          Office for Civil Rights, 2024). Most off-the-shelf form
          providers do not offer a BAA at the price tier service
          businesses default to, and most healthcare site
          implementations are quietly out of compliance for that
          reason.
        </p>
        <p>
          The right architecture treats HIPAA not as a paperwork
          layer over a normal site but as a design constraint that
          shapes which features ship and how. End-to-end encryption
          on form submission. A vendor list with a BAA in place for
          every entry. A privacy policy that names the actual data
          handling, not boilerplate. A breach response plan the
          office can actually execute. None of that is glamorous,
          and most of it is invisible to patients, but a HIPAA
          violation is the kind of fine that closes a practice.
        </p>
        <p>
          Beyond HIPAA, the trust premium in healthcare runs on
          identity. Patients want to see the practitioner&apos;s
          face, the practitioner&apos;s name, the practitioner&apos;s
          credentials with the issuing body named. Stock photography
          of an unrelated dentist or doctor is worse than no
          photography, because patients have learned to recognize
          the pattern and read it as a red flag. The trust block on
          a healthcare site is named, dated, and verifiable, with
          links to actual review sources rather than testimonial
          excerpts that cannot be checked.
        </p>
      </>
    ),
    callouts: [
      {
        kind: "medical",
        title: "If your contact form collects health context, you need a BAA",
        body:
          "A patient writing 'my left molar has been hurting for three days' on your contact form has just transmitted Protected Health Information. The form vendor, the email host, the database, and any analytics tool that touches that submission must be covered by a Business Associate Agreement. Most service-business form providers do not offer a BAA at the standard tier. Audit your form stack against your privacy policy before you ship the site.",
        source: {
          name: "HHS Office for Civil Rights, HIPAA",
          url: "https://www.hhs.gov/hipaa/index.html",
        },
      },
    ],
    break: { kind: "rule" },
  },
  {
    id: "common-failures",
    number: "03",
    label: "Failure patterns",
    heading: "What I see most healthcare sites get wrong",
    body: (
      <>
        <p>
          Five mistakes I see in nearly every healthcare site audit.
          The first is hiding the appointment path. Patients arrive
          with intent; the site should make booking easy. A real
          phone number in the header, a sticky mobile call button, a
          prominent appointment-request form, and ideally an online
          scheduling integration. Burying any of these behind a
          contact form is overthinking.
        </p>
        <p>
          The second is treating insurance as private. The most
          common patient question after &quot;can I be seen
          today&quot; is &quot;do you take my insurance.&quot; The
          answer should be on the site, named, current, and
          verifiable, not a generic &quot;we accept most major
          insurance plans.&quot; The patient who has just been
          burned by a surprise bill from another office reads
          generic insurance language as a red flag.
        </p>
        <p>
          The third is hiding price entirely. Healthcare pricing is
          legitimately complex, but the site can still anchor
          honestly: a new-patient visit price for a dental practice,
          a self-pay rate for an uninsured medical visit, a
          membership plan for cash-pay patients. Practices that
          publish even a partial price list outperform practices
          that publish nothing. The patient is looking for a signal
          that you are not going to surprise them, and a real number
          is that signal.
        </p>
        <p>
          The fourth is fake-feeling proof. A wall of generic
          five-star quotes with first names only reads as
          fabricated. The trust block that works in healthcare
          links to the actual Google Business Profile review page,
          the actual Healthgrades or Zocdoc profile, the actual
          credentialing body for the practitioner&apos;s
          specialty. Stock testimonials are worse than no
          testimonials.
        </p>
        <p>
          The fifth is generic stock photography. A dental practice
          that uses an iStock dentist photo on the about page reads
          as a practice that is hiding something. Real photography
          of the actual practitioner, the actual operatory, the
          actual front desk, on a real day, by a real photographer,
          is the differentiator. The cost of one photo session is
          dramatically less than the cost of looking like every
          other healthcare site.
        </p>
      </>
    ),
    break: { kind: "rule" },
  },
  {
    id: "design-principles",
    number: "04",
    label: "What works",
    heading: "Design principles that actually convert in healthcare",
    body: (
      <>
        <p>
          Six principles, in priority order. The first is the
          appointment path is the primary CTA, and it lives in the
          header, the hero, a sticky mobile bar, and at the bottom
          of every long page. Healthcare buyers are not browsing;
          they are deciding.
        </p>
        <p>
          The second is the trust band runs in the first screen,
          before the services grid. On the Ridgeview dental brief I
          wrote, the trust band on the second screen names four
          confidence signals: same-day emergencies, in-network
          insurance, a 4.9-star Google rating, and sedation
          available. None of those are services; each is a question
          the patient came to verify. The band earns the right to
          keep scrolling.
        </p>
        <p>
          The third is services are described by outcome, not
          procedure code. <em>Preventive cleanings and exams</em>{" "}
          paired with <em>gentle hygienists who actually
          listen</em> outperforms <em>D0150 Comprehensive Oral
          Evaluation</em> by an order of magnitude, because the
          former is the actual outcome the patient is buying and
          the latter is internal billing language.
        </p>
        <p>
          The fourth is the first-visit walkthrough. Dental and
          medical anxiety is dominantly a fear of the unknown. A
          step-by-step walkthrough of what happens at the first
          visit (paperwork sent ahead, comprehensive exam,
          treatment conversation, cleaning same day if time
          allows) reduces the unknown faster than any
          reassurance copy can.
        </p>
        <p>
          The fifth is named practitioners. <em>Our team</em> is a
          weak signal; <em>Dr. Sarah Parker, DDS, family dentistry,
          ten years in West Plano</em> is the strong one. Patients
          are choosing a person, not an LLC. The named-doctor
          surface beats a generic team page on every conversion
          metric I have measured.
        </p>
        <p>
          The sixth is the page loads fast on a mid-tier mobile
          device on a slow connection. Lighthouse score in the
          high nineties on real hardware, Core Web Vitals passing
          at the seventy-fifth percentile in field data (Google
          web.dev, 2024). I cover the technical specifics in{" "}
          <Link
            href="/resources/core-web-vitals-explained"
            className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
          >
            Core Web Vitals Explained for Service Businesses
          </Link>
          .
        </p>
      </>
    ),
    callouts: [
      {
        kind: "accessibility",
        title: "Healthcare buyers skew older and need accessibility built in",
        body:
          "A meaningful share of medical and dental buyers have low vision, motor-control challenges, hearing loss, or cognitive load from the stress of the visit. WCAG 2.2 AA conformance is the floor: high-contrast text, large hit targets, keyboard navigability, captions on any video content, and forms that do not require re-entering information already provided. The work also helps every other visitor.",
        source: {
          name: "W3C, WCAG 2.2",
          url: "https://www.w3.org/TR/WCAG22/",
        },
      },
    ],
    break: { kind: "gradient-rule" },
  },
];

const proof: IndustryProof = {
  eyebrow: "The proof",
  heading:
    "Ridgeview Dental: a published design brief that names every surface the practice needs",
  body: (
    <>
      <p>
        The design brief I wrote for Ridgeview Dental, a West Plano
        family practice, is one of eight published reference
        architectures in the Design Briefs library. It is not a
        finished site; it is the architectural reference that explains
        what every surface should do and why. Each surface in the
        brief is named, photographed, and explained: the calm
        same-day emergency band that runs across the navigation, the
        dated specials card with real expiration dates and no
        promotional codes, the Smile Plan membership published in
        full pricing detail, the four-step first-visit walkthrough
        that names what happens in the chair, the named-doctor
        surface that opens with Dr. Sarah Parker and her actual
        credentials.
      </p>
      <p>
        The brief is the level of architectural depth I bring to a
        real engagement. It is also a literal reference: when a
        dental practice in DFW hires me, the work starts from
        something close to this brief, tuned to that
        practice&apos;s actual specialties, insurance list, and
        community. The Ridgeview brief is not a template; it is a
        thesis on what a modern family dental practice site should
        be, written in enough detail that any competent engineer
        could ship from it.
      </p>
      <p>
        The same architectural depth applies to medical practices.
        The trust signals shift slightly (the credentialing body
        differs, the insurance list looks different, the
        scheduling integration is usually different), but the
        underlying principles hold: appointment path, trust band,
        outcome-named services, first-visit walkthrough, named
        practitioners, fast performance, accessible design.
      </p>
      <p>
        The cousin verticals to healthcare in regulatory weight are{" "}
        <Link
          href="/industries/legal"
          className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
        >
          law firms
        </Link>
        , where State Bar advertising rules shape every page, and{" "}
        <Link
          href="/industries/auto-service"
          className="underline decoration-accent-cyan/40 underline-offset-4 hover:decoration-accent-cyan transition-colors"
        >
          auto service shops
        </Link>
        , where the trust deficit is generational rather than
        regulatory. The constraints are different; the architecture
        responds to them.
      </p>
    </>
  ),
  link: {
    label: "Read the full Ridgeview Dental design brief",
    href: "/work/design-briefs/dental-practice",
  },
};

const cta: IndustryCTA = {
  eyebrow: "Next step",
  heading:
    "If your practice is ready for a real site, the first step is a 30-minute call.",
  body:
    "I do not run pressure sales. The first call is diagnostic. The goal is to confirm whether a custom build is even the right call for your practice, what scope of engagement makes sense, and what timing looks like on both sides. If the project is not a fit, I will say so and recommend a better path. If you want a fast first read on what your current site is leaving on the table, run a free Pathlight scan against your live URL before the call.",
  primary: { label: "Start the conversation", href: "/contact" },
  secondary: { label: "Run a free Pathlight scan", href: "/pathlight" },
};

const faq: { question: string; answer: string }[] = [
  {
    question: "Are my contact and appointment forms HIPAA-compliant out of the box?",
    answer:
      "Almost certainly not. Default form vendors on Squarespace, Wix, WordPress, and most pageless builders do not offer Business Associate Agreements at standard pricing tiers. If your form collects a name plus any health context, the data is Protected Health Information under HIPAA and every vendor that touches it needs a BAA. The audit-and-fix on this is a real engagement, not a checkbox; I cover it as part of any healthcare site I build.",
  },
  {
    question:
      "Should I show prices on my dental or medical website?",
    answer:
      "Show what you can, accurately. A new-patient visit price, a self-pay rate, a membership plan, an in-network insurance list. Practices that publish even partial pricing outperform practices that publish nothing because the patient is looking for a signal that you are not going to surprise them. Hiding everything reads as evasive in this category.",
  },
  {
    question: "Do I need an online scheduling integration?",
    answer:
      "Strongly recommended. Patients increasingly expect to book without a phone call, especially in dental and primary care. Integrations with Dentrix, Eaglesoft, NextGen, and the major scheduling platforms (Zocdoc, NexHealth, Adit, Modento) are technically straightforward to add to a Next.js application. The discovery call confirms which integration matches your practice management software.",
  },
  {
    question:
      "What about reviews and online reputation management?",
    answer:
      "Reviews matter more in healthcare than in most categories. The system that works is a habit, not a campaign: after every visit, your team or your software sends one polite ask with a direct link to your Google Business Profile or Healthgrades review page. Respond to every review, positive or negative, in a calm professional tone. Negative reviews handled well outperform a flawless wall of five-stars on conversion.",
  },
  {
    question:
      "How do you handle bilingual content for Spanish-speaking patients?",
    answer:
      "For DFW practices serving a substantial Spanish-speaking population, a Spanish-language toggle on the site reads as a serious commitment to the community and is technically straightforward to ship. Translation work is a real cost, but the conversion lift in markets where it applies is meaningful. The discovery call covers whether your patient base supports the work.",
  },
  {
    question: "What does a custom dental or medical site engagement actually cost?",
    answer:
      "Custom Next.js engagements start at four thousand five hundred dollars for the Starter tier and scale up from there. The longer reference on what each tier should actually cost in 2026, with ranges and drivers of cost, is on the cost guide. If your site is exclusively a brochure with hours and a phone number and you are firmly under that budget, I will tell you that on the first call and recommend a templated path instead.",
  },
  {
    question: "Will my new site rank for local searches like 'dentist near me'?",
    answer:
      "Local pack ranking is mostly a function of your Google Business Profile health, your review velocity, your citations, and the relevance of your site content. The site itself is a meaningful contributor through proper LocalBusiness schema, fast mobile performance, and customer-language service pages. The longer reference on what actually moves DFW local rankings is in the Resources section.",
  },
];

const sources: SourceEntry[] = [
  {
    id: 1,
    org: "U.S. Department of Health and Human Services, Office for Civil Rights",
    year: 2024,
    title: "HIPAA for Professionals: Privacy and Security Rules",
    url: "https://www.hhs.gov/hipaa/index.html",
  },
  {
    id: 2,
    org: "Centers for Medicare and Medicaid Services",
    year: 2024,
    title: "HIPAA Basics for Providers: Privacy, Security, and Breach Notification",
    url: "https://www.cms.gov/training-education/medicare-learning-network/newsletter/2024-09-19-mlnc",
  },
  {
    id: 3,
    org: "American Dental Association",
    year: 2024,
    title: "ADA Practice Resources and Code of Ethics",
    url: "https://www.ada.org/resources",
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
    org: "Google web.dev",
    year: 2024,
    title: "Core Web Vitals: thresholds and 75th-percentile measurement",
    url: "https://web.dev/articles/vitals",
  },
  {
    id: 6,
    org: "W3C",
    year: 2023,
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
  },
];

export function MedicalAndDentalContent() {
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
