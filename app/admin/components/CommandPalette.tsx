"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CornerDownLeft,
  Search,
} from "lucide-react";

/* Cmd+K command palette.
 *
 * Opens on Cmd+K (mac) or Ctrl+K (everywhere else). Globally mounted
 * once at the admin layout level. Searches against a typed list of
 * jump-targets (every sidebar destination, plus a few common actions
 * like "New template" or "Connect Gmail"). Fuzzy-matches by simple
 * subsequence + initials so the operator can type "edt" or "et" and
 * land on Email templates.
 *
 * Recent jumps are remembered in localStorage and surfaced when the
 * input is empty so the most-used pages are always one keystroke + Enter
 * away. iOS Spotlight design language: glass-morphism backdrop, spring
 * scale-in on appear, arrow-key navigation with always-visible
 * highlight ring on the focused row, Enter to navigate, Esc to close.
 *
 * Build does NOT include contact / deal record search yet. That's a
 * follow-up that needs a debounced server fetch; the page-level palette
 * lights up the high-frequency jumps first. */

interface CommandTarget {
  id: string;
  label: string;
  /** Short subtitle under the label, e.g. "Account" or "Pathlight Advanced". */
  group: string;
  /** Where Enter sends the operator. */
  href: string;
  /** Bonus search tokens. Lowercase. */
  keywords?: string[];
}

const COMMANDS: CommandTarget[] = [
  /* Overview */
  { id: "p:dashboard", label: "Dashboard", group: "Overview", href: "/admin", keywords: ["home", "overview"] },
  /* Acquisition */
  { id: "p:visitors", label: "Visitors", group: "Acquisition", href: "/admin/visitors", keywords: ["analytics", "live"] },
  { id: "p:recurring", label: "Recurring users", group: "Acquisition", href: "/admin/recurring", keywords: ["return"] },
  { id: "p:funnel", label: "Funnel", group: "Acquisition", href: "/admin/funnel", keywords: ["conversion"] },
  { id: "p:search", label: "Search Console", group: "Acquisition", href: "/admin/search", keywords: ["seo", "google", "queries"] },
  { id: "p:rum", label: "RUM (real user metrics)", group: "Acquisition", href: "/admin/performance/rum", keywords: ["performance", "vitals"] },
  /* Relationships */
  { id: "p:contacts", label: "Contacts", group: "Relationships", href: "/admin/contacts", keywords: ["people", "leads"] },
  { id: "p:deals", label: "Deals", group: "Relationships", href: "/admin/deals", keywords: ["pipeline", "opportunities"] },
  { id: "p:stages", label: "Stage board (kanban)", group: "Relationships", href: "/admin/relationships/pipeline", keywords: ["board", "pipeline"] },
  /* Analytics */
  { id: "p:salesanalytics", label: "Sales analytics", group: "Analytics", href: "/admin/analytics/pipeline", keywords: ["forecast", "metrics"] },
  /* Automation */
  { id: "p:sequences", label: "Sequences", group: "Automation", href: "/admin/sequences", keywords: ["drip", "cadence"] },
  { id: "p:rules", label: "Workflow rules", group: "Automation", href: "/admin/automations", keywords: ["automation", "trigger"] },
  { id: "p:templates", label: "Email templates", group: "Automation", href: "/admin/canopy/templates", keywords: ["copy", "compose", "merge"] },
  /* Pathlight Advanced */
  { id: "p:prospecting", label: "Prospecting", group: "Pathlight Advanced", href: "/admin/prospecting", keywords: ["leads", "lists"] },
  { id: "p:websitechanges", label: "Website changes", group: "Pathlight Advanced", href: "/admin/website-changes", keywords: ["monitor", "diff"] },
  { id: "p:beacon", label: "Attribution beacon", group: "Pathlight Advanced", href: "/admin/canopy/beacon", keywords: ["snippet", "tracking"] },
  /* Operations */
  { id: "p:tasks", label: "Tasks", group: "Operations", href: "/admin/tasks", keywords: ["todo", "follow-up"] },
  { id: "p:monitor", label: "Monitor (live event tail)", group: "Operations", href: "/admin/monitor", keywords: ["events", "logs"] },
  { id: "p:costs", label: "Costs", group: "Operations", href: "/admin/costs", keywords: ["spend", "budget", "anthropic"] },
  { id: "p:scans", label: "Scans", group: "Operations", href: "/admin/scans", keywords: ["pathlight"] },
  { id: "p:leads", label: "Leads", group: "Operations", href: "/admin/leads", keywords: ["signups"] },
  { id: "p:clients", label: "Clients", group: "Operations", href: "/admin/clients", keywords: ["portal"] },
  { id: "p:database", label: "Database", group: "Operations", href: "/admin/database", keywords: ["tables", "schema"] },
  /* Health */
  { id: "p:pipeline", label: "Pipeline (Pathlight scan engine)", group: "Health", href: "/admin/pipeline", keywords: ["inngest"] },
  { id: "p:platform", label: "Platform (Vercel)", group: "Health", href: "/admin/platform", keywords: ["deployments"] },
  { id: "p:errors", label: "Errors", group: "Health", href: "/admin/errors", keywords: ["sentry", "bugs"] },
  { id: "p:emaildelivery", label: "Email deliverability", group: "Health", href: "/admin/email", keywords: ["resend", "kpi"] },
  { id: "p:infra", label: "Infrastructure", group: "Health", href: "/admin/infrastructure", keywords: ["dns", "tls", "spf", "dkim", "dmarc"] },
  /* Account */
  { id: "p:canopy", label: "Canopy controls", group: "Account", href: "/admin/canopy", keywords: ["settings", "customize", "gmail"] },
  { id: "p:team", label: "Team (RBAC)", group: "Account", href: "/admin/canopy/team", keywords: ["roles", "permissions"] },
  { id: "p:api", label: "API & webhooks", group: "Account", href: "/admin/canopy/api", keywords: ["tokens", "rest"] },
  { id: "p:audit", label: "Audit log", group: "Account", href: "/admin/audit", keywords: ["history", "changes"] },
  { id: "p:users", label: "Users (bootstrap allowlist)", group: "Account", href: "/admin/users", keywords: ["admins"] },
  { id: "p:config", label: "Config", group: "Account", href: "/admin/config", keywords: ["env", "settings"] },
];

const RECENTS_KEY = "canopy.cmdk.recents";
const RECENTS_MAX = 5;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadRecents();
    const next = [id, ...current.filter((x) => x !== id)].slice(0, RECENTS_MAX);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode, quota); silently skip. */
  }
}

/* Subsequence + initials match. Returns a non-negative score (lower
 * is better) when matched, or -1 when no match. Initials match wins
 * over substring; substring match wins over generic subsequence. */
function fuzzyScore(query: string, label: string, keywords?: string[]): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const hay = label.toLowerCase();
  const haySpace = ` ${hay}`;

  /* Exact prefix wins. */
  if (hay.startsWith(q)) return 0;
  /* Substring beats other matches. */
  const sub = hay.indexOf(q);
  if (sub !== -1) return 5 + sub;
  /* Word-boundary match (e.g. "search console" + "console"). */
  if (haySpace.includes(` ${q}`)) return 10;
  /* Initials: "et" -> "Email templates". */
  const initials = hay
    .split(/\s+/)
    .map((w) => w[0])
    .join("");
  if (initials.startsWith(q)) return 20;
  /* Subsequence: every char of q appears in order in hay. */
  let i = 0;
  for (const ch of hay) {
    if (ch === q[i]) i++;
    if (i === q.length) break;
  }
  if (i === q.length) return 50 + (hay.length - q.length);
  /* Fallback to keywords. */
  if (keywords) {
    for (const k of keywords) {
      if (k.toLowerCase().includes(q)) return 80;
    }
  }
  return -1;
}

interface ScoredCommand {
  command: CommandTarget;
  score: number;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const reduced = useReducedMotion();

  /* Open / close on Cmd+K (or Ctrl+K). Also closes on Esc when open. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (isToggle) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Reset state every time we open. */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setRecentIds(loadRecents());
      /* Slight delay so framer-motion mounts the input first. */
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo<ScoredCommand[]>(() => {
    if (!query.trim()) {
      const recents = recentIds
        .map((id) => COMMANDS.find((c) => c.id === id))
        .filter((c): c is CommandTarget => Boolean(c))
        .map((command) => ({ command, score: 0 }));
      const others = COMMANDS.filter((c) => !recentIds.includes(c.id)).map((command) => ({
        command,
        score: 1,
      }));
      return [...recents, ...others];
    }
    const scored: ScoredCommand[] = [];
    for (const command of COMMANDS) {
      const s = fuzzyScore(query, command.label, command.keywords);
      if (s >= 0) scored.push({ command, score: s });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored;
  }, [query, recentIds]);

  /* Keep active index inside bounds. */
  useEffect(() => {
    if (active >= results.length) setActive(Math.max(0, results.length - 1));
  }, [results.length, active]);

  const navigateTo = useCallback(
    (command: CommandTarget) => {
      pushRecent(command.id);
      setOpen(false);
      router.push(command.href);
    },
    [router]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => Math.min(results.length - 1, prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) navigateTo(target.command);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmdk-root"
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.18 }}
        >
          {/* Backdrop with subtle blur (Apple's signature glass). */}
          <button
            type="button"
            aria-label="Close command palette"
            className="absolute inset-0 cursor-default bg-zinc-900/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20"
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }
            }
            animate={
              reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduced
                ? { opacity: 0, transition: { duration: 0.12 } }
                : { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.14 } }
            }
            transition={
              reduced
                ? { duration: 0.18 }
                : { type: "spring", stiffness: 380, damping: 30, mass: 0.7 }
            }
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Jump to a page or action..."
                className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-zinc-400 focus:outline-none focus:ring-0"
                autoComplete="off"
                spellCheck={false}
                aria-controls="cmdk-results"
              />
              <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline">
                Esc
              </kbd>
            </div>

            <ul
              id="cmdk-results"
              role="listbox"
              aria-label="Results"
              className="max-h-[60vh] overflow-y-auto py-1.5"
            >
              {results.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-500">
                  No matches.
                </li>
              ) : (
                <>
                  {!query.trim() && recentIds.length > 0 && (
                    <li
                      role="presentation"
                      className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      Recent
                    </li>
                  )}
                  {results.map((row, idx) => {
                    const isRecent =
                      !query.trim() && recentIds.includes(row.command.id);
                    const showRecentsDivider =
                      !query.trim() &&
                      recentIds.length > 0 &&
                      idx === recentIds.length;
                    return (
                      <CommandRow
                        key={row.command.id}
                        showDividerLabel={showRecentsDivider}
                        command={row.command}
                        active={idx === active}
                        isRecent={isRecent}
                        onSelect={() => navigateTo(row.command)}
                        onHover={() => setActive(idx)}
                      />
                    );
                  })}
                </>
              )}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2 text-[11px] text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px]">
                    <CornerDownLeft className="h-2.5 w-2.5" aria-hidden="true" />
                  </kbd>
                  open
                </span>
              </div>
              <span className="hidden font-mono sm:inline">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandRow({
  command,
  active,
  isRecent,
  showDividerLabel,
  onSelect,
  onHover,
}: {
  command: CommandTarget;
  active: boolean;
  isRecent: boolean;
  showDividerLabel: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <>
      {showDividerLabel && (
        <li
          role="presentation"
          className="mt-1 px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
        >
          All pages
        </li>
      )}
      <li
        role="option"
        aria-selected={active}
        onMouseEnter={onHover}
        onClick={onSelect}
        className={`mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          active ? "bg-zinc-100" : "hover:bg-zinc-50"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-zinc-900">{command.label}</p>
          <p className="truncate text-[11px] text-zinc-500">{command.group}</p>
        </div>
        {isRecent && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            Recent
          </span>
        )}
        <ArrowRight
          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
            active ? "opacity-100 text-zinc-700" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      </li>
    </>
  );
}
