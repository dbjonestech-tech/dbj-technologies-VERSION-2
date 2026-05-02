/* Client-safe RBAC types and constants. Pure data - no Node /
 * server imports - so client components can import ROLES /
 * ROLE_LABELS / Role without dragging next/headers + the auth
 * module into the browser bundle. The server-side helpers
 * (getSessionRole, requireRole, listAdminUsers) live in rbac.ts. */

export type Role = "admin" | "manager" | "sales" | "viewer";

export const ROLES: readonly Role[] = ["admin", "manager", "sales", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  viewer: "Viewer",
};

const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  manager: 2,
  sales: 1,
  viewer: 0,
};

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
