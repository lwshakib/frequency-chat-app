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

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          clerkId: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    return res
      .status(403)
      .json({ error: "Not authorized to access this conversation" });
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
    include: {
      sender: true,
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessageId: newMessage.id,
    },
  });

  res.status(201).json({ message: "Message received", data: newMessage });
};

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.clerk;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          clerkId: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    return res
      .status(403)
      .json({ error: "Not authorized to access this conversation" });
  }

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

const READ_STATUSES = ["UNREAD", "READ", "SENT"];

export const updateMessages = async (req, res) => {
  const { messageIds, isRead } = req.body;
  const { userId } = req.clerk;

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ error: "Message IDs array is required" });
  }

  let statusToSet = "READ";
  if (isRead !== undefined) {
    statusToSet = String(isRead).toUpperCase();
    if (!READ_STATUSES.includes(statusToSet)) {
      return res.status(400).json({
        error: `Invalid isRead value. Allowed values are ${READ_STATUSES.join(
          ", "
        )}`,
      });
    }
  }

  try {
    const updatedMessages = await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
        conversation: {
          users: {
            some: {
              clerkId: userId,
            },
          },
        },
      },
      data: {
        isRead: statusToSet,
      },
    });

    if (updatedMessages.count === 0) {
      return res.status(404).json({
        error:
          "No messages were updated. Ensure you have access to the target messages.",
      });
    }

    res.json({
      message: "Messages updated successfully",
      updatedMessages,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
