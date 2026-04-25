"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { getAddOnsByTier, type PricingDetail } from "@/lib/pricing-data";

interface PricingDetailLayoutProps {
  detail: PricingDetail;
}

export function PricingDetailLayout({ detail }: PricingDetailLayoutProps) {
  const addOns = getAddOnsByTier(detail.slug);

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
            {`${detail.name} Package`}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            {detail.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {detail.heroDescription}
          </motion.p>

          {/* Price + timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex flex-wrap items-baseline justify-center gap-2 glass-card px-8 py-4"
          >
            <span className="font-display text-4xl font-bold">{detail.price}</span>
            <span className="text-text-muted text-sm">{`· ${detail.timeline}`}</span>
          </motion.div>

          {/* Inline tier-specific CTA + back link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href={detail.ctaHref} className="btn-primary">
              {detail.ctaText} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="btn-outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-20">
        <SectionHeading label="Ideal For" title="Is This Right for You?" />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <p className="text-base text-text-secondary leading-relaxed sm:text-lg">
              {detail.idealFor}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-20 bg-bg-secondary/50">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="space-y-10">
            {detail.sections.map((section, i) => (
              <motion.div
                key={section.heading}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-8"
              >
                <h2 className="font-display text-2xl font-bold mb-3">
                  {section.heading}
                </h2>
                <p className="text-base text-text-secondary leading-relaxed sm:text-lg">
                  {section.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons (only for tiers that have any) */}
      {addOns.length > 0 && (
        <section className="py-20">
          <SectionHeading
            label="Add-Ons"
            title="Enhance Your Package"
            description="Optional add-ons to extend your project."
          />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {addOns.map((addon, i) => (
                <motion.div
                  key={addon.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-bold">{addon.name}</h3>
                    <span className="rounded-full bg-accent-blue/10 border border-accent-blue/20 px-3 py-0.5 text-xs font-medium text-accent-blue">
                      {addon.price}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {addon.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-32">
        <SectionHeading label="FAQ" title="Questions About This Package" />
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
