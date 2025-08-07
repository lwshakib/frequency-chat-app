import express from "express";
import messageRouter from "./messages.js";
import usersRouter from "./users.js";
import conversationsRouter from "./conversations.js";
import notificationsRouter from "./notifications.js";
const router = express.Router();

router.use("/messages", messageRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/notifications", notificationsRouter);

export default router;