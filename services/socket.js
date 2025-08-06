import { Server } from "socket.io";

class SocketService {
  _io;
  constructor() {
    console.log("Init socket service");

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
      console.log("Client connected", socket.id);

      socket.on("join:server", (id) => {
        console.log("Client joined server", id);
        socket.join(id);
      });

      socket.on("room:join", (data) => {
        console.log("Client joined room", data);
      });

      socket.on("room:leave", (data) => {
        console.log("Client left room", data);
      });

      socket.on("typing:start", ({data}) => {
        console.log("Client started typing");
        socket.in(data.conversation.users.map((user) => user.clerkId)).emit("typing:start", data);
      });

      socket.on("typing:end", ({data}) => {
        console.log("Client stopped typing");
        socket.in(data.conversation.users.map((user) => user.clerkId)).emit("typing:end", data);
      });

      socket.on("create:group", ({data}) => {
        console.log("Client created group", data);
        socket.in(data.users.map((user) => user.clerkId)).emit("create:group", data);
      });

      socket.on("remove:group", ({data}) => {
        console.log("Client removed group", data);
        socket.in(data.users.map((user) => user.clerkId)).emit("remove:group", data);
      });

      socket.on("event:message", async ({data}) => {
        console.log("Message received", data);
        data.conversation.users.forEach((user) => {
          socket.in(user.clerkId).emit("message", data);
        });

        console.log("Message sent to all users", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
