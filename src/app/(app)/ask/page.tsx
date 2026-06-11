"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, User, ArrowUp, TrendingUp, DollarSign, BarChart2, AlertTriangle, Zap, HelpCircle } from "lucide-react";
import { streamChat, type ChatMessage } from "@/lib/api";
import { useAuditContext } from "@/lib/audit-context";
import { useAuditData } from "@/lib/use-audit-data";
import { aiSuggestions } from "@/lib/mock-data";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGG_ICONS = [TrendingUp, DollarSign, BarChart2, AlertTriangle, Zap, HelpCircle, TrendingUp, DollarSign];

const DOLLAR_RE = /(\$\d[\d,]*(?:\.\d+)?(?:K|M|B)?)/g;

function CitationChip() {
  return (
    <a
      href="/revenue"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: "#0c8174",
        border: "1px solid rgba(12,129,116,0.35)",
        borderRadius: 6,
        padding: "1px 7px",
        textDecoration: "none",
        marginLeft: 6,
        verticalAlign: "middle",
        background: "#f0faf8",
        whiteSpace: "nowrap",
      }}
    >
      → View findings
    </a>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold** and $dollar tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\$\d[\d,]*(?:\.\d+)?(?:K|M|B)?)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j} style={{ fontWeight: 700, color: "#0b2734" }}>{part.slice(2, -2)}</strong>;
    }
    if (DOLLAR_RE.test(part)) {
      // reset lastIndex after test
      DOLLAR_RE.lastIndex = 0;
      return (
        <span key={j} style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#0c8174" }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function lineHasDollar(line: string): boolean {
  DOLLAR_RE.lastIndex = 0;
  return DOLLAR_RE.test(line);
}

function renderLine(line: string, i: number) {
  if (/^\*\*(.+)\*\*$/.test(line)) {
    return <p key={i} style={{ fontWeight: 700, color: "#0b2734", marginTop: 8 }}>{line.slice(2, -2)}</p>;
  }
  if (line.startsWith("| ")) {
    return <p key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5c747e", lineHeight: 1.6 }}>{line}</p>;
  }
  if (/^\d+\./.test(line)) {
    const hasDollar = lineHasDollar(line);
    return (
      <p key={i} style={{ marginTop: 4 }}>
        {renderInline(line)}
        {hasDollar && <CitationChip />}
      </p>
    );
  }
  if (line.startsWith("- ")) {
    const inner = line.slice(2);
    const hasDollar = lineHasDollar(inner);
    return (
      <p key={i} style={{ marginTop: 2, paddingLeft: 8, color: "#5c747e" }}>
        {renderInline(inner)}
        {hasDollar && <CitationChip />}
      </p>
    );
  }
  if (!line.trim()) return <div key={i} style={{ height: 6 }} />;

  const hasDollar = lineHasDollar(line);
  return (
    <p key={i} style={{ marginTop: 4 }}>
      {renderInline(line)}
      {hasDollar && <CitationChip />}
    </p>
  );
}

function MessageBubble({ message, inputRef }: { message: Message; inputRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const isUser = message.role === "user";

  // Determine if this assistant message contains any dollar amount (for quick-actions)
  const showQuickActions = !isUser && !message.streaming && DOLLAR_RE.test(message.content);
  // reset after test
  DOLLAR_RE.lastIndex = 0;

  return (
    <div style={{ display: "flex", gap: 14, flexDirection: isUser ? "row-reverse" : "row", marginBottom: 24 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUser ? "#f6f8f8" : "#e4f4f1",
          color: isUser ? "#5c747e" : "#0c8174",
          border: isUser ? "1px solid rgba(11,39,52,0.10)" : "none",
          boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
          marginTop: 2,
        }}
      >
        {isUser ? <User style={{ width: 16, height: 16 }} /> : <Sparkles style={{ width: 18, height: 18 }} />}
      </div>
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(11,39,52,0.10)",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            padding: "20px 22px",
            boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
            fontSize: 15,
            lineHeight: 1.62,
            color: "#0b2734",
          }}
        >
          {message.content.split("\n").map((line, i) => renderLine(line, i))}
          {message.streaming && (
            <span style={{ display: "inline-block", width: 4, height: 16, background: "rgba(20,184,166,0.7)", marginLeft: 2, borderRadius: 2, animation: "pulse 1.2s ease-in-out infinite", verticalAlign: "text-bottom" }} />
          )}
        </div>
        {showQuickActions && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="/revenue"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0c8174",
                border: "1px solid rgba(12,129,116,0.35)",
                borderRadius: 8,
                padding: "4px 12px",
                textDecoration: "none",
                background: "#f0faf8",
                whiteSpace: "nowrap",
              }}
            >
              View Revenue →
            </a>
            <a
              href="/risks"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#bd852f",
                border: "1px solid rgba(189,133,47,0.35)",
                borderRadius: 8,
                padding: "4px 12px",
                textDecoration: "none",
                background: "#fdf6ea",
                whiteSpace: "nowrap",
              }}
            >
              See Risks →
            </a>
            <button
              onClick={() => inputRef?.current?.focus()}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5c747e",
                border: "1px solid rgba(11,39,52,0.14)",
                borderRadius: 8,
                padding: "4px 12px",
                background: "#f6f8f8",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Ask follow-up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildGreeting(totalLeakage: number, expectedRecovery: number, isLive: boolean, dataRange: string): string {
  const leakK = `**$${Math.round(totalLeakage / 1000)}K**`;
  const recovK = `**$${Math.round(expectedRecovery / 1000)}K**`;
  if (isLive) {
    return `I've analyzed your 835 data (${dataRange}). I found ${leakK} in revenue leakage — ${recovK} is recoverable.\n\nI can explain your denial patterns, draft appeal letters, model what fixing a specific problem is worth, or compare you to industry benchmarks. What would you like to work on?`;
  }
  return `I'm showing you demo data from a 4-physician family practice. There's ${leakK} in revenue leakage — ${recovK} is recoverable.\n\nUpload your own 835 file to see your practice's numbers. Or ask me anything — I can explain denial patterns, draft appeal letters, or model ROI for your specific situation.`;
}

function AskPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q");
  const { result: auditResult } = useAuditContext(); // needed for streamChat raw API result
  const { metrics, isLive, dataRange } = useAuditData();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: buildGreeting(metrics.totalLeakage, metrics.expectedRecovery, isLive, dataRange),
    },
  ]);

  // If user uploads data after arriving on this page, refresh the greeting
  const prevIsLive = useRef(isLive);
  useEffect(() => {
    if (isLive && !prevIsLive.current && messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ role: "assistant", content: buildGreeting(metrics.totalLeakage, metrics.expectedRecovery, true, dataRange) }]);
    }
    prevIsLive.current = isLive;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoSent = useRef(false);

  useEffect(() => {
    if (initialQ && !hasAutoSent.current) {
      hasAutoSent.current = true;
      sendMessage(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const history: ChatMessage[] = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    await streamChat(
      history,
      auditResult ?? null,
      (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          return prev;
        });
      },
      () => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, streaming: false }];
          return prev;
        });
        setIsStreaming(false);
      },
      (err) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.streaming) return [...prev.slice(0, -1), { role: "assistant", content: `Error: ${err}`, streaming: false }];
          return [...prev, { role: "assistant", content: `Error: ${err}` }];
        });
        setIsStreaming(false);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length <= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxWidth: 880, margin: "0 auto" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} inputRef={inputRef} />
        ))}

        {/* Suggestions */}
        {isEmpty && !isStreaming && (
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8aa0a8", margin: "30px 0 14px", textAlign: "center" }}>
              Suggested Questions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSuggestions.slice(0, 6).map((s, i) => {
                const Icon = SUGG_ICONS[i % SUGG_ICONS.length];
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      padding: "16px 18px",
                      borderRadius: 13,
                      border: "1px solid rgba(11,39,52,0.10)",
                      background: "#fff",
                      boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#0b2734",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: "#e4f4f1", color: "#0c8174", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </div>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fff",
            border: "1px solid rgba(11,39,52,0.10)",
            borderRadius: 16,
            padding: "6px 6px 6px 20px",
            boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your revenue, denials, or payers…"
            rows={1}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
              fontSize: 15,
              color: "#0b2734",
              resize: "none",
              padding: "12px 0",
              minHeight: 48,
              maxHeight: 200,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#0b2734",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "none",
              cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
              opacity: !input.trim() || isStreaming ? 0.4 : 1,
            }}
          >
            <ArrowUp style={{ width: 19, height: 19 }} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11.5, color: "#8aa0a8", marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.02em" }}>
          Simera analyzes your actual 835 data · Not financial advice · Verify before acting
        </p>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<div />}>
      <AskPageInner />
    </Suspense>
  );
}
