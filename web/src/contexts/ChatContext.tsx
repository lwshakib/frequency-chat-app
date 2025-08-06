import type { ChatState, Contact, Message } from "@/types/chat";
import React, { createContext } from "react";

interface ChatContextType {
  state: ChatState;
  contacts: Contact[];
  messages: Message[];
  dispatch: React.Dispatch<ChatAction>;
  selectContact: (contactId: string) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  sendMessage: (content: string) => void;
}

type ChatAction =
  | { type: "SELECT_CONTACT"; payload: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "SET_TYPING"; payload: boolean };

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
