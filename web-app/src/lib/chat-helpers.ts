import type { Conversation } from "@/types";
import { formatDistanceToNow } from "date-fns";

export const getDisplayName = (
  conversation: Conversation | null | undefined,
  currentUserId?: string
): string => {
  if (!conversation) return "Select a conversation";
  if (conversation.name) return conversation.name;
  if (conversation.type === "ONE_TO_ONE" && conversation.users.length > 0) {
    const otherUser = conversation.users.find(
      (u) => u.clerkId !== (currentUserId || "")
    );
    return otherUser?.name || otherUser?.email || "Unknown";
  }
  return "Unknown";
};

export const getDisplayDescription = (
  conversation: Conversation | null | undefined
): string => {
  if (!conversation) return "Choose a conversation to start chatting";
  if (conversation.description) return conversation.description;
  if (conversation.type === "GROUP") {
    return `${conversation.users.length} members`;
  }
  return conversation.type === "ONE_TO_ONE" ? "Direct message" : "Group chat";
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (id: string): string => {
  const colors = [
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-cyan-500",
  ];
  const colorIndex = id.charCodeAt(0) % colors.length;
  return colors[colorIndex];
};

export const formatMessageTime = (date: Date | string | number): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
