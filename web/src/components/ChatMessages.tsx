import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/contexts/SocketProvider";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";

export function ChatMessages() {
  const { messages, setMessages, selectedConversation } = useSocket();

  const { typing } = useSocket();
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedConversation?.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20 h-full min-h-0">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="text-xl font-semibold mb-2">Welcome to ChatApp</h3>
          <p className="text-muted-foreground">
            Select a contact to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20  h-full min-h-0">
        <div className="text-center text-muted-foreground">
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full w-full p-4">
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
  );
}
