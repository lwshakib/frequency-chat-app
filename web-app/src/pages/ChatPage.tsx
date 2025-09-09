import { AppSidebar } from "@/components/app-sidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import EditGroupDialog from "@/components/chat/EditGroupDialog";
import GroupDetailsDialog from "@/components/chat/GroupDetailsDialog";
import MessageInput from "@/components/chat/MessageInput";
import MessagesArea from "@/components/chat/MessagesArea";
import ProfileDialog from "@/components/chat/ProfileDialog";
import TypingIndicator from "@/components/chat/TypingIndicator";
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
import {
  getAvatarColor,
  getDisplayDescription,
  getDisplayName,
  getInitials,
} from "@/lib/chat-helpers";
import { useUser } from "@clerk/clerk-react";
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
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);

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

  // Helper selectors via shared helpers

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

  // Format handled inside MessagesArea via helpers

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

  // Messages area loading handled inside MessagesArea

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
            title={getDisplayName(selectedConversation, user?.id)}
            description={getDisplayDescription(selectedConversation)}
            avatarColorClass={getAvatarColor(selectedConversation.id)}
            initials={getInitials(
              getDisplayName(selectedConversation, user?.id)
            )}
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
        <MessagesArea
          resolvedTheme={resolvedTheme}
          conversation={selectedConversation || null}
          messages={messages}
          isLoading={isLoadingMessages}
          isOneToOne={selectedConversation?.type === "ONE_TO_ONE"}
          isCurrentUser={isCurrentUser}
          scrollAreaRef={scrollAreaRef}
        />

        {/* Chat Input Area - Only show when conversation is selected */}
        {selectedConversation && (
          <>
            <MessageInput
              messageInput={messageInput}
              onChangeMessage={onChangeMessage}
              onKeyPress={handleKeyPress}
              onSendMessage={async ({ content, files }) => {
                // When files present, create a message payload with files
                if (!selectedConversation || !user) return;
                const tempId = `temp-${Date.now()}`;
                const optimisticMessage: Message = {
                  id: tempId,
                  content: content,
                  type:
                    files.length > 0 && content
                      ? "text+files"
                      : files.length > 0
                      ? "files"
                      : "text",
                  files,
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
                sendMessageSocket(optimisticMessage);
                setMessageInput("");
              }}
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
