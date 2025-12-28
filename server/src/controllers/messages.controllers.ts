import type { Request, Response } from "express";
import { MESSAGE_READ_STATUS } from "../../generated/prisma/enums";
import { prisma } from "../services/prisma.services";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const createMessage = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { content, type, files, audio } = req.body;
    const { conversationId } = req.params;

    if (!conversationId || !userId || !type) {
      throw new ApiError(400, "Message type and conversation are required");
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ApiError(403, "Not authorized to access this conversation");
    }

    const allFiles = files || [];
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

    res.status(201).json(new ApiResponse(201, newMessage, "Message received"));
  }
);

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  const { conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    throw new ApiError(403, "Not authorized to access this conversation");
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

  res
    .status(200)
    .json(new ApiResponse(200, { messages }, "Messages fetched successfully"));
});

export const updateMessages = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { messageIds, isRead } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      throw new ApiError(400, "Message IDs array is required");
    }

    let statusToSet: MESSAGE_READ_STATUS = MESSAGE_READ_STATUS.READ;
    if (isRead !== undefined) {
      const statusString = String(isRead).toUpperCase();
      if (statusString in MESSAGE_READ_STATUS) {
        statusToSet = statusString as MESSAGE_READ_STATUS;
      } else {
        throw new ApiError(
          400,
          `Invalid isRead value. Allowed values are ${Object.values(
            MESSAGE_READ_STATUS
          ).join(", ")}`
        );
      }
    }

    const updatedMessages = await prisma.message.updateMany({
      where: {
        id: {
          in: messageIds,
        },
        conversation: {
          users: {
            some: {
              id: userId,
            },
          },
        },
      },
      data: {
        isRead: statusToSet,
      },
    });

    if (updatedMessages.count === 0) {
      throw new ApiError(
        404,
        "No messages were updated. Ensure you have access to the target messages."
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedMessages },
          "Messages updated successfully"
        )
      );
  }
);

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!conversationId) {
      throw new ApiError(400, "Conversation ID is required");
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: MESSAGE_READ_STATUS.UNREAD,
      },
      data: {
        isRead: MESSAGE_READ_STATUS.READ,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "All messages marked as read"));
  }
);

export const searchMessages = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { q } = req.query as { q?: string };

    if (!q || !q.trim()) {
      throw new ApiError(400, "Search query is required");
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ApiError(403, "Not authorized to access this conversation");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        content: {
          contains: q,
          mode: "insensitive",
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, { messages }, "Messages searched successfully")
      );
  }
);
