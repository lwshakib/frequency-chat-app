import type { ChatState, Contact, Message } from "@/types/chat";
import React, { createContext } from "react";

interface ChatContextType {
  state: ChatState;
  contacts: Contact[];
  messages: Message[];
  dispatch: React.Dispatch<ChatAction>;
  selectContact: (contact: Contact) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  sendMessage: (content: string) => void;
  addContact: (contact: Contact) => void;
}

type ChatAction =
  | { type: "SELECT_CONTACT"; payload: Contact }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "ADD_CONTACT"; payload: Contact };

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
