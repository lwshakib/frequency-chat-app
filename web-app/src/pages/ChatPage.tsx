<<<<<<< HEAD
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Camera,
  File,
  Image,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Send,
  Smile,
  Video,
} from "lucide-react";
=======
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

>>>>>>> d29825ee10734e3d77c773c77b8691aab506afda

export default function ChatPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
<<<<<<< HEAD
          "--header-height": "calc(var(--spacing) * 16)",
=======
          "--header-height": "calc(var(--spacing) * 12)",
>>>>>>> d29825ee10734e3d77c773c77b8691aab506afda
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
<<<<<<< HEAD
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            {/* User Info Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-sm text-white font-medium">JS</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-medium">John Smith</h1>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>

            {/* Action Buttons */}
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
                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                  <DropdownMenuItem>Block User</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* This area will contain chat messages */}
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Start a conversation...</p>
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            {/* Media Upload Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Image className="h-4 w-4 mr-2" />
                  Photo
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <File className="h-4 w-4 mr-2" />
                  Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 relative">
              <Input placeholder="Type a message..." className="pr-20" />

              {/* Emoji Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Emojis</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {[
                        "😀",
                        "😂",
                        "😍",
                        "🥰",
                        "😎",
                        "🤔",
                        "😢",
                        "😡",
                        "👍",
                        "👎",
                        "❤️",
                        "🔥",
                        "💯",
                        "🎉",
                        "👏",
                        "🙌",
                        "😊",
                        "😘",
                        "🤗",
                        "😴",
                        "🤤",
                        "😋",
                        "🥳",
                        "😇",
                      ].map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-muted"
                          onClick={() => {
                            // Add emoji to input
                            console.log("Emoji clicked:", emoji);
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" className="h-8 w-8">
              <Send className="h-4 w-4" />
            </Button>
=======
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
              </div>
            </div>
>>>>>>> d29825ee10734e3d77c773c77b8691aab506afda
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
<<<<<<< HEAD
  );
=======
  )
>>>>>>> d29825ee10734e3d77c773c77b8691aab506afda
}
