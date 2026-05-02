import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../../PageHeader";
import { listAdminUsers, getSessionRole } from "@/lib/canopy/rbac";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false, nocache: true },
};

export default async function TeamPage() {
  const [users, me] = await Promise.all([listAdminUsers(), getSessionRole()]);
  return (
    <div className="px-6 py-10 sm:px-10">
      <Link href="/admin/canopy" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900">
        ← Canopy controls
      </Link>
      <PageHeader
        palette="zinc"
        section="Account"
        pageName="Team"
        description="Admin users and their roles. admin can do everything, manager can do everything except change roles or revoke tokens, sales is scoped to their owned records, viewer is read-only."
      />
      <TeamClient users={users} myEmail={me?.email ?? ""} />
    </div>
  );
}
