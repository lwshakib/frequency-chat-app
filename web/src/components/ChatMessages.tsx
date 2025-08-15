import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/contexts/SocketProvider";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";

export function ChatMessages() {
  const { messages, setMessages, selectedConversation } = useSocket();

  const { typing } = useSocket();
  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    if (selectedConversation?.id) {
      setLoading(true);
      fetch(`/api/messages/${selectedConversation.id}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data.messages || []);
        })
        .finally(() => setLoading(false));
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      setMessages([]);
    };
  }, [selectedConversation?.id]);

  // Scroll to bottom when conversation changes and messages are loaded
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const scrollToBottom = () => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "instant",
            });
          }
        }
      };

      // Immediate scroll for conversation change
      scrollToBottom();
    }
  }, [loading, messages.length]);

  // Handle scroll events to show/hide scroll to bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          const isNearBottom =
            scrollContainer.scrollHeight -
              scrollContainer.scrollTop -
              scrollContainer.clientHeight <
            100;
          setShowScrollButton(!isNearBottom);
        }
      }
    };

    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleScroll);
        return () =>
          scrollContainer.removeEventListener("scroll", handleScroll);
      }
    }
  }, [loading]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current && scrollAreaRef.current) {
        // Get the scroll container
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          // Check if user is already near the bottom (within 100px)
          const isNearBottom =
            scrollContainer.scrollHeight -
              scrollContainer.scrollTop -
              scrollContainer.clientHeight <
            100;

          // Only auto-scroll if user is near bottom or if it's a new message from current user
          const isOwnMessage =
            messages.length > 0 &&
            messages[messages.length - 1]?.sender?.clerkId === user?.id;

          if (isNearBottom || isOwnMessage) {
            // Scroll to bottom with smooth behavior
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }
    };

    // Multiple attempts to ensure scroll works
    const timeoutId1 = setTimeout(scrollToBottom, 50);
    const timeoutId2 = setTimeout(scrollToBottom, 150);
    const timeoutId3 = setTimeout(scrollToBottom, 300);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [messages, user?.id]);

  // Also scroll when typing indicator appears/disappears
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current && scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 50);

    return () => clearTimeout(timeoutId);
  }, [typing]);

  if (!selectedConversation?.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20 h-full min-h-0">
        <div className="text-center px-4">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="text-xl font-semibold mb-2">Welcome to Frequency</h3>
          <p className="text-muted-foreground mb-4">
            Select a conversation to start messaging
          </p>
          <div className="text-sm text-muted-foreground/70 space-y-1">
            <p>💡 Use the search bar to find conversations quickly</p>
            <p>📱 Tap the menu button to view all conversations</p>
            <p>➕ Create new groups or start individual chats</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-full w-full p-4">
        <div className="space-y-4">
          {/* Skeleton for multiple messages */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              {/* Avatar skeleton */}
              <div className="flex-shrink-0">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>

              {/* Message content skeleton */}
              <div className="flex-1 space-y-2">
                {/* Name skeleton */}
                <Skeleton className="h-4 w-24" />

                {/* Message bubble skeleton - varying widths for realism */}
                <div className="flex gap-2">
                  <Skeleton
                    className={`h-16 rounded-2xl ${
                      index % 3 === 0
                        ? "w-48"
                        : index % 3 === 1
                        ? "w-32"
                        : "w-64"
                    }`}
                  />
                </div>

                {/* Timestamp skeleton */}
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}

          {/* Additional skeleton messages with different layouts */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`alt-${index}`} className="flex gap-3 justify-end">
              {/* Message content skeleton (right-aligned for own messages) */}
              <div className="flex-1 space-y-2 max-w-xs">
                {/* Message bubble skeleton */}
                <div className="flex justify-end">
                  <Skeleton
                    className={`h-20 rounded-2xl ${
                      index === 0 ? "w-40" : index === 1 ? "w-28" : "w-36"
                    }`}
                  />
                </div>

                {/* Timestamp skeleton */}
                <div className="flex justify-end">
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>

              {/* Avatar skeleton */}
              <div className="flex-shrink-0">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="flex-1 h-full w-full relative">
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-full w-full p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                isOwn: !!(
                  user &&
                  ((message as any).sender?.clerkId
                    ? (message as any).sender.clerkId === user.id
                    : message.senderId === user.id)
                ),
                isGroup: selectedConversation.type === "GROUP" ? true : false,
                // Ensure files array exists for messages from server
                files: message.files || [],
              }}
            />
          ))}
          {typing && typing.name && typing.clerkId !== user?.id && (
            <div className="flex mb-2 items-center gap-2 justify-start">
              <Avatar>
                {typing.imageUrl ? (
                  <AvatarImage src={typing.imageUrl} alt={typing.name} />
                ) : (
                  <AvatarFallback>{typing.name[0]}</AvatarFallback>
                )}
              </Avatar>
              <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-2 max-w-[70%] text-sm animate-pulse">
                {typing.name} is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          title="Scroll to bottom"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
