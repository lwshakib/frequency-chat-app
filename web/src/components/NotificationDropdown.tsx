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
import { Bell, MessageCircle } from "lucide-react";

export function NotificationDropdown() {
  const {
    notifications,
    setNotifications,
    setSelectedConversation,
    markNotificationsAsRead,
    markNotificationsAsOpened,
    notificationsLoading,
  } = useSocket();
  const { user } = useUser();
  const unreadNotifications = notifications.filter(
    (n: any) => n.isRead !== "READ"
  );
  const unopenedCount = notifications.filter((n: any) => !n.isOpened).length;

  const handleNotificationClick = (notificationIndex: number) => {
    console.log("Notification clicked:", notificationIndex);
    const notification = unreadNotifications[notificationIndex];

    // Set the conversation as selected
    setSelectedConversation(notification.conversation);

    // Mark notifications as read for this conversation
    markNotificationsAsRead(notification.conversation.id);
  };

  const clearAllNotifications = () => {
    console.log("Clear all notifications");
    // Mark all notifications as read instead of removing them
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: "READ" }))
    );
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          markNotificationsAsOpened();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unopenedCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unopenedCount > 9 ? "9+" : unopenedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadNotifications.length > 0 && (
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
          {notificationsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          ) : unreadNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {unreadNotifications.map((notification, index) => (
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
                        {!notification.isOpened && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2 mt-1" />
                        )}
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

        {unreadNotifications.length > 0 && (
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
