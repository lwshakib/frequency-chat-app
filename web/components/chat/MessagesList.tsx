import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTime, getInitials } from "@/lib/chat-helpers";
import type { Message } from "@/types";
import { FileIcon, Download } from "lucide-react";

type Props = {
  messages: Message[];
  isCurrentUser: (senderId: string) => boolean;
};

export default function MessagesList({ messages, isCurrentUser }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const own = isCurrentUser(message.senderId);
        return (
          <div
            key={message.id}
            className={`flex ${own ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[80%] items-end gap-2 ${
                own ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {!own && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.sender?.image || ""} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(
                      message.sender?.name || message.sender?.email || "U"
                    )}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`flex flex-col ${own ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    own
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  {message.files && message.files.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                      {message.files.map((file, idx) => {
                        const isImage = file.url.match(
                          /\.(jpeg|jpg|gif|png|webp)$/i
                        );
                        return (
                          <div key={idx} className="rounded overflow-hidden">
                            {isImage ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="max-w-full max-h-[300px] object-contain bg-black/5"
                                />
                              </a>
                            ) : (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-black/10 hover:bg-black/20 rounded transition-colors"
                              >
                                <FileIcon className="w-4 h-4" />
                                <span className="text-xs underline flex-1 truncate">
                                  {file.name}
                                </span>
                                <Download className="w-4 h-4 shrink-0" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {message.content && <div>{message.content}</div>}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground px-1">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
