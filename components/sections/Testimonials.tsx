"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS, type Testimonial } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";

function Star({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.286 3.96c.299.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.96a1 1 0 00-.364-1.118L2.46 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z" />
    </svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center justify-center gap-1.5 text-amber-400">
      <span className="sr-only">{filled} out of 5 stars</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < filled ? "h-6 w-6" : "h-6 w-6 opacity-20"} />
      ))}
    </div>
  );
}

function SoloTestimonial({ t }: { t: Testimonial }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-12 text-center backdrop-blur-sm md:px-12 md:py-14"
    >
      <StarRow rating={t.rating} />

      <blockquote className="mt-8">
        <p className="font-display text-2xl font-medium leading-snug text-text-primary md:text-3xl">
          &ldquo;{t.quote}&rdquo;
        </p>
      </blockquote>

      <figcaption className="mt-8 space-y-2">
        <p className="text-sm font-semibold tracking-wide text-text-primary md:text-base">
          {t.name}, {t.title}
          <span aria-hidden="true" className="mx-2 text-text-muted">
            ·
          </span>
          {t.business}
          <span aria-hidden="true" className="mx-2 text-text-muted">
            ·
          </span>
          {t.location}
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="font-mono uppercase tracking-widest">{t.source} Review</span>
          <span aria-hidden="true">·</span>
          <a
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent-cyan transition-colors hover:text-accent-blue"
          >
            View live site
            <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
      </figcaption>
    </motion.figure>
  );
}

export function TestimonialsSection() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="relative py-32 print-hidden">
      <SectionHeading
        label="Testimonials"
        title="What Clients Say"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {TESTIMONIALS.length === 1 ? (
          <SoloTestimonial t={TESTIMONIALS[0]} />
        ) : null}
      </div>
    </section>
  );
}
