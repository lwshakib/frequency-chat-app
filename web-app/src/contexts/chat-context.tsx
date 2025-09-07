import { create } from "zustand";
import type { Conversation, Message } from "../types";

type ChatStore = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoadingConversations: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),
  setIsLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
}));
