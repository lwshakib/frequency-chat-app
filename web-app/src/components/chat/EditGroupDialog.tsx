import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import * as React from "react";

export default function EditGroupDialog({
  open,
  onOpenChange,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editImageUrl,
  setEditImageUrl,
  setEditImageFile,
  editPanel,
  setEditPanel,
  addMemberSearch,
  setAddMemberSearch,
  availableUsers,
  editMembers,
  addMemberFromPicker,
  adminsSearch,
  setAdminsSearch,
  editAdmins,
  toggleAdmin,
  removeSearch,
  setRemoveSearch,
  removeMember,
  currentUserId,
  saveGroupEdits,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editImageUrl: string;
  setEditImageUrl: (v: string) => void;
  setEditImageFile: (f: File | null) => void;
  editPanel: "addMember" | "updateAdmins" | "removeUsers";
  setEditPanel: (v: "addMember" | "updateAdmins" | "removeUsers") => void;
  addMemberSearch: string;
  setAddMemberSearch: (v: string) => void;
  availableUsers: { clerkId: string; name: string | null; email: string }[];
  editMembers: { clerkId: string; name?: string | null; email?: string }[];
  addMemberFromPicker: (u: {
    clerkId: string;
    name: string | null;
    email: string;
  }) => void;
  adminsSearch: string;
  setAdminsSearch: (v: string) => void;
  editAdmins: Set<string>;
  toggleAdmin: (id: string) => void;
  removeSearch: string;
  setRemoveSearch: (v: string) => void;
  removeMember: (id: string) => void;
  currentUserId?: string;
  saveGroupEdits: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const onPickImage = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setEditImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setEditImageUrl(url);
    }
    e.currentTarget.value = "";
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Group Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Avatar
                className="w-20 h-20 cursor-pointer"
                onClick={onPickImage}
                title="Click to change image"
              >
                <AvatarImage
                  src={editImageUrl || undefined}
                  alt={editName || "Group"}
                />
                <AvatarFallback>
                  {(editName || "G").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>
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
                      const isSelf = m.clerkId === currentUserId;
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
                              disabled={isSelf && isAdmin && numAdmins === 1}
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
                      const isSelf = m.clerkId === currentUserId;
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveGroupEdits}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
