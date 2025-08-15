export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  unreadCount: number;
  isGroup?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file";
  isOwn: boolean;
}

export interface ChatState {
  selectedContact: Contact | null;
  isSidebarOpen: boolean;
  searchQuery: string;
  isTyping: boolean;
}
