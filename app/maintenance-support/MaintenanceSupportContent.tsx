"use client";

import { motion } from "framer-motion";
import { Check, Shield, Zap, Database, Eye, PenTool, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";

const plans = [
  {
    name: "Essential",
    price: "$299",
    period: "/month",
    description: "Basic maintenance for small sites that need to stay updated and secure.",
    features: [
      "Monthly software updates",
      "Security monitoring",
      "Weekly backups",
      "Uptime monitoring",
      "2 hours of content updates",
      "Email support (72h response)",
    ],
  },
  {
    name: "Growth",
    price: "$599",
    period: "/month",
    popular: true,
    description: "Comprehensive care for growing businesses that depend on their website.",
    features: [
      "Everything in Essential",
      "Performance monitoring & optimization",
      "Daily backups with 30-day retention",
      "Monthly analytics report",
      "5 hours of updates & improvements",
      "Priority support (24h response)",
    ],
  },
  {
    name: "Premium",
    price: "$999",
    period: "/month",
    description: "White-glove service for mission-critical sites and applications.",
    features: [
      "Everything in Growth",
      "Continuous uptime monitoring with alerting",
      "Real-time backups",
      "Quarterly performance audits",
      "10 hours of development & improvements",
      "Priority support (4h response)",
      "Direct access to your architect",
    ],
  },
];

const coverageItems = [
  {
    icon: Shield,
    title: "Security Updates",
    description: "Framework, dependency, and CMS patches applied promptly to prevent vulnerabilities.",
  },
  {
    icon: Zap,
    title: "Performance Monitoring",
    description: "Core Web Vitals tracking and proactive optimization to keep your site fast.",
  },
  {
    icon: Database,
    title: "Backup & Recovery",
    description: "Automated backups with tested restore procedures. Your data is always safe.",
  },
  {
    icon: Eye,
    title: "Uptime Monitoring",
    description: "Continuous monitoring with instant alerts. I know about downtime before you do.",
  },
  {
    icon: PenTool,
    title: "Content Updates",
    description: "Text, image, and layout changes handled directly so you can focus on your business.",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Direct access to your principal architect with guaranteed response times.",
  },
];

export default function MaintenanceSupportContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 left-1/2 -translate-x-1/2" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue mb-6"
          >
            Maintenance & Support
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Your Site Deserves
            <br />
            <span className="text-gradient">Ongoing Care.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Keep your website fast, secure, and up-to-date with proactive
            maintenance plans tailored to your business.
          </motion.p>
        </div>
      </section>

      {/* Maintenance Plans */}
      <section className="py-20">
        <SectionHeading
          label="Plans"
          title="Maintenance Plans"
          description="Choose the level of care that fits your business. All plans include monthly reporting and direct communication with your architect."
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative glass-card p-8 ${
                  plan.popular
                    ? "gradient-border lg:-mt-4 lg:mb-4 ring-1 ring-accent-blue/20"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue px-4 py-1 text-xs font-bold text-white shadow-glow-blue">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> Most Popular
                    </span>
                  </div>
                )}

                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {plan.description}
                </p>

                <div className="mt-6 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold">
                      {plan.price}
                    </span>
                    <span className="text-text-muted text-sm">{plan.period}</span>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className={`block w-full text-center rounded-xl py-3.5 font-semibold text-sm transition-all duration-300 ${
                    plan.popular
                      ? "bg-accent-blue text-white shadow-glow-blue hover:shadow-[0_0_50px_rgba(59,130,246,0.4)]"
                      : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  Get Started
                </Link>

                <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-accent-cyan" aria-hidden="true" />
                      <span className="text-sm text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-32 bg-bg-secondary/50">
        <SectionHeading
          label="What's Included"
          title="What's Covered"
          description="Every plan is built on a foundation of proactive care and expert engineering."
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coverageItems.map((item, i) => {
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
        heading="Need Ongoing Support?"
        highlight="I've Got You Covered."
        description="Every plan includes direct communication with your principal architect. No ticket queues, no outsourced support."
        buttonText="Choose a Plan"
      />
    </>
  );
}
