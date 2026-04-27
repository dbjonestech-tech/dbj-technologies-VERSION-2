import type { Metadata } from "next";
import { auth } from "@/auth";
import { getAllowlistSize } from "@/lib/auth/allowlist";
import {
  classifyInvitation,
  listAdminUsers,
  listInvitations,
} from "@/lib/auth/users";
import {
  disableAdminUserAction,
  inviteAdminAction,
  reactivateAdminUserAction,
  revokeInvitationAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false, nocache: true },
};

type Flash = {
  message: string;
  tone: "success" | "error" | "warn";
} | null;

function pickFlash(
  raw: Record<string, string | string[] | undefined>
): Flash {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  if (get("error")) {
    return { message: String(get("error")), tone: "error" };
  }
  if (get("sent")) {
    const delivery = get("delivery");
    if (delivery === "failed") {
      return {
        message: `Invitation row created for ${get("sent")} but the email did not send. Copy the link from the table below and share it manually.`,
        tone: "warn",
      };
    }
    return {
      message: `Invitation sent to ${get("sent")}.`,
      tone: "success",
    };
  }
  if (get("revoked")) {
    return { message: "Invitation revoked.", tone: "success" };
  }
  if (get("disabled")) {
    return {
      message: `${get("disabled")} disabled.`,
      tone: "success",
    };
  }
  if (get("reactivated")) {
    return {
      message: `${get("reactivated")} reactivated.`,
      tone: "success",
    };
  }
  return null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) {
    const future = Math.abs(ms);
    if (future < 3_600_000) return `in ${Math.floor(future / 60_000)}m`;
    if (future < 86_400_000) return `in ${Math.floor(future / 3_600_000)}h`;
    return `in ${Math.floor(future / 86_400_000)}d`;
  }
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function inviteStateBadge(state: string): { className: string; label: string } {
  if (state === "valid")
    return {
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      label: "open",
    };
  if (state === "expired")
    return {
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
      label: "expired",
    };
  if (state === "used")
    return {
      className: "bg-zinc-100 text-zinc-600 ring-zinc-600/20",
      label: "used",
    };
  if (state === "revoked")
    return {
      className: "bg-zinc-100 text-zinc-500 ring-zinc-600/20",
      label: "revoked",
    };
  return {
    className: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
    label: state,
  };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flash = pickFlash(raw);
  const [session, adminUsers, invitations] = await Promise.all([
    auth(),
    listAdminUsers(),
    listInvitations(),
  ]);
  const myEmail = session?.user?.email?.toLowerCase() ?? "";
  const envAllowlistSize = getAllowlistSize();
  const openInvites = invitations.filter(
    (i) => classifyInvitation(i) === "valid"
  ).length;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Users
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Invite collaborators by email. They sign in with Google and
            land on the admin shell. The ADMIN_EMAILS env list remains
            the bootstrap fallback so a database outage cannot lock you
            out.
          </p>
        </header>

        {flash ? <FlashBanner flash={flash} /> : null}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Bootstrap admins (env)"
            value={String(envAllowlistSize)}
          />
          <Stat label="Invited admins" value={String(adminUsers.length)} />
          <Stat
            label="Open invitations"
            value={String(openInvites)}
            tone={openInvites > 0 ? "accent" : "default"}
          />
          <Stat
            label="Disabled"
            value={String(
              adminUsers.filter((u) => u.status === "disabled").length
            )}
            tone="muted"
          />
        </section>

        <InviteCard />

        <InvitedAdminsCard users={adminUsers} myEmail={myEmail} />

        <InvitationsCard invitations={invitations} />
      </div>
    </div>
  );
}

function FlashBanner({ flash }: { flash: NonNullable<Flash> }) {
  const className =
    flash.tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : flash.tone === "warn"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-800 border-red-200";
  return (
    <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${className}`}>
      {flash.message}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "accent";
}) {
  const valueClass =
    tone === "muted"
      ? "text-zinc-500"
      : tone === "accent"
        ? "text-emerald-700"
        : "text-zinc-900";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function InviteCard() {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Invite an admin
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Sends a 7-day expiring link. The invitee must sign in with the
          Google account at this exact email address.
        </p>
      </header>
      <form
        action={inviteAdminAction}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-1 flex-col gap-1 sm:max-w-md">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="name@domain.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Send invitation
        </button>
      </form>
    </section>
  );
}

function InvitedAdminsCard({
  users,
  myEmail,
}: {
  users: Awaited<ReturnType<typeof listAdminUsers>>;
  myEmail: string;
}) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Invited admins
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Accounts added through the invitation flow. Bootstrap admins
          (those in the ADMIN_EMAILS env var) are not listed here, they
          live only in environment configuration.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Invited by</th>
              <th className="px-3 py-2 font-semibold">Accepted</th>
              <th className="px-3 py-2 font-semibold">Last sign-in</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-sm text-zinc-500"
                >
                  No invited admins yet. Use the form above to send an invite.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.email} className="border-t border-zinc-100">
                  <td className="px-3 py-3 font-mono text-xs text-zinc-900">
                    {u.email}
                  </td>
                  <td className="px-3 py-3">
                    {u.status === "active" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-600/20">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-600">
                    {u.invited_by ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600">
                    {formatAbsolute(u.accepted_at)}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600">
                    {formatRelative(u.last_signin_at)}
                  </td>
                  <td className="px-3 py-3">
                    {u.email === myEmail ? (
                      <span className="text-xs text-zinc-400">you</span>
                    ) : u.status === "active" ? (
                      <form action={disableAdminUserAction}>
                        <input type="hidden" name="email" value={u.email} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-zinc-700 hover:text-red-700 hover:underline"
                        >
                          Disable
                        </button>
                      </form>
                    ) : (
                      <form action={reactivateAdminUserAction}>
                        <input type="hidden" name="email" value={u.email} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-zinc-700 hover:text-emerald-700 hover:underline"
                        >
                          Reactivate
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvitationsCard({
  invitations,
}: {
  invitations: Awaited<ReturnType<typeof listInvitations>>;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbjtechnologies.com";
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Invitations
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Recent 200 invitations across all states. Open invitations can
          be revoked. Used and expired invitations stay for audit
          history.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Invitee</th>
              <th className="px-3 py-2 font-semibold">State</th>
              <th className="px-3 py-2 font-semibold">Invited by</th>
              <th className="px-3 py-2 font-semibold">Sent</th>
              <th className="px-3 py-2 font-semibold">Expires</th>
              <th className="px-3 py-2 font-semibold">Link / action</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-sm text-zinc-500"
                >
                  No invitations have been sent.
                </td>
              </tr>
            ) : (
              invitations.map((i) => {
                const state = classifyInvitation(i);
                const badge = inviteStateBadge(state);
                const acceptUrl = `${siteUrl}/invite/${i.token}`;
                return (
                  <tr key={i.token} className="border-t border-zinc-100 align-top">
                    <td className="px-3 py-3 font-mono text-xs text-zinc-900">
                      {i.email}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-600">
                      {i.invited_by}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-600">
                      {formatRelative(i.created_at)}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-600">
                      {state === "valid"
                        ? formatRelative(i.expires_at)
                        : formatAbsolute(i.expires_at)}
                    </td>
                    <td className="px-3 py-3">
                      {state === "valid" ? (
                        <div className="flex flex-col gap-2">
                          <details>
                            <summary className="cursor-pointer text-xs text-zinc-700 hover:text-zinc-900">
                              Show accept link
                            </summary>
                            <input
                              type="text"
                              readOnly
                              value={acceptUrl}
                              className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-700"
                            />
                          </details>
                          <form action={revokeInvitationAction}>
                            <input type="hidden" name="token" value={i.token} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-zinc-700 hover:text-red-700 hover:underline"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
