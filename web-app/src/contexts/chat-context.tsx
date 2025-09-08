import { create } from "zustand";
import type { Conversation, Message } from "../types";

type ChatStore = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  unreadCountByConversationId: Record<string, number>;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoadingConversations: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  unreadCountByConversationId: {},
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) =>
    set((state) => {
      const next = { ...state.unreadCountByConversationId };
      if (conversation?.id) {
        next[conversation.id] = 0;
      }
      return {
        selectedConversation: conversation,
        unreadCountByConversationId: next,
      };
    }),
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),
  setIsLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCountByConversationId: {
        ...state.unreadCountByConversationId,
        [conversationId]:
          (state.unreadCountByConversationId[conversationId] || 0) + 1,
      },
    })),
  resetUnread: (conversationId) =>
    set((state) => ({
      unreadCountByConversationId: {
        ...state.unreadCountByConversationId,
        [conversationId]: 0,
      },
    })),
}));
