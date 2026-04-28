import fs from "node:fs";
import path from "node:path";

export interface BlueprintMeta {
  title: string;
  slug: string;
  template: string;
  headline: string;
  summary: string;
  vertical: string;
  thumbnail: string;
  paletteAccent: string;
}

export interface BlueprintSection {
  heading: string;
  paragraphs: string[];
}

export interface BlueprintData extends BlueprintMeta {
  sections: BlueprintSection[];
}

const BLUEPRINTS_DIR = path.join(process.cwd(), "docs", "blueprints");

const BLUEPRINT_INDEX: Array<
  Pick<BlueprintMeta, "slug" | "vertical" | "thumbnail" | "paletteAccent"> & {
    file: string;
  }
> = [
  {
    slug: "dental-practice",
    file: "dental-practice.md",
    vertical: "Dental Practice",
    thumbnail: "/templates/images/people/dental-dentist.jpg",
    paletteAccent: "#146C94",
  },
  {
    slug: "med-spa",
    file: "med-spa.md",
    vertical: "Med Spa",
    thumbnail: "/templates/images/med-spa-hero.jpg",
    paletteAccent: "#8B5A6B",
  },
  {
    slug: "upscale-restaurant",
    file: "upscale-restaurant.md",
    vertical: "Upscale Restaurant",
    thumbnail: "/templates/images/restaurant-dish1.jpg",
    paletteAccent: "#C9A96E",
  },
  {
    slug: "financial-advisor",
    file: "financial-advisor.md",
    vertical: "Financial Advisor",
    thumbnail: "/templates/images/people/financial-advisor-1.jpg",
    paletteAccent: "#2D5F4A",
  },
  {
    slug: "pi-law",
    file: "pi-law.md",
    vertical: "Personal Injury Law",
    thumbnail: "/templates/images/pi-law-courthouse.jpg",
    paletteAccent: "#C9A961",
  },
  {
    slug: "real-estate",
    file: "real-estate.md",
    vertical: "Luxury Real Estate",
    thumbnail: "/templates/images/real-estate-hero.jpg",
    paletteAccent: "#B87333",
  },
  {
    slug: "luxury-home-builder",
    file: "luxury-home-builder.md",
    vertical: "Luxury Home Builder",
    thumbnail: "/templates/images/luxury-builders-hero.jpg",
    paletteAccent: "#7C856B",
  },
  {
    slug: "hvac-contractor",
    file: "hvac-contractor.md",
    vertical: "HVAC Contractor",
    thumbnail: "/templates/images/people/hvac-technician.jpg",
    paletteAccent: "#F97316",
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

function parseBody(body: string): BlueprintSection[] {
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

export function getBlueprintBySlug(slug: string): BlueprintData | null {
  const idx = BLUEPRINT_INDEX.find((b) => b.slug === slug);
  if (!idx) return null;
  const filePath = path.join(BLUEPRINTS_DIR, idx.file);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const m = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
  if (!m) return null;
  const fm = parseFrontmatter(m[1]);
  const sections = parseBody(m[2]);
  return {
    slug: idx.slug,
    vertical: idx.vertical,
    thumbnail: idx.thumbnail,
    paletteAccent: idx.paletteAccent,
    title: fm.title || idx.vertical,
    template: fm.template || `${idx.slug}.html`,
    headline: fm.headline || "",
    summary: fm.summary || "",
    sections,
  };
}

export function getAllBlueprintMeta(): BlueprintMeta[] {
  return BLUEPRINT_INDEX.map((idx) => {
    const data = getBlueprintBySlug(idx.slug);
    if (!data) {
      return {
        slug: idx.slug,
        vertical: idx.vertical,
        thumbnail: idx.thumbnail,
        paletteAccent: idx.paletteAccent,
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

export function getAllBlueprintSlugs(): string[] {
  return BLUEPRINT_INDEX.map((b) => b.slug);
}
