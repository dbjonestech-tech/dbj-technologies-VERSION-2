"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { setEntityCustomFieldAction } from "@/lib/actions/custom-fields";
import type { CustomFieldDefinition } from "@/lib/canopy/custom-fields";

interface Props {
  entityType: "contact" | "deal";
  entityId: number;
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
}

export default function CustomFieldsPanel({
  entityType,
  entityId,
  definitions,
  values,
}: Props) {
  if (definitions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-center">
        <p className="text-sm text-zinc-600">
          No custom fields defined for this entity yet.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Define fields under <a href="/admin/canopy" className="font-semibold text-violet-700 hover:underline">Canopy controls -&gt; Custom fields</a> to track per-vertical data (vehicle VIN, insurance provider, statute date, etc.).
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="text-base font-display font-semibold text-zinc-900">
          Custom fields
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Fields defined for {entityType === "contact" ? "contacts" : "deals"} on this Canopy install. Edits autosave.
        </p>
      </header>
      <div className="space-y-4">
        {definitions.map((def) => (
          <FieldRow
            key={def.id}
            def={def}
            entityType={entityType}
            entityId={entityId}
            initial={values[def.key]}
          />
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  def,
  entityType,
  entityId,
  initial,
}: {
  def: CustomFieldDefinition;
  entityType: "contact" | "deal";
  entityId: number;
  initial: unknown;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function persist(next: unknown) {
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await setEntityCustomFieldAction({
        entityType,
        entityId,
        key: def.key,
        value: next,
      });
      if (!r.ok) {
        setError(r.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <label className="block">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {def.label}
        </span>
        {def.required ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">required</span>
        ) : null}
        {pending ? <Loader2 className="h-3 w-3 animate-spin text-zinc-400" /> : null}
        {saved ? <Save className="h-3 w-3 text-emerald-600" /> : null}
      </div>
      <FieldInput def={def} initial={initial} onPersist={persist} disabled={pending} />
      {def.description ? (
        <p className="mt-1 text-[11px] text-zinc-500">{def.description}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[11px] text-red-700">{error}</p>
      ) : null}
    </label>
  );
}

function FieldInput({
  def,
  initial,
  onPersist,
  disabled,
}: {
  def: CustomFieldDefinition;
  initial: unknown;
  onPersist: (v: unknown) => void;
  disabled?: boolean;
}) {
  switch (def.kind) {
    case "text":
    case "url":
      return <TextInput initial={typeof initial === "string" ? initial : ""} onPersist={onPersist} disabled={disabled} />;
    case "number":
      return <NumberInput initial={typeof initial === "number" ? initial : null} onPersist={onPersist} disabled={disabled} />;
    case "date":
      return <DateInput initial={typeof initial === "string" ? initial : ""} onPersist={onPersist} disabled={disabled} />;
    case "select":
      return <SelectInput options={def.options ?? []} initial={typeof initial === "string" ? initial : ""} onPersist={onPersist} disabled={disabled} />;
    case "multi_select":
      return <MultiSelectInput options={def.options ?? []} initial={Array.isArray(initial) ? (initial as string[]) : []} onPersist={onPersist} disabled={disabled} />;
    case "checkbox":
      return <CheckboxInput initial={initial === true} onPersist={onPersist} disabled={disabled} />;
  }
}

function TextInput({ initial, onPersist, disabled }: { initial: string; onPersist: (v: string) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(initial);
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== initial) onPersist(draft); }}
      disabled={disabled}
      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
    />
  );
}

function NumberInput({ initial, onPersist, disabled }: { initial: number | null; onPersist: (v: number | null) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(initial === null ? "" : String(initial));
  return (
    <input
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === "") { onPersist(null); return; }
        const n = Number(draft);
        if (Number.isFinite(n) && n !== initial) onPersist(n);
      }}
      disabled={disabled}
      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
    />
  );
}

function DateInput({ initial, onPersist, disabled }: { initial: string; onPersist: (v: string | null) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(initial.slice(0, 10));
  return (
    <input
      type="date"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        onPersist(e.target.value || null);
      }}
      disabled={disabled}
      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
    />
  );
}

function SelectInput({ options, initial, onPersist, disabled }: { options: string[]; initial: string; onPersist: (v: string | null) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(initial);
  return (
    <select
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        onPersist(e.target.value || null);
      }}
      disabled={disabled}
      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
    >
      <option value="">-</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function MultiSelectInput({ options, initial, onPersist, disabled }: { options: string[]; initial: string[]; onPersist: (v: string[]) => void; disabled?: boolean }) {
  const [selected, setSelected] = useState<string[]>(initial);
  function toggle(opt: string) {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    setSelected(next);
    onPersist(next);
  }
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => toggle(o)}
            disabled={disabled}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors disabled:opacity-50 ${
              active
                ? "bg-violet-100 text-violet-800 ring-violet-300"
                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxInput({ initial, onPersist, disabled }: { initial: boolean; onPersist: (v: boolean) => void; disabled?: boolean }) {
  const [checked, setChecked] = useState(initial);
  return (
    <label className="mt-1 inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          onPersist(e.target.checked);
        }}
        disabled={disabled}
        className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-400 disabled:opacity-50"
      />
      <span className="text-sm text-zinc-700">{checked ? "Yes" : "No"}</span>
    </label>
  );
}
