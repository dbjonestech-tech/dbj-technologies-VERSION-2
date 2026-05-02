"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createCustomFieldDefinitionAction,
  deleteCustomFieldDefinitionAction,
  updateCustomFieldDefinitionAction,
} from "@/lib/actions/custom-fields";
import {
  CUSTOM_FIELD_KINDS,
  type CustomFieldDefinition,
  type CustomFieldEntity,
  type CustomFieldKind,
} from "@/lib/canopy/custom-fields";

interface Props {
  contactDefs: CustomFieldDefinition[];
  dealDefs: CustomFieldDefinition[];
}

export default function CustomFieldsManagerClient({ contactDefs, dealDefs }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Custom fields
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          Define per-install fields the operator can fill on every contact or deal. Use this to adapt Canopy to a vertical without changing the schema (vehicle VIN, insurance provider, case type, statute date, etc.).
        </p>
      </header>

      <EntitySection entityType="contact" defs={contactDefs} />
      <EntitySection entityType="deal" defs={dealDefs} />
    </section>
  );
}

function EntitySection({
  entityType,
  defs,
}: {
  entityType: CustomFieldEntity;
  defs: CustomFieldDefinition[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="mt-6 first:mt-0">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {entityType === "contact" ? "Contact fields" : "Deal fields"}
        </h3>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add field"}
        </button>
      </header>
      {adding ? (
        <NewFieldForm
          entityType={entityType}
          onDone={() => setAdding(false)}
        />
      ) : null}
      {defs.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
          No {entityType} fields defined yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {defs.map((def) => (
            <DefRow key={def.id} def={def} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewFieldForm({
  entityType,
  onDone,
}: {
  entityType: CustomFieldEntity;
  onDone: () => void;
}) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<CustomFieldKind>("text");
  const [optionsRaw, setOptionsRaw] = useState("");
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const needsOptions = kind === "select" || kind === "multi_select";

  function submit() {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setError(null);
    start(async () => {
      const r = await createCustomFieldDefinitionAction({
        entityType,
        label,
        kind,
        options: needsOptions ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        required,
        description: description || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setLabel("");
      setKind("text");
      setOptionsRaw("");
      setRequired(false);
      setDescription("");
      onDone();
    });
  }

  return (
    <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Label">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Vehicle VIN, Insurance provider, ..."
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
        <Field label="Kind">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CustomFieldKind)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          >
            {CUSTOM_FIELD_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Required">
          <label className="flex h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-400"
            />
            <span className="text-xs text-zinc-700">Operator must fill this field</span>
          </label>
        </Field>
      </div>
      {needsOptions ? (
        <div className="mt-3">
          <Field label="Options (comma-separated)">
            <input
              type="text"
              value={optionsRaw}
              onChange={(e) => setOptionsRaw(e.target.value)}
              placeholder="Option A, Option B, Option C"
              disabled={pending}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
            />
          </Field>
        </div>
      ) : null}
      <div className="mt-3">
        <Field label="Description (optional)">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Helper text shown beneath the field on contact/deal pages"
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
      </div>
      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Add field
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DefRow({ def }: { def: CustomFieldDefinition }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(def.label);
  const [optionsRaw, setOptionsRaw] = useState((def.options ?? []).join(", "));
  const [required, setRequired] = useState(def.required);
  const [description, setDescription] = useState(def.description ?? "");

  function save() {
    setError(null);
    start(async () => {
      const r = await updateCustomFieldDefinitionAction({
        id: def.id,
        label,
        options: optionsRaw.split(",").map((s) => s.trim()).filter(Boolean),
        required,
        description,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEditing(false);
    });
  }
  function destroy() {
    if (!confirm(`Delete custom field "${def.label}"? This will also strip its values from every existing ${def.entity_type}.`)) return;
    setError(null);
    start(async () => {
      const r = await deleteCustomFieldDefinitionAction(def.id);
      if (!r.ok) setError(r.error);
    });
  }

  if (editing) {
    return (
      <li className="bg-zinc-50/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Label">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={pending}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Required">
            <label className="flex h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                disabled={pending}
                className="h-4 w-4 rounded border-zinc-300 text-violet-600"
              />
              <span className="text-xs text-zinc-700">Required</span>
            </label>
          </Field>
        </div>
        {(def.kind === "select" || def.kind === "multi_select") ? (
          <div className="mt-3">
            <Field label="Options">
              <input
                type="text"
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                disabled={pending}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
        ) : null}
        <div className="mt-3">
          <Field label="Description">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>
        {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-zinc-900">{def.label}</p>
          <span className="font-mono text-[10px] text-zinc-500">{def.key}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            {def.kind}
          </span>
          {def.required ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
              required
            </span>
          ) : null}
        </div>
        {def.description ? (
          <p className="mt-0.5 text-[11px] text-zinc-500">{def.description}</p>
        ) : null}
        {def.options && def.options.length > 0 ? (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Options: {def.options.join(" · ")}
          </p>
        ) : null}
        {error ? <p className="mt-1 text-[11px] text-red-700">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          className="text-[11px] font-semibold text-violet-700 hover:underline disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={destroy}
          disabled={pending}
          aria-label={`Delete ${def.label}`}
          className="text-zinc-400 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
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
