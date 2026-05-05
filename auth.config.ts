import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { headers } from "next/headers";
import { writeAdminAudit } from "@/lib/auth/audit";
import { resolveAccess } from "@/lib/auth/access";

/* Edge-safe Auth.js config. Imported by both `auth.ts` (full app
 * runtime, used by route handlers + server components) and
 * `proxy.ts` (Edge runtime). Splitting the config keeps Node-only
 * code paths (Web Crypto is fine, but Resend SDK + node:crypto are
 * not) out of the middleware bundle.
 *
 * What lives here vs. in auth.ts:
 *   here   -> providers, session strategy, pages, signIn/jwt/session
 *             callbacks (must be edge-safe). The signIn allowlist gate
 *             also lives here so middleware-decoded JWTs already carry
 *             the role + isAdmin flags the gate checks.
 *   auth.ts -> events (signIn audit + new-device email, signOut audit).
 *             Events run only in route-handler context, which is Node;
 *             keeping them out of auth.config means middleware never
 *             bundles Resend/etc.
 */
async function readRequestContext(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ip = fwd ? fwd.split(",")[0]!.trim() : h.get("x-real-ip");
    return { ip: ip ?? null, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  trustHost: true,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = (profile?.email ?? user?.email ?? "").toLowerCase().trim();
      if (!email) return false;

      const grant = await resolveAccess(email);
      if (grant) return true;

      /* Audit write is best-effort; never let a logging failure
       * mask the actual denial reason or 500 the callback. */
      try {
        const { ip, userAgent } = await readRequestContext();
        await writeAdminAudit({
          email: email || null,
          event: "signin.denied",
          result: "denied",
          ip,
          userAgent,
          metadata: { reason: "not_in_allowlist" },
        });
      } catch (err) {
        console.error("[auth signIn callback] audit write failed:", err);
      }
      return false;
    },
    async jwt({ token, user, profile, trigger }) {
      const email = (
        token.email ??
        profile?.email ??
        user?.email ??
        ""
      )
        .toLowerCase()
        .trim();
      if (!email) return token;
      token.email = email;

      /* Resolve role only at sign-in time. The signIn callback already
       * gated entry; we just need to know which role to stamp into the
       * token. Subsequent JWT refreshes trust the previously-stamped
       * value so neither callback re-hits the database. */
      if (trigger === "signIn" || user || token.role === undefined) {
        const grant = await resolveAccess(email);
        if (grant) {
          token.role = grant.role;
          token.isAdmin = grant.role === "admin";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email;
        if (token.role === "admin" || token.role === "client") {
          session.user.role = token.role;
          session.user.isAdmin = token.role === "admin";
        } else if (token.isAdmin === true) {
          /* Pre-Stage-6 admin JWT cutover: tokens issued before the
           * role field existed had isAdmin=true and were definitionally
           * admins. Treat them as such until the cookie expires. New
           * JWTs always carry an explicit role. */
          session.user.role = "admin";
          session.user.isAdmin = true;
        }
        /* If neither branch fires, role + isAdmin stay unset and the
         * middleware + layout gates will treat the request as
         * unauthenticated. Safer than defaulting to admin. */
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
