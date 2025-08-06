import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/hooks/useChat";
import { Menu, MoreVertical, Phone, Video } from "lucide-react";

export function ChatHeader() {
  const { state, contacts, toggleSidebar } = useChat();

  const selectedContact = contacts.find(
    (c) => c.id === state.selectedContactId
  );

  if (!selectedContact) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center flex items-center justify-center gap-4">
          <h2 className="text-lg font-semibold">Select a chat</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
            <AvatarImage
              src={selectedContact.avatar}
              alt={selectedContact.name}
            />
            <AvatarFallback>{selectedContact.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          {selectedContact.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </div>

        <div>
          <h2 className="font-semibold text-sm">{selectedContact.name}</h2>
          <p className="text-xs text-muted-foreground">
            {selectedContact.isOnline ? "Online" : "Last seen 2 hours ago"}
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
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Media & Files</DropdownMenuItem>
            <DropdownMenuItem>Search Messages</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Block Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
