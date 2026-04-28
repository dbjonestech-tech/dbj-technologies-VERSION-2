"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, DollarSign, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";

const phases = [
  {
    step: "01",
    title: "Diagnose and Strategize",
    description:
      "I start every engagement with a Pathlight scan and hands-on review to find where your website is losing trust, leads, and revenue. Before I write a single line of code, I know exactly what to fix and in what order.",
    activities: [
      "Stakeholder interviews and goal alignment",
      "Competitive landscape analysis",
      "User persona and journey mapping",
      "Technical requirements definition",
      "Engagement scope, timeline, and budget agreement",
    ],
  },
  {
    step: "02",
    title: "Architect & Prototype",
    description:
      "I translate strategy into systems. Starting with information architecture and wireframes, I progress to high-fidelity visual designs and interactive prototypes. Every design is reviewed with you and validated before development begins.",
    activities: [
      "Information architecture and sitemap",
      "Wireframes for all key pages and flows",
      "High-fidelity visual design in Figma",
      "Interactive prototype for stakeholder review",
      "Design system and component specification",
    ],
  },
  {
    step: "03",
    title: "Engineer & Test",
    description:
      "I build with clean, typed, maintainable code on production grade frameworks. I work in focused sprints with regular demos so you see progress in real time. Every feature is tested for performance, accessibility, and cross browser compatibility.",
    activities: [
      "Architecture setup and development environment",
      "Focused sprint cycles with progress demos",
      "Performance optimization (90+ Lighthouse baseline)",
      "Accessibility testing (WCAG AA+ compliance)",
      "Cross-browser and real-device testing",
    ],
  },
  {
    step: "04",
    title: "Harden & Launch",
    description:
      "I handle deployment, DNS, SSL, monitoring, and analytics setup. After launch, you get 30 days of complimentary support and a detailed handoff package with full source code and documentation.",
    activities: [
      "Production deployment and DNS configuration",
      "SSL, CDN, and caching setup",
      "Analytics and conversion tracking",
      "Training and documentation handoff",
      "30 days of post-launch support included",
    ],
  },
];

const expectations = [
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description:
      "Regular updates, shared project boards, and direct access to the architect building your system. No layers, no black boxes.",
  },
  {
    icon: DollarSign,
    title: "Fixed-Price Confidence",
    description:
      "Your budget is agreed before development begins. No scope creep, no surprise invoices, no hourly billing.",
  },
  {
    icon: ShieldCheck,
    title: "Engineering Standards",
    description:
      "90+ Lighthouse scores, WCAG AA+ accessibility, and code reviews on every pull request. I don\u2019t ship anything I wouldn\u2019t stake my reputation on.",
  },
];

const tools = ["Figma", "Linear", "Slack", "GitHub", "Vercel", "Notion"];

export default function ProcessContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -right-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue mb-6"
          >
            My Process
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Four Phases.
            <br />
            <span className="text-gradient">Zero Ambiguity.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            A structured delivery process with clear milestones, checkpoints, and
            deliverables at every stage. You always know where your project stands.
          </motion.p>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-32">
        <SectionHeading
          label="The 4 Phases"
          title="From Diagnosis to Deployment"
          description="Each phase has clear deliverables and sign-offs so nothing moves forward without your approval."
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative border-l border-gray-200 pl-8 ml-4 space-y-16">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Dot */}
                <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-blue/40 bg-white">
                  <div className="h-2 w-2 rounded-full bg-accent-blue" />
                </div>

                <div className="glass-card p-6 sm:p-8">
                  <span className="font-mono text-xs text-accent-cyan uppercase tracking-widest">
                    Phase {phase.step}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold">
                    {phase.title}
                  </h3>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                    {phase.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {phase.activities.map((activity) => (
                      <li
                        key={activity}
                        className="flex items-start gap-3 text-sm text-text-secondary"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-blue"
                          aria-hidden="true"
                        />
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What To Expect */}
      <section className="py-32 bg-bg-secondary/50">
        <SectionHeading
          label="What to Expect"
          title="The Client Experience"
          description="Working with me should feel structured, not stressful."
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {expectations.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card glass-card-hover p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools We Use */}
      <section className="py-20">
        <SectionHeading
          label="My Toolkit"
          title="Tools I Use"
          description="Best-in-class tools for project management, design, and communication."
        />
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {tools.map((tool, i) => (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Badge variant="blue" className="px-4 py-2 text-sm">
                  {tool}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CTASection
        heading="Ready to Get Started?"
        highlight="Phase One Awaits."
        description="The first step is a conversation. Tell me about your project and I'll outline how I'd approach it, including timeline, scope, and cost."
        buttonText="Start Discovery"
      />
    </>
  );
}
