import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import React from "react";

export default function CallOverlay({
  title,
  status,
  imageUrl,
  onCancel,
  onAccept,
  startLocalVideo,
}: {
  title: string;
  status?: string;
  imageUrl?: string;
  onCancel: () => void;
  onAccept?: () => void;
  startLocalVideo?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (!startLocalVideo) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("Failed to start local video", e);
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
  }, [startLocalVideo]);

  return (
    <div className="absolute top-0 left-0 w-screen h-screen z-50 bg-background/90 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
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
      </div>

      {startLocalVideo && (
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
