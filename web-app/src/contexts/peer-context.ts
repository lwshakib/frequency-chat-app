import { createContext } from "react";

interface PeerContextType {
  peer: RTCPeerConnection | null;
  setPeer: (peer: RTCPeerConnection | null) => void;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | null>;
  sendStream: (stream: MediaStream) => Promise<void>;
  setRemoteDescriptionAnswer: (
    answer: RTCSessionDescriptionInit
  ) => Promise<void>;
  remoteStream?: MediaStream | null;
}

export const PeerContext = createContext<PeerContextType | null>(null);
