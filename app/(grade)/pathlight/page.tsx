"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { PathlightBackdrop } from "./PathlightBackdrop";

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
  { title: "AI-powered design analysis", body: "Pathlight evaluates layout, hierarchy, and conversion psychology." },
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
        router.push(`/pathlight/${data.scanId}`);
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
    <>
      <PathlightBackdrop />
      <div
        className="relative min-h-screen w-full px-6 py-16 sm:py-24"
        style={{ color: "#e7ebf2" }}
      >
        <div className="mx-auto w-full max-w-[600px]">
        <div
          className="mb-8 flex justify-center"
          style={{ color: "#1AD4EA" }}
        >
          <Link
            href="/"
            aria-label="DBJ Technologies home"
            className="block transition-opacity hover:opacity-100"
            style={{ opacity: 0.75 }}
          >
            <svg
              viewBox="0 0 174 214"
              aria-hidden="true"
              style={{ height: 44, width: "auto" }}
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M 173 98 L 153 87 L 153 149 L 88 189 L 21 150 L 21 88 L 0 99 L 0 160 L 8 166 L 87 213 L 90 213 L 93 210 L 103 205 L 173 160 Z M 57 67 L 37 79 L 37 143 L 57 155 L 59 155 L 59 67 Z M 116 66 L 116 154 L 122 153 L 123 151 L 135 145 L 138 142 L 138 77 L 122 68 Z M 116 24 L 115 26 L 115 46 L 116 48 L 172 83 L 173 82 L 173 58 L 125 29 L 122 26 Z M 96 0 L 92 1 L 89 4 L 0 58 L 0 82 L 2 82 L 42 58 L 74 37 L 76 38 L 76 165 L 87 171 L 96 167 Z"
              />
            </svg>
          </Link>
        </div>
        <section className="mb-14 text-center">
          <h1 className="header-glow-premium font-display text-5xl font-bold tracking-tight sm:text-6xl">
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

        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-[36px]"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(59,130,246,0.05), rgba(8,145,178,0.03) 40%, transparent 72%)",
            }}
          />
          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border p-6 sm:p-8"
            style={{
              borderColor: "rgba(59,130,246,0.18)",
              backgroundColor: "rgba(10,12,18,0.7)",
              backdropFilter: "blur(6px)",
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
    </>
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
