import express from "express";
import {
  createMessage,
  getMessages,
  updateMessages,
  markAllAsRead,
} from "../controllers/messages.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const messagesRouter = express.Router();

messagesRouter.use(requireAuth);

messagesRouter.post("/:conversationId", createMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.put("/read/:conversationId", markAllAsRead);
messagesRouter.put("/", updateMessages);

export default messagesRouter;
