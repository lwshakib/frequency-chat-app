import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  message: any;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex mb-2",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      <Card
        className={cn(
          "px-4 py-2 rounded-2xl max-w-[70%] flex flex-col gap-1 shadow-sm border-none",
          message.isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-muted-foreground rounded-bl-md"
        )}
      >
        {/* Sender details inside the bubble, only for non-own messages */}
        {!message.isOwn && message.sender && (
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="size-6">
              {message.sender.imageUrl ? (
                <AvatarImage
                  src={message.sender.imageUrl}
                  alt={message.sender.name || "Sender"}
                />
              ) : (
                <AvatarFallback>
                  {message.sender.name ? message.sender.name[0] : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <Badge variant="secondary" className="text-xs font-semibold">
              {message.sender.name || "Unknown"}
            </Badge>
          </div>
        )}
        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </div>
        <div
          className={cn(
            "text-xs mt-1 opacity-70",
            message.isOwn ? "text-right" : "text-left"
          )}
        >
          {formatDistanceToNow(message.updatedAt)} ago
        </div>
      </Card>
    </div>
  );
}
