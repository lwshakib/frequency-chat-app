import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/contexts/SocketProvider";
import { useUser } from "@clerk/clerk-react";
import {
  Bell,
  MessageCircle,
  Settings as SettingsIcon,
  UserPlus,
} from "lucide-react";

interface Notification {
  id: string;
  type: "message" | "friend_request" | "system";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New message from Sarah Chen",
    description: "Hey! How are you doing?",
    timestamp: "2 min ago",
    isRead: false,
    avatar:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "2",
    type: "friend_request",
    title: "Friend request from Alex Rodriguez",
    description: "Wants to connect with you",
    timestamp: "1 hour ago",
    isRead: false,
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "3",
    type: "system",
    title: "Profile updated successfully",
    description: "Your profile information has been updated",
    timestamp: "3 hours ago",
    isRead: true,
  },
  {
    id: "4",
    type: "message",
    title: "New message in Design Team",
    description: "Meeting at 3 PM today",
    timestamp: "5 hours ago",
    isRead: true,
    avatar:
      "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

export function NotificationDropdown() {
  const { notifications, setNotifications, setSelectedConversation } =
    useSocket();
  const { user } = useUser();
  const unreadCount = notifications.length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "system":
        return <SettingsIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notificationIndex: number) => {
    console.log("Notification clicked:", notificationIndex);
    const notification = notifications[notificationIndex];

    // Set the conversation as selected
    setSelectedConversation(notification.conversation);

    // Remove the notification when clicked
    setNotifications((prev) =>
      prev.filter((_, index) => index !== notificationIndex)
    );
  };

  const clearAllNotifications = () => {
    console.log("Clear all notifications");
    setNotifications([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="h-8 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <DropdownMenuItem
                  key={index}
                  className="p-3 cursor-pointer focus:bg-muted/50 rounded-lg mb-1"
                  onClick={() => handleNotificationClick(index)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium truncate text-foreground">
                          {notification.conversation.type === "GROUP"
                            ? notification.conversation.name
                            : notification.conversation.users.find(
                                (u: any) => u.clerkId !== user?.id
                              )?.name || "Unknown User"}
                        </p>
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2 mt-1" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Just now
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
