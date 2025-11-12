import { Button } from "@/components/ui/button";
import { usePeer } from "@/hooks/usePeer";
import { Phone, PhoneOff } from "lucide-react";
import React from "react";

export default function CallOverlay({
  title,
  status,
  imageUrl,
  onCancel,
  onAccept,
  startLocalVideo,
  callType,
  isActiveCall,
}: {
  title: string;
  status?: string;
  imageUrl?: string;
  onCancel: () => void;
  onAccept?: () => void;
  startLocalVideo?: boolean;
  callType?: "audio-call" | "video-call";
  isActiveCall?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const [callDuration, setCallDuration] = React.useState(0);
  const intervalRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);
  const { sendStream, remoteStream } = usePeer();

  React.useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current
        .play()
        .catch((err) => console.debug("autoplay fail remote", err));
    }
  }, [remoteStream]);

  React.useEffect(() => {
    let cancelled = false;
    const start = async () => {
      // Only start media if we're in an active call
      // For video calls: startLocalVideo will be true when accepted
      // For audio calls: isActiveCall will be true when accepted
      if (!isActiveCall && !startLocalVideo) return;
      
      const isVideoCall = callType === "video-call";
      setVideoError(null);
      
      try {
        // Request media based on call type
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: isVideoCall ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          } : false,
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        try {
          await sendStream(stream);
        } catch (err) {
          console.debug("sendStream failed", err);
        }
        // Only show video element for video calls
        if (isVideoCall && videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (err) {
            console.debug("autoplay fail local", err);
          }
        }
      } catch {
        // Fallback: try with simpler constraints
        try {
          const constraints: MediaStreamConstraints = {
            audio: true,
            video: isVideoCall ? true : false,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          try {
            await sendStream(stream);
          } catch (err) {
            console.debug("sendStream failed (fallback)", err);
          }
          if (isVideoCall && videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (err) {
              console.debug("autoplay fail local (fallback)", err);
            }
          }
        } catch (e2) {
          console.error("Failed to start media", e2);
          const errorMessage = isVideoCall
            ? "Camera/mic unavailable. Check permissions or if device is in use."
            : "Microphone unavailable. Check permissions or if device is in use.";
          setVideoError(errorMessage);
        }
      }
    };
    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startLocalVideo, sendStream, callType, isActiveCall]);

  // Timer effect - start when call becomes active
  React.useEffect(() => {
    if (isActiveCall) {
      // Start timer
      startTimeRef.current = Date.now();
      setCallDuration(0);
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setCallDuration(Date.now() - startTimeRef.current);
        }
      }, 1000); // Update every second
    } else {
      // Stop timer
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      setCallDuration(0);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActiveCall]);

  // Format time as MM:SS or HH:MM:SS
  const formatCallTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    
    if (hours > 0) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="absolute top-0 left-0 w-screen h-screen z-50 bg-background/90 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {callType === "video-call" && remoteStream ? (
          <div className="relative">
            <div
              className="rounded-md overflow-hidden bg-black"
              style={{ width: 640, height: 360 }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            {isActiveCall && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md font-mono font-semibold text-lg z-10">
                {formatCallTime(callDuration)}
              </div>
            )}
          </div>
        ) : (
          <>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="caller"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted" />
            )}
            <div className="text-foreground text-xl font-semibold text-center px-6">
              {title}
            </div>
            {status ? (
              <div className="text-muted-foreground text-sm">{status}</div>
            ) : null}
            {isActiveCall && (
              <div className="text-foreground text-lg font-mono font-semibold">
                {formatCallTime(callDuration)}
              </div>
            )}
          </>
        )}
        {videoError ? (
          <div className="text-xs text-red-500">{videoError}</div>
        ) : null}
      </div>

      {callType === "video-call" && startLocalVideo && !videoError && (
        <div
          className="absolute top-4 right-4 rounded-md overflow-hidden shadow-lg bg-black"
          style={{ width: 320, height: 180 }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
        {onAccept && (
          <Button
            variant="default"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={onAccept}
          >
            <Phone className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="w-12 h-12 rounded-full"
          onClick={onCancel}
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
