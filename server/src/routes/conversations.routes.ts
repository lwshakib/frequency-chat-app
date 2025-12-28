import express from "express";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
  updateConversation,
} from "../controllers/conversations.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const conversationsRouter = express.Router();

conversationsRouter.use(requireAuth);

conversationsRouter.get("/", getConversations);
conversationsRouter.get("/:id/:userId", getConversationById);
conversationsRouter.post("/", createConversation);
conversationsRouter.put("/:id", updateConversation);
conversationsRouter.delete("/:id", deleteConversation);

export default conversationsRouter;
