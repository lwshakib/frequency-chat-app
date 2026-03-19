"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  username?: string;
  isLocal?: boolean;
  className?: string;
}

export function VideoPlayer({ 
  stream, 
  muted = false, 
  username, 
  isLocal = false,
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
      "relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl transition-all hover:scale-[1.02] border border-white/5",
      className
    )}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={cn(
          "h-full w-full object-cover",
          isLocal && "mirror"
        )}
      />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur-md border border-white/10">
        <div className={cn(
          "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]",
          stream ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-sm font-medium text-white truncate max-w-[150px]">
          {username || (isLocal ? "You" : "User")}
        </span>
      </div>
      
      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
