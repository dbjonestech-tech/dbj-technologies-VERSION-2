"use client";

import { useCallback, useState, useTransition } from "react";
import { CalendarPlus, MessageSquare, Phone, PenLine, ListPlus, Loader2 } from "lucide-react";
import {
  logCallAction,
  logMeetingAction,
  logNoteAction,
  createTaskAction,
} from "@/lib/actions/activities";
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/services/activities";
import { useToast } from "./Toast";

type Mode = "note" | "call" | "meeting" | "task";

interface Props {
  contactId?: number | null;
  dealId?: number | null;
  /* Default mode shown on first render. Defaults to "note". */
  initialMode?: Mode;
}

export default function ActivityComposer({ contactId, dealId, initialMode = "note" }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  function reset() {
    setError(null);
  }

  const onSuccess = useCallback(
    (message: string) => {
      toast.show({ tone: "success", message });
    },
    [toast]
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Log activity
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <ModeButton mode="note"    current={mode} setMode={(m) => { setMode(m); reset(); }} icon={PenLine}        label="Note" />
          <ModeButton mode="call"    current={mode} setMode={(m) => { setMode(m); reset(); }} icon={Phone}          label="Call" />
          <ModeButton mode="meeting" current={mode} setMode={(m) => { setMode(m); reset(); }} icon={CalendarPlus}    label="Meeting" />
          <ModeButton mode="task"    current={mode} setMode={(m) => { setMode(m); reset(); }} icon={ListPlus}        label="Task" />
        </div>
      </header>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {mode === "note" && (
        <NoteForm
          contactId={contactId}
          dealId={dealId}
          pending={pending}
          start={start}
          setError={setError}
          onSuccess={onSuccess}
        />
      )}
      {mode === "call" && (
        <CallForm
          contactId={contactId}
          dealId={dealId}
          pending={pending}
          start={start}
          setError={setError}
          onSuccess={onSuccess}
        />
      )}
      {mode === "meeting" && (
        <MeetingForm
          contactId={contactId}
          dealId={dealId}
          pending={pending}
          start={start}
          setError={setError}
          onSuccess={onSuccess}
        />
      )}
      {mode === "task" && (
        <TaskForm
          contactId={contactId}
          dealId={dealId}
          pending={pending}
          start={start}
          setError={setError}
          onSuccess={onSuccess}
        />
      )}
    </section>
  );
}

function ModeButton({
  mode,
  current,
  setMode,
  icon: Icon,
  label,
}: {
  mode: Mode;
  current: Mode;
  setMode: (m: Mode) => void;
  icon: typeof MessageSquare;
  label: string;
}) {
  const active = current === mode;
  return (
    <button
      type="button"
      onClick={() => setMode(mode)}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-violet-100 text-violet-800 ring-1 ring-violet-300"
          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function NoteForm({
  contactId,
  dealId,
  pending,
  start,
  setError,
  onSuccess,
}: {
  contactId?: number | null;
  dealId?: number | null;
  pending: boolean;
  start: (cb: () => void) => void;
  setError: (e: string | null) => void;
  onSuccess: (message: string) => void;
}) {
  const [body, setBody] = useState("");
  function submit() {
    if (!body.trim()) {
      setError("Note cannot be empty");
      return;
    }
    setError(null);
    start(async () => {
      const r = await logNoteAction({ contactId, dealId, body });
      if (!r.ok) {
        setError(r.error);
      } else {
        setBody("");
        onSuccess("Note added.");
      }
    });
  }
  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Note. Visible to admins only."
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      />
      <SubmitButton onClick={submit} pending={pending} label="Add note" />
    </div>
  );
}

function CallForm({
  contactId,
  dealId,
  pending,
  start,
  setError,
  onSuccess,
}: {
  contactId?: number | null;
  dealId?: number | null;
  pending: boolean;
  start: (cb: () => void) => void;
  setError: (e: string | null) => void;
  onSuccess: (message: string) => void;
}) {
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [duration, setDuration] = useState<string>("");
  const [outcome, setOutcome] = useState("");
  const [body, setBody] = useState("");
  function submit() {
    setError(null);
    const seconds = duration ? Number(duration) * 60 : undefined;
    start(async () => {
      const r = await logCallAction({
        contactId,
        dealId,
        direction,
        durationSeconds: typeof seconds === "number" && Number.isFinite(seconds) ? seconds : undefined,
        outcome: outcome.trim() || undefined,
        body: body.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
      } else {
        setDuration("");
        setOutcome("");
        setBody("");
        onSuccess("Call logged.");
      }
    });
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Direction">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "in" | "out")}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          >
            <option value="out">Outbound</option>
            <option value="in">Inbound</option>
          </select>
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            min={0}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
        <Field label="Outcome">
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            disabled={pending}
            placeholder="Connected / Voicemail / No answer"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="What was discussed and what's next."
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      />
      <SubmitButton onClick={submit} pending={pending} label="Log call" />
    </div>
  );
}

function MeetingForm({
  contactId,
  dealId,
  pending,
  start,
  setError,
  onSuccess,
}: {
  contactId?: number | null;
  dealId?: number | null;
  pending: boolean;
  start: (cb: () => void) => void;
  setError: (e: string | null) => void;
  onSuccess: (message: string) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [attendees, setAttendees] = useState("");
  const [location, setLocation] = useState("");
  const [body, setBody] = useState("");
  function submit() {
    if (!scheduledAt) {
      setError("Scheduled time is required");
      return;
    }
    setError(null);
    start(async () => {
      const r = await logMeetingAction({
        contactId,
        dealId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        attendees: attendees.trim() || undefined,
        location: location.trim() || undefined,
        body: body.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
      } else {
        setScheduledAt("");
        setAttendees("");
        setLocation("");
        setBody("");
        onSuccess("Meeting scheduled.");
      }
    });
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Scheduled (date and time)">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
        <Field label="Attendees">
          <input
            type="text"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            disabled={pending}
            placeholder="Joshua, Miguel"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
        <Field label="Location or link">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={pending}
            placeholder="Zoom link or address"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Agenda, prep notes, action items."
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      />
      <SubmitButton onClick={submit} pending={pending} label="Schedule meeting" />
    </div>
  );
}

function TaskForm({
  contactId,
  dealId,
  pending,
  start,
  setError,
  onSuccess,
}: {
  contactId?: number | null;
  dealId?: number | null;
  pending: boolean;
  start: (cb: () => void) => void;
  setError: (e: string | null) => void;
  onSuccess: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  function submit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    start(async () => {
      const r = await createTaskAction({
        contactId,
        dealId,
        title,
        body: body.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
      });
      if (!r.ok) {
        setError(r.error);
      } else {
        const t = title.trim();
        setTitle("");
        setBody("");
        setDueAt("");
        setPriority("medium");
        onSuccess(`Task "${t}" created.`);
      }
    });
  }
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title (Send proposal, Follow up about pricing, ...)"
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Due date and time">
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          />
        </Field>
        <Field label="Priority">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={pending}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </Field>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="Optional context for the task."
        disabled={pending}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      />
      <SubmitButton onClick={submit} pending={pending} label="Create task" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SubmitButton({
  onClick,
  pending,
  label,
}: {
  onClick: () => void;
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}
