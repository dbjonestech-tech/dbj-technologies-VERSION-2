"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Mail, Sparkles, X } from "lucide-react";
import { sendEmailAction } from "@/lib/actions/email";
import { renderTemplate, type RenderContext } from "@/lib/email/render";

interface TemplateOption {
  id: number;
  name: string;
  subject: string;
  bodyMarkdown: string;
}

interface Props {
  contactId: number;
  dealId: number | null;
  contactEmail: string;
  contactName: string | null;
  contactCompany: string | null;
  fromEmail: string | null;
  templates: TemplateOption[];
  ableToSend: boolean;
  unavailableReason: string | null;
}

export default function EmailComposePanel({
  contactId,
  dealId,
  contactEmail,
  contactName,
  contactCompany,
  fromEmail,
  templates,
  ableToSend,
  unavailableReason,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const previewCtx: RenderContext = useMemo(
    () => ({
      contact: {
        id: contactId,
        email: contactEmail,
        name: contactName,
        company: contactCompany,
        phone: null,
        website: null,
        pathlightScanId: null,
      },
      deal: null,
      pathlight: null,
      user: { email: fromEmail ?? "", name: null },
    }),
    [contactId, contactEmail, contactName, contactCompany, fromEmail]
  );

  const previewSubject = useMemo(
    () => renderTemplate(subject, previewCtx),
    [subject, previewCtx]
  );
  const previewBody = useMemo(
    () => renderTemplate(body, previewCtx),
    [body, previewCtx]
  );

  function applyTemplate(id: number) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.bodyMarkdown);
    setTemplateId(id);
  }

  function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setError(null);
    setInfo(null);
    start(async () => {
      const r = await sendEmailAction({
        contactId,
        dealId,
        templateId,
        subject,
        bodyMarkdown: body,
      });
      if (!r.ok) {
        setError(r.error ?? "Send failed.");
        return;
      }
      setInfo(`Sent. Tracking pixel + click rewrites are live.`);
      setSubject("");
      setBody("");
      setTemplateId(null);
      setOpen(false);
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-zinc-500" />
          <h2 className="font-display text-sm font-semibold text-zinc-900">
            Email
          </h2>
        </div>
        {ableToSend ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            {open ? "Close compose" : "Compose"}
          </button>
        ) : (
          <span className="text-xs text-zinc-500">
            {unavailableReason ?? "Connect Gmail in /admin/canopy first."}
          </span>
        )}
      </header>

      {open && ableToSend && (
        <div className="space-y-3 px-5 py-4 text-sm">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              From: <span className="font-mono text-zinc-700">{fromEmail}</span>
            </span>
            <span>
              To: <span className="font-mono text-zinc-700">{contactEmail}</span>
            </span>
          </div>

          {templates.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Template
              </label>
              <select
                value={templateId ?? ""}
                onChange={(e) =>
                  e.target.value ? applyTemplate(Number(e.target.value)) : setTemplateId(null)
                }
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Use {{contact.first_name}} or {{deal.value}} for merge fields"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder={"Hi {{contact.first_name}},\n\n..."}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 font-mono text-sm"
            />
          </div>

          {(subject.includes("{{") || body.includes("{{")) && (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
              <div className="mb-1 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" /> Live preview
              </div>
              <div className="font-medium">{previewSubject || "(no subject)"}</div>
              <div className="mt-1 whitespace-pre-wrap text-zinc-700">
                {previewBody || "(no body)"}
              </div>
              <p className="mt-2 text-[11px] text-sky-700">
                Final render uses live contact and deal data; preview here uses
                only the visible contact fields.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
              {info}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
