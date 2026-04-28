import fs from "node:fs";
import path from "node:path";

export interface DesignBriefMeta {
  title: string;
  slug: string;
  template: string;
  headline: string;
  summary: string;
  vertical: string;
  preview: string;
  paletteAccent: string;
  description: string;
  keySurfaces: string[];
}

export interface DesignBriefSection {
  heading: string;
  paragraphs: string[];
}

export interface DesignBriefData extends DesignBriefMeta {
  sections: DesignBriefSection[];
}

const BRIEFS_DIR = path.join(process.cwd(), "docs", "design-briefs");

const BRIEF_INDEX: Array<
  Pick<
    DesignBriefMeta,
    "slug" | "vertical" | "preview" | "paletteAccent" | "description" | "keySurfaces"
  > & {
    file: string;
  }
> = [
  {
    slug: "dental-practice",
    file: "dental-practice.md",
    vertical: "Dental Practice",
    preview: "/design-briefs/dental-practice.webp",
    paletteAccent: "#146C94",
    description:
      "How patients actually pick a dentist when a tooth chips on a Tuesday and the kids' six-month cleaning is overdue. The architecture that puts a dated new-patient price, a real insurance list, a Smile Plan membership, and a same-day emergency promise where the panicked search lands. Built for the DFW practice that wants the chair full every day of the week.",
    keySurfaces: [
      "Same-Day Emergency",
      "Smile Plan Membership",
      "Real Insurance List",
    ],
  },
  {
    slug: "med-spa",
    file: "med-spa.md",
    vertical: "Med Spa",
    preview: "/design-briefs/med-spa.webp",
    paletteAccent: "#8B5A6B",
    description:
      "How aesthetics patients actually evaluate a Highland Park practice during the four to twelve weeks between thinking about it and booking the consult. Per-unit pricing, a named board-certified Medical Director with NPI, a real before-and-after gallery, a society membership, and a HIPAA-grade footer. Trust architecture for a practice that books out the consult calendar.",
    keySurfaces: [
      "Per-Unit Pricing",
      "Named Medical Director",
      "Society Membership",
    ],
  },
  {
    slug: "upscale-restaurant",
    file: "upscale-restaurant.md",
    vertical: "Upscale Restaurant",
    preview: "/design-briefs/upscale-restaurant.webp",
    paletteAccent: "#C9A96E",
    description:
      "How diners decide between a Bishop Arts dining room and a Knox-Henderson one in the eighteen seconds they spend on your homepage. On-page menus dated this week, a separately branded bar program, two-room private dining with per-guest pricing, dated awards, and a sticky reservation that works on every page. The architecture that fills tables instead of describing the building.",
    keySurfaces: [
      "On-Page Dated Menu",
      "Two-Room Private Dining",
      "Sticky Reservation",
    ],
  },
  {
    slug: "financial-advisor",
    file: "financial-advisor.md",
    vertical: "Financial Advisor",
    preview: "/design-briefs/financial-advisor.webp",
    paletteAccent: "#2D5F4A",
    description:
      "How a Dallas family with eight figures of equity comp and a private business actually evaluates a fee-only fiduciary across a six-to-eighteen-month decision window. A signed first-person fiduciary pledge, a published tiered fee schedule, named custodian relationships, dated quarterly commentary, and a four-column compliance footer. Trust written as a structural disclosure document, not a brochure.",
    keySurfaces: [
      "Signed Fiduciary Pledge",
      "Published Fee Schedule",
      "Named Custodians",
    ],
  },
  {
    slug: "pi-law",
    file: "pi-law.md",
    vertical: "Personal Injury Law",
    preview: "/design-briefs/pi-law.webp",
    paletteAccent: "#C9A961",
    description:
      "How an injury victim finds a lawyer in the worst hour of their life, searching from the back of an Uber leaving a Central Expressway wreck. A 24/7 bilingual urgent strip, a same-day attorney callback promise, a verdicts ledger with case type and county, a 'what to do after an accident' lead magnet, and the State Bar of Texas advertising disclaimer where it belongs. The architecture that signs cases at midnight.",
    keySurfaces: [
      "24/7 Bilingual Strip",
      "Same-Day Attorney Callback",
      "Verdicts Ledger",
    ],
  },
  {
    slug: "real-estate",
    file: "real-estate.md",
    vertical: "Luxury Real Estate",
    preview: "/design-briefs/real-estate.webp",
    paletteAccent: "#B87333",
    description:
      "How a four-million-dollar Highland Park buyer actually vets the agent before they pick up the phone. A real Sold portfolio with addresses and the side represented, neighborhood notes that read like editorial, a private off-market list, a concierge offering described in detail, and a TREC-compliant footer. The personal practice site that earns the private call instead of routing it to a brokerage template.",
    keySurfaces: [
      "Sold Portfolio",
      "Off-Market Private List",
      "Concierge Offering",
    ],
  },
  {
    slug: "luxury-home-builder",
    file: "luxury-home-builder.md",
    vertical: "Luxury Home Builder",
    preview: "/design-briefs/luxury-home-builder.webp",
    paletteAccent: "#7C856B",
    description:
      "How a custom-home buyer in Volk Estates or Preston Hollow actually reviews a builder's portfolio across the six-to-eighteen-month commission cycle. Built homes credited to their architects, neighborhood-organized galleries, available inventory with status glyphs, dated AIA Dallas and D Home recognition, and a principal letter signed by the founder. The portfolio review the buyer is actually doing.",
    keySurfaces: [
      "Built Homes, Not Renderings",
      "Communities Grid",
      "Principal's Letter",
    ],
  },
  {
    slug: "hvac-contractor",
    file: "hvac-contractor.md",
    vertical: "HVAC Contractor",
    preview: "/design-briefs/hvac-contractor.webp",
    paletteAccent: "#F97316",
    description:
      "How a homeowner finds a contractor when the AC dies on a 105-degree Dallas-Fort Worth August afternoon. A tap-to-call phone as the loudest element, a 24/7 live-answer promise that is actually live, a Comfort Club membership, regional service-area zones (not SEO city pills), multi-modal contact, and a TACLA license number in the footer. The dispatch desk that fills the board in the heat dome.",
    keySurfaces: [
      "Tap-to-Call Hero",
      "Comfort Club Membership",
      "Service-Area Zones",
    ],
  },
];

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*"?([^"]*)"?\s*$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function parseBody(body: string): DesignBriefSection[] {
  const normalized = body.startsWith("## ") ? body : "\n" + body;
  const chunks = normalized.split(/\n## /).filter((c) => c.trim().length > 0);
  return chunks.map((chunk) => {
    const lines = chunk.split("\n");
    const heading = lines[0].replace(/^## /, "").trim();
    const rest = lines.slice(1).join("\n").trim();
    const paragraphs = rest
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return { heading, paragraphs };
  });
}

export function getDesignBriefBySlug(slug: string): DesignBriefData | null {
  const idx = BRIEF_INDEX.find((b) => b.slug === slug);
  if (!idx) return null;
  const filePath = path.join(BRIEFS_DIR, idx.file);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const m = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  if (!m) return null;
  const fm = parseFrontmatter(m[1]);
  const sections = parseBody(m[2]);
  return {
    slug: idx.slug,
    vertical: idx.vertical,
    preview: idx.preview,
    paletteAccent: idx.paletteAccent,
    description: idx.description,
    keySurfaces: idx.keySurfaces,
    title: fm.title || idx.vertical,
    template: fm.template || `${idx.slug}.html`,
    headline: fm.headline || "",
    summary: fm.summary || "",
    sections,
  };
}

export function getAllDesignBriefMeta(): DesignBriefMeta[] {
  return BRIEF_INDEX.map((idx) => {
    const data = getDesignBriefBySlug(idx.slug);
    if (!data) {
      return {
        slug: idx.slug,
        vertical: idx.vertical,
        preview: idx.preview,
        paletteAccent: idx.paletteAccent,
        description: idx.description,
        keySurfaces: idx.keySurfaces,
        title: idx.vertical,
        template: `${idx.slug}.html`,
        headline: "",
        summary: "",
      };
    }
    const { sections, ...meta } = data;
    void sections;
    return meta;
  });
}

export function getAllDesignBriefSlugs(): string[] {
  return BRIEF_INDEX.map((b) => b.slug);
}
