import type { ChatState, Contact, Message } from "@/types/chat";
import type { ReactNode } from "react";
import { useReducer } from "react";
import { ChatContext } from "./ChatContext";

type ChatAction =
  | { type: "SELECT_CONTACT"; payload: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "SET_TYPING"; payload: boolean };

const initialState: ChatState = {
  selectedContactId: null,
  isSidebarOpen: false,
  searchQuery: "",
  isTyping: false,
};

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastMessage: "Hey! How are you doing?",
    timestamp: "2 min ago",
    isOnline: true,
    unreadCount: 2,
  },
  {
    id: "2",
    name: "Design Team",
    avatar:
      "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastMessage: "Meeting at 3 PM today",
    timestamp: "1 hour ago",
    isOnline: false,
    unreadCount: 0,
    isGroup: true,
  },
  {
    id: "3",
    name: "Alex Rodriguez",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastMessage: "Thanks for the help!",
    timestamp: "3 hours ago",
    isOnline: true,
    unreadCount: 0,
  },
  {
    id: "4",
    name: "Emma Watson",
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastMessage: "See you tomorrow",
    timestamp: "1 day ago",
    isOnline: false,
    unreadCount: 1,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "1",
    content: "Hey! How are you doing?",
    timestamp: "10:30 AM",
    type: "text",
    isOwn: false,
  },
  {
    id: "2",
    senderId: "me",
    content: "I'm doing great! Just working on some projects.",
    timestamp: "10:32 AM",
    type: "text",
    isOwn: true,
  },
  {
    id: "3",
    senderId: "1",
    content: "That sounds exciting! What kind of projects?",
    timestamp: "10:33 AM",
    type: "text",
    isOwn: false,
  },
];

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SELECT_CONTACT":
      return {
        ...state,
        selectedContactId: action.payload,
        isSidebarOpen: false,
      };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_TYPING":
      return { ...state, isTyping: action.payload };
    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const selectContact = (contactId: string) => {
    dispatch({ type: "SELECT_CONTACT", payload: contactId });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  };

  const sendMessage = (content: string) => {
    // In a real app, this would send the message to a server
    console.log("Sending message:", content);
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        contacts: mockContacts,
        messages: mockMessages,
        dispatch,
        selectContact,
        toggleSidebar,
        setSearchQuery,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
