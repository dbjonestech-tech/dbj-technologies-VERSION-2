import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  anthropicBudgetHourly,
  canopyChangeMonitoringDaily,
  canopyDigestHourly,
  canopyGmailIngest,
  canopySequenceAdvance,
  canopyWebhookDispatch,
  canopyWorkflowEvaluate,
  costAlertDaily,
  emailKpiRefreshHourly,
  funnelRefreshHourly,
  inngestHealthHourly,
  lighthouseMonitorDaily,
  monitoringPurgeDaily,
  pathlightSyntheticCheck,
  scanRequested,
  searchConsoleDaily,
  vercelTelemetryHourly,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scanRequested,
    costAlertDaily,
    lighthouseMonitorDaily,
    pathlightSyntheticCheck,
    monitoringPurgeDaily,
    emailKpiRefreshHourly,
    funnelRefreshHourly,
    inngestHealthHourly,
    vercelTelemetryHourly,
    anthropicBudgetHourly,
    searchConsoleDaily,
    canopyDigestHourly,
    canopySequenceAdvance,
    canopyWorkflowEvaluate,
    canopyWebhookDispatch,
    canopyChangeMonitoringDaily,
    canopyGmailIngest,
  ],
});
