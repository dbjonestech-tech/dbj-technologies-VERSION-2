"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type Props = {
  scanId: string;
  businessName: string | null;
  pathlightScore: number | null;
  suggestedChips: string[];
  calendlyUrl: string | null;
};

const MAX_TOTAL_MESSAGES = 20;

function welcomeText(
  businessName: string | null,
  pathlightScore: number | null
): string {
  const name = businessName && businessName.trim().length > 0
    ? `${businessName}'s`
    : "your";
  const scoreText =
    typeof pathlightScore === "number"
      ? `Your Pathlight Score is ${pathlightScore}/100.`
      : "";
  const lead = `I've analyzed ${name} website and found some opportunities.`;
  return `${lead} ${scoreText} What would you like to know?`.trim();
}

function limitReachedText(calendlyUrl: string | null): string {
  const link =
    calendlyUrl && calendlyUrl !== "#"
      ? calendlyUrl
      : "mailto:dbjonestech@gmail.com";
  return `You've reached the message limit for this session. For a deeper conversation, book a discovery call: ${link}`;
}

function BubbleChatIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 5.5C3 4.12 4.12 3 5.5 3h9C15.88 3 17 4.12 17 5.5v6c0 1.38-1.12 2.5-2.5 2.5H9l-4 3.25V14H5.5A2.5 2.5 0 0 1 3 11.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2.25 9l13.5-6.75-2.25 13.5-4.5-4.5-6.75-2.25z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span
      aria-label="Pathlight is thinking"
      style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: "#64748b",
            animation: `askpath-dot 1200ms ease-in-out ${i * 150}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

export function AskPathlight({
  scanId,
  businessName,
  pathlightScore,
  suggestedChips,
  calendlyUrl,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [chipsVisible, setChipsVisible] = useState(true);
  const [atLimit, setAtLimit] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const welcome = useMemo(
    () => welcomeText(businessName, pathlightScore),
    [businessName, pathlightScore]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setTriggerVisible(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const openPanel = useCallback(() => {
    setIsMounted(true);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    abortRef.current?.abort();
    abortRef.current = null;
    window.setTimeout(() => triggerRef.current?.focus(), 220);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || streaming) return;

      if (messages.length >= MAX_TOTAL_MESSAGES) {
        setAtLimit(true);
        return;
      }

      setChipsVisible(false);
      setStreamError(null);

      const nextMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(nextMessages);
      setInput("");

      if (nextMessages.length >= MAX_TOTAL_MESSAGES) {
        setAtLimit(true);
        return;
      }

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId, messages: nextMessages }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawFirstChunk = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf("\n\n");

            const dataLine = rawEvent
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload) continue;
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                text?: string;
                error?: string;
              };
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (typeof parsed.text === "string" && parsed.text.length > 0) {
                sawFirstChunk = true;
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1]!;
                  if (last.role !== "assistant") return prev;
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch (err) {
              throw err instanceof Error
                ? err
                : new Error("Stream parse error");
            }
          }
        }

        if (!sawFirstChunk) {
          throw new Error("Empty response");
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          // user-initiated
        } else {
          setStreamError("Something went wrong. Please try again.");
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1]!;
            if (last.role === "assistant" && last.content === "") {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, scanId, streaming]
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => {
      const lastUserIdx = [...prev].reverse().findIndex((m) => m.role === "user");
      if (lastUserIdx === -1) return prev;
      const trueIdx = prev.length - 1 - lastUserIdx;
      return prev.slice(0, trueIdx);
    });
    setStreamError(null);
    window.setTimeout(() => sendMessage(lastUser.content), 0);
  }, [messages, sendMessage]);

  const onSubmit = useCallback(() => {
    if (!input.trim() || streaming || atLimit) return;
    void sendMessage(input);
  }, [input, streaming, atLimit, sendMessage]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );

  const onChipClick = useCallback(
    (chip: string) => {
      if (streaming || atLimit) return;
      void sendMessage(chip);
    },
    [atLimit, sendMessage, streaming]
  );

  const showThinking =
    streaming &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      messages[messages.length - 1]?.content === "");

  return (
    <>
      <style>{`
        @keyframes askpath-dot {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        @keyframes askpath-trigger-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes askpath-glow-breathe {
          0%, 100% { box-shadow: 0 4px 24px rgba(59, 130, 246, 0.2), 0 0 60px rgba(59, 130, 246, 0.06); }
          50%      { box-shadow: 0 4px 24px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.12); }
        }
        @keyframes askpath-panel-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .askpath-trigger {
          animation:
            askpath-trigger-in 320ms ease-out both,
            askpath-glow-breathe 3s ease-in-out 360ms infinite;
          transition: transform 150ms ease-out;
        }
        .askpath-trigger:hover { transform: scale(1.05); }
        .askpath-panel { animation: askpath-panel-in 200ms ease-out both; }
        .askpath-scroll::-webkit-scrollbar { width: 6px; }
        .askpath-scroll::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 999px; }
        .askpath-scroll { scrollbar-width: thin; scrollbar-color: #2d3748 transparent; }
        .askpath-chips::-webkit-scrollbar { display: none; }
        .askpath-chips { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .askpath-panel { animation: none !important; }
          .askpath-trigger {
            animation: none !important;
            box-shadow: 0 4px 24px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.09) !important;
          }
        }
      `}</style>

      {!isOpen && isMounted ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={openPanel}
          aria-label="Open Ask Pathlight chat"
          className="askpath-trigger print-hidden"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            display: triggerVisible ? "inline-flex" : "none",
            alignItems: "center",
            gap: 8,
            padding: "14px 24px",
            backgroundImage:
              "linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)",
            color: "#ffffff",
            borderRadius: 999,
            border: "1px solid rgba(59, 130, 246, 0.25)",
            boxShadow:
              "0 4px 24px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.08)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <BubbleChatIcon />
          <span>Ask Pathlight</span>
        </button>
      ) : null}

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Ask Pathlight chat"
          aria-modal="false"
          className="askpath-panel print-hidden"
          style={{
            position: "fixed",
            zIndex: 50,
            backgroundColor: "#0f0f1a",
            color: "#e7ebf2",
            display: "flex",
            flexDirection: "column",
            ...getPanelPositionStyles(),
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 18px",
              borderBottom: "1px solid #1e293b",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>
                Ask Pathlight
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Ask anything about your results
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close chat"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 44,
                minHeight: 44,
                border: "none",
                background: "transparent",
                color: "#cbd5f5",
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              <CloseIcon />
            </button>
          </header>

          <div
            className="askpath-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 18px",
            }}
          >
            <AssistantBubble>{welcome}</AssistantBubble>

            {messages.map((m, idx) => (
              <Bubble key={idx} role={m.role}>
                {m.content}
              </Bubble>
            ))}

            {showThinking ? (
              <AssistantBubble>
                <ThinkingDots />
              </AssistantBubble>
            ) : null}

            {streamError ? (
              <AssistantBubble>
                <div>Something went wrong. Please try again.</div>
                <button
                  type="button"
                  onClick={retryLast}
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #3b82f6",
                    color: "#3b82f6",
                    backgroundColor: "transparent",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </AssistantBubble>
            ) : null}

            {atLimit ? (
              <AssistantBubble>
                {limitReachedText(calendlyUrl)}
              </AssistantBubble>
            ) : null}

            <div ref={messageEndRef} />
          </div>

          {chipsVisible && messages.length === 0 ? (
            <div
              className="askpath-chips"
              style={{
                display: "flex",
                gap: 8,
                padding: "0 18px 12px",
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {suggestedChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChipClick(chip)}
                  disabled={streaming}
                  style={{
                    flex: "0 0 auto",
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #3b82f6",
                    background: "transparent",
                    color: "#3b82f6",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: streaming ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(59, 130, 246, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          <div
            style={{
              padding: 12,
              borderTop: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming || atLimit}
              placeholder="Ask about your results..."
              aria-label="Ask a question about your scan results"
              style={{
                flex: 1,
                backgroundColor: "#1a1a2e",
                color: "#e7ebf2",
                border: "1px solid #2d3748",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
                opacity: streaming ? 0.6 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2d3748";
              }}
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() || streaming || atLimit}
              aria-label="Send message"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                  !input.trim() || streaming || atLimit
                    ? "not-allowed"
                    : "pointer",
                opacity: !input.trim() || streaming || atLimit ? 0.5 : 1,
                pointerEvents:
                  !input.trim() || streaming || atLimit ? "none" : "auto",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getPanelPositionStyles(): React.CSSProperties {
  if (typeof window !== "undefined" && window.innerWidth < 640) {
    return { inset: 0, borderRadius: 0 };
  }
  return {
    bottom: 24,
    right: 24,
    width: 420,
    maxHeight: 580,
    height: "min(580px, calc(100vh - 48px))",
    border: "1px solid #1e293b",
    borderRadius: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  };
}

function Bubble({
  role,
  children,
}: {
  role: ChatRole;
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            maxWidth: "80%",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            borderRadius: "12px 12px 4px 12px",
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  return <AssistantBubble>{children}</AssistantBubble>;
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          backgroundColor: "#1e293b",
          color: "#e7ebf2",
          borderRadius: "12px 12px 12px 4px",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AskPathlight;
