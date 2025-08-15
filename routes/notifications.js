import express from "express";
import prisma from "../services/prisma.js";

const notificationsRouter = express.Router();

notificationsRouter.post("/", async (req, res) => {
  const { userId } = req.clerk;
  const { conversationId, messageId } = req.body;
  const notification = await prisma.notifications.create({
    data: {
      clerkId: userId,
      conversationId,
      messageId: messageId,
      isRead: "UNREAD",
    },
  });
  res.json({ message: "Notification created successfully", notification });
});

notificationsRouter.get("/", async (req, res) => {
  try {
    const { userId } = req.clerk;
  const notifications = await prisma.notifications.findMany({
    where:{
      conversation:{
        users:{
          some:{
            clerkId: userId
          }
        }
      },
      senderId: {
        not: userId
      }
    },
    include:{
      conversation: {
        include:{
          users: true
        }
      },
      message:true
    },
    orderBy:{
      createdAt:"desc"
    }
  });
  res.json({ message: "Notifications fetched successfully", notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }  
});

notificationsRouter.put("/", async (req, res) => {
  const { isOpened, ids } = req.body;
  if(!isOpened || !ids){
    return res.status(400).json({ error: "isOpened and ids are required" });
  }

  try {
    const notification = await prisma.notifications.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        isOpened: isOpened !== undefined ? isOpened : true,
      },
    });
    res.json({ message: "Notification updated successfully", notification });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default notificationsRouter;
