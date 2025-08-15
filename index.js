import express from "express";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import SocketService from "./services/socket.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import router from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { authMiddleware } from "./middlewares/auth.middleware.js";
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
        scriptSrc: ["'self'", "https://fast-cat-32.clerk.accounts.dev"],
        connectSrc: ["'self'", "https://fast-cat-32.clerk.accounts.dev"],
        frameSrc: ["'self'", "https://clerk.accounts.dev"],
        imgSrc: ["'self'", "data:", "https://clerk.accounts.dev", "*"],
      },
    })
  );

const httpServer = http.createServer(app);


const socketService = new SocketService();

socketService.io.attach(httpServer);
socketService.initListeners();

app.use("/api", requireAuth({signInUrl: "/"}), authMiddleware, router);


if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "web", "dist")));

app.get("/*splat", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web", "dist", "index.html"));
});
}else{
    app.get("/", (req, res) => {
        res.send("Hello World!");
    });
}


httpServer.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});