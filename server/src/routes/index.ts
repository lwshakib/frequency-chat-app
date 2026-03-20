import express from "express";
import cloudinarySignatureRouter from "./cloudinary.routes";
import conversationsRouter from "./conversations.routes";
import messageRouter from "./messages.routes";
import usersRouter from "./users.routes";
import callsRouter from "./calls.routes";
import notificationsRouter from "./notifications.routes";
const router = express.Router();

router.use("/messages", messageRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/cloudinary-signature", cloudinarySignatureRouter);
router.use("/calls", callsRouter);
router.use("/notifications", notificationsRouter);

export default router;
