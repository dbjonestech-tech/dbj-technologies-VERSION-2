"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, ArrowRight,
  Globe, Smartphone, Cloud, Palette, ShoppingCart, Search,
  Code2, Server, Shield, Zap, BarChart3, Monitor, Cpu,
  Database, GitBranch, PenTool, Users, MousePointer,
  Accessibility, Store, CreditCard, TrendingUp, FileSearch,
  Target, Megaphone, Gauge, Image,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";
import type { ServiceDetail } from "@/lib/service-data";

const iconMap: Record<string, LucideIcon> = {
  Globe, Smartphone, Cloud, Palette, ShoppingCart, Search,
  Code2, Server, Shield, Zap, BarChart3, Monitor, Cpu,
  Database, GitBranch, PenTool, Users, MousePointer,
  Accessibility, Store, CreditCard, TrendingUp, FileSearch,
  Target, Megaphone, Gauge, Image,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] || Globe;
}

interface ServicePageLayoutProps {
  service: ServiceDetail;
  relatedServices: { slug: string; title: string; tagline: string }[];
}

export function ServicePageLayout({ service, relatedServices }: ServicePageLayoutProps) {
  const Icon = getIcon(service.iconName);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -left-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-center gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {service.title}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            {service.heroTitle}
            <br />
            <span className="text-gradient">{service.heroHighlight}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {service.heroDescription}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/contact" className="btn-primary">
              {service.ctaText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="btn-outline"
            >
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Long description */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-text-secondary leading-relaxed"
          >
            {service.longDescription}
          </motion.p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-bg-secondary/50">
        <SectionHeading
          label="Why Choose Us"
          title="What Sets This Approach Apart"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {service.benefits.map((benefit, i) => {
              const BenefitIcon = getIcon(benefit.iconName);
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover p-6 md:p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <BenefitIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32">
        <SectionHeading
          label="Our Process"
          title="How I Deliver"
          description="A proven process refined over hundreds of projects."
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative border-l border-gray-200 pl-8 ml-4 space-y-12">
            {service.process.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-blue/40 bg-white">
                  <div className="h-2 w-2 rounded-full bg-accent-blue" />
                </div>
                <span className="font-mono text-xs text-accent-blue uppercase tracking-widest">
                  Step {step.step}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies & Deliverables */}
      <section className="py-20 bg-bg-secondary/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Technologies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-2xl font-bold mb-6">Technologies I Use</h2>
              <div className="flex flex-wrap gap-2">
                {service.technologies.map((tech) => (
                  <Badge key={tech} variant="blue">{tech}</Badge>
                ))}
              </div>
            </motion.div>

            {/* Deliverables */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-display text-2xl font-bold mb-6">What You Get</h2>
              <div className="space-y-3">
                {service.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                    <span className="text-sm text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32">
        <SectionHeading
          label="FAQ"
          title="Common Questions"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Accordion
            items={service.faq.map((f) => ({
              question: f.question,
              answer: f.answer,
              category: "General" as const,
            }))}
          />
        </div>
      </section>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="py-20 bg-bg-secondary/50">
          <SectionHeading
            label="Related Services"
            title="You Might Also Need"
          />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {relatedServices.map((related, i) => (
                <motion.div
                  key={related.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/services/${related.slug}`}
                    className="glass-card-hover p-6 block group"
                  >
                    <h3 className="font-display text-lg font-bold mb-2 group-hover:text-accent-blue transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-sm text-text-secondary">{related.tagline}</p>
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-accent-blue group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </>
  );
}
