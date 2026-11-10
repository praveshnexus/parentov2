import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  RotateCcw,
  Baby,
  TrendingUp,
  Syringe,
  Star,
  AlertTriangle,
  ChevronRight,
  Loader2,
  ShieldAlert,
  X,
  Square,
  BookOpen,
} from "lucide-react";
import { childrenApi, aiApi } from "@/api/services";
import { useAiChat, type ChatMessage } from "@/hooks/useAiChat";
import { Avatar, Card, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import type { Child } from "@/types";
import clsx from "clsx";

const PROMPTS = [
  {
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Growth",
    items: [
      "How is my child's weight compared to their age?",
      "Is their height on track?",
      "What does their BMI mean?",
    ],
  },
  {
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Milestones",
    items: [
      "Which milestones to focus on this month?",
      "How to encourage language development?",
      "Activities for cognitive growth?",
    ],
  },
  {
    icon: Syringe,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Vaccines",
    items: [
      "Are any vaccines overdue?",
      "What vaccines are coming up?",
      "Watch for after vaccination?",
    ],
  },
  {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Health",
    items: [
      "When should I see a doctor?",
      "Is my child eating enough?",
      "Common illnesses for this age?",
    ],
  },
];

function ChildSummaryCard({ childId }: { childId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-summary", childId],
    queryFn: () => aiApi.summary(childId),
    staleTime: 60_000,
  });
  const s = data?.data?.data;
  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />;
  if (!s) return null;
  const ageLabel =
    s.ageMonths < 24
      ? `${s.ageMonths}m`
      : `${Math.floor(s.ageMonths / 12)}y ${s.ageMonths % 12}m`;
  const pct =
    s.totalMilestones > 0
      ? Math.round((s.achievedMilestones / s.totalMilestones) * 100)
      : 0;
  return (
    <div className="bg-primary-500 rounded-2xl p-4 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
          {s.gender === "FEMALE" ? "👧" : "👦"}
        </div>
        <div>
          <p className="font-bold text-sm">{s.name}</p>
          <p className="text-primary-100 text-xs">Age: {ageLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {s.latestWeight && (
          <div className="bg-white/15 rounded-xl p-2.5">
            <p className="text-white/70">Weight</p>
            <p className="font-bold text-base">{s.latestWeight} kg</p>
          </div>
        )}
        {s.latestHeight && (
          <div className="bg-white/15 rounded-xl p-2.5">
            <p className="text-white/70">Height</p>
            <p className="font-bold text-base">{s.latestHeight} cm</p>
          </div>
        )}
        <div className="bg-white/15 rounded-xl p-2.5">
          <p className="text-white/70">Milestones</p>
          <p className="font-bold text-base">{pct}%</p>
        </div>
        <div
          className={clsx(
            "rounded-xl p-2.5",
            s.overdueVaccines > 0 ? "bg-red-400/40" : "bg-white/15",
          )}
        >
          <p className="text-white/70">Vaccines</p>
          <p className="font-bold text-base">
            {s.overdueVaccines > 0 ? `${s.overdueVaccines} due` : "✓ OK"}
          </p>
        </div>
      </div>
      {(s.overdueVaccines > 0 || s.overdueMilestones > 0) && (
        <div className="mt-2.5 flex items-start gap-2 bg-white/15 rounded-xl p-2.5">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            {[
              s.overdueVaccines > 0 &&
                `${s.overdueVaccines} vaccine(s) overdue`,
              s.overdueMilestones > 0 &&
                `${s.overdueMilestones} milestone(s) to check`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

function MdText({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### "))
          return (
            <p key={i} className="font-bold text-xs mt-2">
              {line.slice(4)}
            </p>
          );
        if (line.startsWith("## "))
          return (
            <p key={i} className="font-bold text-sm mt-2">
              {line.slice(3)}
            </p>
          );
        if (line.startsWith("- ") || line.startsWith("• "))
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-primary-400 flex-shrink-0 mt-0.5">•</span>
              <span className="text-sm leading-relaxed">
                {line
                  .slice(2)
                  .split(/(\*\*[^*]+\*\*)/)
                  .map((p, j) =>
                    p.startsWith("**") && p.endsWith("**") ? (
                      <strong key={j}>{p.slice(2, -2)}</strong>
                    ) : (
                      <span key={j}>{p}</span>
                    ),
                  )}
              </span>
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        // A whole line in _underscores_ or *asterisks* = italic note (e.g. disclaimers)
        const italic = line.trim().match(/^(?:_([^_]+)_|\*([^*]+)\*)$/);
        if (italic)
          return (
            <p key={i} className="text-xs italic text-ink-muted leading-relaxed mt-1">
              {italic[1] ?? italic[2]}
            </p>
          );
        return (
          <p key={i} className="text-sm leading-relaxed">
            {line
              .split(/(\*\*[^*]+\*\*)/)
              .map((p, j) =>
                p.startsWith("**") && p.endsWith("**") ? (
                  <strong key={j}>{p.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{p}</span>
                ),
              )}
          </p>
        );
      })}
    </div>
  );
}

function Bubble({
  msg,
  userName,
  userAvatar,
}: {
  msg: ChatMessage;
  userName: string;
  userAvatar?: string;
}) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("flex gap-2.5", isUser && "flex-row-reverse")}
    >
      {isUser ? (
        <Avatar
          src={userAvatar}
          name={userName}
          size="sm"
          className="flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
      <div
        className={clsx(
          "max-w-[78%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary-500 text-white rounded-tr-sm"
            : "bg-white text-ink-primary border border-gray-100 rounded-tl-sm",
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div>
            {msg.content ? <MdText text={msg.content} /> : null}
            {msg.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary-400 rounded-sm ml-1 animate-pulse align-middle" />
            )}
            {!msg.isStreaming && msg.source === "knowledge-base" && (
              <p className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-ink-muted">
                <BookOpen size={10} /> Answered from Parento's knowledge base
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AiChatPage() {
  const { user } = useAuth();
  const { messages, isStreaming, error, sendMessage, stop, clearHistory } =
    useAiChat();
  const { data: statusData } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => aiApi.status(),
    staleTime: 5 * 60_000,
  });
  const aiMode: "claude" | "knowledge-base" | undefined =
    statusData?.data?.data?.mode;
  const [input, setInput] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: childrenData } = useQuery({
    queryKey: ["children"],
    queryFn: () => childrenApi.list(),
  });
  const children: Child[] = childrenData?.data?.data ?? [];

  useEffect(() => {
    if (children.length > 0 && !selectedChildId)
      setSelectedChildId(children[0].id);
  }, [children, selectedChildId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    const t = input.trim();
    if (!t || isStreaming || !selectedChildId) return;
    setInput("");
    await sendMessage(selectedChildId, t);
  }, [input, isStreaming, selectedChildId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const hasMessages = messages.length > 0;

  return (
    <div className="max-w-app mx-auto px-4 py-5 h-[calc(100dvh-6rem)]">
      {/* ── Desktop: 2-col | Mobile: 1-col ── */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-5 h-full">
        {/* ── Left sidebar (desktop) ─────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto">
          {/* Branding */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-ink-primary">Parento AI</p>
              <p className="text-xs text-primary-500 font-medium">
                Child health assistant
              </p>
            </div>
          </div>

          {/* Child selector */}
          {children.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                Select child
              </p>
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      clearHistory();
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                      selectedChildId === child.id
                        ? "border-primary-400 bg-primary-50"
                        : "border-transparent hover:border-gray-200",
                    )}
                  >
                    <span className="text-xl">
                      {child.gender === "FEMALE" ? "👧" : "👦"}
                    </span>
                    <span className="text-sm font-medium text-ink-primary">
                      {child.name}
                    </span>
                    {selectedChildId === child.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Health summary */}
          {selectedChildId && <ChildSummaryCard childId={selectedChildId} />}

          {/* Suggested prompts */}
          {selectedChildId && (
            <Card className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
                Suggested questions
              </p>
              <div className="space-y-2">
                {PROMPTS.map(({ icon: Icon, color, bg, label, items }) => (
                  <div key={label}>
                    <div
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-xl mb-1",
                        bg,
                      )}
                    >
                      <Icon size={13} className={color} />
                      <span className="text-xs font-semibold text-ink-primary">
                        {label}
                      </span>
                    </div>
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setInput(item);
                          textareaRef.current?.focus();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary-50 rounded-xl transition-colors group"
                      >
                        <ChevronRight
                          size={12}
                          className="text-ink-muted group-hover:text-primary-400 flex-shrink-0"
                        />
                        <span className="text-xs text-ink-secondary group-hover:text-ink-primary">
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <ShieldAlert
              size={13}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Parento AI is informational only. Always consult a qualified
              doctor for medical decisions.
            </p>
          </div>
        </div>

        {/* ── Chat panel ─────────────────────────────── */}
        <div className="flex flex-col bg-white rounded-card shadow-card overflow-hidden h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-primary">Parento AI</p>
                <p className="text-[11px] text-primary-500">
                  {selectedChild
                    ? `Chatting about ${selectedChild.name}`
                    : "Select a child to start"}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            {hasMessages && (
              <button
                onClick={clearHistory}
                title="New conversation"
                aria-label="New conversation"
                className="p-1.5 rounded-xl hover:bg-gray-100 text-ink-muted transition-colors"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Mobile child selector chips */}
          {children.length > 0 && (
            <div className="flex gap-2 px-4 py-2.5 border-b border-gray-100 overflow-x-auto lg:hidden flex-shrink-0">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    clearHistory();
                  }}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all",
                    selectedChildId === child.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-ink-secondary",
                  )}
                >
                  <span>{child.gender === "FEMALE" ? "👧" : "👦"}</span>
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-bg">
            {!selectedChildId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mb-4">
                  <Baby size={36} className="text-primary-400" />
                </div>
                <h3 className="font-bold text-ink-primary mb-2">
                  Select a child to start
                </h3>
                <p className="text-sm text-ink-muted">
                  {children.length === 0
                    ? "Add a child in Track first."
                    : "Choose a child to get personalized insights."}
                </p>
              </div>
            ) : !hasMessages ? (
              <div className="space-y-4">
                {/* Mobile summary card */}
                <div className="lg:hidden">
                  <ChildSummaryCard childId={selectedChildId} />
                </div>
                <div className="text-center py-4">
                  <p className="text-sm font-semibold text-ink-primary">
                    Ask me anything about {selectedChild?.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    I have access to their real health records
                  </p>
                </div>
                {/* Mobile prompts */}
                <div className="lg:hidden space-y-2">
                  {PROMPTS.map(({ icon: Icon, color, bg, label, items }) => (
                    <div
                      key={label}
                      className="rounded-2xl overflow-hidden border border-gray-100"
                    >
                      <div
                        className={clsx(
                          "flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold",
                          bg,
                        )}
                      >
                        <Icon size={15} className={color} />
                        <span className="text-ink-primary">{label}</span>
                      </div>
                      <div className="bg-white divide-y divide-gray-50">
                        {items.map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              setInput(item);
                              textareaRef.current?.focus();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-primary-50 transition-colors"
                          >
                            <ChevronRight
                              size={13}
                              className="text-ink-muted flex-shrink-0"
                            />
                            <span className="text-sm text-ink-secondary">
                              {item}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <Bubble
                      key={i}
                      msg={msg}
                      userName={user?.fullName ?? "You"}
                      userAvatar={user?.avatarUrl}
                    />
                  ))}
                </AnimatePresence>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
                    <X size={14} className="flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white border-t border-gray-100">
            <div
              className={clsx(
                "flex items-end gap-2 bg-surface-bg rounded-2xl border-2 px-4 py-2.5 transition-colors",
                !selectedChildId
                  ? "opacity-50"
                  : "border-gray-200 focus-within:border-primary-300",
              )}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedChildId || isStreaming}
                placeholder={
                  !selectedChildId
                    ? "Select a child first..."
                    : `Ask about ${selectedChild?.name ?? ""}...`
                }
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none min-h-[22px] max-h-[120px]"
              />
              {isStreaming ? (
                <button
                  onClick={stop}
                  title="Stop generating"
                  aria-label="Stop generating"
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all bg-primary-50 text-primary-500 hover:bg-primary-100 active:scale-95"
                >
                  {messages[messages.length - 1]?.content ? (
                    <Square size={14} className="fill-current" />
                  ) : (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !selectedChildId}
                  aria-label="Send message"
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                    input.trim() && selectedChildId
                      ? "bg-primary-500 text-white hover:bg-primary-600 active:scale-95"
                      : "bg-gray-100 text-ink-muted cursor-not-allowed",
                  )}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
            <p className="text-center text-[10px] text-ink-muted mt-1.5">
              Not medical advice ·{" "}
              {aiMode === "knowledge-base"
                ? "Powered by Parento's knowledge base"
                : "Powered by Claude"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
