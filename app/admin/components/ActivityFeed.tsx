import { CalendarPlus, Mail, MessageSquare, PenLine, Phone, ListPlus, Check } from "lucide-react";
import {
  activityDetail,
  activityTitle,
  type ActivityRow,
  type ActivityType,
} from "@/lib/services/activities";

const TYPE_TINT: Record<ActivityType, { tone: string; Icon: typeof PenLine }> = {
  note:    { tone: "bg-zinc-100 text-zinc-700",    Icon: PenLine },
  call:    { tone: "bg-blue-100 text-blue-700",    Icon: Phone },
  meeting: { tone: "bg-cyan-100 text-cyan-700",    Icon: CalendarPlus },
  task:    { tone: "bg-amber-100 text-amber-700",  Icon: ListPlus },
  email:   { tone: "bg-violet-100 text-violet-700", Icon: Mail },
};

export default function ActivityFeed({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-zinc-500">
        No activities logged yet. Use the composer above to log a note, call, meeting, or task.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      {activities.map((a) => {
        const cfg = TYPE_TINT[a.type] ?? TYPE_TINT.note;
        const Icon = cfg.Icon;
        const detail = activityDetail(a);
        const completedTask =
          a.type === "task" && a.completed_at !== null;
        return (
          <li key={a.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${cfg.tone}`}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className={`text-sm font-semibold ${completedTask ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                  {activityTitle(a)}
                </p>
                {a.type === "task" && a.priority ? (
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {a.priority}
                  </span>
                ) : null}
                {completedTask ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-2.5 w-2.5" /> done
                  </span>
                ) : null}
                <p
                  className="font-mono text-[11px] text-zinc-400"
                  title={new Date(a.occurred_at).toLocaleString("en-US")}
                >
                  {formatRelative(a.occurred_at)}
                </p>
              </div>
              {detail ? (
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{detail}</p>
              ) : null}
              {a.type === "task" && a.due_at && !completedTask ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Due {new Date(a.due_at).toLocaleString()}
                </p>
              ) : null}
              {a.type === "meeting" && typeof a.payload?.location === "string" && a.payload.location ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Location: {a.payload.location as string}
                </p>
              ) : null}
              {a.owner_email ? (
                <p className="mt-1 text-[11px] text-zinc-400">
                  By {a.owner_email}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export { MessageSquare };
