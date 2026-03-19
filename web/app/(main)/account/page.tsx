"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useChatStore } from "@/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Camera, LogOut, Shield, User, Globe, Trash2, Smartphone, Monitor } from "lucide-react";
import { uploadToCloudinary } from "@/lib/api";
import { cn } from "@/lib/utils";
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

export default function AccountPage() {
  const { session, setSession } = useChatStore();
  const user = session?.user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(user?.image || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Better Auth Data
  const [sessions, setSessions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setImage(user.image || "");
      fetchAuthData();
    }
  }, [user]);

  const fetchAuthData = async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        authClient.listSessions(),
        authClient.listAccounts()
      ]);
      setSessions((sRes as any).data || []);
      setAccounts((aRes as any).data || []);
    } catch (err) {
      console.error("Error fetching auth data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await authClient.updateUser({
        name,
        image
      });
      if ((res as any).error) throw (res as any).error;
      
      toast.success("Profile updated successfully");
      // Refresh session in store
      const newSession = await authClient.useSession();
      setSession((newSession as any).data);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImage(url);
      
      // Auto-update profile with new image
      const res = await authClient.updateUser({ image: url });
      if ((res as any).error) throw (res as any).error;

      toast.success("Profile picture updated");
      const newSession = await authClient.useSession();
      setSession((newSession as any).data);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setIsChangingPassword(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });
      if ((res as any).error) throw (res as any).error;
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
       toast.error(err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      const res = await authClient.revokeSession({ token });
      if ((res as any).error) throw (res as any).error;
      toast.success("Session revoked");
      fetchAuthData();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This action is permanent.")) return;
    try {
      const res = await authClient.deleteUser();
      if ((res as any).error) throw (res as any).error;
      toast.success("Account deleted");
      window.location.href = "/sign-in";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
           <p className="text-muted-foreground mt-1">Manage your profile, security, and connected accounts.</p>
        </div>

        <div className="space-y-12 pb-20">
          {/* Profile Section */}
          <section id="profile" className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-muted-foreground/60 px-1">Profile Information</h2>
            <Card className="rounded-2xl border-white/5 shadow-xl bg-muted/5 p-2">
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-primary/20 p-0.5">
                      <AvatarImage src={image} className="rounded-full object-cover" />
                      <AvatarFallback className="text-2xl font-bold">{name[0]}</AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{name}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="rounded-xl h-11" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={email} disabled className="rounded-xl h-11 opacity-50 bg-muted" />
                    <p className="text-[10px] text-muted-foreground pl-1">Email cannot be changed through the profile settings.</p>
                  </div>
                  <Button type="submit" disabled={isUpdating} className="rounded-xl h-11 px-8 font-semibold">
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Security Section */}
          <section id="security" className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-muted-foreground/60 px-1">Security & Access</h2>
            <div className="grid gap-6">
               {/* Change Password */}
               <Card className="rounded-2xl border-white/5 shadow-xl bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current">Current Password</Label>
                      <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm">Confirm New Password</Label>
                      <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl h-11" />
                    </div>
                    <Button type="submit" disabled={isChangingPassword} className="rounded-xl h-11 px-8 font-semibold">
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card className="rounded-2xl border-white/5 shadow-xl bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-lg">Logged Devices</CardTitle>
                  <CardDescription>Manage your active sessions across different platforms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessions.map((sess) => {
                    const isCurrent = sess.id === session?.session?.id;
                    const ua = sess.userAgent || "Unknown Device";
                    const isMobile = ua.toLowerCase().includes("mobile");
                    
                    return (
                      <div key={sess.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-background rounded-lg border">
                            {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate max-w-[200px]">{ua}</p>
                                {isCurrent && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                             </div>
                             <p className="text-xs text-muted-foreground">{sess.ipAddress || "No IP logged"}</p>
                          </div>
                        </div>
                        {!isCurrent && (
                          <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(sess.token)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                             Revoke
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Connections Section */}
          <section id="connections" className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-muted-foreground/60 px-1">Linked Hubs</h2>
            <Card className="rounded-2xl border-white/5 shadow-xl bg-muted/5">
              <CardContent className="space-y-4 pt-6">
                {accounts.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No third-party accounts connected yet.</p>}
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-background rounded-lg border font-bold text-xs">
                        {acc.providerId[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize">{acc.providerId}</p>
                        <p className="text-xs text-muted-foreground">Social Authentication</p>
                      </div>
                    </div>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Danger Zone */}
          <section id="danger" className="space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-destructive/60 px-1">Danger Zone</h2>
            <Card className="rounded-2xl border-destructive/20 border-2 shadow-xl bg-destructive/[0.02]">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">Remove Account</CardTitle>
                <CardDescription>Permanently erase your identity and data from Frequency.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Deleting your account is irreversible. Your messages, groups, and media will be wiped.
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="rounded-xl h-11 px-8 font-bold">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate Identity
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-destructive/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">Final decision?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and remove all data from our servers. 
                        This includes your message history and all group memberships.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-xl font-semibold">Keep my account</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
                      >
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
