import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./services/auth.services";
import routes from "./routes";
import { WEB_URL } from "./env";
import { errorHandler } from "./middlewares/error.middlewares";
import morganMiddleware from "./logger/morgan.logger";
import {
  gracefulShutdown,
  startMessageConsumer,
  startPresenceConsumer,
  createTopics,
} from "./services/kafka.services";
import SocketService from "./services/socket.services";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: WEB_URL || "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(helmet());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.send("API is healthy");
});

app.use("/api", routes);

const httpServer = http.createServer(app);
const socketService = new SocketService();

// Initialize Kafka topics and consumers
async function initializeKafka() {
  try {
    // Create topics first
    await createTopics();

    // Then start consumers
    await startMessageConsumer();
    await startPresenceConsumer();

    console.log("Kafka initialization completed successfully");
  } catch (error) {
    console.error("Failed to initialize Kafka:", error);
    console.log("Application will continue without Kafka");
  }
}

// Start Kafka initialization (non-blocking)
initializeKafka();

socketService.io.attach(httpServer);
socketService.initListeners();

app.use(morganMiddleware);
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Gracefully shutting down...");
  await gracefulShutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Gracefully shutting down...");
  await gracefulShutdown();
  process.exit(0);
});

export default httpServer;
