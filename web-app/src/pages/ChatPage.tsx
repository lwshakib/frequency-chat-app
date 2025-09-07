import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore } from "@/contexts/chat-context";
import { createMessage, getMessages } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { formatDistanceToNow } from "date-fns";
import {
  Camera,
  File,
  Image,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Send,
  Smile,
  Users,
  Video,
} from "lucide-react";
import * as React from "react";
import type { Message } from "../types";
import { MESSAGE_READ_STATUS } from "../types";

export default function ChatPage() {
  const {
    selectedConversation,
    messages,
    setMessages,
    isLoadingMessages,
    setIsLoadingMessages,
  } = useChatStore();
  const { user } = useUser();

  // Message input state
  const [messageInput, setMessageInput] = React.useState("");
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);

  // Helper functions
  const getDisplayName = () => {
    if (!selectedConversation) return "Select a conversation";
    if (selectedConversation.name) return selectedConversation.name;
    if (
      selectedConversation.type === "ONE_TO_ONE" &&
      selectedConversation.users.length > 0
    ) {
      const otherUser = selectedConversation.users.find(
        (u) => u.clerkId !== "current-user-id"
      );
      return otherUser?.name || otherUser?.email || "Unknown";
    }
    return "Unknown";
  };

  const getDisplayDescription = () => {
    if (!selectedConversation) return "Choose a conversation to start chatting";
    if (selectedConversation.description)
      return selectedConversation.description;
    if (selectedConversation.type === "GROUP") {
      return `${selectedConversation.users.length} members`;
    }
    return selectedConversation.type === "ONE_TO_ONE"
      ? "Direct message"
      : "Group chat";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-cyan-500",
    ];
    const colorIndex = id.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  // Fetch messages when conversation changes
  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !user) return;

      setIsLoadingMessages(true);
      try {
        const data = await getMessages(selectedConversation.id);
        setMessages(data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, user, setMessages, setIsLoadingMessages]);

  // Format message time
  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Check if message is from current user
  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  // Send message function
  const sendMessage = async () => {
    if (
      !messageInput.trim() ||
      !selectedConversation ||
      !user ||
      isSendingMessage
    )
      return;

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message immediately
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      type: "text",
      files: [],
      conversationId: selectedConversation.id,
      senderId: user.id,
      isRead: MESSAGE_READ_STATUS.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: {
        id: user.id,
        clerkId: user.id,
        name: user.fullName || user.firstName || "You",
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    // Add optimistic message immediately
    setMessages([...messages, optimisticMessage]);

    // Clear input immediately
    setMessageInput("");

    setIsSendingMessage(true);
    try {
      const messageData = {
        conversationId: selectedConversation.id,
        content: messageContent,
        type: "text",
      };

      const response = await createMessage(messageData);

      // Replace optimistic message with real message from server
      const updatedMessages = messages.map((msg: Message) =>
        msg.id === tempId ? response.data : msg
      );
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic message on error
      const filteredMessages = messages.filter(
        (msg: Message) => msg.id !== tempId
      );
      setMessages(filteredMessages);

      // Restore input content
      setMessageInput(messageContent);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Message skeleton component
  const MessageSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`flex ${
            index % 3 === 0 ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex max-w-[70%] ${
              index % 3 === 0 ? "flex-row-reverse" : "flex-row"
            } items-end space-x-2`}
          >
            {/* Avatar skeleton */}
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />

            {/* Message bubble skeleton */}
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
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {selectedConversation && (
          <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
              />
              {/* Conversation Info Section */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full ${getAvatarColor(
                      selectedConversation.id
                    )} flex items-center justify-center`}
                  >
                    <span className="text-sm text-white font-medium">
                      {getInitials(getDisplayName())}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base font-medium">{getDisplayName()}</h1>
                  <span className="text-xs text-muted-foreground">
                    {getDisplayDescription()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Block User</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        )}

        {!selectedConversation && (
          <div className="flex h-(--header-height) shrink-0 items-center px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedConversation ? (
            isLoadingMessages ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full ${getAvatarColor(
                      selectedConversation.id
                    )} flex items-center justify-center mx-auto mb-4`}
                  >
                    <span className="text-2xl text-white font-medium">
                      {getInitials(getDisplayName())}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {getDisplayName()}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getDisplayDescription()}
                  </p>
                  <p className="text-sm">Start typing to send a message...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser(message.senderId)
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[70%] ${
                        isCurrentUser(message.senderId)
                          ? "flex-row-reverse"
                          : "flex-row"
                      } items-end space-x-2`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full ${getAvatarColor(
                          message.senderId
                        )} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-xs text-white font-medium">
                          {getInitials(
                            message.sender.name || message.sender.email
                          )}
                        </span>
                      </div>

                      {/* Message bubble */}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isCurrentUser(message.senderId)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isCurrentUser(message.senderId)
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">F</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Welcome to Frequency
                </h3>
                <p className="text-base mb-6 text-muted-foreground">
                  Your modern, real-time chat application for seamless
                  communication
                </p>

                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Create Groups
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Start group conversations with multiple people and
                        collaborate effectively
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Real-time Messaging
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Send instant messages with real-time updates and
                        notifications
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Rich Media
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Share photos, files, and emojis to express yourself
                        better
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Getting Started:</strong> Select a conversation from
                    the sidebar or create a new group to start chatting!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Area - Only show when conversation is selected */}
        {selectedConversation && (
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              {/* Media Upload Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Image className="h-4 w-4 mr-2" />
                    Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <File className="h-4 w-4 mr-2" />
                    Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  className="pr-20"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSendingMessage}
                />

                {/* Emoji Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      disabled={isSendingMessage}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Emojis</h4>
                      <div className="grid grid-cols-8 gap-1">
                        {[
                          "😀",
                          "😂",
                          "😍",
                          "🥰",
                          "😎",
                          "🤔",
                          "😢",
                          "😡",
                          "👍",
                          "👎",
                          "❤️",
                          "🔥",
                          "💯",
                          "🎉",
                          "👏",
                          "🙌",
                          "😊",
                          "😘",
                          "🤗",
                          "😴",
                          "🤤",
                          "😋",
                          "🥳",
                          "😇",
                        ].map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-lg hover:bg-muted"
                            onClick={() => {
                              setMessageInput((prev) => prev + emoji);
                            }}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isSendingMessage}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={sendMessage}
                disabled={!messageInput.trim() || isSendingMessage}
              >
                {isSendingMessage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
