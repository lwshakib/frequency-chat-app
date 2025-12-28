export enum CONVERSATION_TYPE {
  ONE_TO_ONE = "ONE_TO_ONE",
  GROUP = "GROUP",
}

export interface User {
  id: string; // Internal ID
  clerkId: string; // For compatibility
  name: string | null;
  email: string;
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
  createdAt: Date;
  updatedAt: Date;
}
