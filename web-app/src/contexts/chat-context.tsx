import { create } from "zustand";

type Conversation = {
  id: string;
  name: string | null;
  description: string | null;
  type: "ONE_TO_ONE" | "GROUP";
  users: any[]; // You can define a proper User type later
  messages: any[]; // You can define a proper Message type later
  notifications: any[]; // You can define a proper Notification type later
  lastMessageId: string | null;
  lastMessage: any | null; // You can define a proper Message type later
  createdAt: Date;
  updatedAt: Date;
};

type ChatStore = {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoadingConversations: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setIsLoadingConversations: (loading: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  selectedConversation: null,
  isLoadingConversations: false,
  setConversations: (conversations) => set({ conversations }),
  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),
  setIsLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),
}));
