import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/context";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayDescription, getDisplayName } from "@/lib/chat-helpers";
import type { Conversation, Message } from "@/types";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessagesList from "./MessagesList";

type Props = {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isCurrentUser: (senderId: string) => boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  highlight?: string;
};

export default function MessagesArea({
  conversation,
  messages,
  isLoading,
  isCurrentUser,
  scrollAreaRef,
  highlight,
}: Props) {
  const { session, typingByConversationId } = useChatStore();
  const user = session?.user;

  const currentTyping = conversation
    ? typingByConversationId[conversation.id]
    : null;
  const typingUserIds = currentTyping ? Object.keys(currentTyping) : [];

  return (
    <div className="flex-1 min-h-0 bg-linear-to-b from-background to-background overflow-hidden px-1">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-4 md:p-6">
          {conversation ? (
            isLoading ? (
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
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
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
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">
                  {getDisplayName(conversation, user?.id)}
                </p>
                <p className="text-sm">{getDisplayDescription(conversation)}</p>
                <p className="mt-4">No messages yet. Say hi!</p>
              </div>
            ) : (
              <>
                <MessagesList
                  messages={messages}
                  isCurrentUser={isCurrentUser}
                  highlight={highlight}
                />

                {/* Enhanced Typing Indicator */}
                {conversation && typingUserIds.length > 0 && (
                  <div className="flex items-center gap-3 mt-6 ml-1 px-3 py-1.5 rounded-full bg-muted/20 border border-border/50 w-fit animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex -space-x-2">
                      {typingUserIds.slice(0, 3).map((id) => {
                        const userObj = conversation.users.find(
                          (u) => u.id === id
                        );
                        if (!userObj) return null;
                        return (
                          <Avatar
                            key={id}
                            className="h-6 w-6 border-2 border-background shadow-sm shrink-0"
                          >
                            <AvatarImage
                              src={userObj.image || ""}
                              alt={userObj.name || ""}
                            />
                            <AvatarFallback className="text-[8px] font-bold bg-muted-foreground/10">
                              {userObj.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {typingUserIds.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold shrink-0">
                          +{typingUserIds.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 items-center h-full pt-1">
                        <span className="w-1 h-1 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-primary/70 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium italic">
                        {(() => {
                          if (typingUserIds.length === 1) {
                            const userObj = conversation.users.find(
                              (u) => u.id === typingUserIds[0]
                            );
                            return `${userObj?.name || "Someone"} is typing...`;
                          }
                          return "Several people are typing...";
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
