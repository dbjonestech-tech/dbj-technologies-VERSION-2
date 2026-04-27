import Link from "next/link";
import { auth } from "@/auth";
import { Activity, DollarSign, FileText, Mail, Users, Database, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const QUICK_LINKS: {
  label: string;
  description: string;
  href: string;
  icon: typeof Activity;
  status: "live" | "soon";
}[] = [
  {
    label: "Monitor",
    description: "Funnel, severity counts, Lighthouse trends, live event tail.",
    href: "/admin/monitor",
    icon: Activity,
    status: "live",
  },
  {
    label: "Cost dashboard",
    description: "Provider spend, per-operation totals, top scans by cost.",
    href: "/admin/costs",
    icon: DollarSign,
    status: "live",
  },
  {
    label: "Scans",
    description: "Filterable table of every scan with status and revenue range.",
    href: "/admin/scans",
    icon: FileText,
    status: "live",
  },
  {
    label: "Leads",
    description: "Pathlight scan signups and contact-form submissions side by side.",
    href: "/admin/leads",
    icon: Mail,
    status: "live",
  },
  {
    label: "Database",
    description: "Row counts and recent activity by table.",
    href: "/admin/database",
    icon: Database,
    status: "live",
  },
  {
    label: "Audit log",
    description: "Sign-in attempts, allowlist denials, and protected-route access.",
    href: "/admin/audit",
    icon: ShieldCheck,
    status: "live",
  },
  {
    label: "Users",
    description: "Admins and (eventually) client portal accounts.",
    href: "/admin/users",
    icon: Users,
    status: "soon",
  },
];

export default async function AdminLanding() {
  const session = await auth();
  const firstName = session?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Everything you need to operate dbjtechnologies.com and Pathlight.
            More surfaces are landing in the next few iterations; the cards
            marked &ldquo;soon&rdquo; are placeholders for what&apos;s coming.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            const isLive = link.status === "live";
            const className =
              "group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all" +
              (isLive
                ? " hover:border-zinc-300 hover:shadow-sm"
                : " cursor-not-allowed opacity-60");
            const inner = (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(8, 145, 178, 0.08)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#0891b2" }} aria-hidden="true" />
                  </span>
                  {!isLive ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Soon
                    </span>
                  ) : null}
                </div>
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  {link.label}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {link.description}
                </p>
              </>
            );
            if (!isLive) {
              return (
                <div key={link.href} className={className}>
                  {inner}
                </div>
              );
            }
            return (
              <Link key={link.href} href={link.href} className={className}>
                {inner}
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
