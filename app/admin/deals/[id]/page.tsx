import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDeal } from "@/lib/services/deals";
import { getEntityAuditTrail } from "@/lib/canopy/audit";
import PageHeader from "../../PageHeader";
import DealDetailClient from "./DealDetailClient";

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

  const audit = await getEntityAuditTrail("deal", String(id), 30);

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

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <header className="mb-3">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Audit log
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Every change to this deal, who made it, and the before/after values. Powered by canopy_audit_log.
            </p>
          </header>
          {audit.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No changes recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {audit.map((row) => (
                <li key={row.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-700">{row.action}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(row.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {row.actor_email ?? "system"}
                    {row.before && row.after ? (
                      <>
                        {" "}
                        <span className="font-mono">
                          {JSON.stringify(row.before)} → {JSON.stringify(row.after)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
