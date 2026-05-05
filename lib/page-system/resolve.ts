import { pageRegistry } from "./registry";
import type { PageConfig } from "./types";

export function getPageConfig(slug: string): PageConfig | null {
  return pageRegistry[slug] ?? null;
}

export function listPagesByCluster(cluster: string): PageConfig[] {
  return Object.values(pageRegistry).filter((c) => c.cluster === cluster);
}
