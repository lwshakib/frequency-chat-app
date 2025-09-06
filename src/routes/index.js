import express from "express";
import messageRouter from "./messages.routes.js";
import usersRouter from "./users.routes.js";
import conversationsRouter from "./conversations.routes.js";
import notificationsRouter from "./notifications.routes.js";
import cloudinarySignatureRouter from "./cloudinary.routes.js";
const router = express.Router();

router.use("/messages", messageRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/cloudinary-signature", cloudinarySignatureRouter);

export default router;