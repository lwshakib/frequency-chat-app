"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (session) {
    redirect("/");
  }
  return <div className="w-full min-h-screen">{children}</div>;
}
