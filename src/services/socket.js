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
      console.log("A user connected with id : ", socket.id);
      socket.on("join:server", (id) => {
        socket.join(id);
        console.log("A user joined the server with id : ", socket.id);
      });

      socket.on("event:message", (data) => {
        console.log("A user sent a message with id : ", socket.id);
        const users = data.conversation?.users || data.users || [];
        if (users.length > 0) {
          users.forEach((user) => {
            io.to(user.clerkId).emit("message", data.message);
          });
        }
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected with id : ", socket.id);
      });
    });
  }

  get io() {
    return this._io;
  }
}


export default SocketService;