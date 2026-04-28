import Link from "next/link";
import { auth } from "@/auth";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Database,
  DollarSign,
  FileText,
  Filter,
  Globe,
  Mail,
  Search,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getDashboardStatus, type StatusLevel } from "@/lib/services/health-status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Card = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const COLUMNS: { label: string; cards: Card[] }[] = [
  {
    label: "Today",
    cards: [
      {
        label: "Visitors",
        description: "Live presence, top pages, sources, geography, devices.",
        href: "/admin/visitors",
        icon: Globe,
      },
      {
        label: "Monitor",
        description: "Funnel, severity counts, Lighthouse trend, live event tail.",
        href: "/admin/monitor",
        icon: Activity,
      },
      {
        label: "Scans",
        description: "Filterable table of every Pathlight scan with status and revenue range.",
        href: "/admin/scans",
        icon: FileText,
      },
      {
        label: "Leads",
        description: "Pathlight scan signups and contact-form submissions side by side.",
        href: "/admin/leads",
        icon: Mail,
      },
    ],
  },
  {
    label: "Acquisition",
    cards: [
      {
        label: "Funnel",
        description: "Sessions to scans to contacts. Sankey + cohort retention.",
        href: "/admin/funnel",
        icon: Filter,
      },
      {
        label: "Search",
        description: "Top queries, top pages, opportunities (high impressions, mid position).",
        href: "/admin/search",
        icon: Search,
      },
      {
        label: "RUM",
        description: "Real-user Core Web Vitals. p75 / p95 LCP, INP, CLS by page and device.",
        href: "/admin/performance/rum",
        icon: Zap,
      },
      {
        label: "Email",
        description: "Deliverability KPIs by type. Bounce + complaint rate alerts.",
        href: "/admin/email",
        icon: Mail,
      },
    ],
  },
  {
    label: "Health & operations",
    cards: [
      {
        label: "Costs",
        description: "Provider spend, per-operation totals, top scans by cost.",
        href: "/admin/costs",
        icon: DollarSign,
      },
      {
        label: "Pipeline",
        description: "Inngest run history, p50 / p95 / p99 by function, failure rate.",
        href: "/admin/pipeline",
        icon: Workflow,
      },
      {
        label: "Platform",
        description: "Vercel deployments, build durations, function metrics.",
        href: "/admin/platform",
        icon: Server,
      },
      {
        label: "Errors",
        description: "Top unresolved Sentry issues from the trailing 24 hours.",
        href: "/admin/errors",
        icon: AlertTriangle,
      },
      {
        label: "Infrastructure",
        description: "TLS, WHOIS, MX, SPF, DKIM, DMARC checks per managed domain.",
        href: "/admin/infrastructure",
        icon: Wifi,
      },
      {
        label: "Database",
        description: "Row counts and recent activity by table.",
        href: "/admin/database",
        icon: Database,
      },
      {
        label: "Clients",
        description: "Engagement clients, projects, deliverables. Drives the /portal.",
        href: "/admin/clients",
        icon: Briefcase,
      },
    ],
  },
];

const ACCOUNT_CARDS: Card[] = [
  {
    label: "Audit log",
    description: "Sign-in attempts, allowlist denials, protected-route access.",
    href: "/admin/audit",
    icon: ShieldCheck,
  },
  {
    label: "Users",
    description: "Invite admins. Bootstrap allowlist plus DB-backed members.",
    href: "/admin/users",
    icon: Users,
  },
];

function statusBadgeClass(level: StatusLevel): string {
  if (level === "red") return "bg-red-50 text-red-700 border-red-200";
  if (level === "yellow") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default async function AdminLanding() {
  const [session, status] = await Promise.all([auth(), getDashboardStatus()]);
  const firstName = session?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            One cockpit for visitors, conversions, Pathlight, costs,
            pipeline health, and infrastructure. The status bar below
            reflects the worst-of every signal -- green is good.
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusBadgeClass(status.level)}`}
              >
                ● {status.level === "green" ? "All systems normal" : status.level === "yellow" ? "Warning" : "Action needed"}
              </span>
              <span className="text-xs text-zinc-500">
                Computed across deployments, pipeline, budget, infra, errors, and RUM.
              </span>
            </div>
          </div>
          {status.reasons.length > 0 && status.level !== "green" && (
            <ul className="mt-4 space-y-1.5">
              {status.reasons
                .filter((r) => r.level !== "green")
                .map((reason, i) => (
                  <li
                    key={`${reason.area}-${i}`}
                    className="flex items-baseline gap-3 text-xs"
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${reason.level === "red" ? "bg-red-500" : "bg-amber-500"}`}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {reason.area}
                    </span>
                    <span className="text-zinc-700">{reason.message}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Column key={col.label} label={col.label} cards={col.cards} />
          ))}
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Account
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ACCOUNT_CARDS.map((card) => (
              <CardLink key={card.href} card={card} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Column({ label, cards }: { label: string; cards: Card[] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <CardLink key={card.href} card={card} />
        ))}
      </div>
    </div>
  );
}

function CardLink({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: "rgba(8, 145, 178, 0.08)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "#0891b2" }} aria-hidden="true" />
        </span>
      </div>
      <h2 className="font-display text-base font-semibold text-zinc-900">
        {card.label}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
        {card.description}
      </p>
    </Link>
  );
}
