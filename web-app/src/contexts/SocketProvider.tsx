import { useUser } from "@clerk/clerk-react";
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Conversation, Message } from "../types";
import { useChatStore } from "./chat-context";
import { SocketContext, type SocketContextType } from "./socket-context";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType["socket"]>();
  const {
    selectedConversation,
    conversations,
    setMessages,
    setConversations,
    setSelectedConversation,
  } = useChatStore();
  const { user } = useUser();

  const sendMessage = useCallback(
    (message: Message) => {
      socket?.emit("event:message", {
        message,
        conversation: selectedConversation,
      });
    },
    [socket, selectedConversation]
  );

  const createGroupSocketMessage = useCallback(
    (data: Conversation & { initiatorId?: string }) => {
      const enriched = { ...data, initiatorId: user?.id };
      socket?.emit("create:group", enriched);
    },
    [socket, user?.id]
  );

  const onMessageRec = useCallback(
    (msg: Message) => {
      console.log(msg);
      setMessages((prev) => [...prev, msg]);
    },
    [setMessages]
  );

  const onCreateGroup = useCallback(
    (data: Conversation & { initiatorId?: string }) => {
      const conv = data as Conversation;
      setConversations([conv, ...conversations]);
      console.log(conv);

      // Only the initiator auto-selects
      if (data?.initiatorId && data.initiatorId === user?.id) {
        setSelectedConversation(conv);
      }
    },
    [conversations, setConversations, setSelectedConversation, user?.id]
  );

  useEffect(() => {
    const _socket = io(import.meta.env.VITE_API_URL);
    setSocket(_socket);

    _socket.emit("join:server", user?.id);
    _socket.on("message", onMessageRec);
    _socket.on("create:group", onCreateGroup);

    return () => {
      _socket.disconnect();
    };
  }, [user?.id, onMessageRec, onCreateGroup]);
  return (
    <SocketContext.Provider
      value={{ socket, sendMessage, createGroupSocketMessage }}
    >
      {children}
    </SocketContext.Provider>
  );
};
