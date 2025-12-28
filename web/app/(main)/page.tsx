"use client";

import { useChatStore } from "@/context";
import { CONVERSATION_TYPE } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Phone,
  Video,
  MoreVertical,
  Search,
  Bell,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {
  const { selectedConversation, session } = useChatStore();
  const currentUser = session?.user;

  if (!selectedConversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-muted-foreground bg-background h-full">
        <div className="flex flex-col items-center gap-2">
          <Users className="h-12 w-12 opacity-20" />
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherUser = selectedConversation.users.find(
    (u) => u.id !== currentUser?.id
  );

  const conversationName =
    selectedConversation.type === CONVERSATION_TYPE.GROUP
      ? selectedConversation.name
      : otherUser?.name;

  const conversationImage =
    selectedConversation.type === CONVERSATION_TYPE.GROUP
      ? selectedConversation.imageUrl
      : otherUser?.image;

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <Avatar className="h-10 w-10 border shadow-sm">
          <AvatarImage
            src={conversationImage || ""}
            alt={conversationName || "Conversation"}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted">
            {selectedConversation.type === CONVERSATION_TYPE.GROUP ? (
              <Users className="h-5 w-5 text-muted-foreground" />
            ) : (
              <span className="text-sm font-medium">
                {conversationName?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold leading-none mb-1">
            {conversationName}
          </h2>
          {selectedConversation.type === CONVERSATION_TYPE.GROUP ? (
            <p className="text-xs text-muted-foreground">
              {selectedConversation.users.length + 1} members{" "}
              {selectedConversation.description &&
                `• ${selectedConversation.description}`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{otherUser?.email}</p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title="Audio Call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title="Video Call"
          >
            <Video className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <span className="text-sm">View Details</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Search Messages</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">Mute Notifications</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Clear Chat</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto flex items-center justify-center text-muted-foreground text-sm">
          Messages will appear here
        </div>
      </div>
    </div>
  );
}
