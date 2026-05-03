"use client";

import { useEffect, useState } from "react";
import { Inbox, Send } from "lucide-react";

/* Tablet/desktop-aware wrapper for the contact-detail email pair.
 *
 *   < sm    Stack vertically (default mobile behavior).
 *   sm-xl   Tabs ("Compose" | "Conversation"). Both panels stay
 *           mounted (display:none on the inactive one) so the
 *           compose draft and any thread fetch state survive a tab
 *           swap without re-running the server component.
 *   xl+     Side-by-side grid (1fr 1fr).
 *
 * The previous layout stacked at every breakpoint below xl, which
 * meant the contact page on a typical tablet showed compose at full
 * height followed by 25 messages of thread, forcing a long scroll.
 * Tabs reclaim that space and put the conversation one tap away. */

interface Props {
  compose: React.ReactNode;
  thread: React.ReactNode;
}

type Layout = "stack" | "tabs" | "side";

function readLayout(): Layout {
  if (typeof window === "undefined") return "stack";
  const w = window.innerWidth;
  if (w >= 1280) return "side";
  if (w >= 640) return "tabs";
  return "stack";
}

export default function EmailPair({ compose, thread }: Props) {
  const [layout, setLayout] = useState<Layout>("stack");
  const [tab, setTab] = useState<"compose" | "thread">("compose");

  useEffect(() => {
    function update() {
      setLayout(readLayout());
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (layout === "side") {
    return (
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        {compose}
        {thread}
      </div>
    );
  }

  if (layout === "stack") {
    return (
      <div className="mt-6 grid gap-6">
        {compose}
        {thread}
      </div>
    );
  }

  /* Tabs: keep both mounted, hide the inactive one. */
  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Email pair"
        className="mb-3 inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm"
      >
        <TabButton
          active={tab === "compose"}
          onClick={() => setTab("compose")}
          icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}
          label="Compose"
        />
        <TabButton
          active={tab === "thread"}
          onClick={() => setTab("thread")}
          icon={<Inbox className="h-3.5 w-3.5" aria-hidden="true" />}
          label="Conversation"
        />
      </div>
      <div role="tabpanel" hidden={tab !== "compose"}>
        {compose}
      </div>
      <div role="tabpanel" hidden={tab !== "thread"}>
        {thread}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
