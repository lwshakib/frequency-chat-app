import { Server } from "socket.io";
import Redis from "ioredis";
import { produceMessage } from "./kafka.js";


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
      socket.on("join:server", (id) => {
        socket.join(id);
        console.log("A user joined the server with id : ", socket.id);
      });

      socket.on("event:message", async (data) => {
        console.log("A user sent a message with id : ", socket.id);
        await pub.publish("MESSAGES", JSON.stringify(data));
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected with id : ", socket.id);
      });
    });
    sub.on("message",async(channel, data) => {
      if(channel === "MESSAGES") {
        const data2 = JSON.parse(data);
        const users = data2.conversation?.users;

        if (users.length > 0) {
          users.forEach((user) => {
            io.to(user.clerkId).emit("message", data2.message);
          });
        }
        await produceMessage(JSON.stringify({message: data2.message}))
      }
    });
  }

  get io() {
    return this._io;
  }
}


export default SocketService;