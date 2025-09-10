import { Button } from "@/components/ui/button";
import type { Conversation } from "@/types";

export default function ConversationList({
  conversations,
  currentUserId,
  unreadCountByConversationId,
  typingByConversationId,
  onClickConversation,
  selectedConversationId,
}: {
  conversations: Conversation[];
  currentUserId?: string;
  unreadCountByConversationId: Record<string, number>;
  typingByConversationId: Record<string, string[]>;
  onClickConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const otherUsers = conversation.users.filter(
          (u) => u.clerkId !== (currentUserId || "")
        );

        const getDisplayName = () => {
          if (conversation.name) return conversation.name;
          if (conversation.type === "ONE_TO_ONE" && otherUsers.length > 0) {
            return otherUsers[0].name || otherUsers[0].email;
          }
          return "Unknown";
        };

        const getTypingLabel = () => {
          const typingIds = typingByConversationId[conversation.id] || [];
          const visible = typingIds.filter(
            (id) => id !== (currentUserId || "")
          );
          if (visible.length === 0) return null;
          if (conversation.type === "ONE_TO_ONE") {
            return "Typing…";
          }
          const names = conversation.users
            .filter((u) => visible.includes(u.clerkId))
            .map((u) => u.name || u.email || "Someone");
          if (names.length === 1) return `${names[0]} is typing…`;
          const prefix = names.slice(0, 2).join(", ");
          return `${prefix}${names.length > 2 ? ", …" : ""} are typing…`;
        };

        const getLastMessage = () => {
          const typing = getTypingLabel();
          if (typing) return typing;
          if (conversation.lastMessage) return conversation.lastMessage;
          return "No messages yet";
        };

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
        const colorIndex = conversation.id.charCodeAt(0) % colors.length;
        const avatarColor = colors[colorIndex];

        const isSelected = selectedConversationId === conversation.id;
        return (
          <Button
            key={conversation.id}
            variant="ghost"
            className={`w-full justify-start h-auto cursor-pointer p-2 ${
              isSelected ? "bg-muted" : ""
            }`}
            onClick={() => onClickConversation(conversation)}
          >
            <div
              className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center mr-2 flex-shrink-0`}
            >
              <span className="text-xs text-white font-medium">
                {getInitials(getDisplayName())}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium">{getDisplayName()}</div>
              <div className="text-xs text-muted-foreground truncate">
                {getLastMessage()}
              </div>
            </div>
            {unreadCountByConversationId[conversation.id] > 0 && (
              <div className="ml-2 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                {unreadCountByConversationId[conversation.id] > 99
                  ? "99+"
                  : unreadCountByConversationId[conversation.id]}
              </div>
            )}
          </Button>
        );
      })}
    </div>
  );
}
