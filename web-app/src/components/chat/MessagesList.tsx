import type { Message } from "@/types";

export default function MessagesList({
  messages,
  isCurrentUser,
  getAvatarColor,
  getInitials,
  formatMessageTime,
}: {
  messages: Message[];
  isCurrentUser: (senderId: string) => boolean;
  getAvatarColor: (id: string) => string;
  getInitials: (name: string) => string;
  formatMessageTime: (date: Date) => string;
}) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            isCurrentUser(message.senderId) ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex max-w-[70%] ${
              isCurrentUser(message.senderId) ? "flex-row-reverse" : "flex-row"
            } items-end space-x-2`}
          >
            <div
              className={`w-8 h-8 rounded-full ${getAvatarColor(
                message.senderId
              )} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-xs text-white font-medium">
                {getInitials(message.sender.name || message.sender.email)}
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl ${
                isCurrentUser(message.senderId)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  isCurrentUser(message.senderId)
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
