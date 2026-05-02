/* Client-safe API token types + constants. The server-side
 * lib/canopy/api-tokens.ts imports `crypto` (Node-only); pulling
 * SCOPES / ApiTokenRow from there into a "use client" component
 * crashes the client build. This file holds the pure data so the
 * UI can import it cleanly. */

export type Scope = "read" | "write";

export const SCOPES: readonly Scope[] = ["read", "write"];

export interface ApiTokenRow {
  id: number;
  user_email: string;
  name: string;
  prefix: string;
  scopes: Scope[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}
