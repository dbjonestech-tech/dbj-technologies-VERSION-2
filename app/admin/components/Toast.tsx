"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

/* Shared toast surface for the Canopy admin shell.
 *
 * One <ToastProvider> mounts at the layout level. Any client component
 * inside admin can call useToast().show({ tone, message }) to surface a
 * dismissible toast in the bottom-right corner. Toasts auto-dismiss
 * after 4s and stack newest-on-top. Spring physics on slide-in;
 * useReducedMotion swaps to a plain fade so it's not jarring for
 * vestibular sensitivity.
 *
 * No external dep needed. Built on top of framer-motion (already in)
 * and a tiny React context. */

type Tone = "success" | "error" | "info";

interface ToastInput {
  tone?: Tone;
  message: string;
  /** Optional ms override; defaults to 4000. Pass 0 for sticky. */
  durationMs?: number;
}

interface ToastRecord extends ToastInput {
  id: number;
}

interface ToastContextValue {
  show: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    /* Fail open with a no-op so a stray useToast() outside the provider
     * does not crash the page. Logged once for the operator's benefit. */
    if (typeof window !== "undefined") {
      console.warn("[toast] useToast called outside ToastProvider");
    }
    return {
      show: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

const DEFAULT_DURATION_MS = 4000;
const MAX_VISIBLE = 5;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastRecord[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = ++seq.current;
      const record: ToastRecord = { ...input, id };
      setItems((prev) => [record, ...prev].slice(0, MAX_VISIBLE));
      const dur = input.durationMs ?? DEFAULT_DURATION_MS;
      if (dur > 0) {
        const handle = setTimeout(() => dismiss(id), dur);
        timers.current.set(id, handle);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    /* Capture the current ref value so the cleanup function uses the
     * same map instance even if a remount swapped the ref. */
    const map = timers.current;
    return () => {
      for (const handle of map.values()) clearTimeout(handle);
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastRecord[];
  onDismiss: (id: number) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={!reduced}
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, x: 24, scale: 0.96 }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, x: 0, scale: 1 }
            }
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, x: 16, scale: 0.96, transition: { duration: 0.14 } }
            }
            transition={
              reduced
                ? { duration: 0.18 }
                : { type: "spring", stiffness: 360, damping: 30, mass: 0.6 }
            }
            className="pointer-events-auto"
          >
            <ToastCard record={item} onDismiss={() => onDismiss(item.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  record,
  onDismiss,
}: {
  record: ToastRecord;
  onDismiss: () => void;
}) {
  const tone: Tone = record.tone ?? "info";
  const tones = TONE_STYLES[tone];
  const Icon = tones.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border ${tones.border} ${tones.bg} px-4 py-3 shadow-lg shadow-zinc-900/10 backdrop-blur-sm`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tones.icon_color}`} aria-hidden="true" />
      <p className={`flex-1 text-sm leading-snug ${tones.text}`}>{record.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className={`-mr-1 -mt-1 rounded-md p-1 transition-colors hover:bg-black/5 ${tones.text}`}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

const TONE_STYLES: Record<
  Tone,
  {
    border: string;
    bg: string;
    text: string;
    icon: typeof CheckCircle2;
    icon_color: string;
  }
> = {
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/95",
    text: "text-emerald-900",
    icon: CheckCircle2,
    icon_color: "text-emerald-600",
  },
  error: {
    border: "border-rose-200",
    bg: "bg-rose-50/95",
    text: "text-rose-900",
    icon: XCircle,
    icon_color: "text-rose-600",
  },
  info: {
    border: "border-sky-200",
    bg: "bg-sky-50/95",
    text: "text-sky-900",
    icon: Info,
    icon_color: "text-sky-600",
  },
};
