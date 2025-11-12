import { logger } from "@/lib/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { PeerContext } from "./peer-context";

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const [peer, setPeer] = useState<RTCPeerConnection | null>(null);
  const [tracksAdded, setTracksAdded] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createOffer = useCallback(async () => {
    if (peer) {
      logger.debug("Creating offer");

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      logger.debug("Offer created:", offer);

      return offer;
    }
    return null;
  }, [peer]);

  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (peer) {
        logger.debug("Creating answer for offer:", offer);
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        logger.debug("Answer created:", answer);
        return answer;
      }
      return null;
    },
    [peer]
  );

  const sendStream = useCallback(
    async (stream: MediaStream) => {
      if (!peer) {
        logger.error("Peer connection not established");
        return;
      }

      logger.debug("Sending stream:", stream);

      try {
        const audioTrack = stream.getAudioTracks()[0] || null;
        const videoTrack = stream.getVideoTracks()[0] || null;

        // If we already added tracks previously, replace tracks on existing senders
        if (tracksAdded) {
          const currentId = localStreamRef.current?.id;
          if (currentId === stream.id) {
            logger.debug("Same stream already in use; ignoring re-send.");
            return;
          }
          const senders = peer.getSenders();
          for (const sender of senders) {
            if (sender.track?.kind === "audio" && audioTrack) {
              await sender.replaceTrack(audioTrack);
            }
            if (sender.track?.kind === "video" && videoTrack) {
              await sender.replaceTrack(videoTrack);
            }
          }
          localStreamRef.current = stream;
          logger.debug("Replaced sender tracks with new stream tracks");
          return;
        }

        // First-time add: attach all tracks
        const tracks = stream.getTracks();
        for (const track of tracks) {
          await peer.addTrack(track, stream);
        }
        localStreamRef.current = stream;
        setTracksAdded(true);
        logger.debug("Stream tracks added successfully");
      } catch (error) {
        logger.error("Error adding/replacing stream tracks:", error);
      }
    },
    [peer, tracksAdded]
  );

  const setRemoteDescriptionAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (peer) {
        try {
          const state = peer.signalingState;
          const canApply =
            state === "have-local-offer" ||
            (state === "stable" && !peer.currentRemoteDescription);
          if (!canApply) {
            logger.warn(
              "Skip setRemoteDescription(answer) due to state:",
              state
            );
            return;
          }
          logger.debug("Setting remote description with answer:", answer);
          await peer.setRemoteDescription(answer);
          logger.debug("Remote description set successfully");
        } catch (error) {
          logger.error("Error setting remote description:", error);
        }
      }
    },
    [peer]
  );

  useEffect(() => {
    const _peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    // Ensure we can receive remote tracks even if we haven't sent any yet
    try {
      _peer.addTransceiver("audio", { direction: "recvonly" });
      _peer.addTransceiver("video", { direction: "recvonly" });
    } catch (e) {
      logger.warn("Failed to add default transceivers", e);
    }

    _peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        logger.debug("PeerProvider ontrack: remote stream received", stream);
        setRemoteStream(stream);
      }
    };

    setPeer(_peer);
    return () => {
      _peer.ontrack = null;
      _peer.close();
      setPeer(null);
      setRemoteStream(null);
      setTracksAdded(false);
      localStreamRef.current = null;
    };
  }, []);
  return (
    <PeerContext.Provider
      value={{
        peer,
        setPeer,
        createOffer,
        createAnswer,
        sendStream,
        setRemoteDescriptionAnswer,
        remoteStream,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};
