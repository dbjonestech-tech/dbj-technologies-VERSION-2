"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { FAQ_ITEMS } from "@/lib/constants";

const categories = ["All", "General", "Technical", "Billing", "Support"] as const;

export default function FaqContent() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let items = FAQ_ITEMS;
    if (activeCategory !== "All") {
      items = items.filter((f) => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, search]);

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
            FAQ
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Frequently Asked
            <br />
            <span className="text-gradient">Questions.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Everything you need to know about working with me. Can&apos;t find
            what you&apos;re looking for? Reach out directly.
          </motion.p>
        </div>
      </section>

      {/* Search + Filters + Content */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              aria-label="Search frequently asked questions"
              className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-text-muted outline-none transition-colors focus:border-accent-blue/50"
            />
          </motion.div>

          {/* Category tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30"
                    : "border border-gray-200 text-text-secondary hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Accordion */}
          {filtered.length > 0 ? (
            <Accordion items={filtered} />
          ) : (
            <div className="py-16 text-center">
              <p className="text-text-muted">
                No questions match your search. Try a different term or{" "}
                <a href="/contact" className="text-accent-blue hover:underline">
                  reach out
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      <CTASection
        heading="Still Have Questions?"
        highlight="Ask Me Directly."
        description="I'm happy to answer anything not covered here. Reach out and I'll get back to you within one business day."
        buttonText="Get in Touch"
      />
    </>
  );
}
