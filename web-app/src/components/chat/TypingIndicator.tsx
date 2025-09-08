import { useChatStore } from "@/contexts/chat-context";
import { useUser } from "@clerk/clerk-react";

export default function TypingIndicator({
  conversationId,
}: {
  conversationId: string;
}) {
  const { typingByConversationId, selectedConversation } = useChatStore();
  const { user } = useUser();
  const typingIds = typingByConversationId[conversationId] || [];
  const visibleIds = typingIds.filter((id) => id !== user?.id);
  if (!selectedConversation || visibleIds.length === 0) return null;
  const names = selectedConversation.users
    .filter((u) => visibleIds.includes(u.clerkId))
    .map((u) => u.name || u.email || "Someone");
  const label =
    names.length === 1
      ? `${names[0]} is typing…`
      : `${names.slice(0, 2).join(", ")}${
          names.length > 2 ? ", …" : ""
        } are typing…`;
  return <div className="px-2 pt-2 text-xs text-muted-foreground">{label}</div>;
}
