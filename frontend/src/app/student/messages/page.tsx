"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  ArrowLeft,
  ChevronDown,
  CheckCheck,
  Check,
  MessageCircle,
  Smile,
  Paperclip,
  MoreVertical,
} from "lucide-react";

interface Conversation {
  id_conversation: number;
  created_at: string;
  updated_at: string;
  offer: { id_offer: number; title: string };
  company: { id_company: number; company_name: string; logo_url?: string };
  messages: {
    content: string;
    sent_at: string;
    is_read: boolean;
    id_sender: number;
  }[];
}

interface Message {
  id_message: number;
  content: string;
  is_read: boolean;
  sent_at: string;
  sender: { id_user: number; nom: string; prenom: string };
}

interface IncomingMessage {
  id_message: number;
  content: string;
  is_read: boolean;
  sent_at: string;
  id_conversation: number;
  id_sender: number;
  sender: { id_user: number; nom: string; prenom: string };
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-fuchsia-500",
];

function getAvatarGradient(id: number) {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

function formatConversationTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1 || (diffDays === 0 && now.getDate() - d.getDate() === 1)) {
    return "Hier";
  }
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0 && d.getDate() === now.getDate()) return "Aujourd'hui";
  if (diffDays === 1 || (diffDays === 0 && now.getDate() - d.getDate() === 1))
    return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function StudentMessagesPage() {
  const { user } = useAuthStore();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  const handleIncomingMessage = useCallback(
    (msg: unknown) => {
      const incoming = msg as IncomingMessage;
      if (selected && incoming.id_conversation === selected.id_conversation) {
        setMessages((prev) => {
          if (prev.some((m) => m.id_message === incoming.id_message)) return prev;
          return [
            ...prev,
            {
              id_message: incoming.id_message,
              content: incoming.content,
              is_read: incoming.is_read,
              sent_at: incoming.sent_at,
              sender: incoming.sender,
            },
          ];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id_conversation === incoming.id_conversation
              ? {
                  ...c,
                  updated_at: incoming.sent_at,
                  messages: [
                    {
                      content: incoming.content,
                      sent_at: incoming.sent_at,
                      is_read: incoming.id_sender === user?.userId,
                      id_sender: incoming.id_sender,
                    },
                  ],
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          ),
      );
    },
    [selected, scrollToBottom, user?.userId],
  );

  const handleNotification = useCallback((notif: unknown) => {
    const data = notif as { conversationId: number; unreadCount: number };
    setUnreadMap((prev) => ({
      ...prev,
      [data.conversationId]: data.unreadCount,
    }));
  }, []);

  const handleUnreadUpdate = useCallback((data: { total: number }) => {
    void data;
  }, []);

  const { joinConversation, leaveConversation } = useMessagingSocket(
    handleIncomingMessage,
    handleNotification,
    handleUnreadUpdate,
  );

  useEffect(() => {
    if (!user) return;
    const fetchStudentId = async () => {
      try {
        const res = await api.get(`/students/user/${user.userId}`);
        setStudentId(res.data.id_student);
      } catch {
        console.error("Erreur fetch student profile");
      }
    };
    fetchStudentId();
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    const fetchConversations = async () => {
      try {
        const res = await api.get(`/conversations/student/${studentId}`);
        setConversations(res.data);
        if (user) {
          const unreadRes = await api.get(
            `/messages/unread-by-conversation/${user.userId}`,
          );
          setUnreadMap(unreadRes.data);
        }
      } catch {
        console.error("Erreur fetch conversations");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [studentId, user]);

  const openConversation = async (conv: Conversation) => {
    if (selected) {
      leaveConversation(selected.id_conversation);
    }
    setSelected(conv);
    joinConversation(conv.id_conversation);
    setUnreadMap((prev) => ({ ...prev, [conv.id_conversation]: 0 }));
    try {
      const res = await api.get(
        `/messages/conversation/${conv.id_conversation}`,
      );
      setMessages(res.data);
      setTimeout(() => scrollToBottom(false), 50);
      if (user) {
        await api.put(
          `/messages/conversation/${conv.id_conversation}/read-all`,
          { id_user: user.userId },
        );
      }
    } catch {
      console.error("Erreur fetch messages");
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selected || !user) return;
    setSending(true);
    const content = newMessage;
    setNewMessage("");
    try {
      await api.post("/messages", {
        content,
        id_conversation: selected.id_conversation,
        id_sender: user.userId,
      });
    } catch {
      console.error("Erreur send message");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 60);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) scrollToBottom(true);
  }, [messages, isAtBottom, scrollToBottom]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.company.company_name.toLowerCase().includes(q) ||
      conv.offer.title.toLowerCase().includes(q) ||
      conv.messages[0]?.content.toLowerCase().includes(q)
    );
  });

  const getUnreadCount = (conv: Conversation) =>
    unreadMap[conv.id_conversation] || 0;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Messages
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Échangez avec les entreprises
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-200/50 overflow-hidden flex">
        {/* ── Conversation List ── */}
        <div
          className={`w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col border-r border-gray-100 ${
            selected ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search */}
          <div className="px-4 pt-4 pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
                aria-label="Rechercher une conversation"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversations">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Chargement...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-indigo-300" />
                </div>
                <p className="text-sm font-medium text-gray-500 text-center">
                  {searchQuery
                    ? "Aucun résultat"
                    : "Aucune conversation"}
                </p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {searchQuery
                    ? "Essayez un autre terme"
                    : "Les conversations apparaîtront ici"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const unread = getUnreadCount(conv);
                const lastMsg = conv.messages[0];
                const hasUnread = unread > 0;
                const isActive =
                  selected?.id_conversation === conv.id_conversation;
                return (
                  <motion.button
                    key={conv.id_conversation}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => openConversation(conv)}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openConversation(conv);
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                      isActive
                        ? "bg-indigo-50/80"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(conv.id_conversation)} flex items-center justify-center shadow-sm`}
                      >
                        <span className="text-white font-semibold text-sm">
                          {getInitials(conv.company.company_name)}
                        </span>
                      </div>
                      {/* Online dot — simulated */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4
                          className={`text-sm truncate ${
                            hasUnread
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {conv.company.company_name}
                        </h4>
                        {lastMsg && (
                          <span
                            className={`text-[11px] ml-2 flex-shrink-0 ${
                              hasUnread
                                ? "text-indigo-600 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {formatConversationTime(lastMsg.sent_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-500/70 font-medium truncate mb-0.5">
                        {conv.offer.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate pr-2 ${
                            hasUnread
                              ? "text-gray-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {lastMsg ? (
                            <>
                              {lastMsg.id_sender === user?.userId && (
                                <span className="text-gray-300">Vous : </span>
                              )}
                              {lastMsg.content}
                            </>
                          ) : (
                            <span className="italic">Pas de message</span>
                          )}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            selected ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selected ? (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 via-white to-indigo-50/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center px-6"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100/50">
                  <MessageCircle className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-sm text-gray-400 max-w-[260px]">
                  Choisissez une conversation dans la liste pour commencer à
                  discuter
                </p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 flex items-center gap-3.5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                <button
                  onClick={() => {
                    leaveConversation(selected.id_conversation);
                    setSelected(null);
                  }}
                  className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(selected.id_conversation)} flex items-center justify-center shadow-sm`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {getInitials(selected.company.company_name)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {selected.company.company_name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <p className="text-xs text-gray-400 truncate">
                      {selected.offer.title} · En ligne
                    </p>
                  </div>
                </div>

                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4"
              >
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Send className="w-7 h-7 text-indigo-300 -rotate-12" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        Début de la conversation
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Envoyez le premier message à{" "}
                        {selected.company.company_name}
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {/* Date separator at top */}
                    <div className="flex items-center justify-center mb-6 mt-2">
                      <span className="text-xs text-gray-400 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm font-medium">
                        {formatDateSeparator(messages[0].sent_at)}
                      </span>
                    </div>

                    {messages.map((msg, idx) => {
                      const isMe = msg.sender.id_user === user?.userId;
                      const showAvatar =
                        !isMe &&
                        (idx === 0 ||
                          messages[idx - 1].sender.id_user !==
                            msg.sender.id_user);
                      const showTime =
                        idx === messages.length - 1 ||
                        messages[idx + 1]?.sender.id_user !==
                          msg.sender.id_user;
                      const showDateSeparator =
                        idx > 0 &&
                        new Date(msg.sent_at).toDateString() !==
                          new Date(messages[idx - 1].sent_at).toDateString();

                      return (
                        <div key={msg.id_message}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-5">
                              <span className="text-[11px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm font-medium">
                                {formatDateSeparator(msg.sent_at)}
                              </span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTime ? "mb-3" : "mb-0.5"} ${showDateSeparator ? "mt-2" : ""}`}
                          >
                            {!isMe && (
                              <div className="w-8 flex-shrink-0 self-end">
                                {showAvatar && (
                                  <div
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(selected.id_conversation)} flex items-center justify-center shadow-sm`}
                                  >
                                    <span className="text-white text-[10px] font-bold">
                                      {msg.sender.prenom.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] sm:max-w-md px-4 py-2.5 text-sm leading-relaxed ${
                                isMe
                                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-md shadow-md shadow-indigo-200/40"
                                  : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-md shadow-sm"
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                              {showTime && (
                                <div
                                  className={`flex items-center gap-1 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                  <span
                                    className={`text-[10px] ${
                                      isMe ? "text-indigo-200" : "text-gray-300"
                                    }`}
                                  >
                                    {new Date(msg.sent_at).toLocaleTimeString(
                                      "fr-FR",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                  {isMe && (
                                    <span className="text-indigo-200">
                                      {msg.is_read ? (
                                        <CheckCheck className="w-3.5 h-3.5" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll-to-bottom FAB */}
              <AnimatePresence>
                {!isAtBottom && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-lg shadow-gray-200/60 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    aria-label="Aller au dernier message"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Composer */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="flex items-end gap-2">
                  <button
                    className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0"
                    aria-label="Joindre un fichier"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0"
                    aria-label="Ajouter un emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Écrire un message..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
                      aria-label="Votre message"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="p-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-md shadow-indigo-200/50 flex-shrink-0"
                    aria-label="Envoyer"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
