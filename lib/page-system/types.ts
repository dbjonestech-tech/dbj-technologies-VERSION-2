import type {
  AccentDominance,
  Density,
  HeroVariant,
  ImageTreatment,
  LayoutArchetype,
  SectionBreak,
  Texture,
} from "./tokens";

export interface PageConfig {
  slug: string;
  title: string;
  description: string;
  archetype: LayoutArchetype;
  accent: AccentDominance;
  hero: HeroVariant;
  sectionBreak: SectionBreak;
  texture: Texture;
  density: Density;
  imageTreatment: ImageTreatment;
  cluster: string;
  pillar?: string;
  lastReviewed: string;
  nextReviewDue: string;
  sourcesCount?: number;
}

export interface SourceEntry {
  id: number;
  authors?: string;
  org?: string;
  year: number;
  title: string;
  publication?: string;
  url: string;
  doi?: string;
}
