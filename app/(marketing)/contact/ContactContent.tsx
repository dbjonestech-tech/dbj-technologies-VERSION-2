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
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Gauge,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Send,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SITE, BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/constants";
import { getAddOnBySlug } from "@/lib/pricing-data";

/* ─── PAGE IDENTITY ───────────────────────────────────
   Contact is the rose page. Rose-600 carries structural
   elements (chapter rulers, dots, channel tile accents,
   form focus states). Rose-400/500 carry luminous halos
   and pulses. Rose-800 carries depth in gradients.
   Brand-blue stays as the primary CTA / submit color.
   Rose reads as "personal / warm / approachable,"
   distinct from cyan (Process), emerald (Services),
   amber (Pricing), and brand-blue (About). The contact
   page is where humans meet humans, so the warmest tone
   in the palette is intentional. */
const PAGE_ACCENT = "#e11d48"; // rose-600
const PAGE_LIGHT = "#fb7185"; // rose-400
const PAGE_DARK = "#9f1239"; // rose-800
const PAGE_HIGHLIGHT = "#fda4af"; // rose-300, peak glow
const BRAND_BLUE = "#3b82f6";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

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

/* ─── PULSING DOT ───────────────────────────────────── */
function PulsingDot({
  delay = 0,
  size = 8,
  color = PAGE_ACCENT,
  reduce,
}: {
  delay?: number;
  size?: number;
  color?: string;
  reduce: boolean | null;
}) {
  return (
    <motion.span
      className="inline-block rounded-full shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        boxShadow: `0 0 0 0 ${color}66`,
      }}
      animate={
        reduce
          ? undefined
          : {
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.18, 1],
              boxShadow: [
                `0 0 0 0 ${color}66`,
                `0 0 12px 3px ${color}66`,
                `0 0 0 0 ${color}66`,
              ],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              duration: 3.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }
      }
      aria-hidden="true"
    />
  );
}

/* ─── CHAPTER HEADER ─────────────────────────────────── */
function ChapterHeader({
  label,
  heading,
  reduce,
}: {
  label: string;
  heading: string;
  reduce: boolean | null;
}) {
  const tagV: Variants = {
    hidden: reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: EASE_OUT },
    },
  };
  const rulerV: Variants = {
    hidden: reduce ? { scaleX: 1 } : { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: reduce ? 0 : 1.1,
        ease: EASE_OUT,
        delay: 0.1,
      },
    },
  };
  const headingV: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0 : 0.7,
        ease: EASE_OUT,
        delay: 0.15,
      },
    },
  };

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-10">
        <motion.div variants={tagV} className="flex items-center gap-2.5 shrink-0">
          <PulsingDot delay={0} reduce={reduce} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
            {label}
          </span>
        </motion.div>
        <motion.span
          variants={rulerV}
          className="h-[2px] flex-1 origin-left"
          style={{
            background: `linear-gradient(90deg, ${PAGE_LIGHT} 0%, ${PAGE_ACCENT} 35%, ${PAGE_ACCENT}11 100%)`,
            boxShadow: `0 0 14px ${PAGE_LIGHT}33`,
          }}
          aria-hidden="true"
        />
      </div>
      <motion.h2
        variants={headingV}
        className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-[1.1] tracking-tight max-w-4xl"
      >
        {heading}
      </motion.h2>
    </motion.div>
  );
}

/* ─── CHANNEL TILE ────────────────────────────────────
   A premium card-style channel tile used in the hero
   signature grid. Carries the icon chip, label, primary
   value, and an arrow when clickable. */
function ChannelTile({
  icon: Icon,
  label,
  primary,
  caption,
  href,
  reduce,
}: {
  icon: typeof Mail;
  label: string;
  primary: string;
  caption?: string;
  href?: string;
  reduce: boolean | null;
}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      href.startsWith("mailto:") || href.startsWith("tel:") ? (
        <a href={href} className="contents">
          {children}
        </a>
      ) : (
        <Link href={href} className="contents">
          {children}
        </Link>
      )
    ) : (
      <>{children}</>
    );

  return (
    <Wrapper>
      <motion.div
        whileHover={
          reduce
            ? undefined
            : { y: -6, transition: { duration: 0.35, ease: EASE_OUT } }
        }
        className={`group relative rounded-xl border p-5 overflow-hidden ${
          href ? "cursor-pointer" : "cursor-default"
        }`}
        style={{
          borderColor: `${PAGE_ACCENT}26`,
          background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}07 100%)`,
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.95)",
            "0 1px 2px rgba(0,0,0,0.03)",
            `0 8px 22px -10px ${PAGE_ACCENT}22`,
          ].join(", "),
        }}
      >
        <span
          className="absolute -inset-px rounded-xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
          style={{
            boxShadow: [
              `0 24px 56px -14px ${PAGE_ACCENT}48`,
              `0 56px 112px -28px ${PAGE_ACCENT}28`,
              `0 0 0 1px ${PAGE_ACCENT}38`,
            ].join(", "),
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 left-4 right-4 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}88 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3"
            style={{
              background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}10 100%)`,
              color: PAGE_ACCENT,
              boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
            }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {href ? (
            <ArrowRight
              className="h-4 w-4 text-text-muted transition-all duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-hover:text-text-primary"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.22em] mb-1.5"
          style={{ color: PAGE_ACCENT }}
        >
          {label}
        </div>
        <div className="font-display text-base font-bold text-text-primary leading-tight tracking-tight break-words">
          {primary}
        </div>
        {caption ? (
          <div className="mt-1.5 text-xs text-text-secondary leading-snug">
            {caption}
          </div>
        ) : null}
      </motion.div>
    </Wrapper>
  );
}

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

  const heroStagger: Variants = {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const heroItem: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <>
      {/* ─── HERO: CHANNEL GRID ───────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        {/* Page-identity wash: warm rose radials */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{
              background: `radial-gradient(ellipse 60% 45% at 85% 20%, ${PAGE_LIGHT} 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 15% 30%, ${PAGE_ACCENT} 0%, transparent 55%)`,
            }}
          />
        </div>

        {/* Soft hex pattern overlay (warm contact card vibe) */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${PAGE_ACCENT} 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 xl:gap-20 items-start">
            {/* LEFT: title block */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroStagger}
              className="lg:pt-4"
            >
              <motion.div
                variants={heroItem}
                className="flex items-center gap-3 mb-7 flex-wrap"
              >
                <PulsingDot reduce={reduce} />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Contact
                </span>
                <span className="text-text-muted/50" aria-hidden="true">
                  /
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: PAGE_ACCENT }}
                >
                  Direct Line
                </span>
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
              >
                Let's Build
                <br />
                <span style={{ color: PAGE_ACCENT }}>Something Great.</span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-xl mb-10"
              >
                Tell me about your project and I will get back to you within
                one business day. No intake forms routed through a sales team,
                no automated screening. Direct to the architect.
              </motion.p>

              <motion.div
                variants={heroItem}
                className="flex items-center gap-6 lg:gap-8 mb-10"
              >
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    1
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Day Reply
                  </span>
                </div>
                <div
                  className="h-8 w-px bg-text-primary/15"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    0
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Layers
                  </span>
                </div>
                <div
                  className="h-8 w-px bg-text-primary/15"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    1
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Architect
                  </span>
                </div>
              </motion.div>

              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                <Link
                  href="#form"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Start the Form
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
                >
                  Or email directly
                </a>
              </motion.div>
            </motion.div>

            {/* RIGHT: Channel grid signature */}
            <div className="relative">
              {!reduce ? (
                <>
                  <motion.div
                    className="absolute -inset-8 lg:-inset-12 -z-10 blur-3xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${PAGE_LIGHT} 0%, transparent 70%)`,
                    }}
                    animate={{ opacity: [0.16, 0.32, 0.16] }}
                    transition={{
                      duration: 5.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                    aria-hidden="true"
                  />
                  <motion.div
                    className="absolute -inset-6 lg:-inset-10 -z-10 blur-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 60% 40%, ${PAGE_ACCENT} 0%, transparent 60%)`,
                    }}
                    animate={{ opacity: [0.10, 0.22, 0.10] }}
                    transition={{
                      duration: 6.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.6,
                    }}
                    aria-hidden="true"
                  />
                </>
              ) : (
                <div
                  className="absolute -inset-8 lg:-inset-12 -z-10 blur-3xl pointer-events-none opacity-25"
                  style={{
                    background: `radial-gradient(ellipse at center, ${PAGE_LIGHT} 0%, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />
              )}
              <div
                className="relative rounded-2xl lg:rounded-3xl border p-6 lg:p-8 transform-gpu overflow-hidden"
                style={{
                  borderColor: `${PAGE_ACCENT}40`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}0d 60%, ${PAGE_ACCENT}0a 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "inset 0 0 0 1px rgba(255,255,255,0.4)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 18px 48px -16px ${PAGE_ACCENT}40`,
                    `0 48px 100px -32px ${PAGE_ACCENT}30`,
                    `0 80px 140px -40px ${PAGE_DARK}25`,
                  ].join(", "),
                }}
              >
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}aa 35%, ${PAGE_HIGHLIGHT}cc 50%, ${PAGE_LIGHT}aa 65%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2.5 mb-6 lg:mb-7">
                  <PulsingDot reduce={reduce} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    Channels
                  </span>
                </div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: reduce
                        ? { staggerChildren: 0 }
                        : { staggerChildren: 0.08, delayChildren: 0.4 },
                    },
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <motion.div
                    variants={{
                      hidden: reduce
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 18 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: reduce ? 0 : 0.6,
                          ease: EASE_OUT,
                        },
                      },
                    }}
                  >
                    <ChannelTile
                      icon={Mail}
                      label="Email"
                      primary={SITE.email}
                      caption="Direct to inbox"
                      href={`mailto:${SITE.email}`}
                      reduce={reduce}
                    />
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: reduce
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 18 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: reduce ? 0 : 0.6,
                          ease: EASE_OUT,
                        },
                      },
                    }}
                  >
                    <ChannelTile
                      icon={MessageSquare}
                      label="Form"
                      primary="Start a Conversation"
                      caption="Project intake below"
                      href="#form"
                      reduce={reduce}
                    />
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: reduce
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 18 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: reduce ? 0 : 0.6,
                          ease: EASE_OUT,
                        },
                      },
                    }}
                  >
                    <ChannelTile
                      icon={MapPin}
                      label="Location"
                      primary={SITE.address}
                      caption="Working across the metroplex"
                      reduce={reduce}
                    />
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: reduce
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 18 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: reduce ? 0 : 0.6,
                          ease: EASE_OUT,
                        },
                      },
                    }}
                  >
                    <ChannelTile
                      icon={Clock}
                      label="Response"
                      primary="Within 1 business day"
                      caption="Most replies are same-day"
                      reduce={reduce}
                    />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${PAGE_ACCENT}33 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ─── FORM SECTION ─────────────────────────────── */}
      <section id="form" className="relative py-24 lg:py-32 scroll-mt-24">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-16 lg:mb-20 max-w-3xl">
            <ChapterHeader
              label="Project Intake"
              heading="Tell Me About It."
              reduce={reduce}
            />
            <motion.p
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.25,
              }}
              className="mt-8 text-lg leading-[1.7] text-text-secondary"
            >
              Project specifics, goals, timeline. The more detail, the more
              precise the response. The form goes directly to my inbox.
            </motion.p>
          </div>

          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              {selection ? (
                <motion.div
                  initial={
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.7,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6 overflow-hidden"
                  style={{
                    borderColor: `${PAGE_ACCENT}40`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}08 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.04)",
                      `0 12px 32px -12px ${PAGE_ACCENT}28`,
                    ].join(", "),
                  }}
                >
                  <div
                    className="absolute top-0 left-5 right-5 h-px pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}99 50%, transparent 100%)`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-2 font-mono"
                        style={{ color: PAGE_ACCENT }}
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
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.7,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6 overflow-hidden"
                  style={{
                    borderColor: `${PAGE_ACCENT}40`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}08 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.04)",
                      `0 12px 32px -12px ${PAGE_ACCENT}28`,
                    ].join(", "),
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}10 100%)`,
                        color: PAGE_ACCENT,
                        boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
                      }}
                    >
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-1 font-mono"
                        style={{ color: PAGE_ACCENT }}
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
                    reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.7,
                    ease: EASE_OUT,
                  }}
                  className="relative rounded-xl border p-6 overflow-hidden"
                  style={{
                    borderColor: `${PAGE_ACCENT}40`,
                    background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}08 100%)`,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.95)",
                      "0 1px 2px rgba(0,0,0,0.04)",
                      `0 12px 32px -12px ${PAGE_ACCENT}28`,
                    ].join(", "),
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}10 100%)`,
                        color: PAGE_ACCENT,
                        boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
                      }}
                    >
                      <Gauge className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] mb-1 font-mono"
                        style={{ color: PAGE_ACCENT }}
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
                  reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduce ? 0 : 0.7,
                  ease: EASE_OUT,
                  delay: 0.1,
                }}
                className="relative rounded-2xl border p-8 md:p-10 overflow-hidden"
                style={{
                  borderColor: `${PAGE_ACCENT}33`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}06 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 18px 48px -18px ${PAGE_ACCENT}28`,
                    `0 48px 100px -36px ${PAGE_ACCENT}18`,
                  ].join(", "),
                }}
              >
                <div
                  className="absolute top-0 left-8 right-8 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}aa 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
                      style={{
                        backgroundColor: `${PAGE_ACCENT}15`,
                        color: PAGE_ACCENT,
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
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-rose-500/60 appearance-none"
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
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-rose-500/60 appearance-none"
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

            {/* Info sidebar */}
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.2,
              }}
              className="lg:col-span-2 space-y-6"
            >
              <div
                className="relative rounded-2xl border p-7 overflow-hidden"
                style={{
                  borderColor: `${PAGE_ACCENT}26`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}06 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 10px 28px -12px ${PAGE_ACCENT}22`,
                  ].join(", "),
                }}
              >
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}88 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <h3 className="font-display text-xl font-bold mb-5 tracking-tight">
                  Get In Touch
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}10 100%)`,
                        color: PAGE_ACCENT,
                        boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
                      }}
                    >
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1 font-mono">
                        Email
                      </p>
                      <a
                        href={`mailto:${SITE.email}`}
                        className="text-sm font-medium text-text-primary hover:underline underline-offset-4 decoration-1"
                      >
                        {SITE.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}10 100%)`,
                        color: PAGE_ACCENT,
                        boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
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
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative rounded-2xl border p-7 overflow-hidden"
                style={{
                  borderColor: `${PAGE_ACCENT}26`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}06 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 10px 28px -12px ${PAGE_ACCENT}22`,
                  ].join(", "),
                }}
              >
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}88 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2.5 mb-3">
                  <PulsingDot reduce={reduce} delay={1.4} />
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: PAGE_ACCENT }}
                  >
                    Response Time
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2 tracking-tight">
                  Within 1 Business Day
                </h3>
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
