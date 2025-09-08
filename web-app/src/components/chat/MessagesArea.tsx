import ConversationEmpty from "@/components/chat/ConversationEmpty";
import MessageSkeleton from "@/components/chat/MessageSkeleton";
import MessagesList from "@/components/chat/MessagesList";
import WelcomePanel from "@/components/chat/WelcomePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatMessageTime,
  getAvatarColor,
  getDisplayDescription,
  getDisplayName,
  getInitials,
} from "@/lib/chat-helpers";
import type { Conversation, Message } from "@/types";
import * as React from "react";

type Props = {
  resolvedTheme?: string;
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isOneToOne: boolean;
  isCurrentUser: (senderId: string) => boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
};

export default function MessagesArea({
  resolvedTheme,
  conversation,
  messages,
  isLoading,
  isOneToOne,
  isCurrentUser,
  scrollAreaRef,
}: Props) {
  const shouldShowLoading = React.useMemo(() => {
    if (!isLoading) return false;
    return !isOneToOne; // hide loading UI for 1:1
  }, [isLoading, isOneToOne]);

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-4">
          {conversation ? (
            shouldShowLoading ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <ConversationEmpty
                conversationId={conversation.id}
                displayName={getDisplayName(conversation)}
                displayDescription={getDisplayDescription(conversation)}
              />
            ) : (
              <MessagesList
                messages={messages}
                isCurrentUser={isCurrentUser}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
                formatMessageTime={formatMessageTime}
              />
            )
          ) : (
            <WelcomePanel resolvedTheme={resolvedTheme} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
