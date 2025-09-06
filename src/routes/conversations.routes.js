import express from "express";
import {
  createConversation,
  deleteConversation,
  getConversations,
} from "../controllers/conversations.controllers.js";

const conversationsRouter = express.Router();

conversationsRouter.get("/", getConversations);
conversationsRouter.post("/", createConversation);
conversationsRouter.delete("/:id", deleteConversation);

export default conversationsRouter;
