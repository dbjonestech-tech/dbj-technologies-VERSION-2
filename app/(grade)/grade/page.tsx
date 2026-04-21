"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

type FormState = {
  url: string;
  email: string;
  businessName: string;
  city: string;
};

const INITIAL_STATE: FormState = {
  url: "",
  email: "",
  businessName: "",
  city: "Dallas",
};

const BULLETS = [
  { title: "AI-powered design analysis", body: "Claude evaluates layout, hierarchy, and conversion psychology." },
  { title: "Performance & technical audit", body: "Lighthouse metrics, Core Web Vitals, and load-time impact." },
  { title: "Revenue impact estimate", body: "Dollars you lose to every friction point, modelled by industry." },
  { title: "Actionable fix priorities", body: "A ranked list of what to change first, and why it matters." },
];

export default function GradePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [token, setToken] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Please complete the bot-check challenge.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          email: form.email,
          businessName: form.businessName || undefined,
          city: form.city,
          turnstileToken: token,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 202 && data?.scanId) {
        router.push(`/grade/${data.scanId}`);
        return;
      }

      const message =
        data?.error ??
        (res.status === 400
          ? "Please check your inputs."
          : res.status === 429
            ? "Rate limit reached. Try again tomorrow."
            : "Something went wrong. Please try again.");
      setError(message);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const disabled = submitting || !token;

  return (
    <div
      className="min-h-screen w-full px-6 py-16 sm:py-24"
      style={{ backgroundColor: "#06060a", color: "#e7ebf2" }}
    >
      <div className="mx-auto w-full max-w-[600px]">
        <section className="mb-14 text-center">
          <h1
            className="font-display text-5xl font-bold tracking-tight sm:text-6xl"
            style={{
              backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            PATHLIGHT
          </h1>
          <p className="mt-4 text-lg sm:text-xl" style={{ color: "#c5ccd8" }}>
            See what your website is really costing you.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {BULLETS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border p-4 text-left"
                style={{
                  borderColor: "rgba(59,130,246,0.18)",
                  backgroundColor: "rgba(14,16,22,0.6)",
                }}
              >
                <div className="font-display text-sm font-semibold" style={{ color: "#60a5fa" }}>
                  {b.title}
                </div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: "#9aa3b2" }}>
                  {b.body}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.25em]" style={{ color: "#6b7280" }}>
            Free · No credit card · Results in 60 seconds
          </p>
        </section>

        <section>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border p-6 sm:p-8"
            style={{
              borderColor: "rgba(59,130,246,0.18)",
              backgroundColor: "rgba(10,12,18,0.7)",
            }}
          >
            <div className="grid gap-4">
              <Field
                label="Website URL"
                type="url"
                required
                placeholder="https://yourwebsite.com"
                value={form.url}
                onChange={(v) => update("url", v)}
                disabled={submitting}
              />
              <Field
                label="Email"
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={(v) => update("email", v)}
                disabled={submitting}
              />
              <Field
                label="Business Name (optional)"
                type="text"
                placeholder="Acme Plumbing"
                value={form.businessName}
                onChange={(v) => update("businessName", v)}
                disabled={submitting}
              />
              <Field
                label="City"
                type="text"
                placeholder="Dallas"
                value={form.city}
                onChange={(v) => update("city", v)}
                disabled={submitting}
              />

              <div className="mt-2">
                {siteKey ? (
                  <Turnstile
                    siteKey={siteKey}
                    onSuccess={setToken}
                    onError={() => setToken("")}
                    onExpire={() => setToken("")}
                    options={{ theme: "dark" }}
                  />
                ) : (
                  <div
                    className="rounded-md border px-3 py-2 text-xs"
                    style={{
                      borderColor: "rgba(239,68,68,0.35)",
                      color: "#fca5a5",
                    }}
                  >
                    Turnstile is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
                  </div>
                )}
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderColor: "rgba(239,68,68,0.35)",
                    color: "#fca5a5",
                    backgroundColor: "rgba(127,29,29,0.15)",
                  }}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={disabled}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
                  boxShadow: "0 6px 20px rgba(59,130,246,0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Starting scan...
                  </>
                ) : (
                  "Scan My Website"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9aa3b2" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors focus:outline-none disabled:opacity-60"
        style={{
          borderColor: "rgba(148,163,184,0.2)",
          backgroundColor: "rgba(6,8,12,0.9)",
          color: "#e7ebf2",
        }}
      />
    </label>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}
