import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { headers } from "next/headers";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { writeAdminAudit } from "@/lib/auth/audit";
import { hasValidInvitationFor, isAdminUser } from "@/lib/auth/users";

/* Edge-safe Auth.js config. Imported by both `auth.ts` (full app
 * runtime, used by route handlers + server components) and
 * `middleware.ts` (Edge runtime). Splitting the config keeps Node-only
 * code paths (Web Crypto is fine, but Resend SDK + node:crypto are
 * not) out of the middleware bundle.
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
      if (!email) {
        return false;
      }
      /* Three-source allow check, in cost order:
       *   1. ADMIN_EMAILS env (sync set lookup, the bootstrap path)
       *   2. admin_users (rows accepted via prior invitations)
       *   3. admin_invitations (open token for this email = first signin)
       * The invitation path lets the OAuth complete; the events.signIn
       * hook in auth.ts then consumes the invitation and writes the
       * admin_users row. */
      if (isAdminEmail(email)) return true;
      if (await isAdminUser(email)) return true;
      if (await hasValidInvitationFor(email)) return true;

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
      /* Set isAdmin only at sign-in time. The signIn callback already
       * gated entry through env, admin_users, or a valid invitation,
       * so any token reaching this point belongs to an admin. Avoid a
       * DB query on every session refresh by trusting the gate. */
      if (trigger === "signIn" || user || token.isAdmin === undefined) {
        token.isAdmin = true;
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
