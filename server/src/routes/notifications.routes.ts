import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.controllers";

const router = express.Router();

router.get("/:userId", getNotifications);
router.put("/:notificationId/read", markAsRead);
router.put("/user/:userId/read-all", markAllAsRead);

export default router;
