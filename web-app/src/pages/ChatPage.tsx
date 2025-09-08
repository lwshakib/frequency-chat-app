import { AppSidebar } from "@/components/app-sidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import EditGroupDialog from "@/components/chat/EditGroupDialog";
import GroupDetailsDialog from "@/components/chat/GroupDetailsDialog";
import MessageInput from "@/components/chat/MessageInput";
import MessageSkeleton from "@/components/chat/MessageSkeleton";
import MessagesList from "@/components/chat/MessagesList";
import ProfileDialog from "@/components/chat/ProfileDialog";
import TypingIndicator from "@/components/chat/TypingIndicator";
// ui button not used in this file after refactor
// ui input not used in this file after refactor
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// tabs moved into EditGroupDialog component
import { useChatStore } from "@/contexts/chat-context";
import { useTheme } from "@/hooks/use-theme";
import { useSocket } from "@/hooks/useSocket";
import {
  createOneToOne,
  deleteConversation,
  getMessages,
  getUsers,
  updateGroup,
} from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { formatDistanceToNow } from "date-fns";
import { Phone, Users, Video } from "lucide-react";
import * as React from "react";
import type { Conversation, Message } from "../types";
import { MESSAGE_READ_STATUS } from "../types";

export default function ChatPage() {
  const { resolvedTheme } = useTheme();
  const {
    selectedConversation,
    messages,
    setMessages,
    isLoadingMessages,
    setIsLoadingMessages,
    setSelectedConversation,
  } = useChatStore();
  const { user } = useUser();
  const {
    sendMessage: sendMessageSocket,
    createGroupSocketMessage,
    emitTypingStart,
    emitTypingStop,
    emitDeleteConversation,
  } = useSocket();

  // Message input state
  const [messageInput, setMessageInput] = React.useState("");
  const typingTimeoutRef = React.useRef<number | null>(null);
  const lastTypingSentRef = React.useRef<number>(0);

  // Dialog state
  const [isMembersDialogOpen, setIsMembersDialogOpen] = React.useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
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

      // Stop typing immediately on send
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      emitTypingStop(selectedConversation, user.id);

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

  // Emit typing as user types with debounce
  const onChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    if (!selectedConversation || !user) return;
    const now = Date.now();
    const elapsed = now - lastTypingSentRef.current;
    if (elapsed > 1000) {
      emitTypingStart(selectedConversation, user.id);
      lastTypingSentRef.current = now;
    }
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      if (selectedConversation && user) {
        emitTypingStop(selectedConversation, user.id);
      }
    }, 1500);
  };

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Message skeleton extracted to component

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
          <ChatHeader
            title={getDisplayName()}
            description={getDisplayDescription()}
            avatarColorClass={getAvatarColor(selectedConversation.id)}
            initials={getInitials(getDisplayName())}
            isGroup={selectedConversation.type === "GROUP"}
            currentUserIsAdmin={currentUserIsAdmin}
            onOpenMembers={() => setIsMembersDialogOpen(true)}
            onOpenProfile={() => setIsProfileDialogOpen(true)}
            onOpenEdit={openEditDialog}
            onDelete={async () => {
              if (!selectedConversation || !user) return;
              try {
                await deleteConversation(selectedConversation.id, user.id);
                const state = useChatStore.getState() as unknown as {
                  conversations: Conversation[];
                  setConversations: (c: Conversation[]) => void;
                  setSelectedConversation: (c: Conversation | null) => void;
                };
                state.setConversations(
                  state.conversations.filter(
                    (c) => c.id !== selectedConversation.id
                  )
                );
                state.setSelectedConversation(null);
                emitDeleteConversation(selectedConversation);
              } catch (e) {
                console.error("Failed to delete conversation", e);
              }
            }}
          />
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
                  <MessagesList
                    messages={messages}
                    isCurrentUser={isCurrentUser}
                    getAvatarColor={getAvatarColor}
                    getInitials={getInitials}
                    formatMessageTime={formatMessageTime}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <img
                        src={
                          resolvedTheme === "dark"
                            ? "/dark_logo.svg"
                            : "/light_logo.svg"
                        }
                        alt="Frequency Logo"
                        className="h-20 w-20 object-contain"
                      />
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
          <>
            <MessageInput
              messageInput={messageInput}
              onChangeMessage={onChangeMessage}
              onKeyPress={handleKeyPress}
              onSend={sendMessage}
              onEmojiAppend={(emoji) => setMessageInput((prev) => prev + emoji)}
            />
            <TypingIndicator conversationId={selectedConversation.id} />
          </>
        )}
      </SidebarInset>

      <ProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        conversation={selectedConversation || null}
        currentUserId={user?.id}
        getAvatarColor={getAvatarColor}
        getInitials={getInitials}
      />

      <GroupDetailsDialog
        open={isMembersDialogOpen}
        onOpenChange={setIsMembersDialogOpen}
        conversation={selectedConversation || null}
        memberSearchTerm={memberSearchTerm}
        setMemberSearchTerm={setMemberSearchTerm}
        getAvatarColor={getAvatarColor}
        getInitials={getInitials}
        currentUserId={user?.id}
      />

      <EditGroupDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editPanel={editPanel}
        setEditPanel={(v) => setEditPanel(v)}
        addMemberSearch={addMemberSearch}
        setAddMemberSearch={setAddMemberSearch}
        availableUsers={availableUsers}
        editMembers={editMembers}
        addMemberFromPicker={addMemberFromPicker}
        adminsSearch={adminsSearch}
        setAdminsSearch={setAdminsSearch}
        editAdmins={editAdmins}
        toggleAdmin={toggleAdmin}
        removeSearch={removeSearch}
        setRemoveSearch={setRemoveSearch}
        removeMember={removeMember}
        currentUserId={user?.id}
        saveGroupEdits={saveGroupEdits}
      />
    </SidebarProvider>
  );
}

// TypingIndicator extracted to component
