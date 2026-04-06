"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { SITE, SOCIALS, BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/constants";

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

export default function ContactContent() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
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
            Tell us about your project and we&apos;ll get back to you within
            24 hours with a plan.
          </motion.p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 glass-card p-8 md:p-10"
            >
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 mb-4">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-text-secondary max-w-sm">
                    Thanks for reaching out. We&apos;ll review your project details and
                    get back to you within 24 hours.
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
                  {/* Honeypot — hidden from real users, catches bots */}
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
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Phone (optional)"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register("phone")}
                    />
                    <Input
                      label="Company (optional)"
                      placeholder="Your company name"
                      {...register("company")}
                    />
                  </div>
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
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent-blue/50 appearance-none"
                      >
                        <option value="" className="bg-bg-primary">Select budget</option>
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b} className="bg-bg-primary">{b}</option>
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
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-accent-blue/50 appearance-none"
                      >
                        <option value="" className="bg-bg-primary">Select type</option>
                        {PROJECT_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-bg-primary">{t}</option>
                        ))}
                      </select>
                      {errors.projectType && (
                        <p id="projectType-error" className="text-xs text-red-400" role="alert">{errors.projectType.message}</p>
                      )}
                    </div>
                  </div>
                  <Textarea
                    label="Message *"
                    placeholder="Tell us about your project, goals, and timeline..."
                    error={errors.message?.message}
                    {...register("message")}
                  />

                  {status === "error" && (
                    <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Something went wrong. Please try again or email us directly.
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
                  <a
                    href={`mailto:${SITE.email}`}
                    className="flex items-start gap-4 group"
                    aria-label={`Email us at ${SITE.email}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue group-hover:bg-accent-blue/20 transition-colors">
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Email</p>
                      <p className="text-sm text-text-secondary group-hover:text-white transition-colors">
                        {SITE.email}
                      </p>
                    </div>
                  </a>
                  <a
                    href={`tel:${SITE.phone}`}
                    className="flex items-start gap-4 group"
                    aria-label={`Call us at ${SITE.phone}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue group-hover:bg-accent-blue/20 transition-colors">
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Phone</p>
                      <p className="text-sm text-text-secondary group-hover:text-white transition-colors">
                        {SITE.phone}
                      </p>
                    </div>
                  </a>
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
                  We respond to all inquiries within 24 hours during business
                  days. For urgent matters, give us a call.
                </p>
              </div>

              {/* Social */}
              <div className="glass-card p-8">
                <h3 className="font-display text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-text-secondary hover:text-white hover:border-accent-blue/30 transition-all"
                      aria-label={s.label}
                    >
                      <span className="text-xs font-bold">{s.label.charAt(0)}</span>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
