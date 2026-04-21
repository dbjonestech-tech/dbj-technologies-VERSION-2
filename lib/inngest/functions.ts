import { getDb } from "../db";
import { inngest } from "./client";

export const scanRequested = inngest.createFunction(
  {
    id: "pathlight-scan-requested",
    triggers: [{ event: "pathlight/scan.requested" }],
  },
  async ({ event, step }) => {
    const { scanId } = event.data as { scanId: string };
    const sql = getDb();

    try {
      await step.run("mark-scanning", async () => {
        await sql`
          UPDATE scans
          SET status = 'scanning', updated_at = now()
          WHERE id = ${scanId}
        `;
      });

      await step.sleep("simulate-scan", "3s");

      await step.run("mark-complete", async () => {
        await sql`
          UPDATE scans
          SET status = 'complete',
              updated_at = now(),
              completed_at = now()
          WHERE id = ${scanId}
        `;
      });

      return { scanId, status: "complete" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await sql`
        UPDATE scans
        SET status = 'failed',
            error_message = ${message},
            updated_at = now()
        WHERE id = ${scanId}
      `;
      throw err;
    }
  }
);
