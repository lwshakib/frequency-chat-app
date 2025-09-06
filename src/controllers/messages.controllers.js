import prisma from "../services/prisma.js";

export const createMessage = async (req, res) => {
  const { content, type, files, audio } = req.body;
  const { conversationId } = req.params;
  const { userId } = req.clerk;
  if (!conversationId || !userId || !type) {
    return res
      .status(400)
      .json({ error: "Message type and conversation are required" });
  }

  let allFiles = files || [];
  if (audio) {
    allFiles.push(audio);
  }

  const newMessage = await prisma.message.create({
    data: {
      content: content || "",
      type,
      files: allFiles,
      conversationId,
      senderId: userId,
    },
    include:{
      sender: true
    }
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessageId: newMessage.id
    },
  });

  const notification = await prisma.notifications.create({
    data: {
      messageId: newMessage.id,
      conversationId: conversationId,
      senderId: userId,
    },
  });

  res.status(201).json({ message: "Message received", data: newMessage });
};

export const getMessages = async (req, res) => {
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
};

export const updateMessages = async (req, res) => {
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
};