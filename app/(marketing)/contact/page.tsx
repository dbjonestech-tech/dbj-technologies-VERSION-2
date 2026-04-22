import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start your next engagement with DBJ Technologies in Dallas, TX. Share your project goals and I will respond within one business day with a detailed scope and fixed-price plan.",
  alternates: { canonical: "https://dbjtechnologies.com/contact" },
  openGraph: {
    title: "Contact | DBJ Technologies",
    description:
      "Get in touch with DBJ Technologies. I respond to every inquiry within one business day with a scoped plan, clear timeline, and fixed-price proposal.",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
