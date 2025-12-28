import React from "react";
import { Socket } from "socket.io-client";
import type { Conversation, Message } from "../types";

export interface SocketContextType {
  socket: Socket | undefined;
  sendMessage: (message: Message, conversationOverride?: Conversation) => void;
  emitTypingStart: (conversation: Conversation, fromUserId: string) => void;
  emitTypingStop: (conversation: Conversation, fromUserId: string) => void;
  emitDeleteConversation: (conversation: Conversation) => void;
  emitCallStart: (payload: {
    conversationId: string;
    type: "AUDIO" | "VIDEO";
    participants: string[];
    callerId: string;
  }) => void;
  emitCallAccept: (payload: {
    conversationId: string;
    callerId: string;
    calleeId: string;
  }) => void;
  emitCallReject: (payload: {
    conversationId: string;
    callerId: string;
    calleeId: string;
  }) => void;
  emitCallHangup: (payload: {
    conversationId: string;
    participants: string[];
    isGroup: boolean;
  }) => void;
  emitCallSignal: (payload: {
    conversationId: string;
    signal: any;
    toUserId: string;
    fromUserId: string;
  }) => void;
  selfOnline: boolean;
  selfLastOnlineAt: string | undefined;
}

export const SocketContext = React.createContext<SocketContextType | null>(
  null
);
