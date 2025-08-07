import express from "express";
import prisma from "../services/prisma.js"; // Adjust the import based on your project structure
const messagesRouter = express.Router();

messagesRouter.post("/:conversationId", async (req, res) => {
  const { content, type } = req.body;
  const { conversationId } = req.params;
  const { userId } = req.clerk;
  if (!content || !conversationId || !userId || !type) {
    return res.status(400).json({ error: "Message content is required" });
  }

  console.log(userId, conversationId, content, type);
  
  // Here you would typically save the message to your database
  const newMessage = await prisma.message.create({
    data: {
      content,
      type,
      conversationId,
      senderId: userId
    },
  });

  console.log(newMessage);

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessage: content,
    },
  });

  // create notification
  const notification = await prisma.notifications.create({
    data: {
      messageId: newMessage.id,
      conversationId: conversationId,
      senderId: userId,
    },
  });

  console.log(notification);

  // Respond with the received message
  res.status(201).json({ message: "Message received", data: newMessage });
});

messagesRouter.get("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  res.json({ message: "Messages fetched successfully", messages });
});

messagesRouter.put("/", async (req, res) => {
  const { messageIds, isRead } = req.body;

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ error: "Message IDs array is required" });
  }

  try {
    const updatedMessages = await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
      },
      data: {
        isRead: isRead !== undefined ? isRead : "READ",
      },
    });

    res.json({
      message: "Messages marked as read successfully",
      updatedMessages,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default messagesRouter;
