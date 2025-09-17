import React from "react";
import { Socket } from "socket.io-client";
import type { Conversation, Message } from "../types";

export interface SocketContextType {
  socket: Socket | undefined;
  sendMessage: (message: Message) => void;
  createGroupSocketMessage: (
    data: Conversation & { initiatorId?: string }
  ) => void;
  emitTypingStart: (conversation: Conversation, fromClerkId: string) => void;
  emitTypingStop: (conversation: Conversation, fromClerkId: string) => void;
  emitDeleteConversation: (conversation: Conversation) => void;
  selfOnline: boolean;
  selfLastOnlineAt?: string;
  callToUserBySocket: (data: {
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
  }) => void;
  incomingCall: null | {
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
  };
  clearIncomingCall: () => void;
  acceptIncomingCall: () => void;
  cancelIncomingCall: () => void;
  cancelOutgoingCall: (conversation: Conversation, fromClerkId: string) => void;
  callEvent: null | {
    type: "ringing" | "accepted" | "cancelled";
    conversationId: string;
    byClerkId: string;
    at: number;
  };
  clearCallEvent: () => void;
}

export const SocketContext = React.createContext<SocketContextType | null>(
  null
);
