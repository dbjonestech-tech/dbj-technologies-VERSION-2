import type { Metadata } from "next";
import PageHeader from "../../PageHeader";
import { getDb } from "@/lib/db";
import { getCanopySettings } from "@/lib/canopy/settings";
import { generateBeaconSnippet } from "@/lib/canopy/attribution-beacon";
import BeaconClient from "./BeaconClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Attribution beacon",
  robots: { index: false, follow: false, nocache: true },
};

interface ClientRow {
  contact_id: number;
  email: string;
  name: string | null;
  company: string | null;
  beacon_count: number;
  last_recorded_at: string | null;
}

async function getBeaconClients(): Promise<ClientRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT c.id::int AS contact_id,
             c.email,
             c.name,
             c.company,
             COALESCE((
               SELECT COUNT(*) FROM attribution_beacon_data b
                WHERE b.contact_id = c.id
             ), 0)::int AS beacon_count,
             (SELECT MAX(b.recorded_at) FROM attribution_beacon_data b
                WHERE b.contact_id = c.id) AS last_recorded_at
      FROM contacts c
      JOIN deals d ON d.contact_id = c.id
      WHERE d.won = TRUE
      GROUP BY c.id, c.email, c.name, c.company
      ORDER BY beacon_count DESC, c.email ASC
    `) as ClientRow[];
    return rows;
  } catch {
    return [];
  }
}

export default async function BeaconPage() {
  const [settings, clients] = await Promise.all([
    getCanopySettings(),
    getBeaconClients(),
  ]);

  const baseOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://dbjtechnologies.com";

  const exampleSnippet = generateBeaconSnippet({
    contactId: 0,
    canopyOrigin: baseOrigin,
  });

  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="lime"
        section="Pathlight Advanced"
        pageName="Attribution beacon"
        description={`Generate a per-client snippet to embed on a launched site. The snippet posts pageviews and form submits back to ${baseOrigin}/api/canopy/beacon/<contactId>. Data feeds the Case Study tab on each won deal.`}
      />

      {!settings.attribution_beacon_enabled ? (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Beacon ingestion is currently disabled. Toggle <code className="font-mono">attribution_beacon_enabled</code> on in <a className="underline" href="/admin/canopy">/admin/canopy</a> before pasting any snippet on a client site.
        </section>
      ) : null}

      <BeaconClient
        clients={clients}
        canopyOrigin={baseOrigin}
        exampleSnippet={exampleSnippet}
      />
    </div>
  );
}
