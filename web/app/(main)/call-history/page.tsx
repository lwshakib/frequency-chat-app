"use client";

import { useEffect, useState } from "react";
import { getCallLogs } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneMissed, Video, Calendar, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "@/context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CallHistoryPage() {
  const { session } = useChatStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await getCallLogs();
      setCalls(data);
    } catch (err) {
      console.error("Error fetching call logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPartner = (call: any) => {
    if (call.callerId === session?.user?.id) {
       return call.receiver || { name: "Unknown User" };
    }
    return call.caller || { name: "Unknown User" };
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Call History</h1>
           <p className="text-muted-foreground mt-1">Review your recent Audio and Video interactions.</p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-white/5 bg-muted/5 shadow-none">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-32" />
                       <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardContent>
              </Card>
            ))
          ) : calls.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/[0.02]">
               <Phone className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
               <p className="text-muted-foreground font-medium italic">No calls recorded yet.</p>
            </div>
          ) : (
            calls.map((call) => {
              const partner = getPartner(call);
              const isMissed = call.status === "MISSED";
              const isOutgoing = call.callerId === session?.user?.id;
              
              return (
                <Card key={call.id} className="rounded-2xl border-white/5 bg-muted/5 hover:bg-muted/10 transition-colors shadow-none cursor-default group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                          <AvatarImage src={partner.image ?? ""} className="object-cover" />
                          <AvatarFallback className="font-bold">{partner.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 p-1 rounded-full border border-background shadow-sm",
                          isMissed ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {call.type === "VIDEO" ? <Video className="h-3 w-3" /> : (isMissed ? <PhoneMissed className="h-3 w-3" /> : <Phone className="h-3 w-3" />)}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                           <p className="font-semibold text-lg">{partner.name}</p>
                           <span className={cn(
                             "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                             isOutgoing ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                           )}>
                             {isOutgoing ? "Outgoing" : "Incoming"}
                           </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <div className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                          </div>
                          {!isMissed && (
                            <div className="flex items-center gap-1">
                               <Clock className="h-3 w-3" />
                               {formatDuration(call.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Removed status and chevron as per user request */}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
