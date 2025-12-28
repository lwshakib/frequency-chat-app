import express from "express";
import {
  createMessage,
  getMessages,
  updateMessages,
  markAllAsRead,
  searchMessages,
} from "../controllers/messages.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const messagesRouter = express.Router();

messagesRouter.use(requireAuth);

messagesRouter.post("/:conversationId", createMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.get("/search/:conversationId", searchMessages);
messagesRouter.put("/read/:conversationId", markAllAsRead);
messagesRouter.put("/", updateMessages);

export default messagesRouter;
