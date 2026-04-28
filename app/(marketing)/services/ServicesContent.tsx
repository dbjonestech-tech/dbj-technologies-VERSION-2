"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { SERVICES } from "@/lib/constants";

export default function ServicesContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -left-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue mb-6"
          >
            Capabilities
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            What I Engineer
            <br />
            <span className="text-gradient">and How.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            From frontend architecture to cloud infrastructure, every
            discipline is scoped, priced, and delivered to the same
            production grade standard.
          </motion.p>
        </div>
      </section>

      {/* Detailed services */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-20">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`glass-card p-8 md:p-12 grid gap-8 md:grid-cols-2 items-center ${!isEven ? "md:direction-rtl" : ""}`}
                style={{ direction: "ltr" }}
              >
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-3">{service.title}</h2>
                  <p className="text-text-secondary leading-relaxed mb-6">{service.description}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/services/${service.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-accent-blue hover:gap-3 transition-all">
                      Learn More <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-gray-900 transition-all">
                      Discuss Your Project <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="space-y-3">
                  {service.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                      <span className="text-sm text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <CTASection
        heading="Need Something Specific?"
        highlight="Let's Scope It."
        description="Every engagement starts with a clear scope and fixed price. Tell me what you need and I'll define exactly what it takes."
        buttonText="Start a Conversation"
      />
    </>
  );
}
