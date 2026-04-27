import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { headers } from "next/headers";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { writeAdminAudit } from "@/lib/auth/audit";

/* Edge-safe Auth.js config. Imported by both `auth.ts` (full app
 * runtime, used by route handlers + server components) and
 * `middleware.ts` (Edge runtime). Splitting the config keeps Node-only
 * code paths — Web Crypto is fine, but Resend SDK + node:crypto are
 * not — out of the middleware bundle.
 *
 * What lives here vs. in auth.ts:
 *   here   -> providers, session strategy, pages, signIn/jwt/session
 *             callbacks (must be edge-safe). The signIn allowlist gate
 *             also lives here so middleware-decoded JWTs already carry
 *             the isAdmin flag the gate checks.
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
      if (!email || !isAdminEmail(email)) {
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
      }
      return true;
    },
    async jwt({ token, user, profile }) {
      const email = (
        token.email ??
        profile?.email ??
        user?.email ??
        ""
      )
        .toLowerCase()
        .trim();
      if (email) {
        token.email = email;
        token.isAdmin = isAdminEmail(email);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
