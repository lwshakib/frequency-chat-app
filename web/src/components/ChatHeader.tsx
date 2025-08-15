import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/contexts/SocketProvider";
import { useUser } from "@clerk/clerk-react";
import { Menu, MoreVertical, Phone, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ChatHeader() {
  const {
    toggleSidebar,
    selectedConversation,
    setConversations,
    setSelectedConversation,
    removeGroupOnSocket,
  } = useSocket();
  const { user } = useUser();
  const [showConversationDialog, setShowConversationDialog] = useState(false);

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    await toast.promise(
      fetch(`/api/conversations/${selectedConversation.id}`, {
        method: "DELETE",
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to delete: ${res.statusText}`);
          }
          return res.json();
        })
        .then(() => {
          // Remove from local state
          setConversations((prev) =>
            prev.filter((conv) => conv.id !== selectedConversation.id)
          );
          setSelectedConversation(null);
          setShowConversationDialog(false);

          // Emit socket event to notify all group members
          if (selectedConversation.type === "GROUP") {
            removeGroupOnSocket(selectedConversation);
          }
        }),
      {
        loading: "Deleting conversation...",
        success: "Conversation deleted successfully",
        error: "Failed to delete conversation",
      }
    );
  };

  if (!selectedConversation) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleSidebar()}
          className="lg:hidden h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
            {selectedConversation.type === "GROUP" ? (
              /* Show group image if available, otherwise show fallback */
              selectedConversation.image ? (
                <AvatarImage
                  src={selectedConversation.image}
                  alt={selectedConversation.name}
                />
              ) : null
            ) : (
              /* Show other user's avatar for direct messages */
              <AvatarImage
                src={
                  selectedConversation.users.find(
                    (u: any) => u.clerkId !== user?.id
                  )?.imageUrl
                }
                alt={
                  selectedConversation.users.find(
                    (u: any) => u.clerkId !== user?.id
                  )?.name || "Unknown User"
                }
              />
            )}
            <AvatarFallback>
              {selectedConversation.type === "GROUP"
                ? selectedConversation.name?.charAt(0) || "G"
                : selectedConversation.users
                    .find((u: any) => u.clerkId !== user?.id)
                    ?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {selectedConversation.type !== "GROUP" &&
            selectedConversation.users.find((u: any) => u.clerkId !== user?.id)
              ?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
        </div>

        <div
          className="cursor-pointer"
          onClick={() => setShowConversationDialog(true)}
        >
          <h2 className="font-semibold text-sm hover:text-primary transition-colors">
            {selectedConversation.type === "GROUP"
              ? selectedConversation.name
              : selectedConversation.users.find(
                  (u: any) => u.clerkId !== user?.id
                )?.name || "Unknown User"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {selectedConversation.type === "GROUP"
              ? `${selectedConversation.users.length} members`
              : selectedConversation.users.find(
                  (u: any) => u.clerkId !== user?.id
                )?.isOnline
              ? "Online"
              : "Last seen 2 hours ago"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Video className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowConversationDialog(true)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setShowConversationDialog(true)}
            >
              Delete Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conversation Details Dialog */}
      <Dialog
        open={showConversationDialog}
        onOpenChange={setShowConversationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedConversation.type === "GROUP"
                ? "Group Details"
                : "Contact Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                {selectedConversation.type === "GROUP" ? (
                  selectedConversation.image ? (
                    <AvatarImage
                      src={selectedConversation.image}
                      alt={selectedConversation.name}
                    />
                  ) : null
                ) : (
                  <AvatarImage
                    src={
                      selectedConversation.users.find(
                        (u: any) => u.clerkId !== user?.id
                      )?.imageUrl
                    }
                    alt={
                      selectedConversation.users.find(
                        (u: any) => u.clerkId !== user?.id
                      )?.name || "Unknown User"
                    }
                  />
                )}
                <AvatarFallback className="text-2xl">
                  {selectedConversation.type === "GROUP"
                    ? selectedConversation.name?.charAt(0) || "G"
                    : selectedConversation.users
                        .find((u: any) => u.clerkId !== user?.id)
                        ?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Details Section */}
            <div className="w-full space-y-4">
              {selectedConversation.type === "GROUP" ? (
                // Group details
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.users.length} members
                  </p>
                </div>
              ) : (
                // Single conversation details
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {selectedConversation.users.find(
                      (u: any) => u.clerkId !== user?.id
                    )?.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.users.find(
                      (u: any) => u.clerkId !== user?.id
                    )?.email || "No email available"}
                  </p>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteConversation}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {selectedConversation && selectedConversation.type === "GROUP"
                ? "Delete Group"
                : "Delete Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
