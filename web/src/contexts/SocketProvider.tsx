"use client";
import { useUser } from "@clerk/clerk-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
  children?: React.ReactNode;
}

interface ISocketContext {
  sendMessage: (msg: any) => any;
  joinRoom: (conversationId: string) => void;
  leaveRoom: (conversationId: string) => void;
  startTyping: (data: any) => void;
  endTyping: (data: any) => void;
  typing: any;
  setTyping: (typing: any) => void;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  conversations: any[];
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  selectedConversation: any;
  setSelectedConversation: (conversation: any) => void;
  createGroupOnSocket: (data: any) => void;
  removeGroupOnSocket: (data: any) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if (!state) throw new Error(`state is undefined`);

  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket>();
  const [typing, setTyping] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useUser();

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (msg) => {
      console.log("Send Message", msg);
      if (socket) {
        socket.emit("event:message", { data: msg });
      }
    },
    [socket]
  );

  const onMessageRec = useCallback((msg: any) => {
    console.log("Selected Conversation", selectedConversation);
    if (msg.conversation.id !== selectedConversation?.id) {
      setNotifications((prev: any) => [...prev, msg]);
    }
    setMessages((prev: any) => [...prev, msg.message]);
  }, [selectedConversation]);
  

  const joinRoom = (conversationId: string) => {
    if (socket) {
      socket.emit("room:join", { conversationId });
    }
  };

  const leaveRoom = (conversationId: string) => {
    if (socket) {
      socket.emit("room:leave", { conversationId });
    }
  };

  const startTyping = (data: any)=>{
    if(socket){
      socket.emit("typing:start", {data})
    }
  }


  const endTyping = (data: any)=>{
    if(socket){
      socket.emit("typing:end", {data})
    }
  }

  const createGroupOnSocket = (data: any)=>{
    if(socket){
      socket.emit("create:group", {data})
    }
  }

const removeGroupOnSocket = (data: any)=>{
    if(socket){
      socket.emit("remove:group", {data})
    }
}

  useEffect(() => {
    const _socket = io("http://localhost:3000");
    _socket.on("message", onMessageRec);

    _socket.on("typing:start", (data) => {
      // console.log("Client started typing", data);
      setTyping(data);
    });

    _socket.on("typing:end", (data) => {
      // console.log("Client stopped typing", data);
      setTyping(null);
    });

    _socket.on("create:group", (data) => {
      console.log("Client created group", data);
      setConversations((prev) => [...prev, data]);
    });

    _socket.on("remove:group", (data) => {
      console.log("Client removed group", data);
      setConversations((prev) => prev.filter((conv) => conv.id !== data.id));
    });

    _socket.emit("join:server", user?.id);
    setSocket(_socket);


    return () => {
      _socket.off("message", onMessageRec);
      _socket.disconnect();
      setSocket(undefined);
    };
  }, [selectedConversation]);

  return (
    <SocketContext.Provider value={{ sendMessage, joinRoom, leaveRoom, startTyping, endTyping, typing, setTyping, messages, setMessages, conversations, setConversations, selectedConversation, setSelectedConversation, createGroupOnSocket, removeGroupOnSocket, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};