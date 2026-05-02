import Link from "next/link";
import { ArrowRight, AlertCircle, Clock, Sparkles, TrendingDown, UserCheck } from "lucide-react";
import type { NextBestAction as NBA } from "@/lib/analytics/contact";

interface Props {
  nba: NBA;
}

const SIGNAL_TONE: Record<NBA["signal"], { bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  overdue_task: { bg: "bg-rose-50", border: "border-rose-200", icon: AlertCircle },
  stuck_proposal: { bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  score_regression: { bg: "bg-rose-50", border: "border-rose-200", icon: TrendingDown },
  stale_contact: { bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  no_open_deal: { bg: "bg-zinc-50", border: "border-zinc-200", icon: UserCheck },
  fresh_lead: { bg: "bg-emerald-50", border: "border-emerald-200", icon: Sparkles },
  stay_course: { bg: "bg-zinc-50", border: "border-zinc-200", icon: UserCheck },
};

export default function NextBestAction({ nba }: Props) {
  const tone = SIGNAL_TONE[nba.signal] ?? SIGNAL_TONE.stay_course;
  const Icon = tone.icon;
  return (
    <section className={`rounded-xl border ${tone.border} ${tone.bg} p-5 shadow-sm`}>
      <header className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-700" aria-hidden />
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
          Next best action
        </p>
      </header>
      <h3 className="font-display text-base font-semibold text-zinc-900">{nba.action}</h3>
      <p className="mt-1 text-sm text-zinc-700">{nba.reason}</p>
      {nba.link ? (
        <Link
          href={nba.link.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
        >
          {nba.link.label}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
