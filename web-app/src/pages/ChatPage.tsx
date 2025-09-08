import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatStore } from "@/contexts/chat-context";
import { useSocket } from "@/hooks/useSocket";
import { createOneToOne, getMessages, getUsers, updateGroup } from "@/lib/api";
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
  Search,
  Send,
  Smile,
  Users,
  Video,
} from "lucide-react";
import * as React from "react";
import type { Conversation, Message } from "../types";
import { MESSAGE_READ_STATUS } from "../types";

export default function ChatPage() {
  const {
    selectedConversation,
    messages,
    setMessages,
    isLoadingMessages,
    setIsLoadingMessages,
    setSelectedConversation,
  } = useChatStore();
  const { user } = useUser();
  const { sendMessage: sendMessageSocket, createGroupSocketMessage } =
    useSocket();

  // Message input state
  const [messageInput, setMessageInput] = React.useState("");

  // Dialog state
  const [isMembersDialogOpen, setIsMembersDialogOpen] = React.useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = React.useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editAdmins, setEditAdmins] = React.useState<Set<string>>(new Set());
  const [editMembers, setEditMembers] = React.useState<
    { clerkId: string; name?: string | null; email?: string }[]
  >([]);
  const [editPanel, setEditPanel] = React.useState<
    "addMember" | "updateAdmins" | "removeUsers"
  >("addMember");
  const [addMemberSearch, setAddMemberSearch] = React.useState("");
  const [availableUsers, setAvailableUsers] = React.useState<
    { clerkId: string; name: string | null; email: string }[]
  >([]);
  const [adminsSearch, setAdminsSearch] = React.useState("");
  const [removeSearch, setRemoveSearch] = React.useState("");
  const originalAdminsRef = React.useRef<string[]>([]);
  const originalMembersRef = React.useRef<string[]>([]);

  // Ref for scroll area
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  // Helper functions
  const getDisplayName = () => {
    if (!selectedConversation) return "Select a conversation";
    if (selectedConversation.name) return selectedConversation.name;
    if (
      selectedConversation.type === "ONE_TO_ONE" &&
      selectedConversation.users.length > 0
    ) {
      const otherUser = selectedConversation.users.find(
        (u) => u.clerkId !== (user?.id || "")
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

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isLoadingMessages]);

  // Format message time
  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Helpers for admin checks
  const currentUserIsAdmin = React.useMemo(() => {
    if (!selectedConversation) return false;
    return selectedConversation.admins?.some((a) => a.clerkId === user?.id);
  }, [selectedConversation, user?.id]);

  // Open Edit dialog and seed state from selected conversation
  const openEditDialog = () => {
    if (!selectedConversation) return;
    setEditName(selectedConversation.name || "");
    setEditDescription(selectedConversation.description || "");
    const adminIds = new Set<string>(
      selectedConversation.admins?.map((a) => a.clerkId) || []
    );
    setEditAdmins(adminIds);
    const members = selectedConversation.users.map((u) => ({
      clerkId: u.clerkId,
      name: u.name,
      email: u.email,
    }));
    setEditMembers(members);
    originalAdminsRef.current = Array.from(adminIds);
    originalMembersRef.current = members.map((m) => m.clerkId);
    setEditPanel("addMember");
    setAddMemberSearch("");
    setAvailableUsers([]);
    setAdminsSearch("");
    setRemoveSearch("");
    setIsEditDialogOpen(true);
  };

  const toggleAdmin = (clerkId: string) => {
    setEditAdmins((prev) => {
      const copy = new Set(prev);
      if (copy.has(clerkId)) copy.delete(clerkId);
      else copy.add(clerkId);
      return copy;
    });
  };

  const removeMember = (clerkId: string) => {
    setEditMembers((prev) => prev.filter((m) => m.clerkId !== clerkId));
    setEditAdmins((prev) => {
      const copy = new Set(prev);
      copy.delete(clerkId);
      return copy;
    });
  };

  // Fetch users for Add Member panel
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isEditDialogOpen || editPanel !== "addMember") return;
      try {
        const res = await getUsers(addMemberSearch);
        if (cancelled) return;
        const options = res.users.map((u) => ({
          clerkId: u.clerkId,
          name: u.name,
          email: u.email,
        }));
        setAvailableUsers(options);
      } catch {
        if (!cancelled) setAvailableUsers([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [addMemberSearch, isEditDialogOpen, editPanel, editMembers]);

  const addMemberFromPicker = (user: {
    clerkId: string;
    name: string | null;
    email: string;
  }) => {
    if (editMembers.some((m) => m.clerkId === user.clerkId)) return;
    setEditMembers((prev) => [
      { clerkId: user.clerkId, name: user.name, email: user.email },
      ...prev,
    ]);
  };

  const saveGroupEdits = async () => {
    if (!selectedConversation || !user) return;
    const currentMemberIds = editMembers.map((m) => m.clerkId);
    const originalMemberIds = new Set(originalMembersRef.current);
    const originalAdminIds = new Set(originalAdminsRef.current);
    const newAdminIds = new Set(editAdmins);

    const addMemberIds = currentMemberIds.filter(
      (id) => !originalMemberIds.has(id)
    );
    const removeMemberIds = Array.from(originalMemberIds).filter(
      (id) => !currentMemberIds.includes(id)
    );
    const addAdminIds = Array.from(newAdminIds).filter(
      (id) => !originalAdminIds.has(id)
    );
    const removeAdminIds = Array.from(originalAdminIds).filter(
      (id) => !newAdminIds.has(id)
    );

    // Build optimistic conversation
    const prevConversation = selectedConversation;
    const adminsOptimistic = Array.from(editAdmins).map(
      (aid): { clerkId: string; name: string | null } => {
        const found = editMembers.find((m) => m.clerkId === aid);
        return { clerkId: aid, name: found?.name ?? null };
      }
    );
    const usersOptimistic = editMembers.map((m) => {
      const existing = prevConversation.users.find(
        (u) => u.clerkId === m.clerkId
      );
      return existing
        ? {
            ...existing,
            name: m.name ?? existing.name,
            email: m.email ?? existing.email,
          }
        : ({
            id: m.clerkId,
            clerkId: m.clerkId,
            name: m.name ?? null,
            email: m.email ?? "",
            imageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as Conversation["users"][number]);
    });
    const optimisticConversation: Conversation = {
      ...prevConversation,
      name: editName,
      description: editDescription,
      users: usersOptimistic as unknown as Conversation["users"],
      admins: adminsOptimistic,
    };

    // Apply optimistic update and close dialog immediately
    (
      useChatStore.getState() as unknown as {
        setSelectedConversation: (c: Conversation) => void;
      }
    ).setSelectedConversation(optimisticConversation);
    setIsEditDialogOpen(false);

    // Fire-and-forget server update, revert on error
    try {
      await updateGroup({
        conversationId: prevConversation.id,
        requesterId: user.id,
        name: editName,
        description: editDescription,
        addMemberIds,
        removeMemberIds,
        addAdminIds,
        removeAdminIds,
      });
    } catch (err) {
      console.error("Failed to update group", err);
      // Revert UI to previous state on failure
      (
        useChatStore.getState() as unknown as {
          setSelectedConversation: (c: Conversation) => void;
        }
      ).setSelectedConversation(prevConversation);
    }
  };

  // Check if message is from current user
  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  // Send message function
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const messageContent = messageInput.trim();
    const isTemporary = selectedConversation.id.startsWith("temp-");

    try {
      let conversationIdForSend = selectedConversation.id;
      // If temporary one-to-one, create conversation first via socket create:group flow
      if (isTemporary) {
        const other = selectedConversation.users.find(
          (u) => u.clerkId !== user.id
        );
        if (!other) return;

        // Create server-side conversation (one_to_one)
        const created = await createOneToOne([user.id, other.clerkId]);
        // Inform both clients via socket; provider marks initiator so only they auto-select
        createGroupSocketMessage(
          created.data as Conversation & { initiatorId?: string }
        );
        setSelectedConversation(created.data as Conversation);
        conversationIdForSend = created.data.id;
      }

      // Build message and send via socket (after creation for first message)
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        content: messageContent,
        type: "text",
        files: [],
        conversationId: conversationIdForSend,
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

      sendMessageSocket(optimisticMessage);
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send first message:", err);
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

  // Determine whether to show loading UI
  const shouldShowLoading = React.useMemo(() => {
    if (!isLoadingMessages) return false;
    // Do not show loading UI for one-to-one conversations (keep fetching silently)
    return selectedConversation?.type !== "ONE_TO_ONE";
  }, [isLoadingMessages, selectedConversation?.type]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
      className="h-screen"
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col">
        {selectedConversation && (
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
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
                    {selectedConversation.type === "GROUP" ? (
                      <DropdownMenuItem
                        onClick={() => setIsMembersDialogOpen(true)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Users className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                    )}
                    {selectedConversation.type === "GROUP" &&
                      currentUserIsAdmin && (
                        <DropdownMenuItem onClick={openEditDialog}>
                          Edit Group Details
                        </DropdownMenuItem>
                      )}
                    {/* Notifications removed */}
                    {selectedConversation.type === "ONE_TO_ONE" && (
                      <DropdownMenuItem>Block User</DropdownMenuItem>
                    )}
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
          <div className="flex h-16 shrink-0 items-center px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
          </div>
        )}

        {/* Chat Messages Area - Takes remaining space */}
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="p-4">
              {selectedConversation ? (
                shouldShowLoading ? (
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
                      <p className="text-sm">
                        Start typing to send a message...
                      </p>
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
                        <strong>Getting Started:</strong> Select a conversation
                        from the sidebar or create a new group to start
                        chatting!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input Area - Only show when conversation is selected */}
        {selectedConversation && (
          <div className="border-t p-4 shrink-0">
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
                />

                {/* Emoji Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
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

              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={sendMessage}
                disabled={!messageInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarInset>

      {/* Group Details Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedConversation && (
              <>
                {/* Group Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium text-lg">
                    {selectedConversation.name}
                  </h3>
                  {selectedConversation.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedConversation.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedConversation.users.length} members
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Members List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedConversation.users
                    .filter((member) => {
                      if (!memberSearchTerm) return true;
                      const searchLower = memberSearchTerm.toLowerCase();
                      return (
                        member.name?.toLowerCase().includes(searchLower) ||
                        member.email.toLowerCase().includes(searchLower)
                      );
                    })
                    .sort((a, b) => {
                      const aIsAdmin = selectedConversation.admins?.some(
                        (admin) => admin.clerkId === a.clerkId
                      );
                      const bIsAdmin = selectedConversation.admins?.some(
                        (admin) => admin.clerkId === b.clerkId
                      );

                      // Admins first, then regular members
                      if (aIsAdmin && !bIsAdmin) return -1;
                      if (!aIsAdmin && bIsAdmin) return 1;

                      // Within same role, sort alphabetically by name
                      const aName = a.name || a.email || "";
                      const bName = b.name || b.email || "";
                      return aName.localeCompare(bName);
                    })
                    .map((member) => {
                      const isAdmin = selectedConversation.admins?.some(
                        (admin) => admin.clerkId === member.clerkId
                      );
                      const isCurrentUser = member.clerkId === user?.id;

                      return (
                        <div
                          key={member.clerkId}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full ${getAvatarColor(
                                member.clerkId
                              )} flex items-center justify-center`}
                            >
                              <span className="text-sm text-white font-medium">
                                {getInitials(member.name || member.email)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {member.name || "Unknown"}
                                  {isCurrentUser && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (You)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                      );
                    })}

                  {/* No results message */}
                  {selectedConversation.users.filter((member) => {
                    if (!memberSearchTerm) return true;
                    const searchLower = memberSearchTerm.toLowerCase();
                    return (
                      member.name?.toLowerCase().includes(searchLower) ||
                      member.email.toLowerCase().includes(searchLower)
                    );
                  }).length === 0 &&
                    memberSearchTerm && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No members found matching "{memberSearchTerm}"</p>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Details Dialog (Admins only) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Group Details</DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <Tabs
                value={editPanel}
                onValueChange={(v) => setEditPanel(v as typeof editPanel)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="addMember">Add Member</TabsTrigger>
                  <TabsTrigger value="updateAdmins">Update Admins</TabsTrigger>
                  <TabsTrigger value="removeUsers">Remove Users</TabsTrigger>
                </TabsList>

                <TabsContent value="addMember">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Search users..."
                        value={addMemberSearch}
                        onChange={(e) => setAddMemberSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-1">
                      {availableUsers.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-6">
                          No users
                        </div>
                      ) : (
                        availableUsers.map((u) => {
                          const isMember = editMembers.some(
                            (m) => m.clerkId === u.clerkId
                          );
                          return (
                            <div
                              key={u.clerkId}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {u.name || u.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {u.clerkId}
                                </div>
                              </div>
                              {isMember ? (
                                <Button size="sm" variant="outline" disabled>
                                  Added
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addMemberFromPicker(u)}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="updateAdmins">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Search members..."
                        value={adminsSearch}
                        onChange={(e) => setAdminsSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {editMembers
                        .filter((m) => {
                          if (!adminsSearch) return true;
                          const s = adminsSearch.toLowerCase();
                          return (
                            (m.name || "").toLowerCase().includes(s) ||
                            (m.email || "").toLowerCase().includes(s) ||
                            m.clerkId.toLowerCase().includes(s)
                          );
                        })
                        .map((m) => {
                          const isAdmin = editAdmins.has(m.clerkId);
                          const isSelf = m.clerkId === user?.id;
                          const numAdmins = editAdmins.size;
                          return (
                            <div
                              key={m.clerkId}
                              className="flex items-center justify-between p-2 rounded border"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {m.name || m.email || m.clerkId}{" "}
                                  {isSelf && (
                                    <span className="text-xs text-muted-foreground">
                                      (You)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {m.clerkId}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={isAdmin ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleAdmin(m.clerkId)}
                                  disabled={
                                    isSelf && isAdmin && numAdmins === 1
                                  }
                                  title={
                                    isSelf && isAdmin && numAdmins === 1
                                      ? "Assign another admin before removing yourself"
                                      : undefined
                                  }
                                >
                                  {isAdmin ? "Admin" : "Make Admin"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="removeUsers">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Search members to remove..."
                        value={removeSearch}
                        onChange={(e) => setRemoveSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {editMembers
                        .filter((m) => {
                          if (!removeSearch) return true;
                          const s = removeSearch.toLowerCase();
                          return (
                            (m.name || "").toLowerCase().includes(s) ||
                            (m.email || "").toLowerCase().includes(s) ||
                            m.clerkId.toLowerCase().includes(s)
                          );
                        })
                        .map((m) => {
                          const isSelf = m.clerkId === user?.id;
                          const isAdmin = editAdmins.has(m.clerkId);
                          const numAdmins = editAdmins.size;
                          const disableRemove =
                            isSelf || (isAdmin && numAdmins === 1);
                          const title = isSelf
                            ? "You cannot remove yourself"
                            : isAdmin && numAdmins === 1
                            ? "Assign another admin before removing the last admin"
                            : undefined;
                          return (
                            <div
                              key={m.clerkId}
                              className="flex items-center justify-between p-2 rounded border"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {m.name || m.email || m.clerkId}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {m.clerkId}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={disableRemove}
                                title={title}
                                onClick={() => removeMember(m.clerkId)}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveGroupEdits}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
