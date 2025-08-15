import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { Camera, LogOut, Mail, User } from "lucide-react";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user } = useUser();

  const handleChangeAvatar = () => {
    console.log("Change avatar clicked");
    // Add change avatar logic here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">User Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Avatar Section */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
              <AvatarImage
                src={user?.imageUrl}
                alt={user?.fullName || "Profile"}
              />
              <AvatarFallback className="text-2xl">
                {user?.fullName?.slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleChangeAvatar}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {user?.fullName || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {user?.emailAddresses[0]?.emailAddress || "No email"}
                  </p>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="w-full" />

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <SignOutButton>
              <Button variant="destructive" className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </SignOutButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
