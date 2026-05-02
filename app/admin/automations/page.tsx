import type { Metadata } from "next";
import PageHeader from "../PageHeader";
import { listWorkflowRules } from "@/lib/canopy/automation/workflow-rules";
import { listSequences } from "@/lib/canopy/automation/sequences";
import AutomationsClient from "./AutomationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Automations",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AutomationsPage() {
  const [rules, sequences] = await Promise.all([listWorkflowRules(), listSequences()]);
  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="violet"
        section="Automation"
        pageName="Workflow rules"
        description="Trigger -> conditions -> actions. The evaluator polls canopy_audit_log every 2 minutes for entries matching each enabled rule's trigger event, fires matching actions, and records every evaluation so a retry never double-fires."
      />
      <AutomationsClient initialRules={rules} sequences={sequences} />
    </div>
  );
}
