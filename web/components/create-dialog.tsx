"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/types";
import { Search, Upload, UserPlus, Users, X } from "lucide-react";
import * as React from "react";

type CreateDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: User[];
  userSearch: string;
  setUserSearch: (value: string) => void;
  currentUserId?: string;
  onSelectContact: (user: User) => void;
  // Group props
  groupName: string;
  setGroupName: (value: string) => void;
  groupDescription: string;
  setGroupDescription: (value: string) => void;
  selectedUsers: User[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  onCreateGroup: () => void;
  isCreatingGroup: boolean;
  groupImageUrl?: string;
  setGroupImageUrl?: (v: string) => void;
  groupImageFile?: File | null;
  setGroupImageFile?: (f: File | null) => void;
};

export default function CreateDialog({
  isOpen,
  onOpenChange,
  availableUsers,
  userSearch,
  setUserSearch,
  onSelectContact,
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
  selectedUsers,
  addUser,
  removeUser,
  onCreateGroup,
  isCreatingGroup,
  groupImageUrl,
  setGroupImageUrl,
  groupImageFile,
  setGroupImageFile,
}: CreateDialogProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    if (groupImageUrl && groupImageUrl.trim().length > 0) {
      setPreviewUrl(groupImageUrl);
    } else if (groupImageFile) {
      objectUrl = URL.createObjectURL(groupImageFile);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl("");
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [groupImageUrl, groupImageFile]);
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !setGroupImageFile) return;
    const file = files[0];
    setGroupImageFile(file);
    setGroupImageUrl?.("");
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await handleFiles(e.dataTransfer.files);
  };

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
    // reset value so selecting the same file again re-triggers change
    e.target.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="w-full justify-start cursor-pointer dark:text-white"
          variant="outline"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] w-full">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
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
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {availableUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                    onClick={() => onSelectContact(u)}
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
                {availableUsers.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No users
                  </div>
                )}
              </div>
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
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Input
                id="group-description"
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Group Image (Optional)</Label>
              <div
                className="flex items-center gap-4 rounded-md border p-4 hover:bg-muted/40 transition"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={onDrop}
              >
                <div className="shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Group"
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">
                        Upload group image
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Drag & drop, or use the button to choose a file
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onSelectFile}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose file
                      </Button>
                    </div>
                  </div>
                  {groupImageUrl && (
                    <div className="mt-2 text-xs text-muted-foreground break-all max-w-full">
                      {groupImageUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              <div className="max-h-32 overflow-y-auto border rounded-md">
                {availableUsers
                  .filter((u) => !selectedUsers.find((su) => su.id === u.id))
                  .map((user) => (
                    <div
                      key={user.id}
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
                {availableUsers.filter(
                  (u) => !selectedUsers.find((su) => su.id === u.id)
                ).length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-3">
                    No users
                  </div>
                )}
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Members ({selectedUsers.length})</Label>
                <div className="space-y-1">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
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
                        onClick={() => removeUser(user.id)}
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
              onClick={onCreateGroup}
              disabled={isCreatingGroup}
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
