import React from "react";
import { Socket } from "socket.io-client";
import type { Conversation, Message } from "../types";

export interface SocketContextType {
  socket: Socket | undefined;
  sendMessage: (message: Message, conversationOverride?: Conversation) => void;
  emitTypingStart: (conversation: Conversation, fromUserId: string) => void;
  emitTypingStop: (conversation: Conversation, fromUserId: string) => void;
  emitDeleteConversation: (conversation: Conversation) => void;
  selfOnline: boolean;
  selfLastOnlineAt?: string;
}

export const SocketContext = React.createContext<SocketContextType | null>(
  null
);
