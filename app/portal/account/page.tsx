import type { Metadata } from "next";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/actions";
import { getClient } from "@/lib/auth/clients";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false, nocache: true },
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalAccountPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const client = email ? await getClient(email) : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Profile
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            This is what I have on file for you. Need a change? Email me at{" "}
            <a
              href="mailto:joshua@dbjtechnologies.com"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
            >
              joshua@dbjtechnologies.com
            </a>{" "}
            and I will update it.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">{client?.name ?? "(not set)"}</Field>
            <Field label="Company">{client?.company ?? "(not set)"}</Field>
            <Field label="Email" mono>
              {email}
            </Field>
            <Field label="Member since">{formatDate(client?.accepted_at ?? null)}</Field>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Sign out
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sign out of this device. You can come back any time using the
            same Google account.
          </p>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={
          "mt-1 text-sm text-zinc-900" + (mono ? " font-mono text-xs" : "")
        }
      >
        {children}
      </dd>
    </div>
  );
}
