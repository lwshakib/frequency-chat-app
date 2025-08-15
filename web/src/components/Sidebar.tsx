import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocket } from "@/contexts/SocketProvider";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { formatDistanceToNow } from "date-fns";
import { LogOut, Moon, Plus, Search, Settings, Sun, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserSettingsModal } from "./UserSettingsModal";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  clerkId: string;
};

export function Sidebar({ toggleButton }: { toggleButton: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme(); // useTheme now returns ThemeContextType
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<ApiUser[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const {
    conversations,
    setConversations,
    setSelectedConversation,
    createGroupOnSocket,
    typing,
    notifications,
    markNotificationsAsRead,
  } = useSocket();
  const { user } = useUser();

  // Highlight search terms function
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800/50 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        fetchConversations(query);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Fetch conversations with search
  const fetchConversations = async (search?: string) => {
    if (search) {
      setIsSearching(true);
    } else {
      setConversationsLoading(true);
    }

    try {
      const url = search
        ? `/api/conversations?search=${encodeURIComponent(search)}`
        : "/api/conversations";

      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to fetch conversations");
    } finally {
      setConversationsLoading(false);
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    fetchConversations();
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Fetch users with search
  const fetchUsers = async (search?: string) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const url = search
        ? `/api/users?search=${encodeURIComponent(search)}`
        : "/api/users";

      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      setUsersError("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (showAddDialog) {
      fetchUsers();
    }
  }, [showAddDialog]);

  const handleCreateGroup = async () => {
    await toast.promise(
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          ids: selectedGroupUsers.map((user) => user.clerkId),
          name: groupName,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setConversations((prev) => [...prev, data.data]);
          createGroupOnSocket(data.data);
        }),
      {
        loading: "Creating group...",
        success: "Group created!",
        error: "Failed to create group",
      }
    );
    setSelectedGroupUsers([]);
    setGroupName("");
    setShowAddDialog(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/95 backdrop-blur-sm border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img
              src={theme === "light" ? "/light_logo.svg" : "/dark_logo.svg"}
              className="size-8"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Frequency
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            {toggleButton}
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search conversations... (Ctrl+K)"
            className="pl-9 pr-9 h-10 bg-muted/30 border-border/50 focus:border-primary/50 transition-all duration-200"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {isSearching && (
            <div className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
          {searchQuery && !isSearching && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Conversations</h2>
            {searchQuery && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {conversations.length} result
                {conversations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {conversationsLoading ? (
          <div className="space-y-3">
            {/* Skeleton for multiple conversation items */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg"
              >
                {/* Avatar skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                {/* Conversation content skeleton */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name and timestamp row */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>

                  {/* Last message and notification badge row */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-40" />
                    {/* Notification badge skeleton - only show for some items */}
                    {index % 3 === 0 && (
                      <Skeleton className="h-5 w-5 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-4">
            {searchQuery ? (
              <div className="space-y-2">
                <p>No conversations found for "{searchQuery}"</p>
                <p className="text-xs">
                  Try searching for a different name or email
                </p>
              </div>
            ) : (
              "No conversations found."
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-y-2 flex-grow">
            {conversations &&
              conversations.length > 0 &&
              conversations.map((conv: any) => (
                <div
                  key={conv.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
                  )}
                  onClick={() => {
                    setSelectedConversation(conv);
                    // Mark notifications as read for this conversation
                    markNotificationsAsRead(conv.id);
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {conv.type === "GROUP" ? (
                        /* Show group image if available, otherwise show fallback */
                        conv.image ? (
                          <AvatarImage src={conv.image} alt={conv.name} />
                        ) : null
                      ) : (
                        /* Show other user's avatar for direct messages */
                        <AvatarImage
                          src={
                            conv.users.find((u: any) => u.clerkId !== user?.id)
                              ?.imageUrl
                          }
                          alt={
                            conv.users.find((u: any) => u.clerkId !== user?.id)
                              ?.name || "Unknown User"
                          }
                        />
                      )}
                      <AvatarFallback>
                        {conv.type === "GROUP"
                          ? conv.name?.charAt(0) || "G"
                          : conv.users
                              .find((u: any) => u.clerkId !== user?.id)
                              ?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {conv.type === "GROUP"
                          ? highlightSearchTerm(conv.name || "", searchQuery)
                          : highlightSearchTerm(
                              conv.users.find(
                                (u: any) => u.clerkId !== user?.id
                              )?.name || "Unknown User",
                              searchQuery
                            )}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {typing?.conversation?.id === conv.id &&
                        typing?.clerkId !== user?.id
                          ? `${typing.name} is typing...`
                          : conv.lastMessage || "No messages yet"}
                      </p>
                      {notifications.filter(
                        (n: any) =>
                          n.conversation?.id === conv.id &&
                          n.message?.isRead !== "READ"
                      ).length > 0 && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {
                              notifications.filter(
                                (n: any) =>
                                  n.conversation?.id === conv.id &&
                                  n.message?.isRead !== "READ"
                              ).length
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Contact/Group Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact or Group</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="contact" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="group">Group</TabsTrigger>
            </TabsList>
            <TabsContent value="contact">
              <Input
                placeholder="Search contacts..."
                className="mb-2"
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  fetchUsers(e.target.value);
                }}
              />
              {usersLoading && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {/* Skeleton for multiple user items */}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg"
                    >
                      {/* Avatar skeleton */}
                      <Skeleton className="h-8 w-8 rounded-full" />

                      {/* User content skeleton */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {usersError && (
                <div className="text-center text-red-500 py-4">
                  {usersError}
                </div>
              )}
              {!usersLoading && !usersError && (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No users found.
                    </div>
                  ) : (
                    users.map((item) => {
                      const contact = {
                        id: item.id,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        clerkId: item.clerkId,
                        email: item.email,
                      };
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => {
                            // Create a conversation object and set it as selected
                            const conversation = {
                              id: item.id,
                              name: item.name,
                              users: [
                                contact,
                                {
                                  clerkId: user?.id,
                                  imageUrl: user?.imageUrl,
                                  name: user?.fullName,
                                  email: user?.emailAddresses[0].emailAddress,
                                  id: user?.id,
                                },
                              ],
                              type: "SINGLE",
                              lastMessage: "",
                              updatedAt: new Date().toISOString(),
                              clerkId: item.clerkId,
                              isTemporary: true,
                            };
                            console.log(conversation);
                            setSelectedConversation(conversation);
                            setShowAddDialog(false);
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.imageUrl} alt={item.name} />
                            <AvatarFallback>
                              {item.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="group">
              <div className="mb-2">
                <Input
                  placeholder="Group name"
                  className="mb-2"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <Input
                  placeholder="Search users..."
                  className="mb-2"
                  value={groupSearch}
                  onChange={(e) => {
                    setGroupSearch(e.target.value);
                    fetchUsers(e.target.value);
                  }}
                />
              </div>
              {usersLoading && (
                <div className="space-y-3 max-h-48 overflow-y-auto mb-2">
                  {/* Skeleton for multiple user items */}
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg"
                    >
                      {/* Checkbox skeleton */}
                      <Skeleton className="h-4 w-4 rounded" />

                      {/* Avatar skeleton */}
                      <Skeleton className="h-8 w-8 rounded-full" />

                      {/* User content skeleton */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {usersError && (
                <div className="text-center text-red-500 py-4">
                  {usersError}
                </div>
              )}
              {!usersLoading && !usersError && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mb-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupUsers.some(
                          (selectedUser) => selectedUser.id === user.id
                        )}
                        onChange={(e) => {
                          setSelectedGroupUsers((prev) =>
                            e.target.checked
                              ? [...prev, user]
                              : prev.filter(
                                  (selectedUser) => selectedUser.id !== user.id
                                )
                          );
                        }}
                        className="form-checkbox accent-primary h-4 w-4"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedGroupUsers.length >= 2 && (
                <Button className="w-full mt-2" onClick={handleCreateGroup}>
                  Create Group
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Profile Section at the bottom */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} alt="Me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{user?.fullName}</h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <SignOutButton>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </SignOutButton>
          </div>
        </div>
        <UserSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}
