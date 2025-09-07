import { useUser } from "@clerk/clerk-react";
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Message } from "../types";
import { useChatStore } from "./chat-context";
import { SocketContext, type SocketContextType } from "./socket-context";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextType["socket"]>();
  const { selectedConversation, setMessages } = useChatStore();
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

  const onMessageRec = useCallback(
    (msg: Message) => {
      console.log(msg);
      setMessages((prev) => [...prev, msg]);
    },
    [setMessages]
  );

  useEffect(() => {
    const _socket = io(import.meta.env.VITE_API_URL);
    setSocket(_socket);

    _socket.emit("join:server", user?.id);
    _socket.on("message", onMessageRec);

    return () => {
      _socket.disconnect();
    };
  }, [user?.id, onMessageRec]);
  return (
    <SocketContext.Provider value={{ socket, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};
