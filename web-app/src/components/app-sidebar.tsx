"use client";

import * as React from "react";

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
import { createGroup, getConversations, getUsers } from "@/lib/api";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import {
  Bell,
  LogOut,
  Moon,
  Search,
  Sun,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme, setTheme } = useTheme();
  const {
    setConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isLoadingConversations,
    setIsLoadingConversations,
  } = useChatStore();
  const { user } = useUser();

  // Group creation state
  const [groupName, setGroupName] = React.useState("");
  const [groupDescription, setGroupDescription] = React.useState("");
  const [selectedUsers, setSelectedUsers] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState("");
  const [availableUsers, setAvailableUsers] = React.useState<any[]>([]);
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
      };

      const response = await createGroup(groupData);

      // Add the new conversation to the list
      setConversations([response.data, ...conversations]);

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

  const addUser = (userToAdd: any) => {
    if (!selectedUsers.find((u) => u.clerkId === userToAdd.clerkId)) {
      setSelectedUsers([...selectedUsers, userToAdd]);
    }
    setUserSearch("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.clerkId !== userId));
  };

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation(conversation);
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
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        New message from John Doe
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 minutes ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hey! How are you doing today?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Sarah Wilson sent a message
                      </p>
                      <p className="text-xs text-muted-foreground">
                        15 minutes ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Can we schedule a meeting for tomorrow?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Mike Johnson sent a message
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 hour ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Thanks for the quick response!
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start">
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
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Enter contact name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <Button className="w-full">Create Contact</Button>
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
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
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
                    (user) => user.clerkId !== user?.id
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm text-white font-medium">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Smith</p>
                <p className="text-xs text-muted-foreground truncate">
                  john.smith@email.com
                </p>
              </div>
            </div>
            <SignOutButton>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </SignOutButton>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
