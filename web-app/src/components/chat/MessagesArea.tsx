import ConversationEmpty from "@/components/chat/ConversationEmpty";
import MessagesList from "@/components/chat/MessagesList";
import TypingIndicator from "@/components/chat/TypingIndicator";
import WelcomePanel from "@/components/chat/WelcomePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/contexts/chat-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatMessageTime,
  getDisplayDescription,
  getDisplayName,
  getInitials,
} from "@/lib/chat-helpers";
import type { Conversation, Message } from "@/types";
import { useUser } from "@clerk/clerk-react";
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
  const { typingByConversationId } = useChatStore();
  const { user } = useUser();
  const shouldShowLoading = React.useMemo(() => {
    if (!isLoading) return false;
    return !isOneToOne; // hide loading UI for 1:1
  }, [isLoading, isOneToOne]);

  const typingIds = conversation
    ? typingByConversationId[conversation.id] || []
    : [];
  const visibleTypingIds = typingIds.filter((id) => id !== user?.id);

  const showTypingBubble = conversation && visibleTypingIds.length > 0;

  return (
    <div className="flex-1 min-h-0 bg-gradient-to-b from-background to-background overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-4 md:p-6">
          {conversation ? (
            shouldShowLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      index % 3 === 0 ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[72%] ${
                        index % 3 === 0 ? "flex-row-reverse" : "flex-row"
                      } items-end space-x-2`}
                    >
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="space-y-2">
                        <Skeleton
                          className={`h-12 ${
                            index % 3 === 0 ? "w-32" : "w-40"
                          } rounded-2xl`}
                        />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <ConversationEmpty
                conversationId={conversation.id}
                displayName={getDisplayName(conversation)}
                displayDescription={getDisplayDescription(conversation)}
                imageUrl={
                  conversation.type === "GROUP"
                    ? conversation.imageUrl || null
                    : null
                }
              />
            ) : (
              <>
                <MessagesList
                  messages={messages}
                  isCurrentUser={isCurrentUser}
                  getInitials={getInitials}
                  formatMessageTime={formatMessageTime}
                />
                {showTypingBubble && conversation && (
                  <TypingIndicator conversationId={conversation.id} />
                )}
              </>
            )
          ) : (
            <WelcomePanel resolvedTheme={resolvedTheme} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
