import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "DBJ Technologies privacy policy — how we collect, use, and protect your information.",
  openGraph: { title: "Privacy Policy | DBJ Technologies" },
};

export default function PrivacyPage() {
  return (
    <article className="relative pt-40 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="font-display text-section font-bold leading-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-muted mb-12">Last updated: April 2026</p>

        <div className="prose-invert space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p>When you use our contact form, we collect the information you provide: your name, email address, phone number (optional), company name (optional), project details, and budget range. We also collect standard server logs including IP address and browser type for security and analytics purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information you provide solely to respond to your inquiries, deliver our services, and communicate about your projects. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information, including encrypted data transmission (TLS/SSL), secure server infrastructure, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">4. Cookies</h2>
            <p>This website uses only essential cookies required for site functionality. We do not use tracking cookies or third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">5. Third-Party Services</h2>
            <p>We may use third-party services for hosting (Vercel), email delivery, and analytics. These providers have their own privacy policies and may process data in accordance with their terms.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal information at any time by contacting us at hello@dbjtechnologies.com. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">7. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-3">8. Contact</h2>
            <p>If you have questions about this privacy policy, contact us at <a href="mailto:hello@dbjtechnologies.com" className="text-accent-blue hover:underline">hello@dbjtechnologies.com</a>.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
