"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Search } from "lucide-react";

interface ClientRow {
  contact_id: number;
  email: string;
  name: string | null;
  company: string | null;
  beacon_count: number;
  last_recorded_at: string | null;
}

interface Props {
  clients: ClientRow[];
  canopyOrigin: string;
  exampleSnippet: string;
}

function buildSnippet(contactId: number, origin: string): string {
  const o = origin.replace(/\/$/, "");
  const URL = `${o}/api/canopy/beacon/${contactId}`;
  return `<script>(function(){var ID=${contactId};var URL=${JSON.stringify(URL)};function s(k,p){try{var b=JSON.stringify({metric_kind:k,payload:p||{},value:null,origin:location.origin});if(navigator.sendBeacon){navigator.sendBeacon(URL,new Blob([b],{type:"application/json"}));}else{fetch(URL,{method:"POST",headers:{"content-type":"application/json"},body:b,keepalive:true,mode:"no-cors"}).catch(function(){});}}catch(_){}}s("pageview",{path:location.pathname,referrer:document.referrer||null});document.addEventListener("submit",function(e){var t=e.target;if(t&&t.tagName==="FORM"){s("form_submit",{form_id:t.id||null});}},true);})();</script>`;
}

export default function BeaconClient({
  clients,
  canopyOrigin,
  exampleSnippet,
}: Props) {
  const [selected, setSelected] = useState<number | null>(
    clients[0]?.contact_id ?? null
  );
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
    );
  }, [clients, filter]);

  const snippet =
    selected !== null
      ? buildSnippet(selected, canopyOrigin)
      : exampleSnippet;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,1.4fr]">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Won-deal clients
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Only contacts with at least one won deal appear here. Pick one to generate a snippet keyed to its contact id.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1">
          <Search className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by email, name, company"
            className="block w-full bg-transparent text-xs focus:outline-none"
          />
        </div>
        <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <li className="rounded-md border border-dashed border-zinc-200 p-3 text-center text-xs text-zinc-500">
              No matching clients yet.
            </li>
          ) : (
            filtered.map((c) => {
              const active = c.contact_id === selected;
              return (
                <li key={c.contact_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.contact_id)}
                    className={`block w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${active ? "border-lime-300 bg-lime-50 text-lime-900" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    <div className="font-semibold">
                      {c.company || c.name || c.email}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {c.email}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="font-mono">id {c.contact_id}</span>
                      <span>•</span>
                      <span>{c.beacon_count} beacons</span>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Snippet
          </h2>
          <button
            type="button"
            onClick={copySnippet}
            disabled={selected === null}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Paste this just before the closing <code className="font-mono">&lt;/body&gt;</code> tag on the client&apos;s site. The snippet sends a pageview on every load and a form_submit on every {`<form>`} submission. No third-party calls; no PII in payload.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[10px] leading-relaxed text-zinc-800">
          <code>{snippet}</code>
        </pre>
        {selected === null ? (
          <p className="mt-3 text-xs text-zinc-500">
            Pick a client on the left to generate a real snippet. The example above is keyed to id 0 (placeholder).
          </p>
        ) : null}
      </section>
    </div>
  );
}
