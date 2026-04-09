import { SITE, SERVICES, SOCIALS } from "@/lib/constants";

interface JsonLdProps {
  type?: "organization" | "localBusiness" | "website" | "faq" | "service";
  faqItems?: { question: string; answer: string }[];
}

export function JsonLd({ type = "organization", faqItems }: JsonLdProps) {
  const sameAs = SOCIALS.map((s) => s.href);

  const schemas: Record<string, object> = {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/dbj_logo_horizontal.svg`,
      description: SITE.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dallas",
        addressRegion: "TX",
        addressCountry: "US",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SITE.email,
      },
      ...(sameAs.length > 0 && { sameAs }),
    },
    localBusiness: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: SITE.name,
      url: SITE.url,
      email: SITE.email,
      description: SITE.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dallas",
        addressRegion: "TX",
        addressCountry: "US",
      },
      priceRange: "$$$$",
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Web Development Services",
        itemListElement: SERVICES.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.title,
            description: s.tagline,
          },
        })),
      },
    },
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/faq?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (faqItems || []).map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    service: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Web Development Services",
      itemListElement: SERVICES.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Service",
          name: s.title,
          description: s.description,
          provider: {
            "@type": "Organization",
            name: SITE.name,
          },
        },
      })),
    },
  };

  const schema = schemas[type];
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
