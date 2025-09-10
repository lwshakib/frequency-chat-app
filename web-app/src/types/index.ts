// Database enums
export const CONVERSATION_TYPE = {
  ONE_TO_ONE: "ONE_TO_ONE",
  GROUP: "GROUP",
} as const;

export const MESSAGE_READ_STATUS = {
  UNREAD: "UNREAD",
  READ: "READ",
  SENT: "SENT",
} as const;

export type CONVERSATION_TYPE =
  (typeof CONVERSATION_TYPE)[keyof typeof CONVERSATION_TYPE];
export type MESSAGE_READ_STATUS =
  (typeof MESSAGE_READ_STATUS)[keyof typeof MESSAGE_READ_STATUS];

// Base types
export interface User {
  id: string;
  clerkId: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  isOnline?: boolean;
  lastOnlineAt?: string | Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  type: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: MESSAGE_READ_STATUS;
  files: (string | { url: string; name: string; bytes: number })[];
  createdAt: Date;
  updatedAt: Date;
  sender: User;
}

export interface Conversation {
  id: string;
  name: string | null;
  description: string | null;
  imageUrl?: string | null;
  type: CONVERSATION_TYPE;
  users: User[];
  admins: { clerkId: string; name: string | null }[];
  messages: Message[];
  lastMessageId: string | null;
  lastMessage: { content: string } | string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface GetConversationByIdResponse {
  conversation: Conversation;
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface GetUsersResponse {
  users: User[];
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type: string;
  files?: (string | { url: string; name: string; bytes: number })[];
  audio?: unknown;
}

export interface CreateMessageResponse {
  data: Message;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  userIds: string[];
  adminId: string;
}

export interface CreateGroupResponse {
  data: Conversation;
}

export interface UpdateGroupRequest {
  conversationId: string;
  requesterId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  addMemberIds?: string[];
  removeMemberIds?: string[];
  addAdminIds?: string[];
  removeAdminIds?: string[];
}

export interface UpdateGroupResponse {
  data: Conversation;
}
