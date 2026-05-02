"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import { requireRole, ROLES, type Role } from "@/lib/canopy/rbac";

export type TeamActionResult = { ok: true } | { ok: false; error: string };

export async function setUserRoleAction(input: {
  email: string;
  role: Role;
}): Promise<TeamActionResult> {
  const me = await requireRole("admin");
  if (!ROLES.includes(input.role)) return { ok: false, error: "unknown role" };
  const target = input.email.toLowerCase().trim();
  if (target === me.email) {
    return { ok: false, error: "cannot change your own role" };
  }
  try {
    const sql = getDb();
    const before = (await sql`
      SELECT role FROM admin_users WHERE email = ${target}
    `) as Array<{ role: Role }>;
    if (before.length === 0) return { ok: false, error: "user not found" };
    if (before[0]!.role === input.role) return { ok: true };

    await sql`
      UPDATE admin_users SET role = ${input.role} WHERE email = ${target}
    `;
    revalidatePath("/admin/canopy/team");
    await recordChange({
      entityType: "admin_user",
      entityId: target,
      action: "team.role.change",
      before: { role: before[0]!.role },
      after: { role: input.role },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function setUserStatusAction(input: {
  email: string;
  status: "active" | "disabled";
}): Promise<TeamActionResult> {
  const me = await requireRole("admin");
  const target = input.email.toLowerCase().trim();
  if (target === me.email) {
    return { ok: false, error: "cannot disable yourself" };
  }
  if (input.status !== "active" && input.status !== "disabled") {
    return { ok: false, error: "invalid status" };
  }
  try {
    const sql = getDb();
    await sql`
      UPDATE admin_users SET status = ${input.status} WHERE email = ${target}
    `;
    revalidatePath("/admin/canopy/team");
    await recordChange({
      entityType: "admin_user",
      entityId: target,
      action: "team.status.change",
      after: { status: input.status },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}
