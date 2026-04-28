import type { Metadata } from "next";
import Link from "next/link";
import { getClientStats, listClients } from "@/lib/auth/clients";
import {
  archiveClientAction,
  inviteClientAction,
  reactivateClientAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Clients",
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
    if (get("delivery") === "failed") {
      return {
        message: `Client row created for ${get("sent")} but the invitation email did not send. Open the client and copy the accept link from /admin/users.`,
        tone: "warn",
      };
    }
    return { message: `Invitation sent to ${get("sent")}.`, tone: "success" };
  }
  if (get("archived")) {
    return { message: `${get("archived")} archived.`, tone: "success" };
  }
  if (get("reactivated")) {
    return { message: `${get("reactivated")} reactivated.`, tone: "success" };
  }
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 2_592_000_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return `${Math.floor(ms / 2_592_000_000)}mo ago`;
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flash = pickFlash(raw);
  const [stats, clients] = await Promise.all([
    getClientStats(),
    listClients(),
  ]);
  const active = clients.filter((c) => c.status === "active");
  const archived = clients.filter((c) => c.status === "archived");

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Operations
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Clients
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Invite engagement clients to the white-glove portal. Each
            client gets a private project dashboard, deliverables vault,
            and Pathlight scan history scoped to their email.
          </p>
        </header>

        {flash ? <FlashBanner flash={flash} /> : null}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active clients" value={String(stats.activeClients)} />
          <Stat label="Total clients" value={String(stats.totalClients)} />
          <Stat
            label="Active projects"
            value={String(stats.activeProjects)}
            tone="accent"
          />
          <Stat
            label="Completed projects"
            value={String(stats.completedProjects)}
            tone="muted"
          />
        </section>

        <InviteCard />

        <ClientsTable clients={active} kind="active" />
        {archived.length > 0 ? (
          <ClientsTable clients={archived} kind="archived" />
        ) : null}
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
          Invite a client
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Sends a 7-day invitation. Name and company are optional but
          appear in the portal once the client accepts.
        </p>
      </header>
      <form
        action={inviteClientAction}
        className="grid gap-3 sm:grid-cols-3 sm:items-end"
      >
        <Field label="Email" required>
          <input
            type="email"
            name="email"
            required
            placeholder="name@domain.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Name">
          <input
            type="text"
            name="name"
            placeholder="First Last"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            name="company"
            placeholder="Company name"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Send invitation
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function ClientsTable({
  clients,
  kind,
}: {
  clients: Awaited<ReturnType<typeof listClients>>;
  kind: "active" | "archived";
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 bg-zinc-50 px-6 py-3">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          {kind === "active" ? "Active clients" : "Archived"}
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Name / Company</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3 font-semibold">Last sign-in</th>
              <th className="px-6 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-zinc-500"
                >
                  {kind === "active"
                    ? "No active clients yet. Use the form above to invite one."
                    : "No archived clients."}
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.email} className="border-t border-zinc-100">
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/clients/${encodeURIComponent(c.email)}`}
                      className="font-mono text-xs text-blue-700 hover:underline"
                    >
                      {c.email}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="text-zinc-900">{c.name ?? "(no name)"}</div>
                    <div className="text-xs text-zinc-500">
                      {c.company ?? "(no company)"}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-zinc-600">
                    {formatDate(c.accepted_at)}
                  </td>
                  <td className="px-6 py-3 text-xs text-zinc-600">
                    {formatRelative(c.last_signin_at)}
                  </td>
                  <td className="px-6 py-3">
                    {c.status === "active" ? (
                      <form action={archiveClientAction}>
                        <input type="hidden" name="email" value={c.email} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-zinc-700 hover:text-red-700 hover:underline"
                        >
                          Archive
                        </button>
                      </form>
                    ) : (
                      <form action={reactivateClientAction}>
                        <input type="hidden" name="email" value={c.email} />
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
