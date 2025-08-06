import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import {
  LogOut,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import React from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserSettingsModal } from "./UserSettingsModal";

export function Sidebar({ toggleButton }: { toggleButton: React.ReactNode }) {
  const { state, contacts, selectContact, setSearchQuery } =
    useChat();
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = React.useState(false);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-card/95 backdrop-blur-sm border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ChatApp
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
            placeholder="Search contacts..."
            className="pl-9 h-10 bg-muted/30 border-border/50 focus:border-primary/50 transition-all duration-200"
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2 gap-y-2 flex flex-col">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                state.selectedContactId === contact.id && "bg-accent"
              )}
              onClick={() => selectContact(contact.id)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {contact.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate">
                    {contact.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {contact.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.lastMessage}
                  </p>
                  {contact.unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {contact.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Profile Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src="https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Me"
              />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">John Doe</h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings
                className="h-4 w-4"
                onClick={() => setShowSettings(true)}
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
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
