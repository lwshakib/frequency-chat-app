import express from "express";
import {
  createMessage,
  getMessages,
  updateMessages,
} from "../controllers/messages.controllers.js";

const messagesRouter = express.Router();

messagesRouter.post("/:conversationId", createMessage);
messagesRouter.get("/:conversationId", getMessages);
messagesRouter.put("/", updateMessages);

export default messagesRouter;