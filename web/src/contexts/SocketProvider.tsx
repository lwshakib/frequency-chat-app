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
  notificationsLoading: boolean;
  markNotificationsAsRead: (conversationId: string) => void;
  markNotificationsAsOpened: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
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
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUser();

  // Auto-open sidebar on mobile when no conversation is selected
  useEffect(() => {
    if (!selectedConversation && window.innerWidth < 1024) {
      setIsSidebarOpen(true);
    }
  }, [selectedConversation]);

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (msg) => {
      if (socket) {
        console.log("Send Message", msg);
        socket.emit("event:message", { data: msg });
      }
    },
    [socket]
  );

  const onMessageRec = useCallback(
    (msg: any) => {
      console.log(msg);

      if (msg.conversation.id !== selectedConversation?.id) {
        console.log(conversations, msg);

        if (
          !conversations
            .map((conv: any) => conv.id)
            .includes(msg.conversation.id)
        ) {
          setConversations((prev: any) => [...prev, msg.conversation]);
          setNotifications((prev: any) => [
            ...prev,
            {
              message: msg.message,
              isOpened: false,
              conversation: msg.conversation,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        } else {
          setNotifications((prev: any) => [
            ...prev,
            {
              message: { ...msg.message, isRead: "UNREAD" },
              isOpened: false,
              conversation: msg.conversation,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        fetch(`/api/messages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageIds: [msg.message.id],
            isRead: "READ",
          }),
        }).catch((error) => {
          console.error("Failed to mark messages as read:", error);
        });
        setConversations((prev: any) =>
          prev.map((conv: any) =>
            conv.id === msg.conversation.id
              ? {
                  ...conv,
                  lastMessage:
                    msg.message.content ||
                    (msg.message.type === "audio" &&
                    msg.message.files &&
                    msg.message.files.length > 0
                      ? "Voice message"
                      : msg.message.files && msg.message.files.length > 0
                      ? `${msg.message.files.length} file${
                          msg.message.files.length > 1 ? "s" : ""
                        }`
                      : ""),
                }
              : conv
          )
        );
        setMessages((prev: any) => [...prev, msg.message]);
      }
      setConversations((prev: any) =>
        prev.map((conv: any) =>
          conv.id === msg.conversation.id
            ? {
                ...conv,
                lastMessage:
                  msg.message.content ||
                  (msg.message.type === "audio" &&
                  msg.message.files &&
                  msg.message.files.length > 0
                    ? "Voice message"
                    : msg.message.files && msg.message.files.length > 0
                    ? `${msg.message.files.length} file${
                        msg.message.files.length > 1 ? "s" : ""
                      }`
                    : ""),
              }
            : conv
        )
      );
    },
    [selectedConversation, conversations]
  );

  // Function to mark notifications as read for a specific conversation
  const markNotificationsAsRead = useCallback(
    (conversationId: string) => {
      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.conversation?.id === conversationId
            ? {
                ...notification,
                message: {
                  ...notification.message,
                  isRead: "READ",
                },
              }
            : notification
        )
      );

      // Update database - mark messages as read
      const conversationNotifications = notifications.filter(
        (n) => n.conversation?.id === conversationId
      );
      const messageIds: string[] = conversationNotifications
        .map((n) => n.message?.id)
        .filter((id): id is string => typeof id === "string");

      if (messageIds.length > 0) {
        fetch(`/api/messages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageIds, isRead: "READ" }),
        }).catch((error) => {
          console.error("Failed to mark messages as read:", error);
        });
      }
    },
    [notifications]
  );

  // Function to mark all notifications as opened
  const markNotificationsAsOpened = useCallback(() => {
    // Update local state
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isOpened: true }))
    );

    // Update database - mark notifications as opened
    const unopenedNotificationIds: string[] = notifications
      .filter((n) => !n.isOpened && typeof n.id === "string")
      .map((n) => n.id as string);

    if (unopenedNotificationIds.length > 0) {
      fetch(`/api/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOpened: true,
          ids: unopenedNotificationIds,
        }),
      }).catch((error) => {
        console.error("Failed to mark notifications as opened:", error);
      });
    }
  }, [notifications]);

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

  const startTyping = (data: any) => {
    if (socket) {
      socket.emit("typing:start", { data });
    }
  };

  const endTyping = (data: any) => {
    if (socket) {
      socket.emit("typing:end", { data });
    }
  };

  const createGroupOnSocket = (data: any) => {
    if (socket) {
      socket.emit("create:group", { data });
    }
  };

  const removeGroupOnSocket = (data: any) => {
    if (socket) {
      socket.emit("remove:group", { data });
    }
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const _socket = io("http://localhost:3000");
    _socket.on("message", onMessageRec);

    _socket.on("typing:start", (data) => {
      setTyping(data);
    });

    _socket.on("typing:end", () => {
      setTyping(null);
    });

    _socket.on("create:group", (data) => {
      setConversations((prev) => [...prev, data]);
    });

    _socket.on("remove:group", (data) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== data.id));
      // If the removed group was selected, clear the selection
      if (selectedConversation?.id === data.id) {
        setSelectedConversation(null);
        setMessages([]);
      }
    });

    _socket.emit("join:server", user?.id);
    setSocket(_socket);

    return () => {
      _socket.off("message", onMessageRec);
      _socket.disconnect();
      setSocket(undefined);
    };
  }, [selectedConversation, conversations]);

  // Fetch notifications from API
  useEffect(() => {
    if (user?.id) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          // Transform database notifications to match our frontend structure
          const transformedNotifications = data.notifications.map(
            (notification: any) => ({
              message: {
                ...notification.message,
                isRead: notification.message.isRead,
              },
              isOpened: notification.isOpened,
              conversation: notification.conversation,
              createdAt: notification.createdAt,
              updatedAt: notification.updatedAt,
              id: notification.id,
            })
          );
          setNotifications(transformedNotifications);
          setNotificationsLoading(false);
          const messageIds = data.notifications
            .map((notification: any) => {
              const message = notification.message;
              return message.isRead === "UNREAD" &&
                typeof message.id === "string"
                ? message.id
                : null;
            })
            .filter((id: string | null): id is string => id !== null);

          if (messageIds.length > 0) {
            fetch(`/api/messages`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds, isRead: "SENT" }),
            }).catch((error) => {
              console.error("Failed to mark messages as sent:", error);
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch notifications:", error);
          setNotificationsLoading(false);
        });
    }
  }, [user?.id]);

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        joinRoom,
        leaveRoom,
        startTyping,
        endTyping,
        typing,
        setTyping,
        messages,
        setMessages,
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        createGroupOnSocket,
        removeGroupOnSocket,
        notifications,
        setNotifications,
        notificationsLoading,
        markNotificationsAsRead,
        markNotificationsAsOpened,
        isSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
