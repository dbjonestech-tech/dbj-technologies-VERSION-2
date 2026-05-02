import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../PageHeader";
import { listAllTokens } from "@/lib/canopy/api-tokens";
import { listWebhooks } from "@/lib/canopy/webhooks";
import ApiTokensClient from "./ApiTokensClient";
import WebhooksClient from "./WebhooksClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "API & webhooks",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ApiPage() {
  const [tokens, webhooks] = await Promise.all([listAllTokens(), listWebhooks()]);
  return (
    <div className="px-6 py-10 sm:px-10">
      <Link href="/admin/canopy" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900">
        ← Canopy controls
      </Link>
      <PageHeader
        palette="zinc"
        section="Account"
        pageName="API & webhooks"
        description="Bearer tokens for the REST API at /api/v1/*, and outbound webhooks that POST signed events to your URL when records change."
      />

      <ApiTokensClient initialTokens={tokens} />

      <div className="mt-12">
        <WebhooksClient initialWebhooks={webhooks} />
      </div>
    </div>
  );
}
