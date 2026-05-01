import type { Metadata } from "next";
import {
  getEmailKpiByType,
  getEmailKpiTrend,
  type EmailKpiDailyPoint,
  type EmailKpiSummary,
} from "@/lib/services/email-kpi";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Email",
  robots: { index: false, follow: false, nocache: true },
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

const BOUNCE_WARN = 1;
const BOUNCE_FAIL = 2;
const COMPLAINT_WARN = 0.05;
const COMPLAINT_FAIL = 0.1;

function bounceClass(pct: number): string {
  if (pct >= BOUNCE_FAIL) return "text-red-600";
  if (pct >= BOUNCE_WARN) return "text-amber-600";
  return "text-emerald-600";
}

function complaintClass(pct: number): string {
  if (pct >= COMPLAINT_FAIL) return "text-red-600";
  if (pct >= COMPLAINT_WARN) return "text-amber-600";
  return "text-emerald-600";
}

export default async function EmailPage() {
  const [byType, trend] = await Promise.all([
    getEmailKpiByType(30),
    getEmailKpiTrend(30),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="purple"
          section="Acquisition"
          pageName="Email"
          description="Sent vs delivered vs bounced vs complained over the last 30 days. Bounce above 2% or complaints above 0.1% will trigger Resend domain throttling, so those rates are colored red well before the limit."
        />

        <Section title="By email type (30 days)">
          {byType.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No data yet. The first emailKpiRefreshHourly run hydrates this view.
            </p>
          ) : (
            <ByTypeTable rows={byType} />
          )}
        </Section>

        <Section title="Daily trend (30 days)">
          {trend.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <TrendTable rows={trend} />
          )}
        </Section>
      </div>
    </div>
  );
}

function ByTypeTable({ rows }: { rows: EmailKpiSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[800px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Email type</th>
            <th className="px-3 py-2 text-right font-semibold">Sent</th>
            <th className="px-3 py-2 text-right font-semibold">Delivered</th>
            <th className="px-3 py-2 text-right font-semibold">Delivery rate</th>
            <th className="px-3 py-2 text-right font-semibold">Bounced</th>
            <th className="px-3 py-2 text-right font-semibold">Bounce rate</th>
            <th className="px-3 py-2 text-right font-semibold">Complained</th>
            <th className="px-3 py-2 text-right font-semibold">Complaint rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emailType} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.emailType}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">{formatNumber(r.sent)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.delivered)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">{r.deliveryRatePct}%</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.bounced)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bounceClass(r.bounceRatePct)}`}>
                {r.bounceRatePct}%
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.complained)}</td>
              <td className={`px-3 py-2 text-right font-mono ${complaintClass(r.complaintRatePct)}`}>
                {r.complaintRatePct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendTable({ rows }: { rows: EmailKpiDailyPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Day</th>
            <th className="px-3 py-2 text-right font-semibold">Sent</th>
            <th className="px-3 py-2 text-right font-semibold">Delivered</th>
            <th className="px-3 py-2 text-right font-semibold">Bounced</th>
            <th className="px-3 py-2 text-right font-semibold">Complained</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-700">{r.day}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">{formatNumber(r.sent)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.delivered)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.bounced)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.complained)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
