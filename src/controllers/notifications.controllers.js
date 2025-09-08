import prisma from "../services/prisma.js";

export const createNotification = async (req, res) => {
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
};

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.clerk;
    const notifications = await prisma.notifications.findMany({
      where: {
        conversation: {
          users: {
            some: {
              clerkId: userId,
            },
          },
        },
        senderId: {
          not: userId,
        },
      },
      include: {
        conversation: {
          include: {
            users: true,
          },
        },
        message: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({ message: "Notifications fetched successfully", notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const updateNotifications = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    await prisma.notifications.updateMany({
      where: {
        senderId: userId,
        isOpened: false,
      },
      data: {
        isOpened: true,
      },
    });

    await prisma.message.updateMany({
      where: {
        
        isRead: "UNREAD",
      },
      data: {
        isRead: "READ",
      },
    });

    res.json({ message: "Notification updated successfully", notification });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};