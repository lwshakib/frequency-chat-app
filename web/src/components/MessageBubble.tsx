import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import React from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex mb-4 animate-in slide-in-from-bottom-2 duration-300",
      message.isOwn ? "justify-end" : "justify-start"
    )}>
      <div
        className={cn(
          "max-w-[70%] px-4 py-2 rounded-2xl",
          message.isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-muted-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={cn(
          "text-xs mt-1 opacity-70",
          message.isOwn ? "text-right" : "text-left"
        )}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}