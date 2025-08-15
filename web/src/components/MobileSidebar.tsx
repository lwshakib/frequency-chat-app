import { Button } from "@/components/ui/button";
import { useSocket } from "@/contexts/SocketProvider";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileSidebar() {
  const { isSidebarOpen, toggleSidebar } = useSocket();

  return (
    <>
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative h-full">
          
          <Sidebar toggleButton={
            <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
          } />
        </div>
      </div>
    </>
  );
}
