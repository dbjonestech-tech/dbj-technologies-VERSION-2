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
import { getDashboardKpis } from "@/lib/services/dashboard-kpis";
import DashboardCard, { type CardTheme } from "./DashboardCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Card = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type Column = {
  label: string;
  theme: CardTheme;
  cards: Card[];
};

const COLUMNS: Column[] = [
  {
    label: "Today",
    theme: "cyan",
    cards: [
      {
        label: "Visitors",
        description: "Who is on the site right now, what they read, and where they came from.",
        href: "/admin/visitors",
        icon: Globe,
      },
      {
        label: "Monitor",
        description: "Live event tail with funnel counts, severity, and Lighthouse trend.",
        href: "/admin/monitor",
        icon: Activity,
      },
      {
        label: "Scans",
        description: "Every Pathlight scan with status, score, and revenue range. Filterable.",
        href: "/admin/scans",
        icon: FileText,
      },
      {
        label: "Leads",
        description: "Pathlight scan signups and contact-form submissions, side by side.",
        href: "/admin/leads",
        icon: Mail,
      },
    ],
  },
  {
    label: "Acquisition",
    theme: "violet",
    cards: [
      {
        label: "Funnel",
        description: "How visitors flow from session to scan to contact, and where they drop off.",
        href: "/admin/funnel",
        icon: Filter,
      },
      {
        label: "Search",
        description: "Top Google queries and pages, plus pages worth optimizing for CTR.",
        href: "/admin/search",
        icon: Search,
      },
      {
        label: "RUM",
        description: "How fast pages actually load for real visitors, by page and device.",
        href: "/admin/performance/rum",
        icon: Zap,
      },
      {
        label: "Email",
        description: "Deliverability KPIs by email type, with bounce and complaint alerts.",
        href: "/admin/email",
        icon: Mail,
      },
    ],
  },
  {
    label: "Operations",
    theme: "amber",
    cards: [
      {
        label: "Costs",
        description: "Provider spend, per-operation totals, and the most expensive scans.",
        href: "/admin/costs",
        icon: DollarSign,
      },
      {
        label: "Database",
        description: "Row counts and recent activity for every Pathlight and admin table.",
        href: "/admin/database",
        icon: Database,
      },
      {
        label: "Clients",
        description: "Engagement clients, projects, and deliverables. Drives the client portal.",
        href: "/admin/clients",
        icon: Briefcase,
      },
      {
        label: "Audit log",
        description: "Sign-in attempts, allowlist denials, and protected-route access events.",
        href: "/admin/audit",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Health",
    theme: "emerald",
    cards: [
      {
        label: "Pipeline",
        description: "Pathlight scan engine. Recent runs, slow runs, and any failures.",
        href: "/admin/pipeline",
        icon: Workflow,
      },
      {
        label: "Platform",
        description: "Vercel deployments, build durations, and serverless function metrics.",
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
        description: "TLS, WHOIS, MX, SPF, DKIM, and DMARC checks per managed domain.",
        href: "/admin/infrastructure",
        icon: Wifi,
      },
    ],
  },
];

const ACCOUNT_COLUMN: Column = {
  label: "Account",
  theme: "zinc",
  cards: [
    {
      label: "Users",
      description: "Invite admins. Bootstrap allowlist plus database-backed members.",
      href: "/admin/users",
      icon: Users,
    },
  ],
};

function statusBadgeClass(level: StatusLevel): string {
  if (level === "red") return "bg-red-50 text-red-700 border-red-200";
  if (level === "yellow") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function columnDotClass(theme: CardTheme): string {
  if (theme === "cyan") return "bg-cyan-500";
  if (theme === "violet") return "bg-violet-500";
  if (theme === "amber") return "bg-amber-500";
  if (theme === "emerald") return "bg-emerald-500";
  return "bg-zinc-400";
}

export default async function AdminLanding() {
  const [session, status, kpis] = await Promise.all([
    auth(),
    getDashboardStatus(),
    getDashboardKpis(),
  ]);
  const firstName = session?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            One cockpit for visitors, conversions, Pathlight, costs,
            pipeline health, and infrastructure. Hover any card to see
            its current state. The status bar below reflects the
            worst-of every signal, green is good.
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

        {/* Column headers (lg only). Below lg the categorization
            collapses into a flat list because the 1- and 2-col
            responsive grids do not align with the 4-column header.
            Each header carries a small dot in its column theme so
            the color mapping is visible without relying on the cards. */}
        <div className="mb-3 hidden gap-6 lg:grid lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <h2
              key={col.label}
              className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500"
            >
              <span
                aria-hidden="true"
                className={`inline-block h-1.5 w-1.5 rounded-full ${columnDotClass(col.theme)}`}
              />
              {col.label}
            </h2>
          ))}
        </div>

        {/* Card grid rendered in row-major order so each visual row
            has aligned heights via auto-rows-fr. Cards from each
            column interleave: row N takes the Nth card from each
            column in order. */}
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: maxRowCount() }).flatMap((_, rowIdx) =>
            COLUMNS.map((col) => {
              const card = col.cards[rowIdx];
              if (!card) return null;
              return (
                <DashboardCard
                  key={card.href}
                  label={card.label}
                  description={card.description}
                  href={card.href}
                  icon={card.icon}
                  theme={col.theme}
                  kpi={kpis[card.href]}
                />
              );
            })
          )}
        </div>

        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 rounded-full ${columnDotClass(ACCOUNT_COLUMN.theme)}`}
            />
            {ACCOUNT_COLUMN.label}
          </h2>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACCOUNT_COLUMN.cards.map((card) => (
              <DashboardCard
                key={card.href}
                label={card.label}
                description={card.description}
                href={card.href}
                icon={card.icon}
                theme={ACCOUNT_COLUMN.theme}
                kpi={kpis[card.href]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function maxRowCount(): number {
  return COLUMNS.reduce((max, col) => Math.max(max, col.cards.length), 0);
}
