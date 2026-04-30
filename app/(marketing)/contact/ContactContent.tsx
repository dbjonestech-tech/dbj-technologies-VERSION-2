"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Gauge,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SITE, BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/constants";
import { getAddOnBySlug } from "@/lib/pricing-data";

/* ─── PAGE IDENTITY ───────────────────────────────────
   Contact is the silver page. Slate-500 carries
   structural elements at a calm, restrained level.
   Slate-300/400 carry luminous halos. Brand-blue stays
   as the primary CTA / submit color. Silver reads as
   "calm / direct / sophisticated." This page is dialed
   down on visual decoration on purpose; the form is the
   focus. */
const PAGE_ACCENT = "#64748b"; // slate-500
const PAGE_LIGHT = "#94a3b8"; // slate-400
const PAGE_DARK = "#475569"; // slate-600
const BRAND_BLUE = "#3b82f6";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const TIER_LABELS: Record<
  string,
  { name: string; basePrice: number; priceLabel: string }
> = {
  starter: { name: "Starter", basePrice: 4500, priceLabel: "$4,500" },
  professional: {
    name: "Professional",
    basePrice: 9500,
    priceLabel: "$9,500",
  },
  enterprise: {
    name: "Enterprise",
    basePrice: 15000,
    priceLabel: "$15,000+",
  },
};

interface PackageSelection {
  tierSlug: string;
  tier: { name: string; basePrice: number; priceLabel: string };
  addons: {
    slug: string;
    name: string;
    qty: number;
    lineTotal: number;
    perUnit: boolean;
    priceValue: number;
  }[];
  estimate: number;
  message: string;
}

function buildSelection(
  searchParams: URLSearchParams
): PackageSelection | null {
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
      const qty = addon.perUnit
        ? Math.max(1, Math.min(20, isNaN(parsed) ? 1 : parsed))
        : 1;
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
  const computed =
    tier.basePrice + addons.reduce((sum, a) => sum + a.lineTotal, 0);
  const estimate =
    !isNaN(parsedEstimate) && parsedEstimate > 0 ? parsedEstimate : computed;

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
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const searchParams = useSearchParams();

  const selection = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return buildSelection(params);
  }, [searchParams]);

  const isPortalAccessRequest = searchParams.get("topic") === "portal-access";
  const topicParam = searchParams.get("topic");
  const isCanopyRequest =
    topicParam === "canopy" || topicParam === "operations-cockpit";

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

  const fadeIn: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <>
      {/* ─── HERO (CALM, CENTERED, SCALED-BACK) ───────── */}
      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
        {/* Subtle silver wash, distinctly desaturated so the page reads
            as the quietest in the marketing surface, not the loudest. */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              background: `radial-gradient(ellipse 50% 40% at 50% 10%, ${PAGE_LIGHT} 0%, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: reduce
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
          >
            <motion.span
              variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{
                borderColor: `${PAGE_ACCENT}33`,
                backgroundColor: `${PAGE_ACCENT}0a`,
                color: PAGE_DARK,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PAGE_ACCENT }}
                aria-hidden="true"
              />
              Contact
            </motion.span>
            <motion.h1
              variants={fadeIn}
              className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight"
            >
              Let&apos;s Build
              <br />
              <span style={{ color: PAGE_DARK }}>Something Great.</span>
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-[1.6]"
            >
              Tell me about your project and I will get back to you within
              one business day.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── FORM + INFO ──────────────────────────────── */}
      <section className="relative pb-24 lg:pb-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form column */}
            <div className="lg:col-span-3 space-y-6">
              {selection ? (
                <motion.div
                  initial={
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.6,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6"
                  style={{
                    borderColor: `${PAGE_ACCENT}30`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}05 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.03)",
                      `0 8px 24px -10px ${PAGE_ACCENT}20`,
                    ].join(", "),
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-2 font-mono"
                        style={{ color: PAGE_DARK }}
                      >
                        Your Selected Package
                      </p>
                      <p className="font-display text-lg font-bold tracking-tight">
                        {selection.tier.name} Package · {selection.tier.priceLabel}
                      </p>
                    </div>
                    <Link
                      href="/pricing/build"
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modify
                    </Link>
                  </div>

                  {selection.addons.length > 0 ? (
                    <div className="mt-4 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-mono">
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
                  ) : null}

                  <div
                    className="mt-4 pt-4 border-t flex items-baseline justify-between gap-3"
                    style={{ borderColor: `${PAGE_ACCENT}1a` }}
                  >
                    <span className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-mono">
                      Estimated Total
                    </span>
                    <span
                      className="font-display text-xl font-bold tabular-nums"
                      style={{ color: PAGE_DARK }}
                    >
                      ${selection.estimate.toLocaleString()}
                      {selection.tierSlug === "enterprise" ? "+" : ""}
                    </span>
                  </div>
                </motion.div>
              ) : null}

              {isPortalAccessRequest && !selection ? (
                <motion.div
                  initial={
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.6,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6"
                  style={{
                    borderColor: `${PAGE_ACCENT}30`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}05 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.03)",
                      `0 8px 24px -10px ${PAGE_ACCENT}20`,
                    ].join(", "),
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${PAGE_ACCENT}15`,
                        color: PAGE_DARK,
                      }}
                    >
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-1 font-mono"
                        style={{ color: PAGE_DARK }}
                      >
                        Topic
                      </p>
                      <p className="font-display text-base font-bold tracking-tight">
                        Client portal access
                      </p>
                      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                        Share a brief project summary below. Once your account
                        is set up, you will receive an invitation email with a
                        sign-in link.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {isCanopyRequest && !selection ? (
                <motion.div
                  initial={
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.6,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6"
                  style={{
                    borderColor: `${PAGE_ACCENT}30`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}05 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.03)",
                      `0 8px 24px -10px ${PAGE_ACCENT}20`,
                    ].join(", "),
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${PAGE_ACCENT}15`,
                        color: PAGE_DARK,
                      }}
                    >
                      <Gauge className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-1 font-mono"
                        style={{ color: PAGE_DARK }}
                      >
                        Topic
                      </p>
                      <p className="font-display text-base font-bold tracking-tight">
                        Canopy scoping
                      </p>
                      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                        Tell me what you are currently using for analytics,
                        performance, error tracking, and deliverability, plus
                        anything you want consolidated. I will respond with a
                        scoping outline and proposed timeline.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              <motion.div
                initial={
                  reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduce ? 0 : 0.6,
                  ease: EASE_OUT,
                  delay: 0.05,
                }}
                className="relative rounded-2xl border p-8 md:p-10"
                style={{
                  borderColor: `${PAGE_ACCENT}33`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}04 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.03)",
                    `0 12px 32px -14px ${PAGE_ACCENT}28`,
                  ].join(", "),
                }}
              >
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
                      style={{
                        backgroundColor: `${PAGE_ACCENT}18`,
                        color: PAGE_DARK,
                      }}
                    >
                      <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2 tracking-tight">
                      Message Sent
                    </h3>
                    <p className="text-text-secondary max-w-sm leading-relaxed">
                      I will review your project details and get back to you
                      within one business day.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-text-primary/5"
                      style={{
                        borderColor: `${PAGE_ACCENT}33`,
                        color: PAGE_DARK,
                      }}
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                    noValidate
                  >
                    {/* Honeypot */}
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
                        <label
                          htmlFor="budget"
                          className="block text-sm font-medium text-text-secondary"
                        >
                          Budget Range *
                        </label>
                        <select
                          id="budget"
                          {...register("budget")}
                          aria-invalid={!!errors.budget}
                          aria-describedby={
                            errors.budget ? "budget-error" : undefined
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-slate-400 appearance-none"
                        >
                          <option value="" className="bg-white">
                            Select budget
                          </option>
                          {BUDGET_OPTIONS.map((b) => (
                            <option key={b} value={b} className="bg-white">
                              {b}
                            </option>
                          ))}
                        </select>
                        {errors.budget ? (
                          <p
                            id="budget-error"
                            className="text-xs text-red-500"
                            role="alert"
                          >
                            {errors.budget.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="projectType"
                          className="block text-sm font-medium text-text-secondary"
                        >
                          Project Type *
                        </label>
                        <select
                          id="projectType"
                          {...register("projectType")}
                          aria-invalid={!!errors.projectType}
                          aria-describedby={
                            errors.projectType ? "projectType-error" : undefined
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-slate-400 appearance-none"
                        >
                          <option value="" className="bg-white">
                            Select type
                          </option>
                          {PROJECT_TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t} className="bg-white">
                              {t}
                            </option>
                          ))}
                        </select>
                        {errors.projectType ? (
                          <p
                            id="projectType-error"
                            className="text-xs text-red-500"
                            role="alert"
                          >
                            {errors.projectType.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Textarea
                      label="Message *"
                      placeholder="Tell me about your project, goals, and timeline..."
                      error={errors.message?.message}
                      {...register("message")}
                    />

                    {status === "error" ? (
                      <div
                        role="alert"
                        className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500"
                      >
                        <AlertCircle
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        Something went wrong. Please try again in a moment.
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      {status === "loading" ? (
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
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

            {/* Info sidebar (no email displayed) */}
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduce ? 0 : 0.6,
                ease: EASE_OUT,
                delay: 0.1,
              }}
              className="lg:col-span-2 space-y-6"
            >
              <div
                className="relative rounded-2xl border p-7"
                style={{
                  borderColor: `${PAGE_ACCENT}26`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}04 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.03)",
                    `0 8px 22px -10px ${PAGE_ACCENT}1f`,
                  ].join(", "),
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${PAGE_ACCENT}15`,
                      color: PAGE_DARK,
                    }}
                  >
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1 font-mono">
                      Location
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {SITE.address}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary leading-snug">
                      Working across the metroplex.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="relative rounded-2xl border p-7"
                style={{
                  borderColor: `${PAGE_ACCENT}26`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}04 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.03)",
                    `0 8px 22px -10px ${PAGE_ACCENT}1f`,
                  ].join(", "),
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${PAGE_ACCENT}15`,
                      color: PAGE_DARK,
                    }}
                  >
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1 font-mono">
                      Response Time
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      Within 1 business day
                    </p>
                    <p className="mt-1 text-xs text-text-secondary leading-snug">
                      Most replies are same-day.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
