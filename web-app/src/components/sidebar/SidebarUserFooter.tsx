"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { SocketContext } from "@/contexts/socket-context";
import { SignOutButton } from "@clerk/clerk-react";
import { LogOut } from "lucide-react";
import { useContext } from "react";

type SidebarUserFooterProps = {
  imageUrl?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  email?: string | null;
  initial?: string;
};

export default function SidebarUserFooter({
  imageUrl,
  fullName,
  firstName,
  email,
  initial,
}: SidebarUserFooterProps) {
  const socketCtx = useContext(SocketContext);
  const isOnline = socketCtx?.selfOnline;
  return (
    <SidebarFooter>
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={imageUrl ?? undefined}
                  alt={fullName || "User"}
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium">
                  {initial || "U"}
                </AvatarFallback>
              </Avatar>
              {isOnline ? (
                <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {fullName || firstName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {email || "No email"}
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to sign out?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account and will need to sign
                  in again to access your conversations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <SignOutButton>
                    <Button variant="destructive" className="cursor-pointer">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SidebarFooter>
  );
}
