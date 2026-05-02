import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDeal } from "@/lib/services/deals";
import { getActivitiesForDeal } from "@/lib/services/activities";
import { getEntityAuditTrail } from "@/lib/canopy/audit";
import { getCustomFieldDefinitions } from "@/lib/canopy/custom-fields";
import { getEntityExtras } from "@/lib/canopy/entity-extras";
import { getSessionRole } from "@/lib/canopy/rbac";
import { getOAuthTokenForUser } from "@/lib/canopy/email/oauth-tokens";
import { listTemplatesForOwner } from "@/lib/canopy/email/templates";
import { isGoogleOAuthConfigured } from "@/lib/integrations/google-oauth";
import { isTokenEncryptionConfigured } from "@/lib/canopy/email/encryption";
import PageHeader from "../../PageHeader";
import DealDetailClient from "./DealDetailClient";
import ActivityComposer from "../../components/ActivityComposer";
import ActivityFeed from "../../components/ActivityFeed";
import TagsBar from "../../components/TagsBar";
import CustomFieldsPanel from "../../components/CustomFieldsPanel";
import EntityAuditList from "../../components/EntityAuditList";
import CaseStudyTab from "./CaseStudyTab";
import EmailComposePanel from "@/app/admin/contacts/[id]/EmailComposePanel";
import EmailThreadPanel from "@/app/admin/contacts/[id]/EmailThreadPanel";
import {
  getDealAttributionEvents,
  getContactBeaconRollup,
  getContactBeaconSeries,
} from "@/lib/canopy/case-study";
import { getCanopySettings } from "@/lib/canopy/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Deal",
  robots: { index: false, follow: false, nocache: true },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const deal = await getDeal(id);
  if (!deal) notFound();

  const [
    audit,
    activities,
    customFieldDefs,
    extras,
    attribEvents,
    beaconRollup,
    beaconSeries,
    canopySettings,
    sr,
  ] = await Promise.all([
    getEntityAuditTrail("deal", String(id), 30),
    getActivitiesForDeal(id, 50),
    getCustomFieldDefinitions("deal"),
    getEntityExtras("deal", id),
    getDealAttributionEvents(id),
    getContactBeaconRollup(deal.contact_id),
    getContactBeaconSeries(deal.contact_id, 30),
    getCanopySettings(),
    getSessionRole(),
  ]);

  const oauthEnvOk = isGoogleOAuthConfigured() && isTokenEncryptionConfigured();
  const myTokenInfo = sr && oauthEnvOk
    ? await getOAuthTokenForUser(sr.email).catch(() => null)
    : null;
  const myTemplates = sr && oauthEnvOk
    ? await listTemplatesForOwner(sr.email).catch(() => [])
    : [];
  const ableToSend = Boolean(myTokenInfo);
  const unavailableReason = !oauthEnvOk
    ? "Email integration is not configured (env vars missing)."
    : !myTokenInfo
      ? "Connect Gmail in /admin/canopy first."
      : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/admin/deals"
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All deals
        </Link>
        <PageHeader
          palette="violet"
          section="Relationships"
          pageName={deal.name}
          description={
            deal.contact_company
              ? `${deal.contact_name || deal.contact_email} · ${deal.contact_company}`
              : deal.contact_name || deal.contact_email
          }
        >
          <div className="mt-3">
            <Link
              href={`/admin/contacts/${deal.contact_id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
            >
              Open contact <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </PageHeader>

        <DealDetailClient deal={deal} />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TagsBar entityType="deal" entityId={deal.id} initialTags={extras.tags} />
          <div>
            <CustomFieldsPanel
              entityType="deal"
              entityId={deal.id}
              definitions={customFieldDefs}
              values={extras.custom_fields}
            />
          </div>
        </div>

        <div className="mt-8">
          <ActivityComposer contactId={deal.contact_id} dealId={deal.id} />
        </div>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <header className="mb-4">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Activity feed
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Calls, meetings, tasks, and notes logged against this deal.
            </p>
          </header>
          <ActivityFeed activities={activities} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <EmailComposePanel
            contactId={deal.contact_id}
            dealId={deal.id}
            contactEmail={deal.contact_email}
            contactName={deal.contact_name ?? null}
            contactCompany={deal.contact_company ?? null}
            fromEmail={myTokenInfo?.connectedEmail ?? null}
            templates={myTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              subject: t.subject,
              bodyMarkdown: t.body_markdown,
            }))}
            ableToSend={ableToSend}
            unavailableReason={unavailableReason}
          />
          <EmailThreadPanel contactId={deal.contact_id} />
        </div>

        {deal.won === true ? (
          <CaseStudyTab
            dealId={deal.id}
            contactId={deal.contact_id}
            events={attribEvents}
            beacon={beaconRollup}
            series={beaconSeries}
            beaconEnabled={canopySettings.attribution_beacon_enabled}
          />
        ) : null}

        <div className="mt-6">
          <EntityAuditList
            audit={audit}
            description="Every change to this deal, who made it, and the before/after values. Powered by canopy_audit_log."
          />
        </div>
      </div>
    </div>
  );
}
