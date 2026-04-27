import NextAuth from "next-auth";
import { headers } from "next/headers";
import authConfig from "./auth.config";
import { isNewDevice, writeAdminAudit } from "@/lib/auth/audit";
import { deviceHash } from "@/lib/auth/device";
import { sendNewDeviceEmail } from "@/lib/auth/notify";
import { isAdminEmail } from "@/lib/auth/allowlist";
import {
  acceptInvitationFor,
  isAdminUser,
  updateLastSignin,
} from "@/lib/auth/users";

/* Full Auth.js v5 instance, used by route handlers, server components,
 * and server actions. Extends auth.config (edge-safe) with the events
 * hooks that touch Resend + audit-log writes. Middleware imports the
 * lean auth.config directly so this file's Node-leaning imports never
 * land in the Edge bundle. */
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async signIn({ user }) {
      /* Belt-and-suspenders: events fire after the OAuth callback has
       * authenticated. If anything in here throws, Auth.js surfaces it
       * as a 500 instead of completing the redirect. Every side effect
       * here is fire-and-forget so a failure cannot break sign-in. */
      try {
        const email = (user?.email ?? "").toLowerCase().trim();
        if (!email) return;
        const { ip, userAgent } = await readRequestContext();
        const hash = await deviceHash(ip, userAgent);
        const fresh = await isNewDevice({ email, deviceHash: hash });

        /* DB-side bookkeeping for non-env-allowlist users:
         *   - existing admin_users row -> bump last_signin_at
         *   - else -> consume any open invitation and create the row.
         * env-allowlist users (the bootstrap admin) skip both branches;
         * their identity lives only in process.env. */
        let acceptedInvitation = false;
        if (!isAdminEmail(email)) {
          if (await isAdminUser(email)) {
            await updateLastSignin(email);
          } else {
            acceptedInvitation = await acceptInvitationFor(email);
          }
        }

        await writeAdminAudit({
          email,
          event: "signin.success",
          result: "success",
          ip,
          userAgent,
          deviceHash: hash,
          metadata: { newDevice: fresh, acceptedInvitation },
        });
        if (fresh) {
          await sendNewDeviceEmail({ toEmail: email, ip, userAgent });
        }
      } catch (err) {
        console.error("[auth events.signIn] failed:", err);
      }
    },
    async signOut(message) {
      try {
        /* JWT strategy: signOut event payload is { token } shape. The
         * { session } branch only fires under a database adapter, which
         * we do not use. Narrow accordingly. */
        const email =
          "token" in message
            ? (message.token?.email as string | undefined) ?? null
            : null;
        const { ip, userAgent } = await readRequestContext();
        await writeAdminAudit({
          email: email ?? null,
          event: "signout",
          result: "success",
          ip,
          userAgent,
        });
      } catch (err) {
        console.error("[auth events.signOut] failed:", err);
      }
    },
  },
});
