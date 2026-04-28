"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Plus, ArrowRight, Sparkles } from "lucide-react";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { ADD_ONS } from "@/lib/pricing-data";

interface BuildTier {
  slug: string;
  name: string;
  basePrice: number;
  priceLabel: string;
  timeline: string;
  summary: string;
  popular: boolean;
}

const BUILD_TIERS: BuildTier[] = [
  {
    slug: "starter",
    name: "Starter",
    basePrice: 4500,
    priceLabel: "$4,500",
    timeline: "3-4 weeks",
    summary:
      "A complete custom site for small businesses launching their digital presence.",
    popular: false,
  },
  {
    slug: "professional",
    name: "Professional",
    basePrice: 9500,
    priceLabel: "$9,500",
    timeline: "5-8 weeks",
    summary:
      "A high performance site with CMS, analytics, and custom interactions.",
    popular: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    basePrice: 15000,
    priceLabel: "$15,000+",
    timeline: "8-16 weeks",
    summary:
      "Full-scale custom application or platform with dedicated engineering.",
    popular: false,
  },
];

const MIN_QTY = 1;
const MAX_QTY = 20;

function clampQty(value: number): number {
  if (Number.isNaN(value)) return MIN_QTY;
  return Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(value)));
}

export default function BuildContent() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const tier = useMemo(
    () => BUILD_TIERS.find((t) => t.slug === selectedTier) ?? null,
    [selectedTier]
  );

  const visibleAddons = useMemo(() => {
    if (!selectedTier) return [];
    return ADD_ONS.filter((a) => a.tiers.includes(selectedTier));
  }, [selectedTier]);

  function chooseTier(slug: string) {
    if (slug === selectedTier) return;
    setSelectedTier(slug);
    setSelectedAddons((prev) => {
      const next = new Set<string>();
      const allowed = new Set(
        ADD_ONS.filter((a) => a.tiers.includes(slug)).map((a) => a.slug)
      );
      prev.forEach((s) => {
        if (allowed.has(s)) next.add(s);
      });
      return next;
    });
  }

  function toggleAddon(slug: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
        const addon = ADD_ONS.find((a) => a.slug === slug);
        if (addon?.perUnit && !quantities[slug]) {
          setQuantities((q) => ({ ...q, [slug]: 1 }));
        }
      }
      return next;
    });
  }

  function setQty(slug: string, value: number) {
    setQuantities((q) => ({ ...q, [slug]: clampQty(value) }));
  }

  const selectedAddonDetails = useMemo(() => {
    return Array.from(selectedAddons)
      .map((slug) => {
        const addon = ADD_ONS.find((a) => a.slug === slug);
        if (!addon) return null;
        const qty = addon.perUnit ? quantities[slug] ?? 1 : 1;
        const lineTotal = addon.priceValue * qty;
        return { addon, qty, lineTotal };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [selectedAddons, quantities]);

  const total = useMemo(() => {
    if (!tier) return 0;
    return tier.basePrice + selectedAddonDetails.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [tier, selectedAddonDetails]);

  const quoteHref = useMemo(() => {
    if (!tier) return "/contact";
    const params = new URLSearchParams();
    params.set("package", tier.slug);
    if (selectedAddonDetails.length > 0) {
      params.set(
        "addons",
        selectedAddonDetails.map((item) => item.addon.slug).join(",")
      );
      selectedAddonDetails.forEach((item) => {
        if (item.addon.perUnit && item.qty > 1) {
          params.set(`qty_${item.addon.slug}`, String(item.qty));
        }
      });
    }
    params.set("estimate", String(total));
    return `/contact?${params.toString()}`;
  }, [tier, selectedAddonDetails, total]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-12 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 left-1/2 -translate-x-1/2" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue mb-6"
          >
            Package Builder
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Build Your <span className="text-gradient">Package.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Select a base package, add what you need, and request a quote.
          </motion.p>
        </div>
      </section>

      {/* Section 1: Choose Your Base Package */}
      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-blue/10 border border-accent-blue/30 text-xs font-bold text-accent-blue">
              1
            </span>
            <h2 className="font-display text-xl font-bold">
              Choose Your Base Package
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-stretch">
            {BUILD_TIERS.map((t) => {
              const isSelected = selectedTier === t.slug;
              return (
                <motion.button
                  key={t.slug}
                  type="button"
                  onClick={() => chooseTier(t.slug)}
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={isSelected}
                  className={`relative text-left glass-card p-8 transition-all duration-300 ${
                    isSelected
                      ? "ring-2 ring-accent-blue shadow-glow-blue"
                      : "hover:ring-1 hover:ring-accent-blue/30"
                  }`}
                >
                  {t.popular && !isSelected && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue px-4 py-1 text-xs font-bold text-white shadow-glow-blue">
                        <Sparkles className="h-3 w-3" aria-hidden="true" /> Most Popular
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-accent-blue text-white shadow-glow-blue">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}

                  <h3 className="font-display text-2xl font-bold">{t.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold">
                      {t.priceLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Delivered in {t.timeline}
                  </p>
                  <p className="mt-4 text-sm text-text-secondary leading-relaxed">
                    {t.summary}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Customize Your Package */}
      <section className="pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                selectedTier
                  ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
                  : "bg-white/[0.02] border-white/[0.08] text-text-muted"
              }`}
            >
              2
            </span>
            <h2
              className={`font-display text-xl font-bold transition-colors ${
                selectedTier ? "" : "text-text-muted"
              }`}
            >
              Customize Your Package
            </h2>
          </div>

          {!selectedTier ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <p className="text-sm text-text-muted">
                Pick a base package above to see the add-ons available for that
                tier.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {visibleAddons.map((addon) => {
                const isOn = selectedAddons.has(addon.slug);
                const qty = quantities[addon.slug] ?? 1;
                const lineTotal = addon.priceValue * (addon.perUnit ? qty : 1);

                return (
                  <div
                    key={addon.slug}
                    className={`glass-card p-6 transition-all duration-300 ${
                      isOn
                        ? "ring-1 ring-accent-blue/40"
                        : "ring-1 ring-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAddon(addon.slug)}
                      aria-pressed={isOn}
                      className="flex w-full items-start gap-4 text-left"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isOn
                            ? "bg-accent-blue border-accent-blue text-white"
                            : "border-white/20 bg-white/[0.02]"
                        }`}
                        aria-hidden="true"
                      >
                        {isOn && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-base font-bold">
                            {addon.name}
                          </h3>
                          <span className="rounded-full bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-0.5 text-xs font-medium text-accent-blue">
                            {addon.price}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {addon.description}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOn && addon.perUnit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setQty(addon.slug, qty - 1)}
                                disabled={qty <= MIN_QTY}
                                aria-label={`Decrease ${addon.unitLabel ?? "unit"} count`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-text-secondary transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <span
                                className="w-10 text-center font-mono text-sm font-semibold"
                                aria-live="polite"
                              >
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(addon.slug, qty + 1)}
                                disabled={qty >= MAX_QTY}
                                aria-label={`Increase ${addon.unitLabel ?? "unit"} count`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-text-secondary transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <span className="text-xs text-text-muted">
                                {qty} {addon.unitLabel}
                                {qty === 1 ? "" : "s"} × ${addon.priceValue}
                              </span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-text-secondary">
                              ${lineTotal.toLocaleString()}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Spacer so the sticky bar never covers content on short pages */}
      <div className="h-40" aria-hidden="true" />

      {/* Section 3: Sticky Summary Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#06060a]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          {!tier ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-text-muted">
                Select a package above to start building.
              </p>
              <span className="text-xs text-text-muted hidden sm:inline">
                Step 1 of 2
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs uppercase tracking-widest text-text-muted">
                    Your package
                  </span>
                  <span className="font-display text-base font-bold">
                    {tier.name}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {tier.priceLabel}
                  </span>
                </div>
                {selectedAddonDetails.length > 0 && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {selectedAddonDetails
                      .map((item) =>
                        item.addon.perUnit && item.qty > 1
                          ? `${item.qty}× ${item.addon.name} ($${item.lineTotal.toLocaleString()})`
                          : `${item.addon.name} (+$${item.addon.priceValue.toLocaleString()})`
                      )
                      .join(", ")}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-baseline justify-between gap-2 sm:justify-end">
                  <span className="text-xs uppercase tracking-widest text-text-muted">
                    Estimated total
                  </span>
                  <span className="font-display text-2xl font-bold">
                    ${total.toLocaleString()}
                    {tier.slug === "enterprise" ? "+" : ""}
                  </span>
                </div>
                <Link href={quoteHref} className="btn-primary justify-center text-sm">
                  Request a Quote
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
