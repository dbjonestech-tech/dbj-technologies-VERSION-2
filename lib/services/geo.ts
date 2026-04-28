/**
 * Geo enrichment from Vercel edge headers.
 *
 * Vercel injects ISO country, region, city, and approximate lat/long
 * into every request automatically. Reading them costs nothing and
 * avoids the MaxMind license + monthly database refresh dance.
 *
 * Headers (case-insensitive):
 *   x-vercel-ip-country         ISO 3166-1 alpha-2 (e.g. "US")
 *   x-vercel-ip-country-region  Subdivision code (e.g. "TX")
 *   x-vercel-ip-city            City name, URL-encoded
 *   x-vercel-ip-latitude        Approximate centroid
 *   x-vercel-ip-longitude       Approximate centroid
 *
 * Local dev returns nothing for any of these. Callers must treat all
 * fields as optional.
 */

export type Geo = {
  country: string | null;
  region: string | null;
  city: string | null;
};

function readHeader(headers: Headers, name: string): string | null {
  const raw = headers.get(name);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed;
}

function decodeCity(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function extractGeo(headers: Headers): Geo {
  return {
    country: readHeader(headers, "x-vercel-ip-country"),
    region: readHeader(headers, "x-vercel-ip-country-region"),
    city: decodeCity(readHeader(headers, "x-vercel-ip-city")),
  };
}
