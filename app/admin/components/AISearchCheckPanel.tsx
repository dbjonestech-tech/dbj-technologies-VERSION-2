"use client";

import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { recordAiSearchCheckAction } from "@/lib/actions/ai-search-checks";
import {
  AI_SEARCH_ENGINES,
  AI_SEARCH_SENTIMENTS,
  type AiSearchCheckRow,
  type AiSearchEngine,
  type AiSearchSentiment,
} from "@/lib/services/ai-search-checks";

interface Props {
  contactId: number;
  initialChecks: AiSearchCheckRow[];
}

export default function AISearchCheckPanel({ contactId, initialChecks }: Props) {
  const [checks, setChecks] = useState<AiSearchCheckRow[]>(initialChecks);
  const [engine, setEngine] = useState<AiSearchEngine>("chatgpt");
  const [query, setQuery] = useState("");
  const [resultText, setResultText] = useState("");
  const [mentioned, setMentioned] = useState<boolean>(false);
  const [sentiment, setSentiment] = useState<AiSearchSentiment>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    if (!query.trim()) {
      setError("Query is required");
      return;
    }
    start(async () => {
      const r = await recordAiSearchCheckAction({
        contactId,
        engine,
        query,
        resultText,
        mentioned,
        sentiment,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setChecks((prev) => [r.data, ...prev].slice(0, 30));
      setQuery("");
      setResultText("");
      setMentioned(false);
      setSentiment("unknown");
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-zinc-900">
          <Search className="h-4 w-4 text-violet-700" />
          AI search visibility
        </h3>
        <p className="mt-0.5 text-xs text-zinc-600">
          Manually log how this business shows up in AI search engines. Paste the result; we track sentiment and whether they were mentioned over time.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Engine">
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as AiSearchEngine)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          >
            {AI_SEARCH_ENGINES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </Field>
        <Field label="Query">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={pending}
            placeholder='Best auto shop in Richardson, TX'
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Result text (paste the engine response)">
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={4}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Mentioned?">
          <label className="flex h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={mentioned}
              onChange={(e) => setMentioned(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
            <span className="text-xs text-zinc-700">Business name appeared in result</span>
          </label>
        </Field>
        <Field label="Sentiment">
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value as AiSearchSentiment)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          >
            {AI_SEARCH_SENTIMENTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Record check
      </button>

      {checks.length > 0 ? (
        <div className="mt-6">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent checks
          </h4>
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.id} className="rounded-lg border border-zinc-200 bg-zinc-50/40 p-3">
                <div className="flex flex-wrap items-baseline gap-2 text-xs">
                  <span className="font-mono uppercase tracking-wider text-zinc-700">
                    {c.engine}
                  </span>
                  <span className="text-zinc-400">{new Date(c.checked_at).toLocaleString()}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      c.mentioned
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {c.mentioned ? "Mentioned" : "Not mentioned"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sentimentTint(c.sentiment)}`}
                  >
                    {c.sentiment}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-700">"{c.query}"</p>
                {c.result_text ? (
                  <p className="mt-1 text-xs text-zinc-600">{c.result_text}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function sentimentTint(s: AiSearchSentiment): string {
  if (s === "positive") return "bg-emerald-100 text-emerald-700";
  if (s === "negative") return "bg-rose-100 text-rose-700";
  if (s === "neutral") return "bg-blue-100 text-blue-700";
  return "bg-zinc-200 text-zinc-700";
}
