import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/lib/chat-helpers";

type Props = {
  conversationId: string;
  displayName: string;
  displayDescription: string;
  imageUrl?: string | null;
};

export default function ConversationEmpty({
  conversationId,
  displayName,
  displayDescription,
  imageUrl,
}: Props) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        {imageUrl ? (
          <Avatar className="w-16 h-16 mx-auto mb-4">
            <AvatarImage src={imageUrl || undefined} alt={displayName} />
            <AvatarFallback
              className={`${getAvatarColor(
                conversationId
              )} text-white text-2xl font-medium`}
            >
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={`w-16 h-16 rounded-full ${getAvatarColor(
              conversationId
            )} flex items-center justify-center mx-auto mb-4`}
          >
            <span className="text-2xl text-white font-medium">
              {getInitials(displayName)}
            </span>
          </div>
        )}
        <h3 className="text-lg font-medium mb-2">{displayName}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {displayDescription}
        </p>
        <p className="text-sm">Start typing to send a message...</p>
      </div>
    </div>
  );
}
