import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import {
  classifyInvitation,
  getInvitationByToken,
  type InvitationState,
} from "@/lib/auth/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept admin invitation",
  robots: { index: false, follow: false, nocache: true },
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const STATE_COPY: Record<
  InvitationState,
  { heading: string; body: string }
> = {
  valid: {
    heading: "You've been invited",
    body: "Accept the invitation by signing in with your Google account at the email below.",
  },
  expired: {
    heading: "This invitation has expired",
    body: "Invitations are valid for 7 days. Ask whoever sent it to issue a new one.",
  },
  used: {
    heading: "This invitation has already been used",
    body: "If that was you, sign in normally. If you didn't accept it, contact the inviter.",
  },
  revoked: {
    heading: "This invitation was revoked",
    body: "The inviter cancelled this invitation. Ask them to issue a new one if access was intended.",
  },
  missing: {
    heading: "Invitation not found",
    body: "Double-check the link in your email. If the link is correct, ask the inviter to send a new one.",
  },
};

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  /* Already signed in as an admin? The signIn callback handled access
   * during the OAuth round-trip and the events.signIn hook consumed
   * the invitation. Skip the landing page and send them straight in. */
  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  const invitation = await getInvitationByToken(token);
  const state = classifyInvitation(invitation);
  const copy = STATE_COPY[state];

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link
            href="/"
            aria-label="DBJ Technologies home"
            className="inline-flex items-center"
          >
            <Image
              src="/brand/dbj_logo_horizontal.svg"
              alt="DBJ Technologies"
              width={180}
              height={50}
              priority
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            {copy.heading}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {copy.body}
          </p>

          {state === "valid" && invitation ? (
            <>
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Sign in as
                </p>
                <p className="mt-1 font-mono text-sm text-zinc-900">
                  {invitation.email}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Invited by
                </p>
                <p className="mt-1 font-mono text-sm text-zinc-700">
                  {invitation.invited_by}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Expires
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  {formatExpiry(invitation.expires_at)}
                </p>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/admin" });
                }}
                className="mt-6"
              >
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891b2] focus-visible:ring-offset-2"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58Z"
                    />
                  </svg>
                  <span>Accept and sign in with Google</span>
                </button>
              </form>

              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                You must sign in with the exact email above. Signing in
                with a different Google account will be denied.
              </p>
            </>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/signin"
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                Go to sign-in
              </Link>
              <Link
                href="/"
                className="text-center text-xs text-zinc-500 transition-colors hover:text-zinc-900"
              >
                ← Back to dbjtechnologies.com
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
