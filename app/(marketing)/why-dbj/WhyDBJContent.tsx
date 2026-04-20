"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Code2, DollarSign, Headphones, Users, Zap, Layers, Eye, Award, Target } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";

const guarantees = [
  {
    icon: Award,
    title: "90+ Lighthouse Scores",
    description: "Every engagement ships with verified 90+ scores in Performance, Accessibility, Best Practices, and SEO. I test before delivery. You can verify after.",
  },
  {
    icon: Code2,
    title: "100% Code Ownership",
    description: "You own every line of code, every design file, every asset. Full source code and documentation delivered at launch. No lock-in.",
  },
  {
    icon: DollarSign,
    title: "Fixed-Price Projects",
    description: "Your engagement cost is agreed before development begins. No hourly billing, no scope creep, no surprise invoices. The price I quote is the price you pay.",
  },
  {
    icon: Headphones,
    title: "30-Day Post-Launch Support",
    description: "Every engagement includes 30 days of complimentary support after launch. Bug fixes, questions, and minor adjustments are included in the engagement price.",
  },
];

const differentiators = [
  {
    icon: Users,
    title: "Principal-Level Expertise",
    description: "No juniors learning on your project. You get a solo principal architect with years of production experience across real products and real traffic.",
  },
  {
    icon: Target,
    title: "Direct Access",
    description: "You work directly with the person building your product. No layers of account managers or project coordinators between you and the engineer.",
  },
  {
    icon: Layers,
    title: "Modern Stack",
    description: "I use the same technologies as top product companies: Next.js, React, TypeScript, Vercel, AWS. Your engagement gets production-grade tooling.",
  },
  {
    icon: ShieldCheck,
    title: "Built for the Long Run",
    description: "I don't disappear after launch. I offer ongoing maintenance retainers and architect every system for long-term maintainability.",
  },
  {
    icon: Zap,
    title: "Performance as a Standard",
    description: "Speed isn't a feature. It's a baseline. Every project is optimized for Core Web Vitals because your users and search rankings depend on it.",
  },
  {
    icon: Eye,
    title: "Transparent Process",
    description: "Shared project boards, regular updates, and direct communication. You always know exactly where your project stands and what's next.",
  },
];

export default function WhyDBJContent() {
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
            Why DBJ
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Guarantees You Can
            <br />
            <span className="text-gradient">Verify.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            What separates DBJ from agencies and freelancers? Commitments baked
            into every contract, not marketing language on a website.
          </motion.p>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-32">
        <SectionHeading
          label="Contractual Commitments"
          title="My Guarantees"
          description="These aren't aspirational values. They're written into every engagement agreement."
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {guarantees.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card glass-card-hover gradient-border p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-32 bg-bg-secondary/50">
        <SectionHeading
          label="The DBJ Difference"
          title="How I Work Differently"
          description="I'm not the cheapest option. I'm the one you won't need to redo."
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item, i) => {
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
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-cyan">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <CTASection
        heading="See the Difference"
        highlight="In Your Project."
        description="I'd rather show you than tell you. Let's talk about what you're building and how I'd approach it."
        buttonText="Discuss Your Project"
      />
    </>
  );
}
