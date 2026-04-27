import Link from "next/link";

const REPORT_ITEMS = [
  {
    title: "Pathlight Score",
    body: "An overall 0-100 score with four weighted pillars: Design (35%), Performance (25%), Positioning (25%), and Search Visibility (15%).",
  },
  {
    title: "Revenue Impact Estimate",
    body: "Find out what your website is actually costing you each month. Every assumption behind the number is shown, so you can see exactly how it was built.",
  },
  {
    title: "Top 3 Priority Fixes",
    body: "Know exactly what to fix first and why it matters. Each fix explains what is wrong, what it would gain you, and how hard it is to ship.",
  },
  {
    title: "Full Desktop & Mobile Screenshots",
    body: "See your site through your customer's eyes, on the device they actually use. The same view your visitors get when they decide whether to call you.",
  },
];

const GLASS_CARD_BG =
  "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)";

export function PathlightContent() {
  return (
    <div
      className="relative w-full px-6 pb-24"
      style={{ color: "#e7ebf2" }}
    >
      {/* SECTION 3 - What Your Report Includes */}
      <section className="mx-auto w-full max-w-5xl pt-4 sm:pt-8">
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What Your Report Includes
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-5 h-px w-24"
            style={{
              background:
                "linear-gradient(to right, transparent, #3b82f6, #0891b2, transparent)",
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {REPORT_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border p-6 sm:p-7"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: GLASS_CARD_BG,
              }}
            >
              <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                {item.title}
              </h3>
              <p
                className="mt-3 text-sm leading-relaxed sm:text-[15px]"
                style={{ color: "#9ca3af" }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 - Differentiator */}
      <section className="mx-auto w-full max-w-3xl pt-24 sm:pt-32">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Most audits check code. Pathlight checks the experience.
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-5 h-px w-24"
            style={{
              background:
                "linear-gradient(to right, transparent, #3b82f6, #0891b2, transparent)",
            }}
          />
        </div>
        <div
          className="mx-auto mt-10 space-y-5 text-left text-base leading-relaxed sm:text-lg"
          style={{ color: "#9ca3af" }}
        >
          <p>
            Generic website audits scan HTML tags and run speed tests. They tell
            you your images are too large or your meta descriptions are missing.
            That is useful but incomplete.
          </p>
          <p>
            Pathlight looks at the same thing your customers do. It evaluates
            visual design, messaging clarity, trust signals, conversion flow,
            and mobile experience, then translates the findings into a revenue
            impact estimate calibrated for your specific business type.
          </p>
          <p>
            The result is a business-readable report that tells you what to fix
            first and approximately how much fixing it could be worth.
          </p>
        </div>
      </section>

      {/* SECTION 5 - Who This Is For */}
      <section className="mx-auto w-full max-w-3xl pt-24 sm:pt-32">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for businesses where one lead matters
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-5 h-px w-24"
            style={{
              background:
                "linear-gradient(to right, transparent, #3b82f6, #0891b2, transparent)",
            }}
          />
        </div>
        <p
          className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed sm:text-lg"
          style={{ color: "#9ca3af" }}
        >
          Auto repair, contractors, law firms, dental practices, med spas, home
          services, commercial services, counseling practices, and any business
          that grows through calls, forms, quotes, or bookings.
        </p>
      </section>

      {/* SECTION 6 - Secondary CTA */}
      <section className="mx-auto w-full max-w-3xl pt-24 sm:pt-32">
        <div
          className="rounded-2xl border p-8 text-center sm:p-12"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: GLASS_CARD_BG,
          }}
        >
          <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
            Ready to see what your website is really costing you?
          </h2>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#scan-form"
              className="inline-flex w-full items-center justify-center rounded-full px-7 py-3.5 font-display text-sm font-semibold text-white transition-opacity hover:opacity-95 sm:w-auto sm:text-base"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #3b82f6, #0891b2)",
                boxShadow: "0 6px 20px rgba(59,130,246,0.25)",
              }}
            >
              Scan My Website Free
            </a>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-full border px-7 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:border-white/20 sm:w-auto sm:text-base"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(10,12,18,0.45)",
              }}
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 - Footer line */}
      <footer className="mx-auto w-full max-w-5xl pt-20 sm:pt-28">
        <p
          className="text-center text-xs uppercase tracking-[0.25em]"
          style={{ color: "#6b7280" }}
        >
          Powered by DBJ Technologies
        </p>
      </footer>
    </div>
  );
}
