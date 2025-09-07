import { SocketContext } from "@/contexts/socket-context"
import { useContext } from "react"

export const useSocket = () => {
    const socket = useContext(SocketContext)
    if (!socket) {
        throw new Error("useSocket must be used within a SocketProvider")
    }
    return socket
}