import React from "react";
import { Socket } from "socket.io-client";
import type { Message } from "../types";

export interface SocketContextType {
  socket: Socket | undefined;
  sendMessage: (message: Message) => void;
  createGroupSocketMessage: (data: any) => void;
}

export const SocketContext = React.createContext<SocketContextType | null>(
  null
);
