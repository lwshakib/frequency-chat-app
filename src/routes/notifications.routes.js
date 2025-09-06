import express from "express";
import {
  createNotification,
  getNotifications,
  updateNotifications,
} from "../controllers/notifications.controllers.js";

const notificationsRouter = express.Router();

notificationsRouter.post("/", createNotification);
notificationsRouter.get("/", getNotifications);
notificationsRouter.put("/", updateNotifications);

export default notificationsRouter;