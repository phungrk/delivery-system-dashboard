"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, X, Send, Paperclip, Loader2, ChevronRight,
  FileText, Wrench, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Attachment = { name: string; content: string };

type ToolEvent = { name: string; status: "running" | "done" | "error" };

type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  tools?: ToolEvent[];
  error?: string;
};

type SSEEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_done"; name: string; ok: boolean }
  | { type: "error"; message: string }
  | { type: "done" };

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Báo cáo sprint tất cả project",
  "Kiểm tra blocker & rủi ro",
  "Ai đang overload?",
  "Liệt kê các project hiện có",
];

// ── Markdown renderer (lightweight) ──────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3} (.+)$/gm, "<strong>$1</strong>")
    .replace(/^[-•] (.+)$/gm, "• $1")
    .replace(/\n/g, "<br/>");
}

// ── ToolBadge ─────────────────────────────────────────────────────────────────

function ToolBadge({ name, status }: ToolEvent) {
  const toolLabel: Record<string, string> = {
    read_file: "Reading file",
    list_dir: "Listing directory",
    write_file: "Writing file",
  };
  const label = toolLabel[name] ?? name;

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/30 text-muted-foreground border-border">
      {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === "done"    && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
      {status === "error"   && <AlertCircle className="w-3 h-3 text-destructive" />}
      <Wrench className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
      {/* Tool events (above assistant bubble) */}
      {!isUser && msg.tools && msg.tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {msg.tools.map((t, i) => <ToolBadge key={i} {...t} />)}
        </div>
      )}

      {/* Bubble */}
      {(msg.content || isUser) && (
        <div
          className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted/50 border border-border text-foreground rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : msg.error ? (
            <span className="text-destructive">{msg.error}</span>
          ) : (
            <span
              className="prose-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          )}
        </div>
      )}

      {/* Attachments */}
      {isUser && msg.attachments && msg.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {msg.attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-3 h-3" />{a.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AIChatDrawer ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AIChatDrawer({ open, onClose }: Props) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading]         = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const results = await Promise.all(
      files.map((f) => f.text().then((content) => ({ name: f.name, content }))),
    );
    setAttachments((prev) => [...prev, ...results]);
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || loading) return;

    const userMsg: Message = { role: "user", content: text.trim(), attachments: [...attachments] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    // Placeholder assistant message
    const asstIdx = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", tools: [] }]);

    // Build API payload — inject attachments into message content
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.attachments?.length
        ? `${m.content}\n\n---\n${m.attachments.map((a) => `**File: ${a.name}**\n${a.content}`).join("\n\n---\n")}`
        : m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "", error: err.error ?? "Server error" };
          return next;
        });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const ev = JSON.parse(raw) as SSEEvent;

            if (ev.type === "text") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, content: last.content + ev.delta };
                return next;
              });
            }

            if (ev.type === "tool_start") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  tools: [...(last.tools ?? []), { name: ev.name, status: "running" }],
                };
                return next;
              });
            }

            if (ev.type === "tool_done") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  tools: (last.tools ?? []).map((t) =>
                    t.name === ev.name && t.status === "running"
                      ? { ...t, status: ev.ok ? "done" : "error" }
                      : t,
                  ),
                };
                return next;
              });
            }

            if (ev.type === "error") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], error: ev.message };
                return next;
              });
            }
          } catch { /* malformed SSE line */ }
        }
      }
    } catch (e: unknown) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          error: e instanceof Error ? e.message : "Network error",
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, attachments, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] z-50 flex flex-col bg-card border-l border-border shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-[10px] text-muted-foreground">Delivery Management</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 text-center px-2">
              <div className="space-y-1">
                <Bot className="w-10 h-10 text-primary/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Tôi có thể giúp gì cho bạn?</p>
                <p className="text-xs text-muted-foreground/60">Hỏi về dự án, yêu cầu báo cáo, hoặc đính kèm transcript meeting</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
          )}

          {loading && messages[messages.length - 1]?.content === "" && !messages[messages.length - 1]?.tools?.length && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang xử lý…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border flex-shrink-0">
            {attachments.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <FileText className="w-3 h-3" />
                {a.name}
                <button onClick={() => removeAttachment(i)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <div className="flex items-end gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5"
              title="Attach file (.md, .txt, .vtt)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc yêu cầu… (Enter để gửi)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 max-h-32 leading-relaxed disabled:opacity-50"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && attachments.length === 0) || loading}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground flex-shrink-0 mb-0.5 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
            Shift+Enter xuống dòng · Đính kèm .md .txt .vtt
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.vtt,.csv"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

// ── AIChatButton ──────────────────────────────────────────────────────────────

export function AIChatButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <Bot className="w-4 h-4" />
      AI Assistant
    </button>
  );
}
