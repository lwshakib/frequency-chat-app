"use client";

import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Github, Moon, Sun } from "lucide-react";
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            asChild
          >
            <a
              href="https://github.com/lwshakib/frequency-chat-app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View repository on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
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
      </div>
    </SidebarHeader>
  );
}

export default SidebarHeaderBar;
