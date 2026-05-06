"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { triggerAdminScanAction } from "@/lib/actions/pathlight-admin-scan";

/**
 * Inline form for /admin/scans/new. Calls triggerAdminScanAction
 * (Server Action), then either:
 *   - on success, opens /pathlight/[scanId] in a new tab so Joshua
 *     can show the live report to a prospect on a sales call AND
 *     keeps the admin page open so a follow-up scan is one click
 *     away,
 *   - on failure, surfaces the gate's user-facing reason inline so
 *     the operator can fix it (toggle prospecting on, raise budget,
 *     fix the URL) without context-switching.
 *
 * useTransition keeps the submit button disabled during the queue
 * round-trip so a double-click cannot fire two scans in a row;
 * tryReserveScan would catch the duplicate but the UX is cleaner
 * if the second click never happens.
 */

const INPUT_CLASS =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none";

export function AdminScanForm({
  defaultEmail,
  budgetRemaining,
}: {
  defaultEmail: string;
  budgetRemaining: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("Dallas");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await triggerAdminScanAction({
        url,
        email,
        businessName: businessName || null,
        city: city || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      /* Open the public report page in a new tab so Joshua can
       * show the live scan to a prospect on the sales call without
       * losing the admin form. Then refresh the admin route so
       * any list views (e.g. the /admin/scans table on the prior
       * page) pick up the new row on next navigation. */
      const reportUrl = `/pathlight/${result.scanId}`;
      window.open(reportUrl, "_blank", "noopener,noreferrer");
      router.refresh();
      setUrl("");
      setBusinessName("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="URL" required>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          autoFocus
          placeholder="https://prospect-site.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={pending}
          className={INPUT_CLASS}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Recipient email"
          required
          hint="The address that will receive the report email and follow-up sequence."
        >
          <input
            type="email"
            autoComplete="off"
            placeholder="prospect@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className={INPUT_CLASS}
            required
          />
        </Field>
        <Field label="Business name">
          <input
            type="text"
            autoComplete="off"
            placeholder="Mockingbird Optical"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={pending}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <Field label="City">
        <input
          type="text"
          autoComplete="address-level2"
          placeholder="Dallas"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={pending}
          className={INPUT_CLASS}
        />
      </Field>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Queuing scan..." : "Run scan"}
        </button>
        <p className="text-xs text-zinc-500">
          {budgetRemaining !== null && budgetRemaining >= 0
            ? `${budgetRemaining} scan${budgetRemaining === 1 ? "" : "s"} remaining this period.`
            : null}
          {budgetRemaining !== null && budgetRemaining >= 0 ? " " : ""}
          Opens the live report in a new tab.{" "}
          <Link
            href="/admin/canopy"
            className="text-zinc-700 underline-offset-2 hover:underline"
          >
            Adjust budget
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required ? (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}
