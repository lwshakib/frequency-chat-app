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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "./VideoPlayer";

export default function CallOverlay() {
  const { activeCall, setActiveCall, session } = useChatStore();
  const {
    emitCallAccept,
    emitCallReject,
    emitCallHangup,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
    socket,
  } = useSocket();
  const currentUser = session?.user;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStreams(new Map());
  }, []);

  const handleHangup = useCallback(() => {
    if (activeCall) {
      emitCallHangup({
        conversationId: activeCall.conversationId,
        participants: activeCall.participants,
        isGroup: activeCall.isGroup,
      });
      setActiveCall(null);
      cleanup();
    }
  }, [activeCall, emitCallHangup, setActiveCall, cleanup]);

  useEffect(() => {
    if (!activeCall) {
      cleanup();
    }
  }, [activeCall, cleanup]);

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      // Close existing PC if any
      const existingPc = peerConnections.current.get(targetUserId);
      if (existingPc) {
        existingPc.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && activeCall) {
          emitIceCandidate({
            candidate: event.candidate,
            toUserId: targetUserId,
            fromUserId: currentUser!.id,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(targetUserId, event.streams[0]);
          return next;
        });
      };

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnections.current.set(targetUserId, pc);
      return pc;
    },
    [activeCall, currentUser?.id, emitIceCandidate]
  );

  // Signaling Listeners
  useEffect(() => {
    if (!activeCall || activeCall.status !== "CONNECTED") return;

    const onOffer = async (e: any) => {
      const { sdp, senderId } = e.detail;
      if (senderId === currentUser?.id) return;

      const pc = createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      emitAnswer({
        sdp: answer,
        toUserId: senderId,
        fromUserId: currentUser!.id,
      });
    };

    const onAnswer = async (e: any) => {
      const { sdp, senderId } = e.detail;
      const pc = peerConnections.current.get(senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const onIceCandidate = async (e: any) => {
      const { candidate, senderId } = e.detail;
      const pc = peerConnections.current.get(senderId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    };

    const handleParticipantLeft = (e: any) => {
      const { userId } = e.detail;
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      const pc = peerConnections.current.get(userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(userId);
      }
    };

    window.addEventListener("offer", onOffer);
    window.addEventListener("answer", onAnswer);
    window.addEventListener("ice-candidate", onIceCandidate);
    window.addEventListener("call:participant-left", handleParticipantLeft);

    return () => {
      window.removeEventListener("offer", onOffer);
      window.removeEventListener("answer", onAnswer);
      window.removeEventListener("ice-candidate", onIceCandidate);
      window.removeEventListener("call:participant-left", handleParticipantLeft);
    };
  }, [activeCall, createPeerConnection, currentUser?.id, emitAnswer]);

  // Media Stream Initialization
  useEffect(() => {
    if (activeCall?.status === "CONNECTED" && !localStream) {
      navigator.mediaDevices
        .getUserMedia({
          video: activeCall.type === "VIDEO",
          audio: true,
        })
        .then((stream) => {
          setLocalStream(stream);
          localStreamRef.current = stream;

          // If we are the one connecting, send offers to others
          // In group calls, everyone will send offers to those they see as existing users
          // In 1:1, only the caller sends the initial offer usually
          const targets = activeCall.participants.filter(
            (id) => id !== currentUser?.id
          );

          if (activeCall.isOutgoing) {
            targets.forEach(async (targetId) => {
              const pc = createPeerConnection(targetId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              emitOffer({
                sdp: offer,
                toUserId: targetId,
                fromUserId: currentUser!.id,
              });
            });
          }
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
          setActiveCall(null);
        });
    }
  }, [activeCall, createPeerConnection, currentUser?.id, emitOffer, localStream, setActiveCall]);

  if (!activeCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-100 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-2xl transition-all duration-500 p-4 md:p-8",
          activeCall.status === "RINGING" && !activeCall.isOutgoing && "animate-pulse-subtle"
        )}
      >
        <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center gap-6">
          
          {/* Main Video Viewport */}
          <div className="relative w-full flex-1 rounded-3xl overflow-hidden bg-zinc-900/50 border border-white/10 shadow-3xl flex items-center justify-center group">
            
            {/* Grid for Multiple Streams */}
            <div className={cn(
              "w-full h-full p-6 grid gap-6 transition-all duration-500",
              remoteStreams.size === 0 ? "grid-cols-1" : 
              remoteStreams.size === 1 ? "grid-cols-1 md:grid-cols-2" : 
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              
              {/* Local Stream (Only if alone or mobile) */}
              {localStream && remoteStreams.size === 0 && (
                <VideoPlayer 
                  stream={localStream} 
                  isLocal 
                  username="You" 
                  className="w-full h-full max-w-2xl mx-auto"
                  muted
                />
              )}

              {/* Remote Streams */}
              {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                <VideoPlayer
                  key={userId}
                  stream={stream}
                  username={activeCall.participants.length <= 2 ? activeCall.callee?.name : "Participant"}
                  className="w-full h-full"
                />
              ))}

              {/* Placeholder when connecting */}
              {remoteStreams.size === 0 && activeCall.status === "CONNECTED" && !activeCall.isGroup && (
                <div className="flex flex-col items-center justify-center gap-6 text-zinc-400">
                  <Avatar className="h-32 w-32 border-4 border-indigo-500/20 shadow-2xl scale-110">
                    <AvatarImage src={activeCall.callee?.image || ""} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-zinc-800">
                      {activeCall.callee?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{activeCall.callee?.name}</h2>
                    <p className="text-indigo-400 animate-pulse font-medium">Connecting secure link...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Mini Preview (PiP Style) */}
            {localStream && remoteStreams.size > 0 && (
              <motion.div 
                drag
                dragConstraints={{ left: -400, right: 400, top: -200, bottom: 200 }}
                className="absolute top-6 right-6 w-48 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-50 cursor-move"
              >
                <VideoPlayer stream={localStream} isLocal username="You" muted className="hover:scale-100" />
              </motion.div>
            )}

            {/* Call Header Overlay */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 z-50 transition-opacity group-hover:opacity-100 opacity-0 md:opacity-100">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">
                {activeCall.type} CALL
              </span>
              <div className="h-4 w-px bg-white/10 mx-1" />
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Users size={14} />
                <span className="text-xs font-medium">{remoteStreams.size + 1} present</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-6 px-10 py-5 rounded-[2.5rem] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-3xl">
            <ControlActionBtn
              icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              active={!isMuted}
              onClick={() => {
                localStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
                setIsMuted(!isMuted);
              }}
              label="Mic"
            />

            {activeCall.type === "VIDEO" && (
              <ControlActionBtn
                icon={isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                active={!isVideoOff}
                onClick={() => {
                  localStream?.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
                  setIsVideoOff(!isVideoOff);
                }}
                label="Camera"
              />
            )}

            <button
              onClick={handleHangup}
              className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 hover:scale-110 active:scale-95 group"
            >
              <PhoneOff size={28} className="transition-transform group-hover:rotate-12" />
            </button>

            <ControlActionBtn
              icon={isFullScreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              active={false}
              onClick={() => setIsFullScreen(!isFullScreen)}
              label="Fullscreen"
            />
          </div>

          {/* Incoming Call Actions */}
          {activeCall.status === "RINGING" && !activeCall.isOutgoing && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/20 backdrop-blur-3xl p-8 z-[60]"
            >
              <div className="flex flex-col items-center gap-8 mb-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150" />
                  <Avatar className="h-40 w-40 border-8 border-white/10 shadow-3xl">
                    <AvatarImage src={activeCall.callee?.image || ""} className="object-cover" />
                    <AvatarFallback className="text-5xl font-bold bg-indigo-600 text-white">
                      {activeCall.callee?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    {activeCall.callee?.name}
                  </h1>
                  <p className="text-indigo-300 text-lg font-medium animate-bounce">
                    Incoming {activeCall.type.toLowerCase()} call...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <button
                  onClick={() => {
                    emitCallAccept({
                      conversationId: activeCall.conversationId,
                      callerId: activeCall.callerId,
                      calleeId: currentUser!.id,
                    });
                    setActiveCall({ ...activeCall, status: "CONNECTED" });
                  }}
                  className="h-24 w-24 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 flex items-center justify-center transition-all hover:bg-emerald-400 hover:scale-110 active:scale-95 group"
                >
                  <Phone size={36} className="animate-pulse" />
                </button>
                <button
                  onClick={() => {
                    emitCallReject({
                      conversationId: activeCall.conversationId,
                      callerId: activeCall.callerId,
                      calleeId: currentUser!.id,
                    });
                    setActiveCall(null);
                  }}
                  className="h-24 w-24 rounded-full bg-red-500 text-white shadow-2xl shadow-red-500/20 flex items-center justify-center transition-all hover:bg-red-400 hover:scale-110 active:scale-95"
                >
                  <PhoneOff size={36} />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <style jsx>{`
          .animate-pulse-subtle {
            animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.92; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

function ControlActionBtn({ 
  icon, 
  active, 
  onClick,
  label 
}: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void,
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300",
          active 
            ? "border-white/20 bg-white/10 text-white hover:bg-white/20" 
            : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
        )}
        title={label}
      >
        {icon}
      </button>
      <span className="text-[10px] font-medium text-white/40 uppercase tracking-tighter">{label}</span>
    </div>
  );
}
