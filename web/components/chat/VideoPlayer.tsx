"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  username?: string;
  avatar?: string;
  isLocal?: boolean;
  isVideoOn?: boolean;
  className?: string;
}

export function VideoPlayer({ 
  stream, 
  muted = false, 
  username, 
  avatar,
  isLocal = false,
  isVideoOn = true,
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn(
      "relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl transition-all border border-white/5",
      className
    )}>
      {/* Background layer for video off state */}
      <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10" />
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={cn(
          "h-full w-full object-cover relative z-10 transition-opacity duration-500",
          isLocal && "-scale-x-100",
          !isVideoOn ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Avatar for video off */}
      {!isVideoOn && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
           <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-10 scale-125" />
             <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-white/10 shadow-2xl">
               <AvatarImage src={avatar} className="object-cover" />
               <AvatarFallback className="text-2xl font-bold bg-zinc-800 text-white">
                 {username?.charAt(0) || "?"}
               </AvatarFallback>
             </Avatar>
           </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur-md border border-white/10 z-30">
        <div className={cn(
          "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]",
          stream ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-sm font-medium text-white truncate max-w-[150px]">
          {username || (isLocal ? "You" : "User")}
        </span>
      </div>
      
    </div>
  );
}
