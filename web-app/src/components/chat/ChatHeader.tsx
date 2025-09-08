import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MoreVertical, Phone, Users, Video } from "lucide-react";

export default function ChatHeader({
  title,
  description,
  avatarColorClass,
  initials,
  isGroup,
  currentUserIsAdmin,
  onOpenMembers,
  onOpenProfile,
  onOpenEdit,
  onDelete,
}: {
  title: string;
  description: string;
  avatarColorClass: string;
  initials: string;
  isGroup: boolean;
  currentUserIsAdmin: boolean;
  onOpenMembers: () => void;
  onOpenProfile: () => void;
  onOpenEdit: () => void;
  onDelete: () => Promise<void> | void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full ${avatarColorClass} flex items-center justify-center`}
            >
              <span className="text-sm text-white font-medium">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-medium">{title}</h1>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Video className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isGroup ? (
                <DropdownMenuItem onClick={onOpenMembers}>
                  <Users className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onOpenProfile}>
                  <Users className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
              )}
              {isGroup && currentUserIsAdmin && (
                <DropdownMenuItem onClick={onOpenEdit}>
                  Edit Group Details
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => void onDelete()}
              >
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
