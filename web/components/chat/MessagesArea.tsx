import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/context";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayDescription, getDisplayName } from "@/lib/chat-helpers";
import type { Conversation, Message } from "@/types";
import * as React from "react";
import MessagesList from "./MessagesList";

type Props = {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isCurrentUser: (senderId: string) => boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
};

export default function MessagesArea({
  conversation,
  messages,
  isLoading,
  isCurrentUser,
  scrollAreaRef,
}: Props) {
  const { session } = useChatStore();
  const user = session?.user;

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
              <MessagesList messages={messages} isCurrentUser={isCurrentUser} />
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
