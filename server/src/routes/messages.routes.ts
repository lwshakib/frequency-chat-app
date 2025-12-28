import express from "express";
import {
  createMessage,
  getMessages,
  updateMessages,
} from "../controllers/messages.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const messagesRouter = express.Router();

messagesRouter.use(requireAuth);

messagesRouter.post("/:conversationId", createMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.put("/", updateMessages);

export default messagesRouter;
