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
    incrementUnread,
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
      // Update conversation list last message and move to top
      try {
        const state = useChatStore.getState() as unknown as {
          conversations: Conversation[];
          setConversations: (c: Conversation[]) => void;
        };
        const currentConvs = state.conversations;
        const index = currentConvs.findIndex(
          (c) => c.id === msg.conversationId
        );
        if (index !== -1) {
          const conv = currentConvs[index];
          const updatedConv: Conversation = {
            ...conv,
            lastMessageId: msg.id,
            lastMessage: msg.content,
            updatedAt: new Date() as unknown as Conversation["updatedAt"],
          };
          const newList = [
            updatedConv,
            ...currentConvs.filter((c) => c.id !== conv.id),
          ];
          state.setConversations(newList);
        }
      } catch {
        // noop
      }
      // If message is for currently open conversation, append to messages
      if (
        selectedConversation &&
        msg.conversationId === selectedConversation.id
      ) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Otherwise increment unread for that conversation
        incrementUnread(msg.conversationId);
      }
    },
    [setMessages, incrementUnread, selectedConversation]
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

  const emitTypingStart = useCallback(
    (conversation: Conversation, fromClerkId: string) => {
      if (!socket) return;
      const toClerkIds = conversation.users
        .map((u) => u.clerkId)
        .filter((id) => id !== fromClerkId);
      socket.emit("typing:start", {
        conversationId: conversation.id,
        fromClerkId,
        toClerkIds,
      });
    },
    [socket]
  );

  const emitTypingStop = useCallback(
    (conversation: Conversation, fromClerkId: string) => {
      if (!socket) return;
      const toClerkIds = conversation.users
        .map((u) => u.clerkId)
        .filter((id) => id !== fromClerkId);
      socket.emit("typing:stop", {
        conversationId: conversation.id,
        fromClerkId,
        toClerkIds,
      });
    },
    [socket]
  );

  useEffect(() => {
    const _socket = io(import.meta.env.VITE_API_URL);
    setSocket(_socket);

    _socket.emit("join:server", user?.id);
    _socket.on("message", onMessageRec);
    _socket.on("create:group", onCreateGroup);
    _socket.on(
      "typing:start",
      (payload: { conversationId: string; fromClerkId: string }) => {
        if (payload.fromClerkId === user?.id) return;
        const conv = useChatStore
          .getState()
          .conversations.find((c) => c.id === payload.conversationId);
        if (!conv) return;
        useChatStore
          .getState()
          .addTyping(payload.conversationId, payload.fromClerkId);
      }
    );
    _socket.on(
      "typing:stop",
      (payload: { conversationId: string; fromClerkId: string }) => {
        if (payload.fromClerkId === user?.id) return;
        const conv = useChatStore
          .getState()
          .conversations.find((c) => c.id === payload.conversationId);
        if (!conv) return;
        useChatStore
          .getState()
          .removeTyping(payload.conversationId, payload.fromClerkId);
      }
    );

    return () => {
      _socket.disconnect();
    };
  }, [user?.id, onMessageRec, onCreateGroup]);
  return (
    <SocketContext.Provider
      value={{
        socket,
        sendMessage,
        createGroupSocketMessage,
        emitTypingStart,
        emitTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
