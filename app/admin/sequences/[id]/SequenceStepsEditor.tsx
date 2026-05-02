"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  addSequenceStepAction,
  deleteSequenceStepAction,
} from "@/lib/actions/sequences";
import {
  describeStep,
  formatDelay,
  type SequenceRow,
  type SequenceStepKind,
  type SequenceStepRow,
} from "@/lib/canopy/automation/sequences";

interface Props {
  sequence: SequenceRow;
  initialSteps: SequenceStepRow[];
}

const PRESET_DELAYS: Array<{ label: string; seconds: number }> = [
  { label: "Immediately", seconds: 0 },
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
  { label: "7 days", seconds: 604800 },
  { label: "14 days", seconds: 1209600 },
];

export default function SequenceStepsEditor({ sequence, initialSteps }: Props) {
  const [steps, setSteps] = useState<SequenceStepRow[]>(initialSteps);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<SequenceStepKind>("task");
  const [delay, setDelay] = useState<number>(0);
  const [taskTitle, setTaskTitle] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [stageValue, setStageValue] = useState("contacted");

  function buildPayload(): Record<string, unknown> {
    switch (kind) {
      case "task":
        return { title: taskTitle, due_in_days: 0 };
      case "email":
        return { subject: emailSubject, body: emailBody };
      case "wait":
        return {};
      case "tag":
        return { tag: tagValue };
      case "stage_change":
        return { stage: stageValue };
    }
  }

  function payloadValid(): boolean {
    if (kind === "task") return taskTitle.trim().length > 0;
    if (kind === "email") return emailSubject.trim().length > 0;
    if (kind === "tag") return tagValue.trim().length > 0;
    return true;
  }

  function reset() {
    setKind("task");
    setDelay(0);
    setTaskTitle("");
    setEmailSubject("");
    setEmailBody("");
    setTagValue("");
    setStageValue("contacted");
    setAdding(false);
  }

  function handleAdd() {
    if (!payloadValid()) return;
    setError(null);
    start(async () => {
      const payload = buildPayload();
      const r = await addSequenceStepAction({
        sequence_id: sequence.id,
        kind,
        payload,
        delay_seconds: delay,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const newStep: SequenceStepRow = {
        id: r.id,
        sequence_id: sequence.id,
        step_order: steps.length,
        kind,
        payload,
        delay_seconds: delay,
        created_at: new Date().toISOString(),
      };
      setSteps((s) => [...s, newStep]);
      reset();
    });
  }

  function handleDelete(stepId: number) {
    if (!confirm("Remove this step?")) return;
    setError(null);
    start(async () => {
      const r = await deleteSequenceStepAction({ step_id: stepId, sequence_id: sequence.id });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSteps((s) => s.filter((x) => x.id !== stepId));
    });
  }

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">Steps</h2>
        <p className="mt-0.5 text-xs text-zinc-600">
          {steps.length === 0 ? "No steps yet. Add the first one below." : `${steps.length} step${steps.length === 1 ? "" : "s"}.`}
        </p>
      </header>

      {steps.length > 0 ? (
        <ol className="mb-6 space-y-2">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-zinc-500">{i + 1}.</span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{describeStep(step)}</p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    Wait {formatDelay(step.delay_seconds)} {i === 0 ? "(after enrollment)" : "(after previous step)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(step.id)}
                disabled={pending}
                className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                aria-label="Remove step"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {adding ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Kind</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as SequenceStepKind)}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="task">Task</option>
                <option value="email">Email (deferred until Phase 4)</option>
                <option value="wait">Wait</option>
                <option value="tag">Add tag</option>
                <option value="stage_change">Change stage</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Delay</span>
              <select
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                {PRESET_DELAYS.map((d) => (
                  <option key={d.seconds} value={d.seconds}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3">
            {kind === "task" ? (
              <Field label="Task title" value={taskTitle} onChange={setTaskTitle} placeholder="Send proposal" />
            ) : kind === "email" ? (
              <div className="space-y-3">
                <Field label="Subject" value={emailSubject} onChange={setEmailSubject} placeholder="Following up" />
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Body</span>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
                  />
                </label>
                <p className="text-[11px] text-amber-700">
                  Phase 4 will deliver this. For now this step no-ops cleanly.
                </p>
              </div>
            ) : kind === "tag" ? (
              <Field label="Tag" value={tagValue} onChange={setTagValue} placeholder="hot-lead" />
            ) : kind === "stage_change" ? (
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Stage</span>
                <select
                  value={stageValue}
                  onChange={(e) => setStageValue(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  {["new", "contacted", "qualified", "proposal", "won", "lost"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || !payloadValid()}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add step
            </button>
            <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-zinc-900">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4" />
          Add step
        </button>
      )}

      {error ? <p className="mt-3 text-xs text-rose-700">{error}</p> : null}
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
