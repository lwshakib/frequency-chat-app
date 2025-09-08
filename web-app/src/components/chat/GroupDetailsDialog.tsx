import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/types";
import { Search, Users } from "lucide-react";

export default function GroupDetailsDialog({
  open,
  onOpenChange,
  conversation,
  memberSearchTerm,
  setMemberSearchTerm,
  getAvatarColor,
  getInitials,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  memberSearchTerm: string;
  setMemberSearchTerm: (val: string) => void;
  getAvatarColor: (id: string) => string;
  getInitials: (name: string) => string;
  currentUserId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {conversation && (
            <>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-lg">{conversation.name}</h3>
                {conversation.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {conversation.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {conversation.users.length} members
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {conversation.users
                  .filter((member: { name: string | null; email: string }) => {
                    if (!memberSearchTerm) return true;
                    const searchLower = memberSearchTerm.toLowerCase();
                    return (
                      member.name?.toLowerCase().includes(searchLower) ||
                      member.email.toLowerCase().includes(searchLower)
                    );
                  })
                  .sort(
                    (
                      a: {
                        name: string | null;
                        email: string;
                        clerkId: string;
                      },
                      b: { name: string | null; email: string; clerkId: string }
                    ) => {
                      const aName = a.name || a.email || "";
                      const bName = b.name || b.email || "";
                      return aName.localeCompare(bName);
                    }
                  )
                  .map(
                    (member: {
                      clerkId: string;
                      name: string | null;
                      email: string;
                    }) => {
                      const isCurrentUser = member.clerkId === currentUserId;
                      return (
                        <div
                          key={member.clerkId}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full ${getAvatarColor(
                                member.clerkId
                              )} flex items-center justify-center`}
                            >
                              <span className="text-sm text-white font-medium">
                                {getInitials(member.name || member.email)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {member.name || "Unknown"}
                                  {isCurrentUser && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (You)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                {conversation.users.filter(
                  (member: { name: string | null; email: string }) => {
                    if (!memberSearchTerm) return true;
                    const searchLower = memberSearchTerm.toLowerCase();
                    return (
                      member.name?.toLowerCase().includes(searchLower) ||
                      member.email.toLowerCase().includes(searchLower)
                    );
                  }
                ).length === 0 &&
                  memberSearchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No members found matching "{memberSearchTerm}"</p>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
