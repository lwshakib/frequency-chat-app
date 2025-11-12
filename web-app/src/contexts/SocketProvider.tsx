import { usePeer } from "@/hooks/usePeer";
import { useUser } from "@clerk/clerk-react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Conversation, Message } from "../types";
import { useChatStore } from "./chat-context";
import { SocketContext, type SocketContextType } from "./socket-context";
import { getApiUrl } from "@/lib/env";

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
  const { peer, createOffer, createAnswer, setRemoteDescriptionAnswer } =
    usePeer();
  const isMakingOfferRef = useRef<boolean>(false);

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
      logger.debug("Message received:", msg);
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
      } catch (e) {
        logger.error("Failed to update conversation list on message", e);
      }
      if (
        selectedConversation &&
        msg.conversationId === selectedConversation.id
      ) {
        setMessages((prev) => [...prev, msg]);
      } else {
        incrementUnread(msg.conversationId);
      }
    },
    [setMessages, incrementUnread, selectedConversation]
  );

  const onCreateGroup = useCallback(
    (data: Conversation & { initiatorId?: string }) => {
      const conv = data as Conversation;
      setConversations([conv, ...conversations]);
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

  const sendRenegotiationOffer = useCallback(
    async (conversation: Conversation) => {
      if (!socket || !user?.id) return;
      const toClerkId = conversation.users
        .map((u) => u.clerkId)
        .find((id) => id !== user.id);
      if (!toClerkId) return;
      try {
        const offer = await createOffer();
        if (!offer) return;
        socket.emit("webrtc:offer", {
          roomId: conversation.id,
          conversationId: conversation.id,
          fromClerkId: user.id,
          toClerkId,
          offer,
        });
      } catch (e) {
        logger.error("Failed to send renegotiation offer", e);
      }
    },
    [socket, user?.id, createOffer]
  );

  const callToUserBySocket = useCallback(
    async (data: {
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
      try {
        const roomId = data.conversation.id;
        const toClerkId = data.conversation.users
          .map((u) => u.clerkId)
          .find((id) => id !== data.calledBy.clerkId);
        if (toClerkId) {
          socket?.emit("webrtc:room", {
            roomId,
            conversationId: data.conversation.id,
            members: data.conversation.users.map((u) => u.clerkId),
          });
          const offer = await createOffer();
          if (offer) {
            logger.debug("Sending offer:", offer);
            socket?.emit("webrtc:offer", {
              roomId,
              conversationId: data.conversation.id,
              fromClerkId: data.calledBy.clerkId,
              toClerkId,
              offer,
            });
          }
        }
      } catch (e) {
        logger.error("Failed to create room/send offer", e);
        toast.error("Failed to initiate call. Please try again.");
      }
    },
    [socket, createOffer]
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
      // Also set local cancel event so the same cleanup logic runs for the person who cancels
      setCallEvent({
        type: "cancelled",
        conversationId: conversation.id,
        byClerkId: fromClerkId,
        at: Date.now(),
      });
    },
    [socket]
  );

  useEffect(() => {
    if (!user?.id) return;
    
    const _socket = io(getApiUrl(), {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection event handlers
    _socket.on("connect", () => {
      logger.info("Socket connected:", _socket.id);
      setSelfOnline(true);
    });

    _socket.on("disconnect", (reason) => {
      logger.warn("Socket disconnected:", reason);
      setSelfOnline(false);
      if (reason === "io server disconnect") {
        // Server disconnected, need to manually reconnect
        _socket.connect();
      }
    });

    _socket.on("connect_error", (error) => {
      logger.error("Socket connection error:", error);
      toast.error("Connection failed. Attempting to reconnect...");
    });

    _socket.on("reconnect", (attemptNumber) => {
      logger.info("Socket reconnected after", attemptNumber, "attempts");
      toast.success("Reconnected successfully");
    });

    _socket.on("reconnect_attempt", (attemptNumber) => {
      logger.debug("Reconnection attempt:", attemptNumber);
    });

    _socket.on("reconnect_error", (error) => {
      logger.error("Reconnection error:", error);
    });

    _socket.on("reconnect_failed", () => {
      logger.error("Failed to reconnect after all attempts");
      toast.error("Connection lost. Please refresh the page.");
    });

    setSocket(_socket);
    _socket.emit("join:server", user.id);

    return () => {
      _socket.off("connect");
      _socket.off("disconnect");
      _socket.off("connect_error");
      _socket.off("reconnect");
      _socket.off("reconnect_attempt");
      _socket.off("reconnect_error");
      _socket.off("reconnect_failed");
      _socket.disconnect();
      setSocket(undefined);
    };
  }, [user?.id]);

  // Handle RTCPeerConnection negotiationneeded to renegotiate when tracks are added
  useEffect(() => {
    if (!peer || !socket) return;
    const handler = async () => {
      if (isMakingOfferRef.current) return;
      if (peer.signalingState !== "stable") return;
      isMakingOfferRef.current = true;
      try {
        if (selectedConversation) {
          await sendRenegotiationOffer(selectedConversation);
        }
      } catch (e) {
        logger.error("negotiationneeded handler failed", e);
      } finally {
        isMakingOfferRef.current = false;
      }
    };
    peer.onnegotiationneeded = handler;
    return () => {
      (peer as RTCPeerConnection).onnegotiationneeded = null;
    };
  }, [peer, socket, selectedConversation, sendRenegotiationOffer]);

  // Bind ICE candidate emission
  useEffect(() => {
    if (!peer || !socket || !selectedConversation || !user?.id) return;
    const onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
      const candidate = ev.candidate;
      if (!candidate) return;
      const toClerkId = selectedConversation.users
        .map((u) => u.clerkId)
        .find((id) => id !== user.id);
      if (!toClerkId) return;
      socket.emit("webrtc:ice-candidate", {
        conversationId: selectedConversation.id,
        fromClerkId: user.id,
        toClerkId,
        candidate,
      });
    };
    peer.onicecandidate = onicecandidate;
    return () => {
      (peer as RTCPeerConnection).onicecandidate = null;
    };
  }, [peer, socket, selectedConversation, user?.id]);

  useEffect(() => {
    if (!socket || !peer) return;
    const handleIceCandidate = async (payload: {
      conversationId: string;
      fromClerkId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        await peer.addIceCandidate(payload.candidate);
      } catch (e) {
        logger.error("Failed to add remote ICE candidate", e);
      }
    };
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    return () => {
      socket.off("webrtc:ice-candidate", handleIceCandidate);
    };
  }, [socket, peer]);

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
        logger.error("Failed to apply presence update to store", e);
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
      // Clear incoming call if it matches this conversation
      setIncomingCall((prev) => {
        if (prev && prev.conversation.id === payload.conversationId) {
          return null;
        }
        return prev;
      });
      // Set cancel event to notify UI
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
    const handleWebrtcOffer = async (payload: {
      roomId: string;
      conversationId: string;
      fromClerkId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      try {
        const answer = await createAnswer(payload.offer);
        if (answer && user?.id) {
          socket.emit("webrtc:answer", {
            roomId: payload.roomId,
            conversationId: payload.conversationId,
            fromClerkId: user.id,
            toClerkId: payload.fromClerkId,
            answer,
          });
        }
      } catch (e) {
        logger.error("Failed to create/send answer", e);
      }
    };
    const handleWebrtcAnswer = async (payload: {
      roomId: string;
      conversationId: string;
      fromClerkId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      try {
        if (peer && peer.signalingState !== "stable") {
          // Wait a tick to avoid InvalidStateError
          await new Promise((r) => setTimeout(r, 0));
        }
        await setRemoteDescriptionAnswer(payload.answer);
      } catch (e) {
        logger.error("Failed to apply remote answer", e);
      }
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
    socket.on("webrtc:offer", handleWebrtcOffer);
    socket.on("webrtc:answer", handleWebrtcAnswer);
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
      socket.off("webrtc:offer", handleWebrtcOffer);
      socket.off("webrtc:answer", handleWebrtcAnswer);
    };
  }, [
    socket,
    onMessageRec,
    onCreateGroup,
    user?.id,
    createAnswer,
    setRemoteDescriptionAnswer,
    peer,
  ]);
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
        sendRenegotiationOffer,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
