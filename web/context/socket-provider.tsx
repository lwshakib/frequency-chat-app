"use client";

import { useChatStore } from "@/context";
import { authClient } from "@/lib/auth-client";
import { markMessagesAsRead } from "@/lib/api";
import type { Conversation, Message } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./socket-context";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket>();
  const [selfOnline, setSelfOnline] = useState<boolean>(false);
  const [selfLastOnlineAt, setSelfLastOnlineAt] = useState<
    string | undefined
  >();

  const {
    selectedConversation,
    conversations,
    setMessages,
    setConversations,
    setSelectedConversation,
    incrementUnread,
    addTyping,
    removeTyping,
    session,
  } = useChatStore();

  const user = session?.user;

  const sendMessage = useCallback(
    (message: Message, conversationOverride?: Conversation) => {
      socket?.emit("event:message", {
        message,
        conversation: conversationOverride || selectedConversation,
      });
    },
    [socket, selectedConversation]
  );

  const emitDeleteConversation = useCallback(
    (conversation: Conversation) => {
      const memberIds = conversation.users.map((u) => u.id);
      socket?.emit("delete:conversation", {
        conversationId: conversation.id,
        memberIds,
      });
    },
    [socket]
  );

  const emitTypingStart = useCallback(
    (conversation: Conversation, fromUserId: string) => {
      if (!socket) return;
      const toUserIds = conversation.users
        .map((u) => u.id)
        .filter((id) => id !== fromUserId);
      socket.emit("typing:start", {
        conversationId: conversation.id,
        fromUserId,
        toUserIds,
      });
    },
    [socket]
  );

  const emitTypingStop = useCallback(
    (conversation: Conversation, fromUserId: string) => {
      if (!socket) return;
      const toUserIds = conversation.users
        .map((u) => u.id)
        .filter((id) => id !== fromUserId);
      socket.emit("typing:stop", {
        conversationId: conversation.id,
        fromUserId,
        toUserIds,
      });
    },
    [socket]
  );

  const emitCallStart = useCallback(
    (payload: any) => {
      socket?.emit("call:start", payload);
    },
    [socket]
  );

  const emitCallAccept = useCallback(
    (payload: any) => {
      socket?.emit("call:accept", payload);
    },
    [socket]
  );

  const emitCallReject = useCallback(
    (payload: any) => {
      socket?.emit("call:reject", payload);
    },
    [socket]
  );

  const emitCallHangup = useCallback(
    (payload: any) => {
      socket?.emit("call:hangup", payload);
    },
    [socket]
  );

  const emitCallSignal = useCallback(
    (payload: any) => {
      socket?.emit("call:signal", payload);
    },
    [socket]
  );

  useEffect(() => {
    if (!user?.id) return;

    const _socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      withCredentials: true,
    });

    _socket.on("connect", () => {
      console.log("Socket connected:", _socket.id);
      setSelfOnline(true);
    });

    _socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSelfOnline(false);
    });

    _socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
    });

    _socket.on(
      "message",
      (payload: { message: Message; conversation: Conversation }) => {
        const { message: msg, conversation: convData } = payload;
        const state = useChatStore.getState();
        const activeConversation = state.selectedConversation;

        // 1. Handle unread status and active window messages
        if (
          activeConversation &&
          msg.conversationId === activeConversation.id
        ) {
          const currentMessages = state.messages;
          const exists = currentMessages.find((m) => m.id === msg.id);
          if (!exists) {
            setMessages([...currentMessages, msg]);
            if (msg.senderId !== user?.id) {
              markMessagesAsRead(msg.conversationId).catch(console.error);
            }
          }
        } else if (msg.senderId !== user?.id) {
          state.incrementUnread(msg.conversationId);
        }

        // 2. Update the conversation in the sidebar list
        const currentConvs = useChatStore.getState().conversations;
        const index = currentConvs.findIndex(
          (c) => c.id === msg.conversationId
        );

        if (index !== -1) {
          const conv = currentConvs[index];
          const updatedConv: Conversation = {
            ...conv,
            lastMessageId: msg.id,
            lastMessage: msg,
            updatedAt: new Date(),
            // Ensure the count in the list matches what's in the store after increment
            unreadCount:
              useChatStore
                .getState()
                .conversations.find((c) => c.id === conv.id)?.unreadCount ||
              conv.unreadCount,
          };
          const newList = [
            updatedConv,
            ...currentConvs.filter((c) => c.id !== conv.id),
          ];
          state.setConversations(newList);
        } else if (convData) {
          const newConv: Conversation = {
            ...convData,
            lastMessageId: msg.id,
            lastMessage: msg,
            updatedAt: new Date(),
            unreadCount: 1, // It's a brand new conversation with 1 message
          };
          state.setConversations([newConv, ...currentConvs]);
        }
      }
    );

    // Removed automatic group creation update as per user requirement.
    // Conversations will be added upon receiving the first message or on refresh.

    _socket.on(
      "delete:conversation",
      ({ conversationId }: { conversationId: string }) => {
        const state = useChatStore.getState();
        const remaining = state.conversations.filter(
          (c) => c.id !== conversationId
        );
        state.setConversations(remaining);
        if (state.selectedConversation?.id === conversationId) {
          state.setSelectedConversation(null);
        }
      }
    );

    _socket.on(
      "typing:start",
      ({
        conversationId,
        fromUserId,
      }: {
        conversationId: string;
        fromUserId: string;
      }) => {
        if (fromUserId === user.id) return;
        addTyping(conversationId, fromUserId);
      }
    );

    _socket.on("call:invite", (payload: any) => {
      const state = useChatStore.getState();
      const conv = state.conversations.find(
        (c) => c.id === payload.conversationId
      );
      const callerUser = conv?.users.find((u) => u.id === payload.callerId);

      state.setActiveCall({
        conversationId: payload.conversationId,
        type: payload.type,
        status: "RINGING",
        isOutgoing: false,
        participants: payload.participants,
        callerId: payload.callerId,
        isGroup: payload.isGroup,
        callee: callerUser,
      });
    });

    _socket.on("call:participant-left", (payload: any) => {
      window.dispatchEvent(
        new CustomEvent("call:participant-left", { detail: payload })
      );
    });

    _socket.on("call:accepted", (payload: any) => {
      const state = useChatStore.getState();
      if (state.activeCall?.conversationId === payload.conversationId) {
        state.setActiveCall({
          ...state.activeCall!,
          status: "CONNECTED",
        });
      }
    });

    _socket.on("call:rejected", (payload: any) => {
      const state = useChatStore.getState();
      if (state.activeCall?.conversationId === payload.conversationId) {
        state.setActiveCall(null);
        toast.info("Call rejected");
      }
    });

    _socket.on("call:ended", (payload: any) => {
      const state = useChatStore.getState();
      if (state.activeCall?.conversationId === payload.conversationId) {
        state.setActiveCall(null);
        toast.info("Call ended");
      }
    });

    _socket.on("call:signal", (payload: any) => {
      // This will be handled by the CallOverlay component listening to window events or a separate emitter
      window.dispatchEvent(new CustomEvent("call:signal", { detail: payload }));
    });

    _socket.on(
      "typing:stop",
      ({
        conversationId,
        fromUserId,
      }: {
        conversationId: string;
        fromUserId: string;
      }) => {
        if (fromUserId === user.id) return;
        removeTyping(conversationId, fromUserId);
      }
    );

    _socket.on(
      "presence:update",
      (payload: {
        userId: string;
        isOnline: boolean;
        lastOnlineAt: string;
      }) => {
        if (payload.userId === user.id) {
          setSelfOnline(payload.isOnline);
          setSelfLastOnlineAt(payload.lastOnlineAt);
        }

        const state = useChatStore.getState();
        const updatedList = state.conversations.map((conv) => {
          if (conv.type !== "ONE_TO_ONE") return conv;
          if (!conv.users.some((u) => u.id === payload.userId)) return conv;
          return {
            ...conv,
            users: conv.users.map((u) =>
              u.id === payload.userId
                ? {
                    ...u,
                    isOnline: payload.isOnline,
                    lastOnlineAt: new Date(payload.lastOnlineAt),
                  }
                : u
            ),
          };
        });
        state.setConversations(updatedList);

        const sel = useChatStore.getState().selectedConversation;
        if (
          sel &&
          sel.type === "ONE_TO_ONE" &&
          sel.users.some((u) => u.id === payload.userId)
        ) {
          state.setSelectedConversation({
            ...sel,
            users: sel.users.map((u) =>
              u.id === payload.userId
                ? {
                    ...u,
                    isOnline: payload.isOnline,
                    lastOnlineAt: new Date(payload.lastOnlineAt),
                  }
                : u
            ),
          });
        }
      }
    );

    setSocket(_socket);

    return () => {
      _socket.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        sendMessage,
        emitTypingStart,
        emitTypingStop,
        emitDeleteConversation,
        emitCallStart,
        emitCallAccept,
        emitCallReject,
        emitCallHangup,
        emitCallSignal,
        selfOnline,
        selfLastOnlineAt,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
