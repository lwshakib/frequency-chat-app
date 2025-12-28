"use client";

import { useChatStore } from "@/context";
import { CONVERSATION_TYPE, User } from "@/types";
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
import { MESSAGE_READ_STATUS, Message, type Conversation } from "@/types";
import { useSocket } from "@/context/socket-provider";
import {
  getMessages,
  createOneToOneConversation,
  markMessagesAsRead,
  type ApiMessage,
} from "@/lib/api";
import { toConversation } from "@/lib/chat-helpers";

function toMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.id,
    content: apiMsg.content,
    type: apiMsg.type as any,
    files: apiMsg.files,
    conversationId: apiMsg.conversationId,
    senderId: apiMsg.senderId,
    isRead: apiMsg.isRead as any,
    createdAt: new Date(apiMsg.createdAt),
    updatedAt: new Date(apiMsg.updatedAt),
    sender: {
      ...apiMsg.sender,
      createdAt: new Date(apiMsg.sender.createdAt),
      updatedAt: new Date(apiMsg.sender.updatedAt),
    } as User,
  };
}

export default function Page() {
  const {
    selectedConversation,
    session,
    messages,
    setMessages,
    setConversations,
    setSelectedConversation,
    resetUnread,
    isLoadingMessages,
    setIsLoadingMessages,
  } = useChatStore();
  const { sendMessage, emitTypingStart, emitTypingStop } = useSocket();
  const currentUser = session?.user;
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedConversation && !selectedConversation.isVirtual) {
      markMessagesAsRead(selectedConversation.id).catch(console.error);
      resetUnread(selectedConversation.id);
    }
  }, [selectedConversation, resetUnread]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (selectedConversation && currentUser) {
      // Emit typing:start
      emitTypingStart(selectedConversation, currentUser.id);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to emit typing:stop
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop(selectedConversation, currentUser.id);
        typingTimeoutRef.current = null;
      }, 1500);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Skip fetching for virtual conversations (not in DB yet)
    if (selectedConversation.isVirtual) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    // Clear messages and start loading immediately
    setMessages([]);
    setIsLoadingMessages(true);

    const fetchMessages = async () => {
      try {
        const apiMessages = await getMessages(selectedConversation.id);
        if (isMounted) {
          setMessages(apiMessages.map(toMessage));
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch messages:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedConversation?.id, setMessages, setIsLoadingMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, selectedConversation]);

  const handleSendMessage = async (content: string, files?: any[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (!currentUser || !selectedConversation) return;

    let targetConversation = selectedConversation;

    // Persist virtual conversation on first message
    if (selectedConversation.isVirtual) {
      const otherUser = selectedConversation.users.find(
        (u) => u.id !== currentUser.id
      );
      if (!otherUser) return;

      try {
        const apiConversation = await createOneToOneConversation([
          currentUser.id,
          otherUser.id,
        ]);
        const realConversation = toConversation(apiConversation);

        // Update local state: add to sidebar and select real one
        setConversations([
          realConversation,
          ...useChatStore.getState().conversations,
        ]);
        setSelectedConversation(realConversation);
        targetConversation = realConversation;
      } catch (error) {
        console.error("Failed to persist virtual conversation:", error);
        return;
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: content,
      files: files,
      senderId: currentUser.id,
      conversationId: targetConversation.id,
      type:
        files && files.length > 0 ? (content ? "text+files" : "files") : "text",
      isRead: MESSAGE_READ_STATUS.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: currentUser as any as User,
    };

    sendMessage(newMessage, targetConversation);
    setMessages([...useChatStore.getState().messages, newMessage]);
    setMessageInput("");

    // Stop typing indicator on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (targetConversation && currentUser) {
      emitTypingStop(targetConversation, currentUser.id);
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
        onChangeMessage={handleInputChange}
        onKeyPress={() => {}}
        onSendMessage={handleSendMessage}
        onEmojiSelect={(emoji) => setMessageInput((prev) => prev + emoji)}
      />
    </div>
  );
}
