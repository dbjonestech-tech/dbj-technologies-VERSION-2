import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start your next engagement with DBJ Technologies. Share your goals and I will respond within 24 hours with a plan.",
  openGraph: {
    title: "Contact | DBJ Technologies",
    description:
      "Get in touch with DBJ Technologies. I respond to all inquiries within 24 hours.",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
