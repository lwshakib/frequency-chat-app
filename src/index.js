import { requireAuth } from "@clerk/express";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { authMiddleware } from "./middlewares/auth.middlewares.js";
import router from "./routes/index.js";
import { gracefulShutdown, startMessageConsumer } from "./services/kafka.js";
import SocketService from "./services/socket.js";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://*.clerk.dev",
      ],
      scriptSrcElem: [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://*.clerk.dev",
      ],
      connectSrc: [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://*.clerk.dev",
      ],
      frameSrc: [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://*.clerk.dev",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://*.clerk.dev",
        "*",
      ],
    },
  })
);

const httpServer = http.createServer(app);
const socketService = new SocketService();

// Start Kafka consumer with error handling
startMessageConsumer().catch((error) => {
  console.error("Failed to start Kafka consumer:", error);
  console.log("Application will continue without Kafka consumer");
});

socketService.io.attach(httpServer);
socketService.initListeners();

app.use("/api", requireAuth({ signInUrl: "/" }), authMiddleware, router);

httpServer.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

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
