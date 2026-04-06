"use client";

import { motion } from "framer-motion";
import { Zap, Eye, Target, Heart } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { TEAM_MEMBERS, VALUES, SITE } from "@/lib/constants";

const valueIcons = [Zap, Eye, Target, Heart];

const principles = [
  {
    title: "We build with the tools we'd choose for ourselves",
    text: "Next.js, React, TypeScript, Tailwind, Vercel — the same stack used by the best product teams in the world. Your project benefits from the same tooling, not a watered-down agency version.",
  },
  {
    title: "Every project ships with source code and documentation",
    text: "You own everything we build. Full source code, deployment guides, environment configs, and handoff documentation. No lock-in, no hostage situations, no proprietary platforms you can't leave.",
  },
  {
    title: "We scope before we sell",
    text: "Every engagement starts with a paid discovery phase that produces a clear scope, timeline, and fixed price. We don't start billing until you've approved the plan. No hourly surprises.",
  },
];

export default function AboutContent() {
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
            About Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            A Studio Built on
            <br />
            <span className="text-gradient">Engineering Standards.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {SITE.name} is a web development studio in Dallas, TX. We exist because
            too many businesses get sold template sites and agency overhead when what
            they need is real engineering.
          </motion.p>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-32">
        <SectionHeading
          label="How We Work"
          title="Our Operating Principles"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative border-l border-gray-200 pl-8 ml-4 space-y-12">
            {principles.map((item, i) => (
              <motion.div
                key={item.title}
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
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-bg-secondary/50">
        <SectionHeading
          label="Our Values"
          title="What Drives Every Decision"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = valueIcons[i];
              return (
                <Card key={v.title} delay={i * 0.1} gradientBorder>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{v.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team — shown only when real team members are added */}
      {TEAM_MEMBERS.length > 0 && (
        <section className="py-32">
          <SectionHeading
            label="The Team"
            title="Meet the People Behind the Code"
            description="A small, senior team that delivers above its weight."
          />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover p-6 text-center group"
                >
                  <div
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-violet/10 border border-gray-200 transition-all duration-500 group-hover:border-accent-blue/30"
                    role="img"
                    aria-label={`Avatar for ${m.name}`}
                  >
                    <span className="font-display text-3xl font-bold text-gradient" aria-hidden="true">
                      {m.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{m.name}</h3>
                  <p className="mt-1 text-sm text-accent-blue font-medium">{m.role}</p>
                  <p className="mt-3 text-xs text-text-secondary leading-relaxed">{m.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        heading="Want to Know More?"
        highlight="Let's Talk."
        description="We're happy to walk through our process, show you relevant work, or just answer questions. No pitch deck required."
        buttonText="Get in Touch"
      />
    </>
  );
}
