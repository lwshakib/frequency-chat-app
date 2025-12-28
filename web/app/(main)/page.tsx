"use client";

import { useChatStore } from "@/context";
import { CONVERSATION_TYPE, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  LogOut,
  ChevronRight,
  Plus,
  ArrowLeft,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Send,
  Phone,
  Video,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import MessagesArea from "@/components/chat/MessagesArea";
import MessageInput from "@/components/chat/MessageInput";
import { MESSAGE_READ_STATUS, Message, type Conversation } from "@/types";
import { useSocket } from "@/context/socket-provider";
import {
  getMessages,
  createOneToOneConversation,
  markMessagesAsRead,
  deleteConversation as deleteConversationApi,
  searchMessages as searchMessagesApi,
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
    activeCall,
    setActiveCall,
  } = useChatStore();
  const {
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    emitCallStart,
    emitDeleteConversation,
  } = useSocket();
  const currentUser = session?.user;
  const [messageInput, setMessageInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!selectedConversation || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMessagesApi(selectedConversation.id, query);
      setSearchResults(results.map(toMessage));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      await deleteConversationApi(selectedConversation.id);

      // Emit socket event to notify others
      emitDeleteConversation(selectedConversation);

      // Local update
      const allConversations = useChatStore.getState().conversations;
      setConversations(
        allConversations.filter((c) => c.id !== selectedConversation.id)
      );
      setSelectedConversation(null);

      toast.success("Conversation deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete conversation");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    if (selectedConversation && !selectedConversation.isVirtual) {
      markMessagesAsRead(selectedConversation.id).catch(console.error);
      resetUnread(selectedConversation.id);
    }
  }, [selectedConversation, resetUnread]);

  const handleStartCall = (type: "AUDIO" | "VIDEO") => {
    if (!selectedConversation || !currentUser) return;

    const participants = selectedConversation.users.map((u) => u.id);
    const otherUser = selectedConversation.users.find(
      (u) => u.id !== currentUser.id
    );

    const callPayload = {
      conversationId: selectedConversation.id,
      type,
      participants,
      callerId: currentUser.id,
      isOutgoing: true,
      status: "CALLING" as any,
      callee: otherUser,
      isGroup: selectedConversation.type === CONVERSATION_TYPE.GROUP,
    };

    setActiveCall(callPayload);
    emitCallStart(callPayload);
  };

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
      <div className="flex h-18 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 shadow-xs sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedConversation(null)}
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isSearchMode ? (
          <div className="flex-1 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                autoFocus
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-muted/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-hidden transition-all placeholder:text-muted-foreground/60"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSearchMode(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="rounded-full text-xs font-medium px-4 hover:bg-muted"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-primary/10 transition-transform hover:scale-105">
                <AvatarImage
                  src={conversationImage || ""}
                  alt={conversationName || ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                  {conversationName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <h2 className="text-sm font-semibold leading-none truncate mb-1">
                  {conversationName}
                </h2>
                {selectedConversation.type === CONVERSATION_TYPE.GROUP ? (
                  <p className="text-[11px] text-muted-foreground/80 truncate">
                    {selectedConversation.users.length + 1} members{" "}
                    {selectedConversation.description &&
                      `• ${selectedConversation.description}`}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        otherUser?.isOnline
                          ? "bg-green-500"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground/80 truncate">
                      {otherUser?.isOnline ? "Active now" : "Offline"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleStartCall("AUDIO")}
                className="h-9 w-9 text-muted-foreground hover:text-primary transition-all rounded-full hover:bg-primary/5"
              >
                <Phone className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleStartCall("VIDEO")}
                className="h-9 w-9 text-muted-foreground hover:text-primary transition-all rounded-full hover:bg-primary/5"
              >
                <Video className="h-4.5 w-4.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground transition-all rounded-full hover:bg-muted"
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 rounded-xl"
                >
                  <DropdownMenuItem className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">View Details</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg"
                    onClick={() => setIsSearchMode(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span className="text-sm">Search Messages</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Mute Notifications</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Delete Conversation
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              conversation and all associated messages for everyone in the chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MessagesArea
        conversation={selectedConversation}
        messages={isSearchMode && searchQuery.trim() ? searchResults : messages}
        isLoading={isSearchMode ? isSearching : isLoadingMessages}
        isCurrentUser={(id) => id === currentUser?.id}
        scrollAreaRef={scrollAreaRef}
        highlight={searchQuery}
      />

      {!isSearchMode && (
        <MessageInput
          messageInput={messageInput}
          onChangeMessage={handleInputChange}
          onKeyPress={() => {}}
          onSendMessage={handleSendMessage}
          onEmojiSelect={(emoji) => setMessageInput((prev) => prev + emoji)}
        />
      )}
    </div>
  );
}
