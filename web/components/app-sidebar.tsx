"use client";

import * as React from "react";

import ConversationList from "@/components/conversation-list";
import CreateDialog from "@/components/create-dialog";
import { NavUser } from "@/components/nav-user";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore } from "@/context";
import type { Conversation, User } from "@/types";
import { CONVERSATION_TYPE } from "@/types";
import { Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import {
  searchUsers,
  getConversations,
  createOneToOneConversation,
  createGroupConversation,
  uploadToCloudinary,
  type ApiUser,
  type ApiConversation,
} from "@/lib/api";

// Helper to convert API user to frontend User type
function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    clerkId: apiUser.id, // Using id as clerkId for compatibility
    name: apiUser.name,
    email: apiUser.email,
    image: apiUser.image,
    createdAt: new Date(apiUser.createdAt),
    updatedAt: new Date(apiUser.updatedAt),
  };
}

// Helper to convert API conversation to frontend Conversation type
function toConversation(apiConv: ApiConversation): Conversation {
  return {
    id: apiConv.id,
    name: apiConv.name,
    description: apiConv.description,
    type:
      apiConv.type === "GROUP"
        ? CONVERSATION_TYPE.GROUP
        : CONVERSATION_TYPE.ONE_TO_ONE,
    users: apiConv.users.map(toUser),
    admins: apiConv.admins.map((a) => a.id),
    messages: [],
    lastMessageId: apiConv.lastMessageId,
    lastMessage: apiConv.lastMessage,
    imageUrl: apiConv.imageUrl,
    createdAt: new Date(apiConv.updatedAt),
    updatedAt: new Date(apiConv.updatedAt),
  };
}

// --- Header Component ---
export function SidebarHeaderBar() {
  return (
    <SidebarHeader>
      <div className="px-2 py-2 flex items-center justify-between">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent active:bg-transparent focus:bg-transparent"
            >
              <Link href="/">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </SidebarHeader>
  );
}

// --- Main Sidebar Component ---
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
    session,
  } = useChatStore();

  const user = session?.user;

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
  const [conversationSearch, setConversationSearch] = React.useState("");

  // Fetch conversations from API
  const fetchConversations = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingConversations(true);
    try {
      const apiConversations = await getConversations(user.id);
      setConversations(apiConversations.map(toConversation));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.id, setIsLoadingConversations, setConversations]);

  // Fetch users from API with debounce
  const fetchUsersDebounced = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (searchTerm: string) => {
      clearTimeout(timeoutId);
      if (!searchTerm.trim()) {
        setAvailableUsers([]);
        return;
      }
      timeoutId = setTimeout(async () => {
        try {
          const apiUsers = await searchUsers(searchTerm, user?.id);
          setAvailableUsers(apiUsers.map(toUser));
        } catch (error) {
          console.error("Error fetching users:", error);
          setAvailableUsers([]);
        }
      }, 300);
    };
  }, [user?.id]);

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  React.useEffect(() => {
    fetchUsersDebounced(userSearch);
  }, [userSearch, fetchUsersDebounced]);

  // Handle creating a 1-on-1 conversation (contact)
  const handleSelectContact = async (selectedUser: User) => {
    if (!user?.id) return;

    try {
      const apiConversation = await createOneToOneConversation([
        user.id,
        selectedUser.id,
      ]);
      const newConversation = toConversation(apiConversation);

      // Add to conversations if not already there
      const exists = conversations.find((c) => c.id === newConversation.id);
      if (!exists) {
        setConversations([newConversation, ...conversations]);
      }

      setSelectedConversation(newConversation);
      setIsDialogOpen(false);
      setUserSearch("");
    } catch (error) {
      console.error("Error creating contact conversation:", error);
    }
  };

  // Handle creating a group conversation
  const handleCreateGroup = async () => {
    if (!user?.id || !groupName.trim() || selectedUsers.length === 0) return;

    setIsCreatingGroup(true);
    try {
      // Upload image to Cloudinary if file is provided
      let imageUrl = groupImageUrl;
      if (groupImageFile) {
        try {
          imageUrl = await uploadToCloudinary(groupImageFile);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Continue without image if upload fails
        }
      }

      // Include current user in the group
      const memberIds = [user.id, ...selectedUsers.map((u) => u.id)];

      const apiConversation = await createGroupConversation({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        imageUrl: imageUrl || undefined,
        memberIds,
        adminId: user.id,
      });

      const newConversation = toConversation(apiConversation);
      setConversations([newConversation, ...conversations]);
      setSelectedConversation(newConversation);

      // Reset form
      setIsDialogOpen(false);
      setGroupName("");
      setGroupDescription("");
      setGroupImageUrl("");
      setGroupImageFile(null);
      setSelectedUsers([]);
      setUserSearch("");
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const addUser = (userToAdd: User) => {
    if (!selectedUsers.find((u) => u.id === userToAdd.id)) {
      setSelectedUsers([...selectedUsers, userToAdd]);
    }
    setUserSearch("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleConversationClick = async (conversation: Conversation) => {
    if (!user) return;
    setSelectedConversation(conversation);
    resetUnread(conversation.id);
  };

  // Filter conversations based on search
  const filteredConversations = React.useMemo(() => {
    if (!conversationSearch.trim()) return conversations;
    const search = conversationSearch.toLowerCase();
    return conversations.filter((conv) => {
      // Search by conversation name
      if (conv.name?.toLowerCase().includes(search)) return true;
      // Search by user names in the conversation
      return conv.users.some((u) => u.name?.toLowerCase().includes(search));
    });
  }, [conversations, conversationSearch]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeaderBar />
      <SidebarContent>
        <div className="p-4 h-full flex flex-col gap-4">
          <CreateDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            availableUsers={availableUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            onSelectContact={handleSelectContact}
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
          <Input
            placeholder="Search contacts..."
            className="w-full"
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
          />

          {/* Groups and Contacts */}
          <div className="flex items-center space-x-2 px-2 py-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Groups & Contacts
            </span>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-2">
            <div className="space-y-1">
              {isLoadingConversations ? (
                <div className="space-y-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 rounded-md"
                    >
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {conversationSearch
                    ? "No matching conversations"
                    : "No Conversations"}
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  currentUserId={user?.id}
                  unreadCountByConversationId={unreadCountByConversationId}
                  typingByConversationId={typingByConversationId}
                  onClickConversation={handleConversationClick}
                  selectedConversationId={selectedConversation?.id}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
