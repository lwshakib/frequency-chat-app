import express from "express";
import messageRouter from "./messages.js";
import usersRouter from "./users.js";
import conversationsRouter from "./conversations.js";
import notificationsRouter from "./notifications.js";
import imagekitAuthRouter from "./imagekit.js";
const router = express.Router();

router.use("/messages", messageRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/imagekit-auth", imagekitAuthRouter);

export default router;