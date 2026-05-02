import type { Metadata } from "next";
import PageHeader from "../../PageHeader";
import {
  getApproxTimeInStage,
  getLossReasons,
  getPipelineSummary,
  getRevenueByMonth,
  getSourceAttribution,
} from "@/lib/analytics/pipeline";
import PipelineDashboard from "./PipelineDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pipeline analytics",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PipelineAnalyticsPage() {
  const [summary, timeInStage, revenue, sources, lossReasons] = await Promise.all([
    getPipelineSummary(),
    getApproxTimeInStage(),
    getRevenueByMonth(12),
    getSourceAttribution(180),
    getLossReasons(180),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="emerald"
        section="Analytics"
        pageName="Pipeline"
        description="Stage funnel, win rate, deal velocity, source attribution, and loss reasons. Read-only over the deals + activities tables; no scans triggered."
      />
      <PipelineDashboard
        summary={summary}
        timeInStage={timeInStage}
        revenue={revenue}
        sources={sources}
        lossReasons={lossReasons}
      />
    </div>
  );
}
