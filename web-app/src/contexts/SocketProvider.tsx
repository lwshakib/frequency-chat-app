import { useUser } from "@clerk/clerk-react";
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Conversation, Message } from "../types";
import { useChatStore } from "./chat-context";
import { SocketContext, type SocketContextType } from "./socket-context";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType["socket"]>();
  const [selfOnline, setSelfOnline] = useState<boolean>(false);
  const [selfLastOnlineAt, setSelfLastOnlineAt] = useState<
    string | undefined
  >();
  const [incomingCall, setIncomingCall] =
    useState<SocketContextType["incomingCall"]>(null);
  const [callEvent, setCallEvent] =
    useState<SocketContextType["callEvent"]>(null);
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

  const emitDeleteConversation = useCallback(
    (conversation: Conversation) => {
      const memberIds = conversation.users.map((u) => u.clerkId);
      socket?.emit("delete:conversation", {
        conversationId: conversation.id,
        memberIds,
      });
    },
    [socket]
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

  const callToUserBySocket = useCallback(
    (data: {
      event: string; // video-call, audio-call
      calledBy: {
        clerkId: string;
        name: string;
        imageUrl: string;
      };
      conversation: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        users: {
          clerkId: string;
          name: string;
          imageUrl: string;
        }[];
      };
    }) => {
      socket?.emit("call:user", data);
    },
    [socket]
  );

  const acceptIncomingCall = useCallback(() => {
    if (!socket || !incomingCall || !user?.id) return;
    socket.emit("call:accept", {
      conversationId: incomingCall.conversation.id,
      acceptedBy: user.id,
      toClerkId: incomingCall.calledBy.clerkId,
    });
    setIncomingCall(null);
    setCallEvent({
      type: "accepted",
      conversationId: incomingCall.conversation.id,
      byClerkId: user.id,
      at: Date.now(),
    });
  }, [socket, incomingCall, user?.id]);

  const cancelIncomingCall = useCallback(() => {
    if (!socket || !incomingCall || !user?.id) return;
    socket.emit("call:cancel", {
      conversationId: incomingCall.conversation.id,
      cancelledBy: user.id,
      toClerkIds: [incomingCall.calledBy.clerkId],
    });
    setIncomingCall(null);
    setCallEvent({
      type: "cancelled",
      conversationId: incomingCall.conversation.id,
      byClerkId: user.id,
      at: Date.now(),
    });
  }, [socket, incomingCall, user?.id]);

  const cancelOutgoingCall = useCallback(
    (conversation: Conversation, fromClerkId: string) => {
      if (!socket) return;
      const toClerkIds = conversation.users
        .map((u) => u.clerkId)
        .filter((id) => id !== fromClerkId);
      if (toClerkIds.length === 0) return;
      socket.emit("call:cancel", {
        conversationId: conversation.id,
        cancelledBy: fromClerkId,
        toClerkIds,
      });
    },
    [socket]
  );

  // Create socket once per user session
  useEffect(() => {
    if (!user?.id) return;
    const _socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    setSocket(_socket);
    _socket.emit("join:server", user.id);
    return () => {
      _socket.disconnect();
      setSocket(undefined);
    };
  }, [user?.id]);

  // Bind listeners when socket is ready
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: Message) => onMessageRec(msg);
    const handleCreateGroup = (data: Conversation & { initiatorId?: string }) =>
      onCreateGroup(data);
    const handleDeleteConversation = (payload: { conversationId: string }) => {
      const { conversationId } = payload;
      const state = useChatStore.getState() as unknown as {
        conversations: Conversation[];
        setConversations: (c: Conversation[]) => void;
        selectedConversation: Conversation | null;
        setSelectedConversation: (c: Conversation | null) => void;
      };
      const remaining = state.conversations.filter(
        (c) => c.id !== conversationId
      );
      state.setConversations(remaining);
      if (state.selectedConversation?.id === conversationId) {
        state.setSelectedConversation(null);
      }
    };
    const handleTypingStart = (payload: {
      conversationId: string;
      fromClerkId: string;
    }) => {
      if (payload.fromClerkId === user?.id) return;
      const conv = useChatStore
        .getState()
        .conversations.find((c) => c.id === payload.conversationId);
      if (!conv) return;
      useChatStore
        .getState()
        .addTyping(payload.conversationId, payload.fromClerkId);
    };
    const handleTypingStop = (payload: {
      conversationId: string;
      fromClerkId: string;
    }) => {
      if (payload.fromClerkId === user?.id) return;
      const conv = useChatStore
        .getState()
        .conversations.find((c) => c.id === payload.conversationId);
      if (!conv) return;
      useChatStore
        .getState()
        .removeTyping(payload.conversationId, payload.fromClerkId);
    };
    const handlePresence = (payload: {
      clerkId: string;
      isOnline: boolean;
      lastOnlineAt: string;
    }) => {
      console.log("presence:update", payload);
      if (payload.clerkId === user?.id) {
        setSelfOnline(payload.isOnline);
        setSelfLastOnlineAt(payload.lastOnlineAt);
      }
      try {
        const state = useChatStore.getState() as unknown as {
          conversations: Conversation[];
          setConversations: (c: Conversation[]) => void;
          selectedConversation: Conversation | null;
          setSelectedConversation: (c: Conversation | null) => void;
        };
        // Update list conversations where one-to-one and includes this clerkId
        const updatedList = state.conversations.map((conv) => {
          if (conv.type !== "ONE_TO_ONE") return conv;
          if (!conv.users.some((u) => u.clerkId === payload.clerkId))
            return conv;
          return {
            ...conv,
            users: conv.users.map((u) =>
              u.clerkId === payload.clerkId
                ? {
                    ...u,
                    isOnline: payload.isOnline,
                    lastOnlineAt: payload.lastOnlineAt,
                  }
                : u
            ),
          };
        });
        state.setConversations(updatedList);

        // Update selectedConversation similarly if one-to-one and contains clerkId
        const sel = state.selectedConversation;
        if (
          sel &&
          sel.type === "ONE_TO_ONE" &&
          sel.users.some((u) => u.clerkId === payload.clerkId)
        ) {
          state.setSelectedConversation({
            ...sel,
            users: sel.users.map((u) =>
              u.clerkId === payload.clerkId
                ? {
                    ...u,
                    isOnline: payload.isOnline,
                    lastOnlineAt: payload.lastOnlineAt,
                  }
                : u
            ),
          });
        }
      } catch (e) {
        console.error("Failed to apply presence update to store", e);
      }
    };
    const handleCallUser = (payload: {
      event: string;
      calledBy: {
        clerkId: string;
        name: string;
        imageUrl: string;
      };
      conversation: {
        id: string;
        name: string;
        imageUrl: string;
        type: string;
        users: {
          clerkId: string;
          name: string;
          imageUrl: string;
        }[];
      };
    }) => {
      setIncomingCall(payload);
      // Inform caller that callee is ringing
      if (user?.id) {
        socket.emit("call:ringing", {
          conversationId: payload.conversation.id,
          ringingBy: user.id,
          toClerkId: payload.calledBy.clerkId,
        });
      }
    };
    const handleCallAccept = (payload: {
      conversationId: string;
      acceptedBy: string;
    }) => {
      setCallEvent({
        type: "accepted",
        conversationId: payload.conversationId,
        byClerkId: payload.acceptedBy,
        at: Date.now(),
      });
    };
    const handleCallCancel = (payload: {
      conversationId: string;
      cancelledBy: string;
    }) => {
      setCallEvent({
        type: "cancelled",
        conversationId: payload.conversationId,
        byClerkId: payload.cancelledBy,
        at: Date.now(),
      });
    };
    const handleCallRinging = (payload: {
      conversationId: string;
      ringingBy: string;
    }) => {
      setCallEvent({
        type: "ringing",
        conversationId: payload.conversationId,
        byClerkId: payload.ringingBy,
        at: Date.now(),
      });
    };
    socket.on("message", handleMessage);
    socket.on("create:group", handleCreateGroup);
    socket.on("delete:conversation", handleDeleteConversation);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("presence:update", handlePresence);
    socket.on("call:user", handleCallUser);
    socket.on("call:accept", handleCallAccept);
    socket.on("call:cancel", handleCallCancel);
    socket.on("call:ringing", handleCallRinging);
    return () => {
      socket.off("message", handleMessage);
      socket.off("create:group", handleCreateGroup);
      socket.off("delete:conversation", handleDeleteConversation);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:update", handlePresence);
      socket.off("call:user", handleCallUser);
      socket.off("call:accept", handleCallAccept);
      socket.off("call:cancel", handleCallCancel);
      socket.off("call:ringing", handleCallRinging);
    };
  }, [socket, onMessageRec, onCreateGroup, user?.id]);
  return (
    <SocketContext.Provider
      value={{
        socket,
        sendMessage,
        createGroupSocketMessage,
        emitTypingStart,
        emitTypingStop,
        emitDeleteConversation,
        selfOnline,
        selfLastOnlineAt,
        callToUserBySocket,
        incomingCall,
        clearIncomingCall: () => setIncomingCall(null),
        acceptIncomingCall,
        cancelIncomingCall,
        cancelOutgoingCall,
        callEvent,
        clearCallEvent: () => setCallEvent(null),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
