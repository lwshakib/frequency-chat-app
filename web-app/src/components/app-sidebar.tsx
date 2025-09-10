"use client";

import * as React from "react";

import ConversationList from "@/components/chat/ConversationList";
import ConversationSkeleton from "@/components/chat/ConversationSkeleton";
import CreateDialog from "@/components/sidebar/CreateDialog";
import SidebarHeaderBar from "@/components/sidebar/SidebarHeaderBar";
import SidebarUserFooter from "@/components/sidebar/SidebarUserFooter";
import { Input } from "@/components/ui/input";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useChatStore } from "@/contexts/chat-context";
import { useTheme } from "@/hooks/use-theme";
import { useSocket } from "@/hooks/useSocket";
import {
  createGroup,
  getCloudinaryAuth,
  getConversationById,
  getConversations,
  getUsers,
} from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { Users } from "lucide-react";
import type { Conversation, User } from "../types";
import { CONVERSATION_TYPE } from "../types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme, setTheme } = useTheme();
  const {
    setConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isLoadingConversations,
    setIsLoadingConversations,
    unreadCountByConversationId,
    resetUnread,
    typingByConversationId,
  } = useChatStore();
  const { user } = useUser();
  const { createGroupSocketMessage } = useSocket();
  // Group creation state
  const [groupName, setGroupName] = React.useState("");
  const [groupDescription, setGroupDescription] = React.useState("");
  const [groupImageUrl, setGroupImageUrl] = React.useState<string>("");
  const [groupImageFile, setGroupImageFile] = React.useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const [userSearch, setUserSearch] = React.useState("");
  const [availableUsers, setAvailableUsers] = React.useState<User[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const data = await getConversations(user.id);
      setConversations(data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, setIsLoadingConversations, setConversations]);

  async function fetchUsers(searchTerm?: string) {
    try {
      const data = await getUsers(searchTerm);
      setAvailableUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  React.useEffect(() => {
    fetchUsers(userSearch);
  }, [userSearch]);

  React.useEffect(() => {
    if (isDialogOpen) {
      fetchUsers(userSearch);
    }
  }, [isDialogOpen, userSearch]);

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;

    setIsCreatingGroup(true);
    try {
      // If user selected a file, upload now and get URL
      let finalImageUrl: string | undefined = groupImageUrl.trim() || undefined;
      if (groupImageFile) {
        try {
          const auth = await getCloudinaryAuth();
          const form = new FormData();
          form.append("file", groupImageFile);
          form.append("api_key", auth.apiKey);
          form.append("timestamp", String(auth.timestamp));
          form.append("folder", auth.folder);
          form.append("signature", auth.signature);
          const uploadUrl = `https://api.cloudinary.com/v1_1/${auth.cloudName}/auto/upload`;
          const res = await fetch(uploadUrl, { method: "POST", body: form });
          const data = await res.json();
          if (data?.secure_url) finalImageUrl = data.secure_url as string;
        } catch (e) {
          console.error("Failed to upload group image", e);
        }
      }
      const userIds = [user.id, ...selectedUsers.map((u) => u.clerkId)];
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        imageUrl: finalImageUrl,
        userIds,
        adminId: user.id,
      };

      const response = await createGroup(groupData);

      createGroupSocketMessage(response.data);

      // Reset form
      setGroupName("");
      setGroupDescription("");
      setGroupImageUrl("");
      setGroupImageFile(null);
      setSelectedUsers([]);
      setUserSearch("");

      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const addUser = (userToAdd: User) => {
    if (!selectedUsers.find((u) => u.clerkId === userToAdd.clerkId)) {
      setSelectedUsers([...selectedUsers, userToAdd]);
    }
    setUserSearch("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.clerkId !== userId));
  };

  const handleConversationClick = async (conversation: Conversation) => {
    if (!user) return;

    try {
      // Fetch full conversation details
      const data = await getConversationById(conversation.id, user.id);
      setSelectedConversation(data.conversation);
      resetUnread(conversation.id);
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      // Fallback to setting the conversation from the list if API call fails
      setSelectedConversation(conversation);
      resetUnread(conversation.id);
    }
  };

  // Skeleton extracted to component

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeaderBar
        resolvedTheme={resolvedTheme}
        onToggleTheme={() =>
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
        }
      />
      <SidebarContent>
        <div className="p-4 space-y-4">
          <CreateDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            availableUsers={availableUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            onSelectContact={(u) => {
              if (!user) return;
              const tempId = `temp-${Date.now()}`;
              const tempConversation = {
                id: tempId,
                name: null,
                description: null,
                type: CONVERSATION_TYPE.ONE_TO_ONE,
                users: [
                  {
                    id: user.id,
                    clerkId: user.id,
                    name: user.fullName || user.firstName || null,
                    email: user.emailAddresses?.[0]?.emailAddress || "",
                    imageUrl: user.imageUrl || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  {
                    id: u.clerkId,
                    clerkId: u.clerkId,
                    name: u.name,
                    email: u.email,
                    imageUrl: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ],
                admins: [],
                messages: [],
                lastMessageId: null,
                lastMessage: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as unknown as Conversation;
              setSelectedConversation(tempConversation);
              setIsDialogOpen(false);
            }}
            groupName={groupName}
            setGroupName={setGroupName}
            groupDescription={groupDescription}
            setGroupDescription={setGroupDescription}
            groupImageUrl={groupImageUrl}
            setGroupImageUrl={setGroupImageUrl}
            groupImageFile={groupImageFile}
            setGroupImageFile={setGroupImageFile}
            selectedUsers={selectedUsers}
            addUser={addUser}
            removeUser={removeUser}
            onCreateGroup={handleCreateGroup}
            isCreatingGroup={isCreatingGroup}
          />
          <Input placeholder="Search contacts..." className="w-full" />

          {/* Groups and Contacts */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 px-2 py-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Groups & Contacts
              </span>
            </div>
            <div className="space-y-1">
              {isLoadingConversations ? (
                <ConversationSkeleton />
              ) : conversations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No Conversations
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  currentUserId={user?.id}
                  unreadCountByConversationId={unreadCountByConversationId}
                  typingByConversationId={typingByConversationId}
                  onClickConversation={handleConversationClick}
                  selectedConversationId={selectedConversation?.id}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarUserFooter
        imageUrl={user?.imageUrl}
        fullName={user?.fullName ?? null}
        firstName={user?.firstName ?? null}
        email={user?.emailAddresses?.[0]?.emailAddress ?? null}
        initial={
          user?.firstName?.charAt(0)?.toUpperCase() ||
          user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
          "U"
        }
      />
    </Sidebar>
  );
}
