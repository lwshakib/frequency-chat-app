import Redis from "ioredis";
import { Server } from "socket.io";
import { produceMessage, produceUserPresence } from "./kafka.js";

const pub = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "0"),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

const sub = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "0"),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

class SocketService {
  _io;
  constructor() {
    this._io = new Server({
      cors: {
        origin: "*",
        allowedHeaders: ["*"],
      },
    });

    sub.subscribe("MESSAGES");
  }

  initListeners() {
    const io = this.io;
    io.on("connection", (socket) => {
      console.log("A user connected with id : ", socket.id);
      socket.on("join:server", async (id) => {
        if (!id) return;
        socket.join(id);
        // store clerkId on the socket for later (e.g., on disconnect)
        socket.data.clerkId = id;
        console.log("A user joined the server with id : ", socket.id);
        try {
          const ts = new Date().toISOString();
          await produceUserPresence({
            clerkId: id,
            isOnline: true,
            lastOnlineAt: ts,
          });
          io.emit("presence:update", {
            clerkId: id,
            isOnline: true,
            lastOnlineAt: ts,
          });
        } catch (e) {
          console.error("Failed to produce presence (join)", e);
        }
      });

      socket.on("event:message", async (data) => {
        await pub.publish("MESSAGES", JSON.stringify(data));
      });

      socket.on("create:group", (data) => {
        io.to(data.users.map((user) => user.clerkId)).emit(
          "create:group",
          data
        );
      });

      socket.on("delete:conversation", (payload) => {
        try {
          const { conversationId, memberIds } = payload || {};
          if (!conversationId || !Array.isArray(memberIds)) return;
          io.to(memberIds).emit("delete:conversation", { conversationId });
        } catch {}
      });

      socket.on("call:user", (payload) => {
        try {
          const { event, calledBy, conversation } = payload || {};
          if (!event || !calledBy || !conversation) return;
          const recipientIds = conversation.users
            .map((user) => user.clerkId)
            .filter((id) => id !== calledBy.clerkId);
          if (recipientIds.length === 0) return;
          io.to(recipientIds).emit("call:user", {
            event,
            calledBy,
            conversation,
          });
        } catch {}
      });

      socket.on("call:accept", (payload) => {
        try {
          const { conversationId, acceptedBy, toClerkId } = payload || {};
          if (!conversationId || !acceptedBy || !toClerkId) return;
          io.to(toClerkId).emit("call:accept", { conversationId, acceptedBy });
        } catch {}
      });

      socket.on("call:cancel", (payload) => {
        try {
          const { conversationId, cancelledBy, toClerkIds } = payload || {};
          if (!conversationId || !cancelledBy || !Array.isArray(toClerkIds))
            return;
          io.to(toClerkIds).emit("call:cancel", {
            conversationId,
            cancelledBy,
          });
        } catch {}
      });

      socket.on("call:ringing", (payload) => {
        try {
          const { conversationId, ringingBy, toClerkId } = payload || {};
          if (!conversationId || !ringingBy || !toClerkId) return;
          io.to(toClerkId).emit("call:ringing", { conversationId, ringingBy });
        } catch {}
      });

      // Typing indicators
      socket.on("typing:start", (payload) => {
        try {
          const { conversationId, fromClerkId, toClerkIds } = payload || {};
          if (!conversationId || !fromClerkId || !Array.isArray(toClerkIds))
            return;
          io.to(toClerkIds).emit("typing:start", {
            conversationId,
            fromClerkId,
          });
        } catch {}
      });
      socket.on("typing:stop", (payload) => {
        try {
          const { conversationId, fromClerkId, toClerkIds } = payload || {};
          if (!conversationId || !fromClerkId || !Array.isArray(toClerkIds))
            return;
          io.to(toClerkIds).emit("typing:stop", {
            conversationId,
            fromClerkId,
          });
        } catch {}
      });

      socket.on("disconnect", async () => {
        const clerkId = socket.data?.clerkId;
        console.log("A user disconnected", { socketId: socket.id, clerkId });
        if (!clerkId) return;
        try {
          const ts = new Date().toISOString();
          await produceUserPresence({
            clerkId,
            isOnline: false,
            lastOnlineAt: ts,
          });
          io.emit("presence:update", {
            clerkId,
            isOnline: false,
            lastOnlineAt: ts,
          });
        } catch (e) {
          console.error("Failed to produce presence (disconnect)", e);
        }
      });
    });
    sub.on("message", async (channel, data) => {
      if (channel === "MESSAGES") {
        const data2 = JSON.parse(data);
        const users = data2.conversation?.users;

        if (users.length > 0) {
          users.forEach((user) => {
            console.log("Sending message to user : ", user.clerkId);
            io.to(user.clerkId).emit("message", data2.message);
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
