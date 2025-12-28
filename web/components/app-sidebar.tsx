"use client";

import * as React from "react";

import ConversationList from "@/components/conversation-list";
import CreateDialog from "@/components/create-dialog";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
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

// --- Header Component ---
export function SidebarHeaderBar() {
  return (
    <SidebarHeader>
      <div className="px-2 py-2 flex items-center justify-between">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent active:bg-transparent focus:bg-transparent"
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

  // Stub API calls
  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      // Stub: fetch logic removed
      // setConversations([...]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, setIsLoadingConversations, setConversations]);

  async function fetchUsers(searchTerm?: string) {
    try {
      // Stub: fetch users
      if (searchTerm) {
        setAvailableUsers([
          {
            id: "1",
            clerkId: "1",
            name: "Alice",
            email: "alice@example.com",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "2",
            clerkId: "2",
            name: "Bob",
            email: "bob@example.com",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      } else {
        setAvailableUsers([]);
      }
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

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;

    setIsCreatingGroup(true);
    try {
      // Stub creation
      console.log("Create group:", groupName, selectedUsers);
      setIsDialogOpen(false);
      setGroupName("");
      setSelectedUsers([]);
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
    setSelectedConversation(conversation);
    resetUnread(conversation.id);
  };

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
            onSelectContact={(u) => {
              if (!user) return;
              const tempId = `temp-${Date.now()}`;
              const tempConversation = {
                id: tempId,
                name: u.name,
                description: null,
                type: CONVERSATION_TYPE.ONE_TO_ONE,
                users: [
                  // Map user to type compatible stub
                  { ...u },
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
          </ScrollArea>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
