import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { produceMessage, produceUserPresence } from "./kafka.services";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "../env";
import { auth } from "./auth.services";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "./prisma.services";

const pub = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
});

const sub = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
});

class SocketService {
  private _io: Server;
  constructor() {
    this._io = new Server({
      cors: {
        origin: "*",
        allowedHeaders: ["*"],
      },
    });

    // Add authentication middleware
    this._io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(socket.handshake.headers),
        });

        if (!session) {
          return next(new Error("Unauthorized"));
        }

        socket.data.user = session.user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    sub.subscribe("MESSAGES");
  }

  initListeners() {
    const io = this.io;
    io.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      const userId = user.id;

      console.log("A user connected:", { socketId: socket.id, userId });

      // Join personal room
      socket.join(userId);

      // Handle presence update on connection
      const handleConnectionPresence = async () => {
        try {
          const ts = new Date().toISOString();
          await produceUserPresence({
            userId,
            isOnline: true,
            lastOnlineAt: ts,
          });
          io.emit("presence:update", {
            userId,
            isOnline: true,
            lastOnlineAt: ts,
          });
        } catch (e) {
          console.error("Failed to produce presence (join)", e);
        }
      };
      handleConnectionPresence();

      socket.on("event:message", async (data: any) => {
        await pub.publish("MESSAGES", JSON.stringify(data));
      });

      socket.on("join:server", (userId: string) => {
        console.log("User joined server in socket: ", userId);
        socket.join(userId);
      });

      socket.on("delete:conversation", (payload: any) => {
        try {
          const { conversationId, memberIds } = payload || {};
          if (!conversationId || !Array.isArray(memberIds)) return;
          io.to(memberIds).emit("delete:conversation", { conversationId });
        } catch (error) {
          console.error("Error in delete:conversation:", error);
        }
      });

      // Typing indicators
      socket.on("typing:start", (payload: any) => {
        try {
          const { conversationId, fromUserId, toUserIds } = payload || {};
          if (!conversationId || !fromUserId || !Array.isArray(toUserIds))
            return;
          io.to(toUserIds).emit("typing:start", {
            conversationId,
            fromUserId,
          });
        } catch (error) {
          console.error("Error in typing:start:", error);
        }
      });
      socket.on("typing:stop", (payload: any) => {
        try {
          const { conversationId, fromUserId, toUserIds } = payload || {};
          if (!conversationId || !fromUserId || !Array.isArray(toUserIds))
            return;
          io.to(toUserIds).emit("typing:stop", {
            conversationId,
            fromUserId,
          });
        } catch (error) {
          console.error("Error in typing:stop:", error);
        }
      });

      // --- Call Events ---
      socket.on("call:start", async (payload: any) => {
        const { conversationId, type, participants, callerId } = payload;
        // Notify all participants except the caller
        const targets = participants.filter(
          (id: string) => id !== socket.data.user.id
        );
        io.to(targets).emit("call:invite", {
          conversationId,
          type,
          participants,
          callerId,
        });

        // SAVE CALL TO DATABASE
        try {
          const receiverId = participants.find((id: string) => id !== callerId);
          const newCall = await prisma.call.create({
            data: {
              type,
              status: "RINGING",
              conversationId,
              callerId,
              receiverId: receiverId || null,
            },
          });

          // Track active call in Redis for cross-instance duration calculation/status updates
          await pub.set(
            `active_call:${conversationId}`,
            JSON.stringify({
              callId: newCall.id,
              startTime: Date.now(),
              status: "RINGING",
            }),
            "EX",
            3600 // Expire after 1 hour anyway
          );
        } catch (error) {
          console.error("Failed to log call start:", error);
        }
      });

      socket.on("call:ringing", (payload: any) => {
        const { conversationId, callerId } = payload;
        io.to(callerId).emit("call:ringing", { conversationId, calleeId: socket.data.user.id });
      });

      socket.on("call:accept", async (payload: any) => {
        const { conversationId, callerId, calleeId } = payload;
        io.to(callerId).emit("call:accepted", { conversationId, calleeId });

        // UPDATE CALL STATUS TO CONNECTED
        try {
          const callDataRaw = await pub.get(`active_call:${conversationId}`);
          if (callDataRaw) {
            const callData = JSON.parse(callDataRaw);
            await prisma.call.update({
              where: { id: callData.callId },
              data: { status: "CONNECTED", updatedAt: new Date() },
            });

            // Update status in Redis
            callData.status = "CONNECTED";
            callData.startTime = Date.now(); // Reset start time to when connection happened for duration
            await pub.set(
              `active_call:${conversationId}`,
              JSON.stringify(callData),
              "EX",
              3600
            );
          }
        } catch (error) {
          console.error("Failed to update call to CONNECTED:", error);
        }
      });

      socket.on("call:reject", async (payload: any) => {
        const { conversationId, callerId, calleeId } = payload;
        io.to(callerId).emit("call:rejected", { conversationId, calleeId });

        // UPDATE CALL STATUS TO REJECTED
        try {
          const callDataRaw = await pub.get(`active_call:${conversationId}`);
          if (callDataRaw) {
            const callData = JSON.parse(callDataRaw);
            await prisma.call.update({
              where: { id: callData.callId },
              data: { status: "REJECTED" },
            });
            await pub.del(`active_call:${conversationId}`);
          }
        } catch (error) {
          console.error("Failed to update call to REJECTED:", error);
        }
      });

      socket.on("call:hangup", async (payload: any) => {
        const { conversationId, participants, isGroup } = payload;
        if (isGroup) {
          // Just notify others that this specific user left
          const targets = participants.filter(
            (id: string) => id !== socket.data.user.id
          );
          io.to(targets).emit("call:participant-left", {
            conversationId,
            userId: socket.data.user.id,
          });

          // For group calls, we might want to check if everyone left, 
          // but for simplicity, let's just end it if it's the caller or just 1 person left
          // In this basic version, we wrap up the call record when it's ended for the "conversation"
          // In group calls, its harder to define "the" duration if it continues differently
        } else {
          // For 1:1, end the call for everyone
          io.to(participants).emit("call:ended", { conversationId });
        }

        // WRAP UP CALL RECORD
        try {
          const callDataRaw = await pub.get(`active_call:${conversationId}`);
          if (callDataRaw) {
            const callData = JSON.parse(callDataRaw);
            const duration =
              callData.status === "CONNECTED"
                ? Math.floor((Date.now() - callData.startTime) / 1000)
                : 0;
            const finalStatus =
              callData.status === "CONNECTED" ? "COMPLETED" : "MISSED";

            await prisma.call.update({
              where: { id: callData.callId },
              data: {
                status: finalStatus,
                duration: duration || 0,
              },
            });
            await pub.del(`active_call:${conversationId}`);
          }
        } catch (error) {
          console.error("Failed to wrap up call log:", error);
        }
      });

      socket.on("call:signal", (payload: any) => {
        const { signal, toUserId, fromUserId } = payload;
        io.to(toUserId).emit("call:signal", {
          signal,
          fromUserId,
        });
      });

      // WebRTC Signaling: Forwarding offers, answers, and ICE candidates
      socket.on("offer", (payload: any) => {
        const { sdp, toUserId, fromUserId } = payload;
        io.to(toUserId).emit("offer", {
          sdp,
          senderId: fromUserId,
        });
      });

      socket.on("answer", (payload: any) => {
        const { sdp, toUserId, fromUserId } = payload;
        io.to(toUserId).emit("answer", {
          sdp,
          senderId: fromUserId,
        });
      });

      socket.on("ice-candidate", (payload: any) => {
        const { candidate, toUserId, fromUserId } = payload;
        io.to(toUserId).emit("ice-candidate", {
          candidate,
          senderId: fromUserId,
        });
      });

      socket.on("disconnect", async () => {
        console.log("A user disconnected", { socketId: socket.id, userId });
        
        // Notify any possible call participants that this user is gone
        // This is caught by the CallOverlay to close connections
        io.emit("call:participant-left", { userId });

        try {
          const ts = new Date().toISOString();
          await produceUserPresence({
            userId,
            isOnline: false,
            lastOnlineAt: ts,
          });
          io.emit("presence:update", {
            userId,
            isOnline: false,
            lastOnlineAt: ts,
          });
        } catch (e) {
          console.error("Failed to produce presence (disconnect)", e);
        }
      });
    });
    sub.on("message", async (channel: string, data: string) => {
      if (channel === "MESSAGES") {
        const data2 = JSON.parse(data);
        const users = data2.conversation?.users;

        if (users.length > 0) {
          users.forEach((user: any) => {
            console.log("Sending message to user : ", user.id);
            io.to(user.id).emit("message", {
              message: data2.message,
              conversation: data2.conversation,
            });
          });
        }
        await produceMessage(JSON.stringify({ message: data2.message }));
      }
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
