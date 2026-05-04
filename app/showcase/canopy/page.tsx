import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  ClipboardList,
  DollarSign,
  FileText,
  Globe,
  Mail,
} from "lucide-react";
import { PALETTES, type PaletteName } from "@/lib/admin/page-themes";
import {
  DEMO_DASHBOARD_KPIS,
  DEMO_TASKS_SUMMARY,
  DEMO_PIPELINE,
  formatUsd,
} from "@/lib/demo/fixtures";

/* Showcase dashboard. A faithful static replica of /admin so the
 * marketing surface mirrors the real product. Data sourced from
 * lib/demo/fixtures; no DB reads. */

export default function ShowcaseDashboard() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Canopy Admin
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            A demo view of Canopy as an operator would see it.
            Fictional data, real product.
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Good afternoon.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            One canopy for visitors, conversions, Pathlight, costs,
            pipeline health, and infrastructure. Hover any card to see
            its current state. The status bar below reflects the
            worst-of every signal, green is good.
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                ● All systems normal
              </span>
              <span className="text-xs text-zinc-500">
                Computed across deployments, pipeline, budget, infra,
                errors, and RUM.
              </span>
            </div>
          </div>
        </section>

        <PipelineRow />
        <TasksCard />
        <CardsRow />
      </div>
    </div>
  );
}

function PipelineRow() {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500"
          />
          Pipeline
        </h2>
        <Link
          href="/showcase/canopy/deals"
          className="text-[11px] font-semibold text-violet-700 hover:underline"
        >
          Open Deals board →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RollupTile
          label="Weighted pipeline"
          value={formatUsd(DEMO_PIPELINE.weightedCents)}
          sub={`${DEMO_PIPELINE.openCount} open deals`}
          accent="violet"
        />
        <RollupTile
          label="Unweighted pipeline"
          value={formatUsd(DEMO_PIPELINE.unweightedCents)}
          sub="Sum of all open deal values"
          accent="zinc"
        />
        <RollupTile
          label="Closed-Won this month"
          value={formatUsd(DEMO_PIPELINE.closedWonMonthCents)}
          sub={`${DEMO_PIPELINE.wonMonthCount} won this month`}
          accent="emerald"
        />
      </div>
    </section>
  );
}

function RollupTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "violet" | "emerald" | "zinc";
}) {
  const accentText =
    accent === "violet"
      ? "text-violet-700"
      : accent === "emerald"
        ? "text-emerald-700"
        : "text-zinc-700";
  const accentBar =
    accent === "violet"
      ? "bg-violet-500"
      : accent === "emerald"
        ? "bg-emerald-500"
        : "bg-zinc-400";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${accentBar}`}
        />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold ${accentText}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function TasksCard() {
  const { dueToday, overdue, dueThisWeek, nextDueTitle } =
    DEMO_TASKS_SUMMARY;
  const total = dueToday + overdue;
  return (
    <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
          />
          Today's Tasks
        </h2>
        <span className="text-[11px] font-semibold text-amber-700">
          Open Tasks board →
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TaskTile label="Overdue" value={overdue} tone="danger" />
        <TaskTile label="Due today" value={dueToday} tone="warning" />
        <TaskTile label="Due this week" value={dueThisWeek} tone="neutral" />
        <TaskTile label="Active total" value={total} tone="neutral" />
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        <span className="font-semibold text-zinc-700">Next up:</span>{" "}
        <span className="hover:underline">{nextDueTitle}</span>
        <span className="ml-2 font-mono text-[11px] text-zinc-500">
          due in 4h 12m
        </span>
      </p>
    </section>
  );
}

function TaskTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "neutral";
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-zinc-900";
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

interface ShowcaseCard {
  label: string;
  description: string;
  href: string;
  Icon: typeof Globe;
  palette: PaletteName;
  kpiHref: string;
}

const SHOWCASE_CARDS: { label: string; cards: ShowcaseCard[] }[] = [
  {
    label: "Today",
    cards: [
      {
        label: "Visitors",
        description:
          "Who is on the site right now, what they read, and where they came from.",
        href: "/showcase/canopy/analytics",
        Icon: Globe,
        palette: "sky",
        kpiHref: "/showcase/canopy/visitors",
      },
      {
        label: "Relationships",
        description:
          "Follow-ups, new leads, and pipeline at a glance.",
        href: "/showcase/canopy/contacts",
        Icon: ClipboardList,
        palette: "pink",
        kpiHref: "/showcase/canopy/contacts",
      },
      {
        label: "Deals",
        description:
          "Active opportunities, weighted forecast, and won/lost analytics.",
        href: "/showcase/canopy/deals",
        Icon: Briefcase,
        palette: "violet",
        kpiHref: "/showcase/canopy/deals",
      },
      {
        label: "Monitor",
        description:
          "Worst-of status across deploys, infrastructure, deliverability, and budget.",
        href: "/showcase/canopy/operations",
        Icon: Activity,
        palette: "cyan",
        kpiHref: "/showcase/canopy/visitors",
      },
    ],
  },
  {
    label: "Pipeline",
    cards: [
      {
        label: "Pathlight scans",
        description:
          "Prospecting candidates, change alerts, and competitive scans, all gated.",
        href: "/showcase/canopy/pathlight",
        Icon: FileText,
        palette: "teal",
        kpiHref: "/showcase/canopy/scans",
      },
      {
        label: "Leads",
        description:
          "Pathlight scan signups and contact-form submissions, side by side.",
        href: "/showcase/canopy/contacts",
        Icon: Mail,
        palette: "blue",
        kpiHref: "/showcase/canopy/leads",
      },
      {
        label: "Costs",
        description: "Spend per provider, operation, and scan.",
        href: "/showcase/canopy/operations",
        Icon: DollarSign,
        palette: "amber",
        kpiHref: "/showcase/canopy/costs",
      },
      {
        label: "Errors",
        description:
          "Top unresolved issues from the trailing 24 hours.",
        href: "/showcase/canopy/operations",
        Icon: AlertTriangle,
        palette: "red",
        kpiHref: "/showcase/canopy/errors",
      },
    ],
  },
];

function CardsRow() {
  const kpiByHref = new Map(
    DEMO_DASHBOARD_KPIS.map((k) => [k.href, k])
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {SHOWCASE_CARDS.flatMap((col) => col.cards).map((card) => {
        const tokens = PALETTES[card.palette];
        const kpi = kpiByHref.get(card.kpiHref);
        return (
          <Link
            key={`${card.label}-${card.kpiHref}`}
            href={card.href}
            className={`group flex h-[200px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all ${tokens.hoverShadow} ${tokens.hoverBorder}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${tokens.iconTile}`}
              >
                <card.Icon
                  className={`h-5 w-5 ${tokens.iconColor}`}
                  aria-hidden="true"
                />
              </div>
              {kpi ? (
                <div className="text-right">
                  <p
                    className={`font-mono text-2xl font-semibold ${tokens.kpiNeutralText}`}
                  >
                    {kpi.primary}
                  </p>
                  {kpi.meta ? (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      {kpi.meta}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className={`text-base font-semibold ${tokens.pageEyebrow}`}>
              {card.label}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
              {card.description}
            </p>
            {kpi?.secondary ? (
              <p className="mt-auto flex items-center gap-2 text-[11px] text-zinc-500">
                <span
                  aria-hidden="true"
                  className={`inline-block h-1.5 w-1.5 rounded-full ${tokens.dot}`}
                />
                {kpi.secondary}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
