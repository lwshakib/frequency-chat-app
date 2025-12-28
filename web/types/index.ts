export enum CONVERSATION_TYPE {
  ONE_TO_ONE = "ONE_TO_ONE",
  GROUP = "GROUP",
}

export enum MESSAGE_READ_STATUS {
  READ = "READ",
  UNREAD = "UNREAD",
}

export interface User {
  id: string; // Internal ID
  clerkId?: string; // For compatibility
  name: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  imageUrl?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  emailAddresses?: { emailAddress: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  name: string | null;
  description: string | null;
  type: CONVERSATION_TYPE;
  users: User[];
  admins: string[];
  messages: any[];
  lastMessageId: string | null;
  lastMessage: any | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string | null;
  type: "text" | "files" | "text+files" | "system" | "audio";
  files?: { url: string; name: string; bytes: number }[];
  conversationId: string;
  senderId: string;
  isRead: MESSAGE_READ_STATUS;
  createdAt: Date;
  updatedAt: Date;
  sender: User;
}
