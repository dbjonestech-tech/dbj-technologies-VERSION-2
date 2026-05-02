import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "../../PageHeader";
import { getSessionRole } from "@/lib/canopy/rbac";
import { listTemplatesForOwner } from "@/lib/canopy/email/templates";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Email templates",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EmailTemplatesPage() {
  const session = await getSessionRole();
  if (!session) notFound();

  const templates = await listTemplatesForOwner(session.email);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          palette="stone"
          section="Account"
          pageName="Email templates"
          description="Reusable copy for the compose modal on contact and deal pages. Merge fields like {{contact.first_name}} or {{deal.value}} are substituted at send time. Templates are scoped to your account; other admins maintain their own libraries."
        />
        <TemplatesClient
          ownerEmail={session.email}
          initial={templates.map((t) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            bodyMarkdown: t.body_markdown,
            mergeFields: t.merge_fields,
            updatedAt: t.updated_at,
          }))}
        />
      </div>
    </div>
  );
}
