"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function TestimonialsSection() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="relative py-32">
      <SectionHeading
        label="Testimonials"
        title="What Our Clients Say"
        description="Don't take our word for it — here's what the people we've worked with have to say."
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card p-8 flex flex-col"
            >
              <Quote className="h-8 w-8 text-accent-blue/30 mb-4" aria-hidden="true" />
              <p className="flex-1 text-text-secondary leading-relaxed text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-4 pt-6 border-t border-gray-200">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan text-white text-sm font-bold"
                  role="img"
                  aria-label={`Avatar for ${t.name}`}
                >
                  <span aria-hidden="true">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
