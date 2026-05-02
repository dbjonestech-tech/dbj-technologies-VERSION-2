import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  canopyDigestHourly,
  canopySequenceAdvance,
  canopyWorkflowEvaluate,
  costAlertDaily,
  lighthouseMonitorDaily,
  monitoringPurgeDaily,
  pathlightSyntheticCheck,
  scanRequested,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scanRequested,
    costAlertDaily,
    lighthouseMonitorDaily,
    pathlightSyntheticCheck,
    monitoringPurgeDaily,
    canopyDigestHourly,
    canopySequenceAdvance,
    canopyWorkflowEvaluate,
  ],
});
