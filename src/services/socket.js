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
    });
  }

  get io() {
    return this._io;
  }
}


export default SocketService;