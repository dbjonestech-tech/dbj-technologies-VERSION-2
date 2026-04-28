import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

import {
  getVisitorOverview,
  getTopPages,
  getLiveVisitors,
} from "../lib/services/analytics";
import { getFunnelStages, getCohortGrid } from "../lib/services/funnel";
import { getRumOverview } from "../lib/services/rum";
import {
  getRecentDeployments,
  getCurrentDeploymentSummary,
} from "../lib/services/vercel-platform";
import { getFunctionHealth, getRecentInngestRuns } from "../lib/services/inngest-health";
import { getLatestInfraStatuses } from "../lib/services/infrastructure";
import {
  getCurrentBudgetState,
  getBudgetTrend,
} from "../lib/services/anthropic-budget";
import {
  getTopQueries,
  getOpportunities,
} from "../lib/services/search-console";
import { getEmailKpiByType, getEmailKpiTrend } from "../lib/services/email-kpi";

async function main() {
  console.log("=== Read API smoke test against migrated prod DB ===");

  const overview = await getVisitorOverview("1 day");
  console.log(
    `analytics.getVisitorOverview: ${overview.pageViews} views, ${overview.sessions} sessions`
  );
  console.log(`analytics.getTopPages: ${(await getTopPages("7 days", 5)).length} rows`);
  console.log(`analytics.getLiveVisitors: ${(await getLiveVisitors()).length} rows`);

  const stages = await getFunnelStages(7);
  console.log(
    `funnel.getFunnelStages: ${stages.length} stages, top=${stages[0]?.count}`
  );
  console.log(`funnel.getCohortGrid: ${(await getCohortGrid()).length} cells`);

  const rum = await getRumOverview(7);
  console.log(`rum.getRumOverview: ${rum.views} measurements`);

  const deploys = await getRecentDeployments();
  console.log(`vercel.getRecentDeployments: ${deploys.length} rows`);
  const deploySummary = await getCurrentDeploymentSummary();
  console.log(
    `vercel.getCurrentDeploymentSummary: state=${deploySummary.productionState ?? "(none)"}, failed24h=${deploySummary.failedLast24h}`
  );

  const fnHealth = await getFunctionHealth(7);
  console.log(`inngest.getFunctionHealth: ${fnHealth.length} rows`);
  console.log(`inngest.getRecentInngestRuns: ${(await getRecentInngestRuns()).length} rows`);

  console.log(`infra.getLatestInfraStatuses: ${(await getLatestInfraStatuses()).length} rows`);

  const budget = await getCurrentBudgetState();
  console.log(
    `anthropic.getCurrentBudgetState: spend=$${budget.spendUsd}, limit=${budget.limitUsd ?? "(unset)"}`
  );
  console.log(`anthropic.getBudgetTrend: ${(await getBudgetTrend()).length} points`);

  console.log(`gsc.getTopQueries: ${(await getTopQueries(28)).length} rows`);
  console.log(`gsc.getOpportunities: ${(await getOpportunities(28)).length} rows`);

  console.log(`email.getEmailKpiByType: ${(await getEmailKpiByType(30)).length} rows`);
  console.log(`email.getEmailKpiTrend: ${(await getEmailKpiTrend(30)).length} points`);

  console.log("=== All read APIs returned without error ===");
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
