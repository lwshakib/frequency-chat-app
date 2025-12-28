"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/context";
import { useSocket } from "@/context/socket-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CallOverlay() {
  const { activeCall, setActiveCall, session } = useChatStore();
  const {
    emitCallAccept,
    emitCallReject,
    emitCallHangup,
    emitCallSignal,
    socket,
  } = useSocket();
  const currentUser = session?.user;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  const handleHangup = useCallback(() => {
    if (activeCall) {
      emitCallHangup({
        conversationId: activeCall.conversationId,
        participants: activeCall.participants,
        isGroup: activeCall.isGroup,
      });
      setActiveCall(null);
    }
  }, [activeCall, emitCallHangup, setActiveCall]);

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setLocalStream(null);
    setRemoteStreams({});
  }, [localStream]);

  useEffect(() => {
    if (!activeCall) {
      cleanup();
    }
  }, [activeCall, cleanup]);

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      // Close existing PC if any
      if (peerConnections.current[targetUserId]) {
        peerConnections.current[targetUserId].close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && activeCall) {
          emitCallSignal({
            conversationId: activeCall.conversationId,
            signal: { candidate: event.candidate },
            toUserId: targetUserId,
            fromUserId: currentUser!.id,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: event.streams[0],
        }));
      };

      // Important: Add tracks BEFORE sending offer/answer if stream is already available
      if (localStream) {
        localStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStream));
      }

      peerConnections.current[targetUserId] = pc;
      return pc;
    },
    [activeCall, currentUser?.id, emitCallSignal, localStream]
  );

  // Effect to add tracks to ALL existing peer connections when localStream becomes available
  useEffect(() => {
    if (localStream) {
      Object.values(peerConnections.current).forEach((pc) => {
        // Check if track is already added to avoid duplicates
        localStream.getTracks().forEach((track) => {
          const alreadyAdded = pc
            .getSenders()
            .some((s) => s.track?.id === track.id);
          if (!alreadyAdded) {
            pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  const handleSignal = useCallback(
    async (e: any) => {
      const { signal, fromUserId } = e.detail;
      if (!activeCall || fromUserId === currentUser?.id) return;

      let pc = peerConnections.current[fromUserId];
      if (!pc) {
        pc = createPeerConnection(fromUserId);
      }

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === "offer") {
          // If we have an offer, we must have our stream ready or we'll send an answer with no tracks
          // Wait, createAnswer will use whatever tracks are in the PC at that moment.
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitCallSignal({
            conversationId: activeCall.conversationId,
            signal: { sdp: answer },
            toUserId: fromUserId,
            fromUserId: currentUser!.id,
          });
        }
      } else if (signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.error("Scale ICE Error", e);
        }
      }
    },
    [activeCall, createPeerConnection, currentUser?.id, emitCallSignal]
  );

  useEffect(() => {
    window.addEventListener("call:signal", handleSignal as EventListener);
    const handleParticipantLeft = (e: any) => {
      const { userId } = e.detail;
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
    };
    window.addEventListener(
      "call:participant-left",
      handleParticipantLeft as EventListener
    );

    return () => {
      window.removeEventListener("call:signal", handleSignal as EventListener);
      window.removeEventListener(
        "call:participant-left",
        handleParticipantLeft as EventListener
      );
    };
  }, [handleSignal]);

  useEffect(() => {
    if (activeCall?.status === "CONNECTED" && !localStream) {
      navigator.mediaDevices
        .getUserMedia({
          video: activeCall.type === "VIDEO",
          audio: true,
        })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          if (activeCall.isOutgoing) {
            const targets = activeCall.participants.filter(
              (id) => id !== currentUser?.id
            );
            targets.forEach(async (targetId) => {
              const pc = createPeerConnection(targetId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              emitCallSignal({
                conversationId: activeCall.conversationId,
                signal: { sdp: offer },
                toUserId: targetId,
                fromUserId: currentUser!.id,
              });
            });
          }
        });
    }
  }, [
    activeCall,
    createPeerConnection,
    currentUser?.id,
    emitCallSignal,
    localStream,
  ]);

  if (!activeCall) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl transition-all duration-300",
        activeCall.status === "RINGING" && !activeCall.isOutgoing
          ? "animate-pulse"
          : ""
      )}
    >
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border flex items-center justify-center">
        {/* Remote Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 w-full h-full">
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div
              key={userId}
              className="relative bg-muted rounded-xl overflow-hidden border"
            >
              <VideoElement stream={stream} />
              <div className="absolute bottom-2 left-2 bg-black/40 px-2 py-1 rounded text-[10px] text-white backdrop-blur">
                Participant
              </div>
            </div>
          ))}
          {Object.keys(remoteStreams).length === 0 &&
            activeCall.status === "CONNECTED" && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Avatar className="h-20 w-20 border-2">
                  <AvatarImage src={activeCall.callee?.image || ""} />
                  <AvatarFallback>
                    {activeCall.callee?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="animate-pulse">Connecting to participants...</p>
              </div>
            )}
          {activeCall.status !== "CONNECTED" && (
            <div className="flex flex-col items-center gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl scale-110">
                <AvatarImage
                  src={activeCall.callee?.image || ""}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl">
                  {activeCall.callee?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {activeCall.callee?.name}
                </h3>
                <p className="text-muted-foreground animate-bounce">
                  {activeCall.isOutgoing ? "Calling..." : "Incoming Call..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video Preview (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute top-4 right-4 w-48 aspect-video bg-muted rounded-lg overflow-hidden border-2 border-white/10 shadow-xl z-10 transition-transform hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute bottom-1 left-1 bg-black/40 px-1.5 py-0.5 rounded text-[8px] text-white backdrop-blur">
              You
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full h-12 w-12 transition-all",
              isMuted
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
            onClick={() => {
              localStream
                ?.getAudioTracks()
                .forEach((t) => (t.enabled = isMuted));
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {activeCall.type === "VIDEO" && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full h-12 w-12 transition-all",
                isVideoOff
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
              onClick={() => {
                localStream
                  ?.getVideoTracks()
                  .forEach((t) => (t.enabled = isVideoOff));
                setIsVideoOff(!isVideoOff);
              }}
            >
              {isVideoOff ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform"
            onClick={handleHangup}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12 bg-white/10 text-white hover:bg-white/20 transition-all"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Incoming Call Actions */}
        {activeCall.status === "RINGING" && !activeCall.isOutgoing && (
          <div className="absolute inset-x-0 bottom-32 flex justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              onClick={() => {
                emitCallAccept({
                  conversationId: activeCall.conversationId,
                  callerId: activeCall.callerId,
                  calleeId: currentUser!.id,
                });
                setActiveCall({
                  ...activeCall,
                  status: "CONNECTED",
                });
              }}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-12 py-7 text-lg font-bold shadow-xl flex items-center gap-3 animate-pulse"
            >
              <Phone className="h-6 w-6" />
              Accept
            </Button>
            <Button
              onClick={() => {
                emitCallReject({
                  conversationId: activeCall.conversationId,
                  callerId: activeCall.callerId,
                  calleeId: currentUser!.id,
                });
                setActiveCall(null);
              }}
              variant="destructive"
              className="rounded-full px-12 py-7 text-lg font-bold shadow-xl flex items-center gap-3"
            >
              <PhoneOff className="h-6 w-6" />
              Decline
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

function VideoElement({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
