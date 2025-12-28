"use client";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: string;
  onClickConversation: (c: Conversation) => void;
  selectedConversationId?: string;
  unreadCountByConversationId?: Record<string, number>;
  typingByConversationId?: Record<string, any>;
}

export default function ConversationList({
  conversations,
  onClickConversation,
  selectedConversationId,
  unreadCountByConversationId,
}: ConversationListProps) {
  if (!conversations?.length) return null;
  return (
    <div className="flex flex-col gap-1 w-full">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onClickConversation(c)}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left w-full",
            selectedConversationId === c.id && "bg-sidebar-accent"
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>{c.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate text-sm">
                {c.name || "Unknown"}
              </span>
              {unreadCountByConversationId?.[c.id] ? (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  {unreadCountByConversationId[c.id]}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {c.lastMessage?.content || "No messages"}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
