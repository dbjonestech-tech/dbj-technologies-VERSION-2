"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { createApiTokenAction, revokeApiTokenAction } from "@/lib/actions/api-tokens";
import { type ApiTokenRow, SCOPES, type Scope } from "@/lib/canopy/api-tokens";

interface Props {
  initialTokens: ApiTokenRow[];
}

export default function ApiTokensClient({ initialTokens }: Props) {
  const [tokens, setTokens] = useState<ApiTokenRow[]>(initialTokens);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Scope[]>(["read"]);
  const [revealed, setRevealed] = useState<{ id: number; plaintext: string; prefix: string } | null>(null);

  function toggleScope(s: Scope) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function handleCreate() {
    if (!name.trim() || scopes.length === 0) return;
    setError(null);
    start(async () => {
      const r = await createApiTokenAction({ name: name.trim(), scopes });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.plaintext && r.prefix) {
        setRevealed({ id: r.id, plaintext: r.plaintext, prefix: r.prefix });
      }
      const newRow: ApiTokenRow = {
        id: r.id,
        user_email: "you",
        name: name.trim(),
        prefix: r.prefix ?? "",
        scopes,
        last_used_at: null,
        expires_at: null,
        created_at: new Date().toISOString(),
        revoked_at: null,
      };
      setTokens((t) => [newRow, ...t]);
      setName("");
      setScopes(["read"]);
      setCreating(false);
    });
  }

  function handleRevoke(id: number) {
    if (!confirm("Revoke this token? Any client using it will start getting 401s immediately.")) return;
    setError(null);
    start(async () => {
      const r = await revokeApiTokenAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setTokens((t) =>
        t.map((x) => (x.id === id ? { ...x, revoked_at: new Date().toISOString() } : x))
      );
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900">API tokens</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Bearer tokens for the REST API. The plaintext token is shown ONCE at creation; copy it now.
          </p>
        </div>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Plus className="h-3.5 w-3.5" />
            New token
          </button>
        ) : null}
      </header>

      {error ? <p className="mb-3 text-xs text-rose-700">{error}</p> : null}

      {revealed ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-900">
            Token created. Copy this now - it will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-2 py-1.5 font-mono text-[11px] text-zinc-900">
              {revealed.plaintext}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(revealed.plaintext)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {creating ? (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="zapier integration"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              />
            </label>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Scopes</span>
              <div className="mt-1 flex gap-2">
                {SCOPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleScope(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
                      scopes.includes(s)
                        ? "bg-zinc-900 text-white ring-zinc-900"
                        : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !name.trim() || scopes.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create token
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName("");
                setScopes(["read"]);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {tokens.length === 0 ? (
        <p className="text-sm text-zinc-500">No tokens yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {tokens.map((t) => {
            const revoked = t.revoked_at !== null;
            return (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${revoked ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                      {t.name}
                    </p>
                    <span className="font-mono text-[10px] text-zinc-500">{t.prefix}...</span>
                    {t.scopes.map((s) => (
                      <span key={s} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                        {s}
                      </span>
                    ))}
                    {revoked ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">revoked</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                    {t.user_email} - created {new Date(t.created_at).toLocaleDateString()}
                    {t.last_used_at ? ` - last used ${new Date(t.last_used_at).toLocaleDateString()}` : " - never used"}
                  </p>
                </div>
                {!revoked ? (
                  <button
                    type="button"
                    onClick={() => handleRevoke(t.id)}
                    className="text-rose-600 hover:text-rose-800"
                    aria-label="Revoke token"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
