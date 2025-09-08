"use client";

import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { Link } from "react-router";

type SidebarHeaderBarProps = {
  resolvedTheme: string | undefined;
  onToggleTheme: () => void;
};

export function SidebarHeaderBar({
  resolvedTheme,
  onToggleTheme,
}: SidebarHeaderBarProps) {
  return (
    <SidebarHeader>
      <div className="px-2 py-2 flex items-center justify-between">
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
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={onToggleTheme}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </SidebarHeader>
  );
}

export default SidebarHeaderBar;
