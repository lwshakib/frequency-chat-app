"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SocketProvider } from "@/context/socket-provider";

import { authClient } from "@/lib/auth-client";
import { useChatStore } from "@/context";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const { setSession } = useChatStore();

  useEffect(() => {
    if (session) {
      setSession(session);
    }
  }, [session, setSession]);

  if (isPending) {
    return null;
  }

  if (!session) {
    redirect("/sign-in");
  }
  return (
    <SocketProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </SocketProvider>
  );
}
