import type { AccentDominance } from "./tokens";

export interface AccentClasses {
  hex: string;
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  glow: string;
}

export const accentMap: Record<AccentDominance, AccentClasses> = {
  blue: {
    hex: "#3b82f6",
    text: "text-accent-blue",
    bg: "bg-accent-blue",
    bgSoft: "bg-accent-blue/5",
    border: "border-accent-blue/20",
    ring: "ring-accent-blue/20",
    glow: "shadow-glow-blue",
  },
  cyan: {
    hex: "#0891b2",
    text: "text-accent-cyan",
    bg: "bg-accent-cyan",
    bgSoft: "bg-accent-cyan/5",
    border: "border-accent-cyan/20",
    ring: "ring-accent-cyan/20",
    glow: "shadow-glow-cyan",
  },
  violet: {
    hex: "#7c3aed",
    text: "text-accent-violet",
    bg: "bg-accent-violet",
    bgSoft: "bg-accent-violet/5",
    border: "border-accent-violet/20",
    ring: "ring-accent-violet/20",
    glow: "shadow-glow-violet",
  },
  amber: {
    hex: "#d97706",
    text: "text-accent-amber",
    bg: "bg-accent-amber",
    bgSoft: "bg-accent-amber/5",
    border: "border-accent-amber/20",
    ring: "ring-accent-amber/20",
    glow: "shadow-glow-amber",
  },
};
