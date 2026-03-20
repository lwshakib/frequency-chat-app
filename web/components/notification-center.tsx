"use client";

import { useEffect, useState } from "react";
import { IconBell, IconCheck } from "@tabler/icons-react";
import { useChatStore } from "@/context";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  ApiNotification,
} from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function NotificationCenter() {
  const {
    session,
    notifications,
    setNotifications,
    markNotificationRead,
    conversations,
    setSelectedConversation,
  } = useChatStore();
  const userId = session?.user?.id;
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (userId) {
      getNotifications(userId).then(setNotifications).catch(console.error);
    }
  }, [userId, setNotifications]);

  const handleMarkRead = async (notification: ApiNotification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        markNotificationRead(notification.id);
      }

      // Handle redirection
      if (notification.type === "MESSAGE") {
        if (notification.conversationId) {
          const conversation = conversations.find(
            (c) => c.id === notification.conversationId
          );
          if (conversation) {
            setSelectedConversation(conversation);
            router.push("/");
          }
        }
      } else if (notification.type === "CALL") {
        router.push("/call-history");
      }

      setIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-sidebar-accent transition-colors"
        >
          <IconBell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in-50 duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-2xl border-sidebar-border bg-popover text-popover-foreground rounded-xl overflow-hidden backdrop-blur-sm"
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-muted/30">
          <h3 className="text-sm font-semibold tracking-tight">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 text-xs px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12 opacity-50 grayscale transition-all">
              <IconBell className="size-10 stroke-[1.5]" />
              <p className="text-xs font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-sidebar-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative group p-4 flex gap-3 transition-all hover:bg-sidebar-accent/50 cursor-pointer",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleMarkRead(notification)}
                >
                  <div
                    className={cn(
                      "mt-1.5 flex h-2.5 w-2.5 shrink-0 rounded-full",
                      notification.isRead
                        ? "bg-muted-foreground/30"
                        : "bg-primary"
                    )}
                  />
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p
                      className={cn(
                        "text-xs leading-relaxed break-words",
                        !notification.isRead
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {notification.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notification);
                      }}
                    >
                      <IconCheck className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
