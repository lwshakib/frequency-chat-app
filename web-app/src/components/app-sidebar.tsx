"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { SignOutButton } from "@clerk/clerk-react";
import { Bell, LogOut, Moon, Sun, UserPlus, Users } from "lucide-react";
import { Link } from "react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent active:bg-transparent focus:bg-transparent"
            >
              <Link to="/">
                <img
                  src={
                    resolvedTheme === "dark"
                      ? "/dark_logo.svg"
                      : "/light_logo.svg"
                  }
                  alt="Frequency Logo"
                  className="h-8 w-auto"
                />
                <span>Frequency</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        New message from John Doe
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 minutes ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hey! How are you doing today?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Sarah Wilson sent a message
                      </p>
                      <p className="text-xs text-muted-foreground">
                        15 minutes ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Can we schedule a meeting for tomorrow?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Mike Johnson sent a message
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 hour ago
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Thanks for the quick response!
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="contact" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="contact"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger
                    value="group"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Group
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Enter contact name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <Button className="w-full">Create Contact</Button>
                </TabsContent>
                <TabsContent value="group" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input id="group-name" placeholder="Enter group name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">Description</Label>
                    <Input
                      id="group-description"
                      placeholder="Enter group description"
                    />
                  </div>
                  <Button className="w-full">Create Group</Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Input placeholder="Search contacts..." className="w-full" />

          {/* Groups and Contacts */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 px-2 py-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Groups & Contacts
              </span>
            </div>
            <div className="space-y-1">
              {/* Groups */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">WT</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Work Team</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Sarah: "Let's discuss the project timeline"
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">F</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Family</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Mom: "Don't forget dinner on Sunday!"
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">F</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Friends</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Alex: "Movie night this Friday?"
                  </div>
                </div>
              </Button>

              {/* Contacts */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">JD</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Hey! How are you doing today?
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">SW</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Sarah Wilson</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Can we schedule a meeting for tomorrow?
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">MJ</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Mike Johnson</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Thanks for the quick response!
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto cursor-pointer p-2"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs text-white font-medium">AL</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium">Alice Lee</div>
                  <div className="text-xs text-muted-foreground truncate">
                    See you at the conference next week!
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm text-white font-medium">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Smith</p>
                <p className="text-xs text-muted-foreground truncate">
                  john.smith@email.com
                </p>
              </div>
            </div>
            <SignOutButton>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </SignOutButton>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
