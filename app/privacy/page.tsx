import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "DBJ Technologies privacy policy. How contact form submissions are collected, used, and protected, plus details on encryption, cookies, third-party services, and your rights.",
  openGraph: {
    title: "Privacy Policy | DBJ Technologies",
    description:
      "How DBJ Technologies collects, uses, stores, and protects your information. Transparent practices, encrypted transmission, zero tracking cookies, and clearly defined user rights.",
  },
};

export default function PrivacyPage() {
  return (
    <article className="relative pt-40 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="font-display text-section font-bold leading-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-muted mb-12">Last updated: April 2026</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">1. Information Collected</h2>
            <p>When you use the contact form, DBJ Technologies collects the information you provide: your name, email address, phone number (optional), company name (optional), project details, and budget range. Standard server logs including IP address and browser type are also collected for security and analytics purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">2. How Your Information Is Used</h2>
            <p>The information you provide is used solely to respond to your inquiries, deliver services, and communicate about your projects. DBJ Technologies does not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">3. Data Security</h2>
            <p>DBJ Technologies implements industry-standard security measures to protect your personal information, including encrypted data transmission (TLS/SSL), secure server infrastructure, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p>This website uses only essential cookies required for site functionality. No tracking cookies or third-party advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>DBJ Technologies may use third-party services for hosting (Vercel), email delivery, and analytics. These providers have their own privacy policies and may process data in accordance with their terms.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal information at any time by contacting dbjonestech@gmail.com. A response will be provided within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">7. Changes to This Policy</h2>
            <p>This privacy policy may be updated from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">8. Contact</h2>
            <p>If you have questions about this privacy policy, contact <a href="mailto:dbjonestech@gmail.com" className="text-accent-blue hover:underline">dbjonestech@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
