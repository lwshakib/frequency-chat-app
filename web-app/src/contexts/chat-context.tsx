import { create } from "zustand";

type Message = {
  id: string;
  content: string;
  type: string;
  files: any[];
  conversationId: string;
  senderId: string;
  isRead: string;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    clerkId: string;
    name: string;
    email: string;
  };
};

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
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
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
  setMessages: (messages) => set({ messages }),
  setIsLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
}));
