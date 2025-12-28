import { create } from "zustand";
import { authClient } from "@/lib/auth-client";
import { Conversation } from "@/types";

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
  unreadCountByConversationId: Record<string, number>;
  setUnreadCountByConversationId: (counts: Record<string, number>) => void;
  resetUnread: (conversationId: string) => void;
  typingByConversationId: Record<string, any>;
  setTypingByConversationId: (typing: Record<string, any>) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
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
  unreadCountByConversationId: {},
  setUnreadCountByConversationId: (unreadCountByConversationId) =>
    set({ unreadCountByConversationId }),
  resetUnread: (conversationId) =>
    set((state) => ({
      unreadCountByConversationId: {
        ...state.unreadCountByConversationId,
        [conversationId]: 0,
      },
    })),
  typingByConversationId: {},
  setTypingByConversationId: (typingByConversationId) =>
    set({ typingByConversationId }),
}));
