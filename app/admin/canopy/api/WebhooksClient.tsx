"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createWebhookAction,
  deleteWebhookAction,
  updateWebhookAction,
} from "@/lib/actions/webhooks";
import { type WebhookRow, WEBHOOK_EVENTS } from "@/lib/canopy/webhooks";

interface Props {
  initialWebhooks: WebhookRow[];
}

export default function WebhooksClient({ initialWebhooks }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>(initialWebhooks);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["*"]);
  const [revealedSecret, setRevealedSecret] = useState<{ id: number; secret: string } | null>(null);

  function toggleEvent(e: string) {
    if (e === "*") {
      setEvents(["*"]);
      return;
    }
    setEvents((prev) => {
      const without = prev.filter((x) => x !== "*");
      return without.includes(e) ? without.filter((x) => x !== e) : [...without, e];
    });
  }

  function handleCreate() {
    if (!name.trim() || !url.trim() || events.length === 0) return;
    setError(null);
    start(async () => {
      const r = await createWebhookAction({ name: name.trim(), url: url.trim(), events, enabled: true });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.secret) setRevealedSecret({ id: r.id, secret: r.secret });
      const newRow: WebhookRow = {
        id: r.id,
        name: name.trim(),
        url: url.trim(),
        events,
        enabled: true,
        last_audit_log_id: 0,
        fire_count: 0,
        fail_count: 0,
        created_by_email: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWebhooks((w) => [newRow, ...w]);
      setName("");
      setUrl("");
      setEvents(["*"]);
      setCreating(false);
    });
  }

  function handleToggle(id: number, enabled: boolean) {
    setError(null);
    setWebhooks((w) => w.map((x) => (x.id === id ? { ...x, enabled } : x)));
    start(async () => {
      const r = await updateWebhookAction({ id, enabled });
      if (!r.ok) setError(r.error);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this webhook?")) return;
    setError(null);
    start(async () => {
      const r = await deleteWebhookAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setWebhooks((w) => w.filter((x) => x.id !== id));
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900">Webhooks</h2>
          <p className="mt-1 text-xs text-zinc-600">
            POST signed events to your URL when records change. Signature header format:{" "}
            <code className="rounded bg-zinc-100 px-1 text-[10px]">Canopy-Signature: t=&lt;ts&gt;,v1=&lt;hex&gt;</code> -
            HMAC SHA-256 of <code>&lt;ts&gt;.&lt;body&gt;</code>.
          </p>
        </div>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Plus className="h-3.5 w-3.5" />
            New webhook
          </button>
        ) : null}
      </header>

      {error ? <p className="mb-3 text-xs text-rose-700">{error}</p> : null}

      {revealedSecret ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-900">
            Webhook secret. Copy this now - it will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-2 py-1.5 font-mono text-[11px] text-zinc-900">
              {revealedSecret.secret}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(revealedSecret.secret)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => setRevealedSecret(null)}
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
                placeholder="zapier deal-won hook"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">URL</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/..."
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              />
            </label>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Events</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEvent(e)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
                    events.includes(e)
                      ? "bg-zinc-900 text-white ring-zinc-900"
                      : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Selecting <code>*</code> subscribes to every audit-log event. Otherwise pick the specific actions.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !name.trim() || !url.trim() || events.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create webhook
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName("");
                setUrl("");
                setEvents(["*"]);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {webhooks.length === 0 ? (
        <p className="text-sm text-zinc-500">No webhooks yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {webhooks.map((w) => (
            <li key={w.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{w.name}</p>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-zinc-500">{w.url}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {w.events.map((e) => (
                      <span key={e} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                        {e}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500">
                    delivered {w.fire_count} - failed {w.fail_count}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={w.enabled}
                    onClick={() => handleToggle(w.id, !w.enabled)}
                    disabled={pending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      w.enabled ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        w.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(w.id)}
                    className="text-rose-600 hover:text-rose-800"
                    aria-label="Delete webhook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
