"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/context";
import { useSocket } from "@/context/socket-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
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
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "./VideoPlayer";

export default function CallOverlay() {
  const { activeCall, setActiveCall, session } = useChatStore();
  const {
    emitCallAccept,
    emitCallReject,
    emitCallHangup,
    emitCallSignal,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
    localStream,
    setLocalStream,
    isMediaReady,
    setIsMediaReady,
  } = useSocket();
  const currentUser = session?.user;

  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteVideoStatuses, setRemoteVideoStatuses] = useState<Map<string, boolean>>(new Map());
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOffers = useRef<Map<string, any>>(new Map());

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStreams(new Map());
    setRemoteVideoStatuses(new Map());
    setIsMediaReady(false);
    pendingOffers.current.clear();
    setCallDuration(0);
  }, [localStream, setLocalStream, setIsMediaReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall?.status === "CONNECTED" && remoteStreams.size > 0) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status, remoteStreams.size]);

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
      const existingPc = peerConnections.current.get(targetUserId);
      if (existingPc) existingPc.close();

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
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

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          console.warn("Peer connection failed for", targetUserId);
          // Optional: try to restart ICE or cleanup
        }
      };

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

  const processOffer = useCallback(async (senderId: string, sdp: any) => {
    const pc = createPeerConnection(senderId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emitAnswer({ sdp: answer, toUserId: senderId, fromUserId: currentUser!.id });
    } catch (err) {
      console.error("Error processing offer:", err);
    }
  }, [createPeerConnection, currentUser?.id, emitAnswer]);

  // Buffer offers until media is ready
  useEffect(() => {
    if (!activeCall || activeCall.status !== "CONNECTED") return;

    const onOffer = (e: any) => {
      const { sdp, senderId } = e.detail;
      if (senderId === currentUser?.id) return;

      if (!isMediaReady) {
        pendingOffers.current.set(senderId, sdp);
      } else {
        processOffer(senderId, sdp);
      }
    };

    const onAnswer = async (e: any) => {
      const { sdp, senderId } = e.detail;
      const pc = peerConnections.current.get(senderId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(console.error);
    };

    const onIceCandidate = async (e: any) => {
      const { candidate, senderId } = e.detail;
      const pc = peerConnections.current.get(senderId);
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    };

    const onSignal = (e: any) => {
      const { signal, fromUserId } = e.detail;
      if (signal.videoEnabled !== undefined) {
        setRemoteVideoStatuses(prev => {
          const next = new Map(prev);
          next.set(fromUserId, signal.videoEnabled);
          return next;
        });
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
      if (!activeCall.isGroup && userId === activeCall.callee?.id) {
        toast.info("Partner disconnected");
        handleHangup();
      }
    };

    window.addEventListener("offer", onOffer);
    window.addEventListener("answer", onAnswer);
    window.addEventListener("ice-candidate", onIceCandidate);
    window.addEventListener("call:signal", onSignal);
    window.addEventListener("call:participant-left", handleParticipantLeft);

    return () => {
      window.removeEventListener("offer", onOffer);
      window.removeEventListener("answer", onAnswer);
      window.removeEventListener("ice-candidate", onIceCandidate);
      window.removeEventListener("call:signal", onSignal);
      window.removeEventListener("call:participant-left", handleParticipantLeft);
    };
  }, [activeCall, isMediaReady, processOffer, currentUser?.id, cleanup, setActiveCall]);

  const isMediaRequesting = useRef(false);
  const requestedCallIdRef = useRef<string | null>(null);
  const activeCallRef = useRef(activeCall);
  
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  // Handle media and pending connectivity
  useEffect(() => {
    let isMounted = true;
    const status = activeCall?.status;
    const type = activeCall?.type;
    const conversationId = activeCall?.conversationId;

    if (status === "CONNECTED" && 
        conversationId && 
        requestedCallIdRef.current !== conversationId && 
        !localStream && 
        !isMediaRequesting.current) {
        
        console.log("ONE-SHOT media request for:", conversationId);
        requestedCallIdRef.current = conversationId;
        isMediaRequesting.current = true;
        setMediaError(null);
        
        // Timeout guard for getUserMedia
        const mediaTimeout = setTimeout(() => {
            if (!localStream && isMounted) {
                console.error("Media request timed out for", conversationId);
                isMediaRequesting.current = false;
                setMediaError("Timeout starting video source. Please check if another app is using the camera.");
                toast.error("Media access timed out.");
            }
        }, 30000);

      // 500ms delay to bypass entry animation/Turbopack jitters
      setTimeout(async () => {
        try {
          // Pre-enumerate devices to "wake up" the browser media thread
          await navigator.mediaDevices.enumerateDevices();
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: type === "VIDEO" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false, 
            audio: true 
          });

          clearTimeout(mediaTimeout);
          if (!isMounted || !activeCallRef.current || activeCallRef.current.conversationId !== conversationId) {
            stream.getTracks().forEach(t => t.stop());
            isMediaRequesting.current = false;
            return;
          }

          setLocalStream(stream);
          localStreamRef.current = stream;
          setIsMediaReady(true);
          isMediaRequesting.current = false;
          setMediaError(null);

          const currentCall = activeCallRef.current;
          if (currentCall.isOutgoing) {
            // ... signalling logic
            const targets = currentCall.participants.filter((id) => id !== currentUser?.id);
            targets.forEach(async (targetId) => {
              const pc = createPeerConnection(targetId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              emitOffer({ sdp: offer, toUserId: targetId, fromUserId: currentUser!.id });
            });
          }

          pendingOffers.current.forEach((sdp, senderId) => {
            processOffer(senderId, sdp);
          });
          pendingOffers.current.clear();
        } catch (err: any) {
          clearTimeout(mediaTimeout);
          if (isMounted) {
            console.error("Media error for", conversationId, ":", err);
            isMediaRequesting.current = false;
            setMediaError(err.name === "AbortError" ? "Timeout starting video source. Use the button to retry." : err.message);

            // FALLBACK: If video failed, try audio-only to keep the call alive
            if (type === "VIDEO") {
              // ... fallback logic
              console.warn("Attempting audio-only fallback for", conversationId);
              toast.warning("Camera timed out. Falling back to audio-only.");
              try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (isMounted && activeCallRef.current?.conversationId === conversationId) {
                  setLocalStream(audioStream);
                  localStreamRef.current = audioStream;
                  setIsVideoOff(true); 
                  setIsMediaReady(true);
                  setMediaError(null);
                  
                  activeCallRef.current.participants.forEach(pId => {
                    if (pId !== currentUser?.id) {
                      emitCallSignal({
                        conversationId,
                        signal: { videoEnabled: false },
                        toUserId: pId,
                        fromUserId: currentUser!.id,
                      });
                    }
                  });

                  if (activeCallRef.current.isOutgoing) {
                    const targets = activeCallRef.current.participants.filter(id => id !== currentUser?.id);
                    targets.forEach(async (tId) => {
                      const pc = createPeerConnection(tId);
                      const offer = await pc.createOffer();
                      await pc.setLocalDescription(offer);
                      emitOffer({ sdp: offer, toUserId: tId, fromUserId: currentUser!.id });
                    });
                  }
                  pendingOffers.current.forEach((sdp, senderId) => processOffer(senderId, sdp));
                  pendingOffers.current.clear();
                  return;
                } else {
                  audioStream.getTracks().forEach(t => t.stop());
                }
              } catch (audioErr) {
                console.error("Audio fallback failed too:", audioErr);
              }
            }
          }
        }
      }, 500);
    }

    return () => {
      isMounted = false;
    };
  }, [activeCall?.status, activeCall?.conversationId, activeCall?.type, createPeerConnection, currentUser?.id, emitOffer, emitCallSignal, localStream, setLocalStream, setIsMediaReady, handleHangup, processOffer]);

  if (!activeCall) return null;

  const remoteUserId = Array.from(remoteStreams.keys())[0];
  const remoteStream = remoteStreams.get(remoteUserId || "");

  const getParticipantName = (id: string): string => {
    if (!id) return "User";
    const userInConv = useChatStore.getState().selectedConversation?.users.find(u => u.id === id);
    if (userInConv?.name) return userInConv.name;
    if (activeCall.callee?.name && id === activeCall.callee?.id) return activeCall.callee.name;
    return "User";
  };

  const remoteUserName = getParticipantName(remoteUserId || "");
  const isAudioCall = activeCall.type === "AUDIO";
  const isConnected = activeCall.status === "CONNECTED";
  const isIncoming = activeCall.status === "RINGING" && !activeCall.isOutgoing;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
      >
        {/* Call Timer Overlay */}
        {isConnected && remoteStream && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-mono font-medium text-white/90 tracking-widest">
              {Math.floor(callDuration / 60).toString().padStart(2, "0")}:
              {(callDuration % 60).toString().padStart(2, "0")}
            </span>
          </motion.div>
        )}
        {/* Background Layer */}
        {isConnected && !isAudioCall && remoteStream ? (
           <div className="absolute inset-0">
            <VideoPlayer 
              stream={remoteStream || null} 
              username={remoteUserName || "User"}
              avatar={activeCall.isGroup ? undefined : (activeCall.callee?.image ?? undefined)}
              isVideoOn={remoteVideoStatuses.get(remoteUserId || "") !== false}
              className="h-full w-full rounded-none border-none scale-100" 
            />
           </div>
        ) : (
          <div className="absolute inset-0 bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-zinc-900 to-black/40" />
          </div>
        )}

        {/* Floating Local Preview */}
        {!isAudioCall && localStream && isConnected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-6 right-6 w-32 md:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-50 bg-black"
          >
            <VideoPlayer 
                stream={localStream} 
                isLocal 
                muted 
                username="You" 
                avatar={currentUser?.image ?? undefined}
                isVideoOn={!isVideoOff}
                className="h-full w-full rounded-none" 
            />
          </motion.div>
        )}

        {/* Center Content */}
        <AnimatePresence>
          {(isAudioCall || !isConnected || (isConnected && !isAudioCall && !remoteStream)) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 flex flex-col items-center gap-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10 scale-150" />
                <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-white/10 shadow-3xl">
                  <AvatarImage src={activeCall.callee?.image || ""} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold bg-zinc-800 text-white">
                    {activeCall.callee?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">{activeCall.callee?.name}</h1>
                <p className="text-zinc-500 font-medium tracking-wide">
                  {isIncoming ? (isAudioCall ? "Incoming Call" : "Incoming Video Call") : isConnected ? (remoteStream ? "On Call" : (isAudioCall ? "Connecting audio..." : "Connecting video...")) : "Calling..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bottom Controls */}
        <div className="absolute bottom-12 left-0 right-0 z-50 flex flex-col items-center gap-8 px-6">
          <div className="flex items-center gap-6">
            {isIncoming ? (
              <>
                <button
                  onClick={() => {
                    emitCallAccept({
                      conversationId: activeCall.conversationId,
                      callerId: activeCall.callerId,
                      calleeId: currentUser!.id,
                    });
                    setActiveCall({ ...activeCall, status: "CONNECTED" });
                  }}
                  className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                  <Phone size={28} />
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
                  className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-red-500 text-white shadow-xl shadow-red-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                  <PhoneOff size={28} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 bg-zinc-900/60 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                {isConnected && (
                  <>
                    <button
                      onClick={() => {
                        localStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
                        setIsMuted(!isMuted);
                      }}
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                        isMuted ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10"
                      )}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    {!isAudioCall && (
                      <button
                        onClick={() => {
                          const newState = !isVideoOff;
                          setIsVideoOff(newState);
                          localStream?.getVideoTracks().forEach((t) => (t.enabled = !newState));
                          
                          // Notify participants
                          activeCall.participants.forEach(pId => {
                            if (pId !== currentUser?.id) {
                                emitCallSignal({
                                    conversationId: activeCall.conversationId,
                                    signal: { videoEnabled: !newState },
                                    toUserId: pId,
                                    fromUserId: currentUser!.id,
                                });
                            }
                          });
                        }}
                        className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                          isVideoOff ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white hover:bg-white/10"
                        )}
                      >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleHangup}
                  className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-red-500 text-white flex items-center justify-center transition-all hover:bg-red-600 hover:scale-110 active:scale-95 shadow-lg shadow-red-500/20"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            )}
          </div>
        </div>

        {mediaError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 p-6 rounded-3xl bg-red-500/10 backdrop-blur-3xl border border-red-500/20 text-center max-w-[300px]"
          >
             <p className="text-sm font-medium text-red-400">{mediaError}</p>
             <button
               onClick={() => {
                 requestedCallIdRef.current = null;
                 isMediaRequesting.current = false;
                 setMediaError(null);
               }}
               className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold transition-all hover:bg-red-400 active:scale-95"
             >
               Retry Camera
             </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
