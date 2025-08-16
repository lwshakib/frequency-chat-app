import { Server } from "socket.io";

class SocketService {
  _io;
  constructor() {
    this._io = new Server({
      cors: {
        origin: "*",
        allowedHeaders: ["*"],
      },
    });
  }

  initListeners() {
    const io = this.io;

    io.on("connection", (socket) => {
      socket.on("join:server", (id) => {
        socket.join(id);
      });

      socket.on("room:join", (data) => {
        // Room join logic
      });

      socket.on("room:leave", (data) => {
        // Room leave logic
      });

      socket.on("typing:start", ({ data }) => {
        // Handle both regular and temporary conversations
        const users = data.conversation?.users || data.users || [];
        if (users.length > 0) {
          socket
            .in(users.map((user) => user.clerkId))
            .emit("typing:start", data);
        }
      });

      socket.on("typing:end", ({ data }) => {
        // Handle both regular and temporary conversations
        const users = data.conversation?.users || data.users || [];
        if (users.length > 0) {
          socket.in(users.map((user) => user.clerkId)).emit("typing:end", data);
        }
      });

      socket.on("create:group", ({ data }) => {
        socket
          .in(data.users.map((user) => user.clerkId))
          .emit("create:group", data);
      });

      socket.on("remove:group", ({ data }) => {
        // Emit to all group members to remove the group from their UI
        data.users.forEach((user) => {
          socket.in(user.clerkId).emit("remove:group", data);
        });
      });

      socket.on("event:message", async ({ data }) => {
        // Handle both regular and temporary conversations
        const users = data.conversation?.users || data.users || [];
        if (users.length > 0) {
          users.forEach((user) => {
            socket.in(user.clerkId).emit("message", data);
          });
        }
      });

      socket.on("disconnect", () => {
        // Client disconnected
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
