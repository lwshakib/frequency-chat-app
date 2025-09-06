import { create } from "zustand";

type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
};

type ChatStore = {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
};
export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
}));
