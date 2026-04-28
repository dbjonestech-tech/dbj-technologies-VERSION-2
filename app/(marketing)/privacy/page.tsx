import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "DBJ Technologies privacy policy. How contact form submissions are collected, used, and protected, plus details on encryption, cookies, analytics, third-party services, and your rights.",
  alternates: { canonical: "https://dbjtechnologies.com/privacy" },
  openGraph: {
    title: "Privacy Policy | DBJ Technologies",
    description:
      "How DBJ Technologies collects, uses, stores, and protects your information. Transparent practices, encrypted transmission, consent-gated analytics, and clearly defined user rights.",
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
            <p>This website uses essential cookies required for site functionality and analytics cookies set by Google Analytics when you accept the cookie banner. No third-party advertising cookies are used. See the Analytics section below for opt-out details.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">5. Analytics</h2>
            <p>I use Google Analytics to understand how visitors find and use this site, including traffic sources, pages visited, device type, and approximate geographic region. Google Analytics uses cookies to collect anonymous usage data, and IP addresses are anonymized before they reach Google. No personally identifiable information is shared with Google.</p>
            <p className="mt-3">You can opt out by clicking Decline on the cookie banner, by clearing the consent value from your browser storage, or by installing Google&apos;s official opt-out browser add-on at <a href="https://tools.google.com/dlpage/gaoptout" className="text-accent-blue hover:underline" rel="noopener noreferrer" target="_blank">tools.google.com/dlpage/gaoptout</a>. I also use Vercel Speed Insights, which is a separate, cookieless performance measurement tool that records anonymous page load timings without tracking individuals.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">6. Third-Party Services</h2>
            <p>DBJ Technologies may use third-party services for hosting (Vercel), email delivery (Resend), and analytics (Google Analytics, Vercel Speed Insights). These providers have their own privacy policies and may process data in accordance with their terms.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal information at any time by contacting DBJ Technologies through the form on the <a href="/contact" className="text-accent-blue hover:underline">Contact page</a>. A response will be provided within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p>This privacy policy may be updated from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">9. Contact</h2>
            <p>If you have questions about this privacy policy, please reach out through the form on the <a href="/contact" className="text-accent-blue hover:underline">Contact page</a>.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
