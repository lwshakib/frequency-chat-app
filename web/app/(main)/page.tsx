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
import { useState, useEffect, useRef } from "react";
import MessagesArea from "@/components/chat/MessagesArea";
import MessageInput from "@/components/chat/MessageInput";
import { MESSAGE_READ_STATUS, Message } from "@/types";

export default function Page() {
  const {
    selectedConversation,
    session,
    messages,
    setMessages,
    isLoadingMessages,
    setIsLoadingMessages,
  } = useChatStore();
  const currentUser = session?.user;
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      // Simulate API call and add dummy messages
      setTimeout(() => {
        const dummyMessages: Message[] = [
          {
            id: "1",
            content: "Hey there! How's it going?",
            senderId: "other-user",
            conversationId: selectedConversation.id,
            type: "text",
            isRead: MESSAGE_READ_STATUS.READ,
            createdAt: new Date(Date.now() - 3600000),
            updatedAt: new Date(Date.now() - 3600000),
            sender: (selectedConversation.users.find(
              (u) => u.id !== currentUser?.id
            ) || currentUser) as User,
          },
          {
            id: "2",
            content: "Hi! Just working on the chat app. It's looking good!",
            senderId: currentUser?.id || "me",
            conversationId: selectedConversation.id,
            type: "text",
            isRead: MESSAGE_READ_STATUS.READ,
            createdAt: new Date(Date.now() - 1800000),
            updatedAt: new Date(Date.now() - 1800000),
            sender: currentUser as User,
          },
        ];
        setMessages(dummyMessages);
        setIsLoadingMessages(false);
      }, 500);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, currentUser, setMessages, setIsLoadingMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUser || !selectedConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      senderId: currentUser.id,
      conversationId: selectedConversation.id,
      type: "text",
      isRead: MESSAGE_READ_STATUS.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: currentUser,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    <div className="flex flex-1 flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shrink-0">
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

      <MessagesArea
        conversation={selectedConversation}
        messages={messages}
        isLoading={isLoadingMessages}
        isCurrentUser={(id) => id === currentUser?.id}
        scrollAreaRef={scrollAreaRef}
      />

      <MessageInput
        messageInput={messageInput}
        onChangeMessage={(e) => setMessageInput(e.target.value)}
        onKeyPress={handleKeyPress}
        onSendMessage={(content, files) => {
          if (!content.trim() && (!files || files.length === 0)) return;

          const newMessage: Message = {
            id: Date.now().toString(),
            content: content,
            files: files,
            senderId: currentUser!.id,
            conversationId: selectedConversation.id,
            type:
              files && files.length > 0
                ? content
                  ? "text+files"
                  : "files"
                : "text",
            isRead: MESSAGE_READ_STATUS.UNREAD,
            createdAt: new Date(),
            updatedAt: new Date(),
            sender: currentUser as User,
          };

          setMessages([...messages, newMessage]);
          setMessageInput("");
        }}
        onEmojiSelect={(emoji) => setMessageInput((prev) => prev + emoji)}
      />
    </div>
  );
}
