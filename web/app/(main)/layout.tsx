"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SocketProvider } from "@/context/socket-provider";
import CallOverlay from "@/components/chat/call-overlay";

import { authClient } from "@/lib/auth-client";
import { useChatStore } from "@/context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const { setSession } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return null;
  }
  return (
    <SocketProvider>
      <CallOverlay />
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
