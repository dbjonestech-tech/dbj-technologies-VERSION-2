"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { Accordion } from "@/components/ui/Accordion";
import { PRICING_TIERS, PRICING_ADDONS, FAQ_ITEMS } from "@/lib/constants";

export default function PricingContent() {
  const billingFaqs = FAQ_ITEMS.filter((f) => f.category === "Billing");

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
            Engagement Tiers
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Fixed Pricing,
            <br />
            <span className="text-gradient">Clear Scope.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Engineering-phase engagements with transparent pricing. Know exactly
            what you&apos;re getting, and what it costs, before I write a
            single line of code.
          </motion.p>
        </div>
      </section>

      {/* Pricing note */}
      <section className="pb-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Link
            href="/pricing/build"
            className="inline-flex items-center gap-2 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-5 py-2 text-sm font-semibold text-accent-blue hover:bg-accent-blue/15 transition-colors"
          >
            Not sure which package? Build a custom package →
          </Link>
          <span className="text-sm text-text-muted">
            All prices are per-engagement, fixed before development begins
          </span>
          <span className="text-sm text-text-muted">
            Looking for post-launch care?{" "}
            <Link
              href="/pricing/maintenance"
              className="text-accent-blue hover:underline"
            >
              See maintenance &amp; support plans →
            </Link>
          </span>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 items-start">
            {PRICING_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`relative glass-card p-8 ${
                  tier.popular
                    ? "gradient-border lg:-mt-4 lg:mb-4 ring-1 ring-accent-blue/20"
                    : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue px-4 py-1 text-xs font-bold text-white shadow-glow-blue">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> Most Popular
                    </span>
                  </div>
                )}

                <h3 className="font-display text-2xl font-bold">{tier.name}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {tier.description}
                </p>

                <div className="mt-6 mb-8">
                  {tier.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl font-bold">
                        ${tier.price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="font-display text-4xl font-bold text-gradient">
                        Custom
                      </div>
                      <div className="text-text-muted text-sm mt-1">
                        Starts at $15,000
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-text-secondary mt-2">
                    Delivered in {tier.timeline}
                  </p>
                </div>

                <Link
                  href={`/pricing/${tier.name.toLowerCase()}`}
                  className={`block w-full text-center rounded-xl py-3.5 font-semibold text-sm transition-all duration-300 ${
                    tier.popular
                      ? "bg-accent-blue text-white shadow-glow-blue hover:shadow-[0_0_50px_rgba(59,130,246,0.4)]"
                      : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {tier.cta}
                </Link>

                <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
                  {tier.features.map((f) => (
                    <div key={f.text} className="flex items-center gap-3">
                      {f.included ? (
                        <Check className="h-4 w-4 shrink-0 text-accent-cyan" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-text-muted/40" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm ${
                          f.included ? "text-text-secondary" : "text-text-muted/40"
                        }`}
                      >
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="py-20">
        <SectionHeading label="Add-Ons" title="Flexible Engagements" />
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRICING_ADDONS.map((addon, i) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/[0.06] rounded-2xl p-8 bg-white/[0.02]"
              >
                <h3 className="text-xl font-semibold">{addon.name}</h3>
                <p className="text-sm text-text-secondary mt-2">
                  {addon.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${addon.price}</span>
                  <span className="text-sm text-text-muted">
                    / {addon.unit.replace("per ", "")}
                  </span>
                </div>
                <Link
                  href={addon.href}
                  className="mt-6 block w-full text-center rounded-xl py-3.5 font-semibold text-sm border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                >
                  {addon.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="py-32">
        <SectionHeading
          label="Billing FAQ"
          title="Common Pricing Questions"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Accordion items={billingFaqs} />
        </div>
      </section>
    </>
  );
}
