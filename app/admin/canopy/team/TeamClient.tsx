"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setUserRoleAction, setUserStatusAction } from "@/lib/actions/team";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/canopy/rbac";

interface UserRow {
  email: string;
  role: Role;
  status: "active" | "disabled";
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string;
  last_signin_at: string | null;
  created_at: string;
}

interface Props {
  users: UserRow[];
  myEmail: string;
}

export default function TeamClient({ users: initial, myEmail }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRole(email: string, role: Role) {
    setError(null);
    setUsers((rs) => rs.map((u) => (u.email === email ? { ...u, role } : u)));
    start(async () => {
      const r = await setUserRoleAction({ email, role });
      if (!r.ok) setError(r.error);
    });
  }

  function handleStatus(email: string, status: "active" | "disabled") {
    setError(null);
    setUsers((rs) => rs.map((u) => (u.email === email ? { ...u, status } : u)));
    start(async () => {
      const r = await setUserStatusAction({ email, status });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="mt-8 space-y-4">
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}

      {users.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No DB-resident admin users yet. Env-allowlisted admins can use Canopy without appearing here. Inviting a teammate adds a row.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Invited by</th>
                <th className="px-4 py-2">Last signin</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => {
                const isMe = u.email === myEmail;
                return (
                  <tr key={u.email} className={isMe ? "bg-emerald-50/40" : ""}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-zinc-900">{u.email}</span>
                      {isMe ? <span className="ml-2 text-[10px] font-semibold text-emerald-700">(you)</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRole(u.email, e.target.value as Role)}
                        disabled={pending || isMe}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs shadow-sm disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status}
                        onChange={(e) => handleStatus(u.email, e.target.value as "active" | "disabled")}
                        disabled={pending || isMe}
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                        } disabled:opacity-50`}
                      >
                        <option value="active">active</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {u.invited_by ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {u.last_signin_at ? new Date(u.last_signin_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {pending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-center text-xs text-zinc-500">
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                    Saving...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Inviting a new teammate uses the existing /admin/users invitation flow. Once they accept, change their role here.
      </p>
    </div>
  );
}
