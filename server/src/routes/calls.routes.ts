import express from "express";
import { getCallLogs } from "../controllers/calls.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.get("/", requireAuth, getCallLogs);

export default router;
