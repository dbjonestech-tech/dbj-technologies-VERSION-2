import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "DBJ Technologies terms of service. Engagement scope, payment terms, intellectual property transfer, client responsibilities, limitation of liability, and Texas governing law.",
  openGraph: {
    title: "Terms of Service | DBJ Technologies",
    description:
      "The terms governing DBJ Technologies engagements: services, payment, IP transfer, client responsibilities, limitation of liability, termination, and Texas governing law.",
  },
};

export default function TermsPage() {
  return (
    <article className="relative pt-40 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="font-display text-section font-bold leading-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-text-muted mb-12">Last updated: April 2026</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the DBJ Technologies website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use the services.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">2. Services</h2>
            <p>DBJ Technologies provides web development, design, cloud infrastructure, and related technology services. Specific deliverables, timelines, and pricing are defined in individual project agreements.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">3. Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and code, is the property of DBJ Technologies unless otherwise stated. Client deliverables are transferred to the client upon full payment as specified in the project agreement.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">4. Client Responsibilities</h2>
            <p>Clients are responsible for providing accurate project requirements, timely feedback, and necessary content or assets. Delays caused by incomplete or late client deliverables may affect project timelines.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">5. Payment Terms</h2>
            <p>Payment terms are specified in individual project agreements. Standard terms require 50% upfront and 50% upon project completion. Late payments may incur additional fees as outlined in the agreement.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>DBJ Technologies shall not be liable for any indirect, incidental, or consequential damages arising from the use of its services. Total liability shall not exceed the amount paid by the client for the specific service in question.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">7. Termination</h2>
            <p>Either party may terminate a project engagement with written notice as specified in the project agreement. Work completed up to the date of termination will be billed accordingly.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">8. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Texas, United States. Any disputes shall be resolved in the courts of Dallas County, Texas.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">9. Contact</h2>
            <p>Questions about these terms can be directed to DBJ Technologies through the form on the <a href="/contact" className="text-accent-blue hover:underline">Contact page</a>.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
