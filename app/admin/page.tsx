import { auth } from "@/auth";
import { getDashboardStatus, type StatusLevel } from "@/lib/services/health-status";
import { getDashboardKpis } from "@/lib/services/dashboard-kpis";
import DashboardCard, { type IconName } from "./DashboardCard";
import { PALETTES, type PaletteName } from "@/lib/admin/page-themes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Per-card metadata for the Canopy admin dashboard. Every card has
 * its own palette (one of 18 named hues in lib/admin/page-themes.ts)
 * so the card and its destination /admin/<route> page share a
 * consistent color identity. Columns group palettes by family
 * (Today = sky/cyan/teal/blue, Acquisition = violet/indigo/fuchsia/
 * purple/pink, Operations = amber/orange/yellow/stone, Health =
 * emerald/green/red/lime, Account = zinc) so the column-level
 * grouping still reads at a glance.
 */
type Card = {
  label: string;
  description: string;
  href: string;
  /* Lucide icon component name. Functions cannot cross the
   * Server -> Client RSC boundary as props, so we pass the icon's
   * name (a string) and resolve the component inside DashboardCard. */
  iconName: IconName;
  palette: PaletteName;
};

type Column = {
  label: string;
  /* Family hue used for the column-header dot only. Each card inside
   * carries its own palette. */
  familyDot: PaletteName;
  cards: Card[];
};

const COLUMNS: Column[] = [
  {
    label: "Today",
    familyDot: "cyan",
    cards: [
      {
        label: "Visitors",
        description: "Who is on the site right now, what they read, and where they came from.",
        href: "/admin/visitors",
        iconName: "Globe",
        palette: "sky",
      },
      {
        label: "Relationships",
        description: "Follow-ups, new leads, and pipeline at a glance.",
        href: "/admin/contacts",
        iconName: "ClipboardList",
        palette: "pink",
      },
      {
        label: "Monitor",
        description: "Live event tail with funnel counts, severity, and Lighthouse trend.",
        href: "/admin/monitor",
        iconName: "Activity",
        palette: "cyan",
      },
      {
        label: "Scans",
        description: "Every Pathlight scan with status, score, and revenue range. Filterable.",
        href: "/admin/scans",
        iconName: "FileText",
        palette: "teal",
      },
      {
        label: "Leads",
        description: "Pathlight scan signups and contact-form submissions, side by side.",
        href: "/admin/leads",
        iconName: "Mail",
        palette: "blue",
      },
    ],
  },
  {
    label: "Acquisition",
    familyDot: "violet",
    cards: [
      {
        label: "Funnel",
        description: "How visitors flow from session to scan to contact, and where they drop off.",
        href: "/admin/funnel",
        iconName: "Filter",
        palette: "violet",
      },
      {
        label: "Search",
        description: "Top Google queries and pages, plus pages worth optimizing for CTR.",
        href: "/admin/search",
        iconName: "Search",
        palette: "indigo",
      },
      {
        label: "RUM",
        description: "How fast pages actually load for real visitors, by page and device.",
        href: "/admin/performance/rum",
        iconName: "Zap",
        palette: "fuchsia",
      },
      {
        label: "Email",
        description: "Deliverability KPIs by email type, with bounce and complaint alerts.",
        href: "/admin/email",
        iconName: "Mail",
        palette: "purple",
      },
      {
        label: "Recurring users",
        description: "Every visitor who came back across multiple sessions, ranked by visit count.",
        href: "/admin/recurring",
        iconName: "Repeat",
        palette: "pink",
      },
    ],
  },
  {
    label: "Operations",
    familyDot: "amber",
    cards: [
      {
        label: "Costs",
        description: "Provider spend, per-operation totals, and the most expensive scans.",
        href: "/admin/costs",
        iconName: "DollarSign",
        palette: "amber",
      },
      {
        label: "Database",
        description: "Row counts and recent activity for every Pathlight and admin table.",
        href: "/admin/database",
        iconName: "Database",
        palette: "orange",
      },
      {
        label: "Clients",
        description: "Engagement clients, projects, and deliverables. Drives the client portal.",
        href: "/admin/clients",
        iconName: "Briefcase",
        palette: "yellow",
      },
      {
        label: "Audit log",
        description: "Sign-in attempts, allowlist denials, and protected-route access events.",
        href: "/admin/audit",
        iconName: "ShieldCheck",
        palette: "stone",
      },
    ],
  },
  {
    label: "Health",
    familyDot: "emerald",
    cards: [
      {
        label: "Pipeline",
        description: "Pathlight scan engine. Recent runs, slow runs, and any failures.",
        href: "/admin/pipeline",
        iconName: "Workflow",
        palette: "emerald",
      },
      {
        label: "Platform",
        description: "Vercel deployments, build durations, and serverless function metrics.",
        href: "/admin/platform",
        iconName: "Server",
        palette: "green",
      },
      {
        label: "Errors",
        description: "Top unresolved Sentry issues from the trailing 24 hours.",
        href: "/admin/errors",
        iconName: "AlertTriangle",
        palette: "red",
      },
      {
        label: "Infrastructure",
        description: "TLS, WHOIS, MX, SPF, DKIM, and DMARC checks per managed domain.",
        href: "/admin/infrastructure",
        iconName: "Wifi",
        palette: "lime",
      },
    ],
  },
];

const ACCOUNT_COLUMN: Column = {
  label: "Account",
  familyDot: "zinc",
  cards: [
    {
      label: "Users",
      description: "Invite admins. Bootstrap allowlist plus database-backed members.",
      href: "/admin/users",
      iconName: "Users",
      palette: "zinc",
    },
  ],
};

function statusBadgeClass(level: StatusLevel): string {
  if (level === "red") return "bg-red-50 text-red-700 border-red-200";
  if (level === "yellow") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
            Canopy Admin
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

        {/* Column headers (lg only). Each header carries its column
            family dot. Below lg the columns collapse into a flat
            single grid because the 1- and 2-col responsive layouts
            do not align with the 4-column header. */}
        <div className="mb-3 hidden gap-6 lg:grid lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <h2
              key={col.label}
              className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500"
            >
              <span
                aria-hidden="true"
                className={`inline-block h-1.5 w-1.5 rounded-full ${PALETTES[col.familyDot].dot}`}
              />
              {col.label}
            </h2>
          ))}
        </div>

        {/* Per-column flex stacks. Variable column lengths (Acquisition
            now has 5 cards while others have 4) are handled naturally
            because each column is its own vertical flex container. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {COLUMNS.map((col) => (
            <div key={col.label} className="flex flex-col gap-4 lg:gap-6">
              {col.cards.map((card) => (
                <DashboardCard
                  key={card.href}
                  label={card.label}
                  description={card.description}
                  href={card.href}
                  iconName={card.iconName}
                  palette={card.palette}
                  kpi={kpis[card.href]}
                />
              ))}
            </div>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 rounded-full ${PALETTES[ACCOUNT_COLUMN.familyDot].dot}`}
            />
            {ACCOUNT_COLUMN.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACCOUNT_COLUMN.cards.map((card) => (
              <DashboardCard
                key={card.href}
                label={card.label}
                description={card.description}
                href={card.href}
                iconName={card.iconName}
                palette={card.palette}
                kpi={kpis[card.href]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
