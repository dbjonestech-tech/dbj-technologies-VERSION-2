"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SERVICES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ServicesSection() {
  return (
    <section className="relative py-32">
      <SectionHeading
        label="Capabilities"
        title="Engineering Disciplines"
        description="Six core disciplines, one architectural standard. Every engagement is scoped, engineered, and delivered with production-grade precision."
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="glass-card-hover block h-full p-8 group cursor-default">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue transition-colors duration-300 group-hover:bg-accent-blue/20">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {service.tagline}
                  </p>
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent-blue transition-all group-hover:gap-2 min-h-[44px] min-w-[44px]"
                  >
                    Learn more<span className="sr-only"> about {service.title}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
