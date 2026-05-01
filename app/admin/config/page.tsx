import type { Metadata } from "next";
import { Check, X, ExternalLink, AlertCircle } from "lucide-react";
import PageHeader from "../PageHeader";
import {
  ADMIN_ENV_VARS,
  ADMIN_WEBHOOKS,
  checkEnvVarStatuses,
  envGroups,
  type EnvVarRequirement,
  type EnvVarStatus,
} from "@/lib/admin/env-config";

/* No data leaves the server: this page only renders booleans
 * (set / not set), never the actual env-var values. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Config",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ConfigPage() {
  const statuses = checkEnvVarStatuses();
  const groups = envGroups();
  const byGroup = new Map<string, EnvVarStatus[]>();
  for (const g of groups) byGroup.set(g, []);
  for (const s of statuses) {
    byGroup.get(s.spec.group)?.push(s);
  }

  /* Topline counts. Required+missing is the urgent number. */
  const requiredMissing = statuses.filter(
    (s) => s.spec.requirement === "required" && !s.isSet
  ).length;
  const recommendedMissing = statuses.filter(
    (s) => s.spec.requirement === "recommended" && !s.isSet
  ).length;
  const optionalMissing = statuses.filter(
    (s) => s.spec.requirement === "optional" && !s.isSet
  ).length;
  const totalSet = statuses.filter((s) => s.isSet).length;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="teal"
          section="Account"
          pageName="Config"
          description="Self-service status board for every environment variable and webhook the admin dashboard depends on. Only declares whether each value is set, never the value itself. Use this page to diagnose any blank dashboard before grepping the codebase."
        />

        <Topline
          totalSet={totalSet}
          total={statuses.length}
          requiredMissing={requiredMissing}
          recommendedMissing={recommendedMissing}
          optionalMissing={optionalMissing}
        />

        {requiredMissing > 0 ? (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-red-800">
              <strong>{requiredMissing} required variable{requiredMissing === 1 ? "" : "s"} missing.</strong>{" "}
              Pages that depend on these will error or render blank until they
              are set in Vercel -&gt; Project -&gt; Settings -&gt; Environment Variables.
            </p>
          </div>
        ) : null}

        {groups.map((group) => {
          const rows = byGroup.get(group) ?? [];
          if (rows.length === 0) return null;
          return (
            <Section key={group} title={group}>
              <EnvTable rows={rows} />
            </Section>
          );
        })}

        <Section title="Webhooks to register">
          <p className="mb-4 text-xs leading-relaxed text-zinc-600">
            One-time setup outside the codebase. Each handler exists at the URL
            below; register it on the upstream provider with the matching
            secret.
          </p>
          <WebhooksTable />
        </Section>
      </div>
    </div>
  );
}

function Topline({
  totalSet,
  total,
  requiredMissing,
  recommendedMissing,
  optionalMissing,
}: {
  totalSet: number;
  total: number;
  requiredMissing: number;
  recommendedMissing: number;
  optionalMissing: number;
}) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Set" value={`${totalSet} / ${total}`} tone="positive" />
      <Stat
        label="Required missing"
        value={String(requiredMissing)}
        tone={requiredMissing > 0 ? "danger" : "positive"}
      />
      <Stat
        label="Recommended missing"
        value={String(recommendedMissing)}
        tone={recommendedMissing > 0 ? "warning" : "positive"}
      />
      <Stat
        label="Optional missing"
        value={String(optionalMissing)}
        tone="neutral"
      />
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "warning" | "danger" | "neutral";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-zinc-700";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-zinc-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EnvTable({ rows }: { rows: EnvVarStatus[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[760px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold w-8"></th>
            <th className="px-3 py-2 font-semibold">Variable</th>
            <th className="px-3 py-2 font-semibold">Requirement</th>
            <th className="px-3 py-2 font-semibold">Description</th>
            <th className="px-3 py-2 font-semibold">Where to get it</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <EnvRow key={s.spec.name} status={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvRow({ status }: { status: EnvVarStatus }) {
  const { spec, isSet } = status;
  return (
    <tr className="border-t border-zinc-100 even:bg-zinc-100/70 hover:bg-teal-50">
      <td className="px-3 py-3">
        {isSet ? (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
            title="Set in this environment"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 ring-1 ring-rose-200"
            title="Not set in this environment"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs font-semibold text-zinc-900">
            {spec.name}
          </code>
          {spec.isPublic ? (
            <span
              className="inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-700 ring-1 ring-violet-200"
              title="Prefix NEXT_PUBLIC_ exposes this value to the browser bundle"
            >
              public
            </span>
          ) : null}
        </div>
        {spec.affectedPages && spec.affectedPages.length > 0 ? (
          <p className="mt-1 text-[10px] text-zinc-500">
            Affects: {spec.affectedPages.join(", ")}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <RequirementChip requirement={spec.requirement} />
      </td>
      <td className="px-3 py-3 text-xs leading-relaxed text-zinc-700">
        {spec.description}
      </td>
      <td className="px-3 py-3 text-xs leading-relaxed text-zinc-600">
        {spec.whereToGet ?? "-"}
      </td>
    </tr>
  );
}

function RequirementChip({ requirement }: { requirement: EnvVarRequirement }) {
  const cfg =
    requirement === "required"
      ? {
          label: "required",
          cls: "bg-rose-50 text-rose-700 ring-rose-200",
        }
      : requirement === "recommended"
        ? {
            label: "recommended",
            cls: "bg-amber-50 text-amber-700 ring-amber-200",
          }
        : {
            label: "optional",
            cls: "bg-zinc-100 text-zinc-700 ring-zinc-300",
          };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function WebhooksTable() {
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Webhook</th>
            <th className="px-3 py-2 font-semibold">Endpoint</th>
            <th className="px-3 py-2 font-semibold">Register at</th>
            <th className="px-3 py-2 font-semibold">Events</th>
            <th className="px-3 py-2 font-semibold">Secret</th>
          </tr>
        </thead>
        <tbody>
          {ADMIN_WEBHOOKS.map((wh) => (
            <tr
              key={wh.name}
              className="border-t border-zinc-100 even:bg-zinc-100/70 hover:bg-teal-50"
            >
              <td className="px-3 py-3 text-xs font-semibold text-zinc-900">
                {wh.name}
                <p className="mt-1 text-[10px] font-normal text-zinc-500">
                  Affects: {wh.affectedPages.join(", ")}
                </p>
              </td>
              <td className="px-3 py-3">
                <code className="font-mono text-[11px] text-zinc-700">
                  {wh.url}
                </code>
              </td>
              <td className="px-3 py-3 text-xs text-zinc-700">
                <span className="inline-flex items-center gap-1">
                  {wh.registerAt}
                  <ExternalLink
                    className="h-3 w-3 text-zinc-400"
                    aria-hidden="true"
                  />
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-zinc-700">{wh.events}</td>
              <td className="px-3 py-3">
                <code className="font-mono text-[11px] text-zinc-700">
                  {wh.secretEnv}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
