import { PeerContext } from "@/contexts/peer-context";
import { useContext } from "react";

export const usePeer = () => {
  const peer = useContext(PeerContext);
  if (!peer) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return peer;
};