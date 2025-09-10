import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/contexts/chat-context";
import { getInitials } from "@/lib/chat-helpers";
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

  const typingUsers = selectedConversation.users.filter((u) =>
    visibleIds.includes(u.clerkId)
  );

  return (
    <div className="mt-2 flex items-end gap-2">
      {selectedConversation.type === "GROUP" && typingUsers[0] && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={typingUsers[0].imageUrl || undefined}
            alt={typingUsers[0].name || typingUsers[0].email || "User"}
          />
          <AvatarFallback className="text-[10px] font-medium">
            {getInitials(typingUsers[0].name || typingUsers[0].email || "User")}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-[70%]">
        <div className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-muted">
          <span className="sr-only">Typing</span>
          <span
            className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-foreground/70 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
