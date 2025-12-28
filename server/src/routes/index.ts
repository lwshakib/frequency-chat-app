import express from "express";
import cloudinarySignatureRouter from "./cloudinary.routes";
import conversationsRouter from "./conversations.routes";
import messageRouter from "./messages.routes";
import usersRouter from "./users.routes";
const router = express.Router();

router.use("/messages", messageRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/cloudinary-signature", cloudinarySignatureRouter);

export default router;
