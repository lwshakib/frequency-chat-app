import express from "express";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
  updateConversation,
} from "../controllers/conversations.controllers.js";

const conversationsRouter = express.Router();

conversationsRouter.get("/", getConversations);
conversationsRouter.get("/:id/:userId", getConversationById);
conversationsRouter.post("/", createConversation);
conversationsRouter.put("/:id", updateConversation);
conversationsRouter.delete("/:id", deleteConversation);

export default conversationsRouter;
