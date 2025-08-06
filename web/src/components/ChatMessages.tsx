import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

export function ChatMessages() {
  const { state, messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!state.selectedContactId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
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

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {state.isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
