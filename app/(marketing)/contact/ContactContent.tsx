"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Send, CheckCircle2, AlertCircle, Loader2, Pencil, KeyRound, Gauge } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { SITE, BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/constants";
import { getAddOnBySlug } from "@/lib/pricing-data";

const TIER_LABELS: Record<string, { name: string; basePrice: number; priceLabel: string }> = {
  starter: { name: "Starter", basePrice: 4500, priceLabel: "$4,500" },
  professional: { name: "Professional", basePrice: 9500, priceLabel: "$9,500" },
  enterprise: { name: "Enterprise", basePrice: 15000, priceLabel: "$15,000+" },
};

interface PackageSelection {
  tierSlug: string;
  tier: { name: string; basePrice: number; priceLabel: string };
  addons: { slug: string; name: string; qty: number; lineTotal: number; perUnit: boolean; priceValue: number }[];
  estimate: number;
  message: string;
}

function buildSelection(searchParams: URLSearchParams): PackageSelection | null {
  const packageSlug = searchParams.get("package");
  if (!packageSlug || !TIER_LABELS[packageSlug]) return null;

  const tier = TIER_LABELS[packageSlug];
  const addonsParam = searchParams.get("addons");
  const slugs = addonsParam ? addonsParam.split(",").filter(Boolean) : [];

  const addons = slugs
    .map((slug) => {
      const addon = getAddOnBySlug(slug);
      if (!addon) return null;
      const qtyRaw = searchParams.get(`qty_${slug}`);
      const parsed = qtyRaw ? parseInt(qtyRaw, 10) : 1;
      const qty = addon.perUnit ? Math.max(1, Math.min(20, isNaN(parsed) ? 1 : parsed)) : 1;
      const lineTotal = addon.priceValue * qty;
      return {
        slug: addon.slug,
        name: addon.name,
        qty,
        lineTotal,
        perUnit: addon.perUnit,
        priceValue: addon.priceValue,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const estimateParam = searchParams.get("estimate");
  const parsedEstimate = estimateParam ? parseInt(estimateParam, 10) : NaN;
  const computed = tier.basePrice + addons.reduce((sum, a) => sum + a.lineTotal, 0);
  const estimate = !isNaN(parsedEstimate) && parsedEstimate > 0 ? parsedEstimate : computed;

  const addonSentence =
    addons.length > 0
      ? addons
          .map((a) => (a.perUnit && a.qty > 1 ? `${a.qty} ${a.name}` : a.name))
          .join(", ")
      : "";

  const message = addonSentence
    ? `I am interested in the ${tier.name} package (${tier.priceLabel}) with ${addonSentence}. Estimated total: $${estimate.toLocaleString()}.`
    : `I am interested in the ${tier.name} package (${tier.priceLabel}). Estimated total: $${estimate.toLocaleString()}.`;

  return {
    tierSlug: packageSlug,
    tier,
    addons,
    estimate,
    message,
  };
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  budget: z.string().min(1, "Please select a budget range"),
  projectType: z.string().min(1, "Please select a project type"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website: z.string().optional(), // honeypot
});

type FormData = z.infer<typeof schema>;

const PORTAL_ACCESS_DEFAULTS: Partial<FormData> = {
  budget: "Not sure yet",
  projectType: "Other",
  message:
    "I'd like to request access to the DBJ client portal. A bit of context on what I'm working on:\n\n",
};

const CANOPY_DEFAULTS: Partial<FormData> = {
  budget: "$25,000+",
  projectType: "Other",
  message:
    "I'd like to scope a Canopy engagement. A bit of context on what we're currently using and what I want to consolidate:\n\n",
};

export default function ContactContent() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const searchParams = useSearchParams();

  const selection = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return buildSelection(params);
  }, [searchParams]);

  const isPortalAccessRequest = searchParams.get("topic") === "portal-access";
  const topicParam = searchParams.get("topic");
  // Accept both the new "canopy" topic and the legacy "operations-cockpit"
  // topic so any link published before the rename still routes correctly.
  const isCanopyRequest = topicParam === "canopy" || topicParam === "operations-cockpit";

  const formDefaults = useMemo<Partial<FormData> | undefined>(() => {
    if (selection) return { message: selection.message };
    if (isPortalAccessRequest) return PORTAL_ACCESS_DEFAULTS;
    if (isCanopyRequest) return CANOPY_DEFAULTS;
    return undefined;
  }, [selection, isPortalAccessRequest, isCanopyRequest]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults,
  });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

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
            Contact
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Let&apos;s Build
            <br />
            <span className="text-gradient">Something Great.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Tell me about your project and I&apos;ll get back to you within
            one business day.
          </motion.p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form column */}
            <div className="lg:col-span-3 space-y-6">
              {selection && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card p-6 ring-1 ring-accent-blue/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent-blue mb-2 font-mono">
                        Your Selected Package
                      </p>
                      <p className="font-display text-lg font-bold">
                        {selection.tier.name} Package · {selection.tier.priceLabel}
                      </p>
                    </div>
                    <Link
                      href="/pricing/build"
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-blue transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modify
                    </Link>
                  </div>

                  {selection.addons.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="text-xs uppercase tracking-widest text-text-muted">
                        Add-ons
                      </p>
                      <ul className="space-y-1">
                        {selection.addons.map((a) => (
                          <li
                            key={a.slug}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span className="text-text-secondary">
                              {a.perUnit && a.qty > 1
                                ? `${a.qty}× ${a.name}`
                                : a.name}
                            </span>
                            <span className="font-mono text-xs text-text-muted">
                              +${a.lineTotal.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-baseline justify-between gap-3">
                    <span className="text-xs uppercase tracking-widest text-text-muted">
                      Estimated Total
                    </span>
                    <span className="font-display text-xl font-bold">
                      ${selection.estimate.toLocaleString()}
                      {selection.tierSlug === "enterprise" ? "+" : ""}
                    </span>
                  </div>
                </motion.div>
              )}

              {isPortalAccessRequest && !selection && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card p-6 ring-1 ring-accent-blue/20"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent-blue mb-1 font-mono">
                        Topic
                      </p>
                      <p className="font-display text-base font-bold">
                        Client portal access
                      </p>
                      <p className="mt-2 text-sm text-text-secondary">
                        Share a brief project summary below. Once your account
                        is set up, you&apos;ll receive an invitation email with
                        a sign-in link.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {isCanopyRequest && !selection && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card p-6 ring-1 ring-accent-blue/20"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                      <Gauge className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent-blue mb-1 font-mono">
                        Topic
                      </p>
                      <p className="font-display text-base font-bold">
                        Canopy scoping
                      </p>
                      <p className="mt-2 text-sm text-text-secondary">
                        Tell me what you&apos;re currently using for analytics,
                        performance, error tracking, and deliverability, plus
                        anything you want consolidated. I&apos;ll respond with a
                        scoping outline and proposed timeline.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 md:p-10"
            >
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 mb-4">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">Message Sent</h3>
                  <p className="text-text-secondary max-w-sm">
                    I&apos;ll review your project details and get back to you
                    within one business day.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 btn-outline text-sm"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  {/* Honeypot: hidden from real users, catches bots */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register("website" as keyof FormData)}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Name *"
                      placeholder="Your full name"
                      error={errors.name?.message}
                      {...register("name")}
                    />
                    <Input
                      label="Email *"
                      type="email"
                      placeholder="you@company.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    placeholder="Your phone number"
                    {...register("phone")}
                  />
                  <Input
                    label="Company (optional)"
                    placeholder="Your company name"
                    {...register("company")}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="budget" className="block text-sm font-medium text-text-secondary">
                        Budget Range *
                      </label>
                      <select
                        id="budget"
                        {...register("budget")}
                        aria-invalid={!!errors.budget}
                        aria-describedby={errors.budget ? "budget-error" : undefined}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-accent-blue/50 appearance-none"
                      >
                        <option value="" className="bg-white">Select budget</option>
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b} className="bg-white">{b}</option>
                        ))}
                      </select>
                      {errors.budget && (
                        <p id="budget-error" className="text-xs text-red-400" role="alert">{errors.budget.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="projectType" className="block text-sm font-medium text-text-secondary">
                        Project Type *
                      </label>
                      <select
                        id="projectType"
                        {...register("projectType")}
                        aria-invalid={!!errors.projectType}
                        aria-describedby={errors.projectType ? "projectType-error" : undefined}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-accent-blue/50 appearance-none"
                      >
                        <option value="" className="bg-white">Select type</option>
                        {PROJECT_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-white">{t}</option>
                        ))}
                      </select>
                      {errors.projectType && (
                        <p id="projectType-error" className="text-xs text-red-400" role="alert">{errors.projectType.message}</p>
                      )}
                    </div>
                  </div>
                  <Textarea
                    label="Message *"
                    placeholder="Tell me about your project, goals, and timeline..."
                    error={errors.message?.message}
                    {...register("message")}
                  />

                  {status === "error" && (
                    <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Something went wrong. Please try again in a moment.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-primary w-full justify-center text-base disabled:opacity-50"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
            </div>

            {/* Info sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-8"
            >
              <div className="glass-card p-8">
                <h3 className="font-display text-xl font-bold mb-6">Get In Touch</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Location</p>
                      <p className="text-sm text-text-secondary">{SITE.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response time */}
              <div className="glass-card p-8">
                <h3 className="font-display text-lg font-bold mb-3">Response Time</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  I respond to all inquiries within one business day. Most
                  responses are same-day.
                </p>
              </div>

            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
