import { SITE, SERVICES, SOCIAL_LINKS } from "@/lib/constants";

interface JsonLdProps {
  type?:
    | "organization"
    | "localBusiness"
    | "website"
    | "faq"
    | "service"
    | "serviceItem"
    | "creativeWork"
    | "offer"
    | "breadcrumb";
  faqItems?: { question: string; answer: string }[];
  service?: { slug: string; name: string; description: string };
  creativeWork?: {
    slug: string;
    name: string;
    description: string;
    image?: string;
    category?: string;
  };
  offer?: { slug: string; name: string; description: string; price: string };
  breadcrumb?: { name: string; url: string }[];
}

/* Parse the leading numeric value out of a price string.
   Handles "$4,500", "Starting at $15,000", "$299/month", "$175/hour". */
function parsePriceUSD(price: string): string | null {
  const match = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

const provider = {
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
};

export function JsonLd({
  type = "organization",
  faqItems,
  service,
  creativeWork,
  offer,
  breadcrumb,
}: JsonLdProps) {
  const schemas: Record<string, object | null> = {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/dbj_logo_horizontal.svg`,
      description: SITE.description,
      email: SITE.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dallas",
        addressRegion: "TX",
        addressCountry: "US",
      },
      sameAs: SOCIAL_LINKS.map((link) => link.href),
    },
    localBusiness: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      email: SITE.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dallas",
        addressRegion: "TX",
        addressCountry: "US",
      },
      sameAs: SOCIAL_LINKS.map((link) => link.href),
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
          provider,
        },
      })),
    },
    serviceItem: service
      ? {
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.name,
          description: service.description,
          url: `${SITE.url}/services/${service.slug}`,
          serviceType: service.name,
          provider,
          areaServed: {
            "@type": "Country",
            name: "United States",
          },
        }
      : null,
    creativeWork: creativeWork
      ? {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: creativeWork.name,
          description: creativeWork.description,
          url: `${SITE.url}/work/${creativeWork.slug}`,
          ...(creativeWork.image
            ? {
                image: creativeWork.image.startsWith("http")
                  ? creativeWork.image
                  : `${SITE.url}${creativeWork.image}`,
              }
            : {}),
          ...(creativeWork.category ? { about: creativeWork.category } : {}),
          creator: provider,
        }
      : null,
    offer: offer
      ? {
          "@context": "https://schema.org",
          "@type": "Offer",
          name: offer.name,
          description: offer.description,
          url: `${SITE.url}/pricing/${offer.slug}`,
          ...(parsePriceUSD(offer.price)
            ? {
                price: parsePriceUSD(offer.price),
                priceCurrency: "USD",
              }
            : {}),
          category: "Service",
          seller: provider,
        }
      : null,
    breadcrumb: breadcrumb
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumb.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b.name,
            item: b.url,
          })),
        }
      : null,
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
