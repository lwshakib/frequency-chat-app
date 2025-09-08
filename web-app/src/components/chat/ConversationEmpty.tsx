import { getAvatarColor, getInitials } from "@/lib/chat-helpers";

type Props = {
  conversationId: string;
  displayName: string;
  displayDescription: string;
};

export default function ConversationEmpty({
  conversationId,
  displayName,
  displayDescription,
}: Props) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <div
          className={`w-16 h-16 rounded-full ${getAvatarColor(
            conversationId
          )} flex items-center justify-center mx-auto mb-4`}
        >
          <span className="text-2xl text-white font-medium">
            {getInitials(displayName)}
          </span>
        </div>
        <h3 className="text-lg font-medium mb-2">{displayName}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {displayDescription}
        </p>
        <p className="text-sm">Start typing to send a message...</p>
      </div>
    </div>
  );
}
