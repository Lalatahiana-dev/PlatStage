"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useMessagingSocket(
  onMessage?: (msg: unknown) => void,
  onNotification?: (notif: unknown) => void,
  onUnreadUpdate?: (data: { total: number }) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const socket = io(`${API_URL}/messaging`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });

    socket.on("new-message", (msg) => {
      onMessage?.(msg);
    });

    socket.on("message-notification", (notif) => {
      onNotification?.(notif);
    });

    socket.on("unread-update", (data) => {
      onUnreadUpdate?.(data);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onMessage, onNotification, onUnreadUpdate]);

  const joinConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit("join-conversation", { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit("leave-conversation", { conversationId });
  }, []);

  return { socket: socketRef.current, joinConversation, leaveConversation };
}
