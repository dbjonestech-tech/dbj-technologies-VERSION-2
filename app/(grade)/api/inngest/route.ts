import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { costAlertDaily, scanRequested } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scanRequested, costAlertDaily],
});
