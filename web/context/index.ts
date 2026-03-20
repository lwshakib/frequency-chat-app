import { create } from "zustand";
import { authClient } from "@/lib/auth-client";
import { Conversation, CallState, User } from "@/types";
import { ApiNotification } from "@/lib/api";

type SessionData = ReturnType<typeof authClient.useSession>["data"];

interface ChatStore {
  session: SessionData | null;
  setSession: (session: SessionData | null) => void;
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
  isLoadingConversations: boolean;
  setIsLoadingConversations: (loading: boolean) => void;
  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  typingByConversationId: Record<string, Record<string, boolean>>;
  addTyping: (conversationId: string, userId: string) => void;
  removeTyping: (conversationId: string, userId: string) => void;
  setTypingByConversationId: (
    typing: Record<string, Record<string, boolean>>
  ) => void;
  messages: any[];
  setMessages: (messages: any[]) => void;
  isLoadingMessages: boolean;
  setIsLoadingMessages: (loading: boolean) => void;
  activeCall: CallState | null;
  setActiveCall: (call: CallState | null) => void;
  notifications: ApiNotification[];
  setNotifications: (notifications: ApiNotification[]) => void;
  addNotification: (notification: ApiNotification) => void;
  markNotificationRead: (notificationId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markNotificationRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    })),
  session: null,
  setSession: (session) => set({ session }),
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  isLoadingConversations: false,
  setIsLoadingConversations: (isLoadingConversations) =>
    set({ isLoadingConversations }),
  incrementUnread: (conversationId: string) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c
      ),
    })),
  resetUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),
  addTyping: (conversationId: string, userId: string) =>
    set((state) => ({
      typingByConversationId: {
        ...state.typingByConversationId,
        [conversationId]: {
          ...(state.typingByConversationId[conversationId] || {}),
          [userId]: true,
        },
      },
    })),
  removeTyping: (conversationId: string, userId: string) =>
    set((state) => {
      const conversationTyping = {
        ...(state.typingByConversationId[conversationId] || {}),
      };
      delete conversationTyping[userId];
      return {
        typingByConversationId: {
          ...state.typingByConversationId,
          [conversationId]: conversationTyping,
        },
      };
    }),
  typingByConversationId: {},
  setTypingByConversationId: (typingByConversationId) =>
    set({ typingByConversationId }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  isLoadingMessages: false,
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  activeCall: null,
  setActiveCall: (activeCall) => set({ activeCall }),
}));
