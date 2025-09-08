import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Conversation } from "@/types";

export default function ProfileDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  getAvatarColor,
  getInitials,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  currentUserId: string | undefined;
  getAvatarColor: (id: string) => string;
  getInitials: (name: string) => string;
}) {
  const isOneToOne = conversation?.type === "ONE_TO_ONE";
  let other:
    | { clerkId: string; name: string | null; email: string; id?: string }
    | undefined;
  if (isOneToOne && conversation) {
    other = conversation.users.find((u) => u.clerkId !== (currentUserId || ""));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        {isOneToOne && other && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full ${getAvatarColor(
                  other.clerkId
                )} flex items-center justify-center text-white font-medium`}
              >
                {getInitials(other.name || other.email)}
              </div>
              <div className="space-y-1">
                <div className="text-base font-semibold">
                  {other.name || other.email}
                </div>
                <div className="text-sm text-muted-foreground">
                  {other.email}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
