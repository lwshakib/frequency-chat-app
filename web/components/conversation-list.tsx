"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation, CONVERSATION_TYPE } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: string;
  onClickConversation: (c: Conversation) => void;
  selectedConversationId?: string;
  typingByConversationId?: Record<string, any>;
}

export default function ConversationList({
  conversations,
  currentUserId,
  onClickConversation,
  selectedConversationId,
  typingByConversationId,
}: ConversationListProps) {
  if (!conversations?.length) return null;
  return (
    <div className="flex flex-col gap-1 w-full">
      {conversations.map((c) => {
        // Determine display details based on type
        const isGroup = c.type === CONVERSATION_TYPE.GROUP; // Ensure we handle string or enum if types mix, but strictly it is CONVERSATION_TYPE

        let displayName = c.name;
        let displayImage = c.imageUrl;

        if (!isGroup) {
          const otherUser = c.users.find((u) => u.id !== currentUserId);
          if (otherUser) {
            displayName = otherUser.name;
            displayImage = otherUser.image;
          }
        }

        return (
          <button
            key={c.id}
            onClick={() => onClickConversation(c)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left w-full",
              selectedConversationId === c.id && "bg-sidebar-accent"
            )}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={displayImage || ""}
                alt={displayName || ""}
                className="object-cover"
              />
              <AvatarFallback>
                {displayName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium truncate text-sm">
                  {displayName || "Unknown"}
                </span>
                {c.unreadCount > 0 ? (
                  <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {c.unreadCount}
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {typingByConversationId?.[c.id] &&
                Object.keys(typingByConversationId[c.id]).length > 0 ? (
                  <span className="text-primary font-medium animate-pulse">
                    {(() => {
                      const typingUserIds = Object.keys(
                        typingByConversationId[c.id]
                      );
                      if (typingUserIds.length === 1) {
                        const userObj = c.users.find(
                          (u) => u.id === typingUserIds[0]
                        );
                        return `${userObj?.name || "Someone"} is typing...`;
                      }
                      return "Several people are typing...";
                    })()}
                  </span>
                ) : (
                  c.lastMessage?.content || "No messages"
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
