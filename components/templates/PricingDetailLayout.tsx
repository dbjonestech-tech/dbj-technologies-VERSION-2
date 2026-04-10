"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Clock, RefreshCw, Headphones } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import type { PricingDetail } from "@/lib/pricing-data";
import type { PricingTier } from "@/lib/constants";

interface PricingDetailLayoutProps {
  detail: PricingDetail;
  tier: PricingTier;
}

export function PricingDetailLayout({ detail, tier }: PricingDetailLayoutProps) {
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
            {detail.tierName} Package
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            {detail.heroTitle}
            <br />
            <span className="text-gradient">{detail.heroHighlight}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {detail.heroDescription}
          </motion.p>

          {/* Price highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            {tier.price !== null ? (
              <div className="inline-flex flex-wrap items-baseline justify-center gap-2 glass-card px-8 py-4">
                <span className="text-text-muted text-sm">One-time</span>
                <span className="font-display text-4xl font-bold">${tier.price.toLocaleString()}</span>
                <span className="text-text-muted text-sm">· Delivered in {tier.timeline}</span>
              </div>
            ) : (
              <div className="inline-flex flex-col items-center gap-1 glass-card px-8 py-4">
                <span className="font-display text-3xl font-bold text-gradient">Custom Pricing</span>
                <span className="text-text-muted text-sm">Starts at $15,000 · Delivered in {tier.timeline}</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/contact" className="btn-primary">
              {tier.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="btn-outline">
              Compare All Plans
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-20">
        <SectionHeading
          label="Ideal For"
          title="Is This Package Right for You?"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {detail.idealFor.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 glass-card p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                <span className="text-sm text-text-secondary">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-32 bg-bg-secondary/50">
        <SectionHeading
          label="What's Included"
          title="Everything in This Package"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {detail.whatsIncluded.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-6"
              >
                <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline, Revisions, Support */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Clock, title: "Timeline", value: detail.timeline },
              { icon: RefreshCw, title: "Revisions", value: detail.revisions },
              { icon: Headphones, title: "Support", value: detail.support },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <ItemIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      {detail.addOns.length > 0 && (
        <section className="py-20 bg-bg-secondary/50">
          <SectionHeading
            label="Add-Ons"
            title="Enhance Your Package"
            description="Optional add-ons to extend your project's capabilities."
          />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {detail.addOns.map((addon, i) => (
                <motion.div
                  key={addon.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-6 flex items-start gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg font-bold">{addon.title}</h3>
                      <span className="rounded-full bg-accent-blue/10 border border-accent-blue/20 px-3 py-0.5 text-xs font-medium text-accent-blue">
                        {addon.price}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{addon.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-32">
        <SectionHeading
          label="FAQ"
          title="Questions About This Package"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Accordion
            items={detail.faq.map((f) => ({
              question: f.question,
              answer: f.answer,
              category: "Billing" as const,
            }))}
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
