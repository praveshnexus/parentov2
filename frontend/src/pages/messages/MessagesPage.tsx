import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/api/client";
import { Avatar, Skeleton, EmptyState } from "@/components/ui";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";

const msgApi = {
  getConversations: () => api.get("/messages/conversations"),

  getConversationByAppointment: (appointmentId: string) =>
    api.get(`/messages/appointment/${appointmentId}`),

  getMessages: (id: string) =>
    api.get(`/messages/conversations/${id}/messages?page=1&limit=50`),

  send: (id: string, content: string) =>
    api.post(`/messages/conversations/${id}/messages`, { content }),
};

function fmtTime(d: string) {
  const dt = new Date(d);
  if (isToday(dt)) return format(dt, "h:mm a");
  if (isYesterday(dt)) return "Yesterday";
  return format(dt, "MMM d");
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 px-4 py-2.5 bg-white rounded-2xl rounded-tl-sm border border-gray-100 w-fit">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-ink-muted"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Conversation list ──────────────────────────────────────────
function ConvList({
  convs,
  activeId,
  onSelect,
  myId,
  search,
  setSearch,
}: {
  convs: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  myId: string;
  search: string;
  setSearch: (s: string) => void;
}) {
  const filtered = convs.filter((c: any) => {
    if (!search) return true;
    const other = c.participants?.find((p: any) => p.userId !== myId)?.user;
    return other?.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-ink-primary mb-3">Messages</h2>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-surface-bg rounded-pill pl-8 pr-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-100 border border-gray-200"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={24} />}
            title="No conversations"
            description="Book an appointment to start messaging."
          />
        ) : (
          filtered.map((conv: any) => {
            const other = conv.participants?.find(
              (p: any) => p.userId !== myId,
            )?.user;
            const isActive = activeId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 last:border-0",
                  isActive ? "bg-primary-50" : "hover:bg-gray-50",
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={other?.avatarUrl}
                    name={other?.fullName ?? "?"}
                    size="md"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={clsx(
                        "text-sm truncate",
                        isActive
                          ? "font-bold text-primary-700"
                          : "font-semibold text-ink-primary",
                      )}
                    >
                      {other?.fullName ?? "Unknown"}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[11px] text-ink-muted flex-shrink-0">
                        {fmtTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted truncate mt-0.5">
                    {conv.lastMessage ?? "Start a conversation"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Chat window ────────────────────────────────────────────────
function ChatWindow({
  convId,
  other,
  onBack,
  myId,
}: {
  convId: string;
  other: any;
  onBack: () => void;
  myId: string;
}) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => msgApi.getMessages(convId),
  });
  const messages = data?.data?.data ?? [];

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:conversation", convId);
    return () => {
      socket.emit("leave:conversation", convId);
    };
  }, [socket, convId]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg: any) => {
      if (msg.conversationId === convId) {
        queryClient.setQueryData(["messages", convId], (old: any) =>
          old
            ? {
                ...old,
                data: { ...old.data, data: [...(old.data?.data ?? []), msg] },
              }
            : old,
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };
    const onStart = ({ userId }: any) => {
      if (userId !== myId) setOtherTyping(true);
    };
    const onStop = ({ userId }: any) => {
      if (userId !== myId) setOtherTyping(false);
    };
    socket.on("message", onMsg);
    socket.on("typing:start", onStart);
    socket.on("typing:stop", onStop);
    return () => {
      socket.off("message", onMsg);
      socket.off("typing:start", onStart);
      socket.off("typing:stop", onStop);
    };
  }, [socket, convId, myId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => msgApi.send(convId, content),
    onSuccess: (res: any) => {
      queryClient.setQueryData(["messages", convId], (old: any) =>
        old
          ? {
              ...old,
              data: {
                ...old.data,
                data: [...(old.data?.data ?? []), res.data.data],
              },
            }
          : old,
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      socket?.emit("typing:stop", { conversationId: convId });
    },
  });

  const handleInput = (val: string) => {
    setInput(val);
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", { conversationId: convId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: convId });
    }, 1500);
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t || sendMutation.isPending) return;
    setInput("");
    setIsTyping(false);
    sendMutation.mutate(t);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors lg:hidden"
        >
          <ArrowLeft size={18} className="text-ink-secondary" />
        </button>
        <div className="relative">
          <Avatar
            src={other?.avatarUrl}
            name={other?.fullName ?? "?"}
            size="sm"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink-primary">
            {other?.fullName}
          </p>
          {otherTyping ? (
            <p className="text-xs text-primary-500 animate-pulse">typing...</p>
          ) : (
            <p className="text-xs text-green-500">Online</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-ink-secondary transition-colors">
            <Phone size={17} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-ink-secondary transition-colors">
            <Video size={17} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-ink-secondary transition-colors">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-bg">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={clsx(
                  "flex",
                  i % 2 === 0 ? "justify-start" : "justify-end",
                )}
              >
                <Skeleton
                  className={clsx(
                    "h-10 rounded-2xl",
                    i % 2 === 0 ? "w-48" : "w-36",
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-primary-400" />
            </div>
            <p className="font-semibold text-ink-primary">
              Say hello to {other?.fullName}!
            </p>
            <p className="text-sm text-ink-muted mt-1">
              Start the conversation
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg: any) => {
              const isMine = msg.senderId === myId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex items-end gap-2",
                    isMine ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {!isMine && (
                    <Avatar
                      src={other?.avatarUrl}
                      name={other?.fullName ?? "?"}
                      size="xs"
                      className="flex-shrink-0 mb-0.5"
                    />
                  )}
                  <div
                    className={clsx(
                      "max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMine
                        ? "bg-primary-500 text-white rounded-br-sm"
                        : "bg-white text-ink-primary border border-gray-100 rounded-bl-sm",
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={clsx(
                        "text-[10px] mt-0.5",
                        isMine ? "text-white/60" : "text-ink-muted",
                      )}
                    >
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {otherTyping && <TypingDots />}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${other?.fullName ?? ""}...`}
            className="flex-1 bg-surface-bg rounded-pill border border-gray-200 px-4 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              input.trim()
                ? "bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-sm"
                : "bg-gray-100 text-ink-muted cursor-not-allowed",
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Messages Page ─────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();

  const appointmentId = searchParams.get("appointmentId");

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => msgApi.getConversations(),
    refetchInterval: 30_000,
  });

  const convs = data?.data?.data ?? [];

  // 👇 ADD THIS HERE
  useEffect(() => {
    if (!appointmentId) return;

    msgApi
      .getConversationByAppointment(appointmentId)
      .then((res) => {
        setActiveId(res.data.data.id);
      })
      .catch(console.error);
  }, [appointmentId]);

  const active = convs.find((c: any) => c.id === activeId);
  const otherUser = active?.participants?.find(
    (p: any) => p.userId !== user?.id,
  )?.user;

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-primary">Messages</h1>
          <p className="text-sm text-ink-muted">
            {convs.length} conversation{convs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Desktop: side-by-side | Mobile: show one at a time ── */}
      <div
        className="bg-white rounded-card shadow-card overflow-hidden"
        style={{ height: "calc(100dvh - 11rem)" }}
      >
        <div className="flex h-full">
          {/* Conversation list */}
          <div
            className={clsx(
              "flex-shrink-0 border-r border-gray-100",
              "w-full lg:w-80",
              activeId ? "hidden lg:flex" : "flex",
            )}
          >
            {isLoading ? (
              <div className="p-4 space-y-3 w-full">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full">
                <ConvList
                  convs={convs}
                  activeId={activeId}
                  onSelect={setActiveId}
                  myId={user?.id ?? ""}
                  search={search}
                  setSearch={setSearch}
                />
              </div>
            )}
          </div>

          {/* Chat window */}
          <div
            className={clsx(
              "flex-1 min-w-0",
              activeId ? "flex flex-col" : "hidden lg:flex flex-col",
            )}
          >
            {activeId && otherUser ? (
              <ChatWindow
                convId={activeId}
                other={otherUser}
                onBack={() => setActiveId(null)}
                myId={user?.id ?? ""}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mb-5">
                  <MessageCircle size={36} className="text-primary-400" />
                </div>
                <h3 className="font-bold text-lg text-ink-primary mb-2">
                  Your messages
                </h3>
                <p className="text-sm text-ink-muted max-w-xs">
                  Select a conversation from the list to start chatting with a
                  doctor or parent.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
