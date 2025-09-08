"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatStore } from "@/contexts/chat-context";
import { useTheme } from "@/hooks/use-theme";
import { useSocket } from "@/hooks/useSocket";
import {
  createGroup,
  getConversationById,
  getConversations,
  getUsers,
} from "@/lib/api";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { LogOut, Moon, Search, Sun, UserPlus, Users, X } from "lucide-react";
import { Link } from "react-router";
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
  } = useChatStore();
  const { user } = useUser();
  const { createGroupSocketMessage } = useSocket();
  // Group creation state
  const [groupName, setGroupName] = React.useState("");
  const [groupDescription, setGroupDescription] = React.useState("");
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const [userSearch, setUserSearch] = React.useState("");
  const [availableUsers, setAvailableUsers] = React.useState<User[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  async function fetchConversations() {
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
  }

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
  }, [user]);

  React.useEffect(() => {
    fetchUsers(userSearch);
  }, [userSearch]);

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;

    setIsCreatingGroup(true);
    try {
      const userIds = [user.id, ...selectedUsers.map((u) => u.clerkId)];
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        userIds,
        adminId: user.id,
      };

      const response = await createGroup(groupData);

      createGroupSocketMessage(response.data);

      // Reset form
      setGroupName("");
      setGroupDescription("");
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

  // Skeleton component for conversation loading
  const ConversationSkeleton = () => (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 rounded-md">
          <Skeleton className="w-6 h-6 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="px-2 py-2 flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent active:bg-transparent focus:bg-transparent"
              >
                <Link to="/">
                  <img
                    src={
                      resolvedTheme === "dark"
                        ? "/dark_logo.svg"
                        : "/light_logo.svg"
                    }
                    alt="Frequency Logo"
                    className="h-8 w-auto"
                  />
                  <span>Frequency</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4 space-y-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="contact" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="contact"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger
                    value="group"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Group
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Find a user</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {userSearch && (
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        {availableUsers.map((u) => (
                          <div
                            key={u.clerkId}
                            className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                            onClick={() => {
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
                                    name:
                                      user.fullName || user.firstName || null,
                                    email:
                                      user.emailAddresses?.[0]?.emailAddress ||
                                      "",
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
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {u.name?.charAt(0)?.toUpperCase() ||
                                    u.email?.charAt(0)?.toUpperCase() ||
                                    "U"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {u.name || u.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="group" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name *</Label>
                    <Input
                      id="group-name"
                      placeholder="Enter group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">
                      Description (Optional)
                    </Label>
                    <Input
                      id="group-description"
                      placeholder="Enter group description"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                    />
                  </div>

                  {/* User Search */}
                  <div className="space-y-2">
                    <Label>Add Members</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Search Results */}
                    {userSearch && (
                      <div className="max-h-32 overflow-y-auto border rounded-md">
                        {availableUsers
                          .filter(
                            (u) =>
                              !selectedUsers.find(
                                (su) => su.clerkId === u.clerkId
                              )
                          )
                          .map((user) => (
                            <div
                              key={user.clerkId}
                              className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                              onClick={() => addUser(user)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">
                                    {user.name?.charAt(0)?.toUpperCase() ||
                                      user.email?.charAt(0)?.toUpperCase() ||
                                      "U"}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Members ({selectedUsers.length})</Label>
                      <div className="space-y-1">
                        {selectedUsers.map((user) => (
                          <div
                            key={user.clerkId}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {user.name?.charAt(0)?.toUpperCase() ||
                                    user.email?.charAt(0)?.toUpperCase() ||
                                    "U"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {user.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUser(user.clerkId)}
                              className="h-6 w-6 p-0 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full cursor-pointer"
                    onClick={handleCreateGroup}
                    disabled={
                      !groupName.trim() ||
                      selectedUsers.length === 0 ||
                      isCreatingGroup
                    }
                  >
                    {isCreatingGroup ? "Creating..." : "Create Group"}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
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
                conversations.map((conversation) => {
                  // Get other users (excluding current user)
                  const otherUsers = conversation.users.filter(
                    (u) => u.clerkId !== (user?.id || "")
                  );

                  // Generate initials for display
                  const getInitials = (name: string) => {
                    return name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  // Get conversation display name
                  const getDisplayName = () => {
                    if (conversation.name) return conversation.name;
                    if (
                      conversation.type === "ONE_TO_ONE" &&
                      otherUsers.length > 0
                    ) {
                      return otherUsers[0].name || otherUsers[0].email;
                    }
                    return "Unknown";
                  };

                  // Admin check not used here; compute when needed

                  // Get last message preview
                  const getLastMessage = () => {
                    if (conversation.lastMessage) {
                      return conversation.lastMessage.content || "No message";
                    }
                    return "No messages yet";
                  };

                  // Generate avatar color based on conversation id
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
                  const colorIndex =
                    conversation.id.charCodeAt(0) % colors.length;
                  const avatarColor = colors[colorIndex];

                  const isSelected =
                    selectedConversation?.id === conversation.id;

                  return (
                    <Button
                      key={conversation.id}
                      variant="ghost"
                      className={`w-full justify-start h-auto cursor-pointer p-2 ${
                        isSelected ? "bg-muted" : ""
                      }`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center mr-2 flex-shrink-0`}
                      >
                        <span className="text-xs text-white font-medium">
                          {getInitials(getDisplayName())}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium">
                          {getDisplayName()}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getLastMessage()}
                        </div>
                      </div>
                      {unreadCountByConversationId[conversation.id] > 0 && (
                        <div className="ml-2 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                          {unreadCountByConversationId[conversation.id] > 99
                            ? "99+"
                            : unreadCountByConversationId[conversation.id]}
                        </div>
                      )}
                    </Button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={user?.imageUrl}
                  alt={user?.fullName || "User"}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase() ||
                    user?.emailAddresses?.[0]?.emailAddress
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.fullName || user?.firstName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.emailAddresses?.[0]?.emailAddress || "No email"}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to sign out?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out of your account and will need to sign
                    in again to access your conversations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <SignOutButton>
                      <Button variant="destructive" className="cursor-pointer">
                        Sign Out
                      </Button>
                    </SignOutButton>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
