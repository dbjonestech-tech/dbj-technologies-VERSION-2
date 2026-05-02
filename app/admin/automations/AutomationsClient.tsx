"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createWorkflowRuleAction,
  deleteWorkflowRuleAction,
  toggleWorkflowRuleAction,
} from "@/lib/actions/workflow-rules";
import {
  TRIGGER_EVENTS,
  ACTION_KINDS,
  type ActionKind,
  type TriggerEvent,
  type WorkflowAction,
  type WorkflowRuleRow,
} from "@/lib/canopy/automation/workflow-rules";
import type { SequenceRow } from "@/lib/canopy/automation/sequences";

interface Props {
  initialRules: WorkflowRuleRow[];
  sequences: SequenceRow[];
}

export default function AutomationsClient({ initialRules, sequences }: Props) {
  const [rules, setRules] = useState<WorkflowRuleRow[]>(initialRules);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function handleToggle(id: number, enabled: boolean) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled } : r)));
    start(async () => {
      const result = await toggleWorkflowRuleAction({ id, enabled });
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this rule?")) return;
    start(async () => {
      const result = await deleteWorkflowRuleAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRules((rs) => rs.filter((r) => r.id !== id));
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">
          {rules.length === 0 ? "No rules yet." : `${rules.length} rule${rules.length === 1 ? "" : "s"}.`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4" />
          New rule
        </button>
      </div>

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}

      {creating ? (
        <CreateRuleForm
          sequences={sequences}
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            start(async () => {
              const result = await createWorkflowRuleAction(input);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              const newRule: WorkflowRuleRow = {
                id: result.id,
                name: input.name,
                description: input.description ?? null,
                trigger_event: input.trigger_event,
                conditions: input.conditions,
                actions: input.actions,
                enabled: input.enabled,
                last_evaluated_at: null,
                last_audit_log_id: 0,
                fire_count: 0,
                created_by_email: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setRules((rs) => [newRule, ...rs]);
              setCreating(false);
            })
          }
        />
      ) : null}

      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <article key={rule.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-zinc-900">{rule.name}</h3>
                  {rule.description ? <p className="mt-0.5 text-xs text-zinc-600">{rule.description}</p> : null}
                  <p className="mt-2 font-mono text-[11px] text-zinc-500">
                    when <span className="font-semibold text-zinc-700">{rule.trigger_event}</span>
                    {" -> "}
                    {rule.actions.length === 0
                      ? "(no actions)"
                      : rule.actions.map((a) => a.kind).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    fired {rule.fire_count}x
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.enabled}
                    onClick={() => handleToggle(rule.id, !rule.enabled)}
                    disabled={pending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      rule.enabled ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    className="text-rose-600 hover:text-rose-800"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {Object.keys(rule.conditions).length > 0 ? (
                <details className="mt-3 text-xs text-zinc-600">
                  <summary className="cursor-pointer text-zinc-500">Conditions</summary>
                  <pre className="mt-1 overflow-x-auto rounded bg-zinc-50 p-2 text-[11px]">
                    {JSON.stringify(rule.conditions, null, 2)}
                  </pre>
                </details>
              ) : null}

              {rule.actions.length > 0 ? (
                <details className="mt-2 text-xs text-zinc-600">
                  <summary className="cursor-pointer text-zinc-500">Actions ({rule.actions.length})</summary>
                  <pre className="mt-1 overflow-x-auto rounded bg-zinc-50 p-2 text-[11px]">
                    {JSON.stringify(rule.actions, null, 2)}
                  </pre>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface CreateInput {
  name: string;
  description?: string | null;
  trigger_event: TriggerEvent;
  conditions: Record<string, unknown>;
  actions: WorkflowAction[];
  enabled: boolean;
}

function CreateRuleForm({
  sequences,
  pending,
  onCancel,
  onSubmit,
}: {
  sequences: SequenceRow[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateInput) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<TriggerEvent>("deal.stage_change");
  const [conditionField, setConditionField] = useState("stage");
  const [conditionValue, setConditionValue] = useState("qualified");
  const [actionKind, setActionKind] = useState<ActionKind>("create_task");
  const [actionTaskTitle, setActionTaskTitle] = useState("");
  const [actionTaskDays, setActionTaskDays] = useState(2);
  const [actionTag, setActionTag] = useState("");
  const [actionStage, setActionStage] = useState("contacted");
  const [actionSequenceId, setActionSequenceId] = useState<number>(sequences[0]?.id ?? 0);
  const [enabled, setEnabled] = useState(true);

  function buildActionPayload(): Record<string, unknown> {
    switch (actionKind) {
      case "create_task":
        return { title: actionTaskTitle, due_in_days: actionTaskDays, priority: "medium" };
      case "add_tag":
      case "remove_tag":
        return { tag: actionTag };
      case "change_stage":
        return { stage: actionStage };
      case "enroll_in_sequence":
        return { sequence_id: actionSequenceId };
      case "trigger_pathlight_scan":
        return { reason: `Triggered by rule '${name}'` };
      case "send_email":
        return { subject: "Following up", body: "" };
      default:
        return {};
    }
  }

  function actionFormValid(): boolean {
    if (actionKind === "create_task") return actionTaskTitle.trim().length > 0;
    if (actionKind === "add_tag" || actionKind === "remove_tag") return actionTag.trim().length > 0;
    if (actionKind === "enroll_in_sequence") return actionSequenceId > 0;
    return true;
  }

  function handleCreate() {
    if (!name.trim() || !actionFormValid()) return;
    const conditions = conditionField.trim()
      ? { match: { [conditionField.trim()]: conditionValue.trim() } }
      : {};
    const action: WorkflowAction = { kind: actionKind, payload: buildActionPayload() };
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      trigger_event: trigger,
      conditions,
      actions: [action],
      enabled,
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-base font-semibold text-zinc-900">New workflow rule</h2>
      <p className="mt-1 text-xs text-zinc-600">
        Single condition + single action for now. Multi-action rules can be wired by editing the rule's JSON in the audit log later.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" value={name} onChange={setName} placeholder="Auto-create proposal task" />
        <Field label="Description" value={description} onChange={setDescription} placeholder="Optional" />
      </div>

      <div className="mt-4 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Trigger</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Event</span>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as TriggerEvent)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              {TRIGGER_EVENTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <Field label='Match field (e.g. "stage")' value={conditionField} onChange={setConditionField} />
          <Field label="Match value" value={conditionValue} onChange={setConditionValue} />
        </div>
        <p className="text-[11px] text-zinc-500">
          Leave the match field empty to fire on every event of this type. Use prefixes like <code>before.stage</code> or <code>after.stage</code> to target the audit row's before / after JSON.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Action</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Action kind</span>
            <select
              value={actionKind}
              onChange={(e) => setActionKind(e.target.value as ActionKind)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              {ACTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          {actionKind === "create_task" ? (
            <>
              <Field label="Task title" value={actionTaskTitle} onChange={setActionTaskTitle} />
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Due in N days</span>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={actionTaskDays}
                  onChange={(e) => setActionTaskDays(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
              </label>
            </>
          ) : actionKind === "add_tag" || actionKind === "remove_tag" ? (
            <Field label="Tag" value={actionTag} onChange={setActionTag} placeholder="hot-lead" />
          ) : actionKind === "change_stage" ? (
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Stage</span>
              <select
                value={actionStage}
                onChange={(e) => setActionStage(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                {["new", "contacted", "qualified", "proposal", "won", "lost"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : actionKind === "enroll_in_sequence" ? (
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sequence</span>
              <select
                value={actionSequenceId}
                onChange={(e) => setActionSequenceId(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                {sequences.length === 0 ? <option value={0}>No sequences available</option> : null}
                {sequences.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable immediately
        </label>
        <button
          type="button"
          onClick={handleCreate}
          disabled={pending || !name.trim() || !actionFormValid()}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create rule
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-900">
          Cancel
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
      />
    </label>
  );
}
