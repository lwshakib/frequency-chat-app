import type { Request, Response } from "express";
import {
  CreateConversationSchema,
  CONVERSATION_TYPE,
} from "../schemas/conversations.schemas.js";
import { prisma } from "../services/prisma.services";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getConversations = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUserId = req.user.id;
    const { search } = req.query as {
      search?: string;
    };

    let whereClause: any = {
      users: {
        some: {
          id: currentUserId,
        },
      },
    };

    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause = {
        ...whereClause,
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            users: {
              some: {
                AND: [
                  {
                    id: {
                      not: currentUserId,
                    },
                  },
                  {
                    OR: [
                      {
                        name: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                      {
                        email: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        type: true,
        lastMessageId: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            isOnline: true,
            lastOnlineAt: true,
          },
        },
        admins: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lastMessage: {
          select: { content: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Fetch unread counts for all these conversations for the current user in one go
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: {
          in: conversations.map((c) => c.id),
        },
        senderId: {
          not: currentUserId,
        },
        isRead: "UNREAD",
      },
      _count: {
        _all: true,
      },
    });

    // Create a map for easy lookup
    const unreadMap: Record<string, number> = {};
    unreadCounts.forEach((uc) => {
      unreadMap[uc.conversationId] = uc._count._all;
    });

    // Minimal transform: keep lastMessage as object (content only), flatten admin.user, and add unreadCount
    const shaped = conversations.map((c) => ({
      ...c,
      admins: c.admins.map((a: any) => ({
        id: a.user.id,
        name: a.user.name,
      })),
      unreadCount: unreadMap[c.id] || 0,
    }));

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { conversations: shaped },
          "Conversations fetched successfully"
        )
      );
  }
);

export const getConversationById = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUserId = req.user.id;
    const { id: conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, users: { some: { id: currentUserId } } },
      include: {
        users: true,
        lastMessage: true,
        admins: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        senderId: { not: currentUserId },
        isRead: "UNREAD",
      },
    });

    // Transform the conversation data to match the expected structure
    const transformedConversation = {
      ...conversation,
      lastMessage: conversation.lastMessage
        ? conversation.lastMessage.content
        : null,
      admins: conversation.admins.map((admin: any) => ({
        id: admin.user.id,
        name: admin.user.name,
      })),
      unreadCount,
    };

    res
      .status(200)
      .json(new ApiResponse(200, { conversation: transformedConversation }));
  }
);

export const createConversation = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUserId = req.user.id;
    const { ids, type, name, description, imageUrl } = req.body;

    // Validate request body using Zod schema
    const validationResult = CreateConversationSchema.safeParse({
      ids,
      type,
      name,
      description,
      imageUrl,
      adminId: currentUserId,
    });

    if (!validationResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        validationResult.error.issues
      );
    }

    const validatedData = validationResult.data;
    const {
      ids: validatedIds,
      type: validatedType,
      name: validatedName,
      description: validatedDescription,
      imageUrl: validatedImageUrl,
    } = validatedData;

    if (validatedType === CONVERSATION_TYPE.ONE_TO_ONE) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: validatedType,
          users: {
            every: {
              id: {
                in: validatedIds,
              },
            },
          },
        },
        include: {
          lastMessage: {
            select: { content: true },
          },
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              isOnline: true,
              lastOnlineAt: true,
            },
          },
          admins: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        // Transform consistent with index
        const shaped = {
          ...existingConversation,
          admins: existingConversation.admins.map((a: any) => ({
            id: a.user.id,
            name: a.user.name,
          })),
        };

        res
          .status(200)
          .json(new ApiResponse(200, shaped, "Conversation already exists"));
        return;
      }

      // Create new one-to-one conversation if none exists
      const newConversation: any = await prisma.conversation.create({
        data: {
          users: {
            connect: validatedIds.map((userId) => ({ id: userId })),
          },
          type: validatedType,
          name: validatedName,
          imageUrl: validatedImageUrl ?? null,
        },
        include: {
          lastMessage: {
            select: { content: true },
          },
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              isOnline: true,
              lastOnlineAt: true,
            },
          },
          admins: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const shapedNew = {
        ...newConversation,
        admins: newConversation.admins.map((a: any) => ({
          id: a.user.id,
          name: a.user.name,
        })),
      };

      res
        .status(201)
        .json(
          new ApiResponse(201, shapedNew, "Conversation created successfully")
        );
    } else {
      const newConversation = await prisma.conversation.create({
        data: {
          users: {
            connect: validatedIds.map((userId) => ({ id: userId })),
          },
          type: validatedType,
          name: validatedName,
          description: validatedDescription,
          imageUrl: validatedImageUrl ?? null,
          admins: {
            create: {
              userId: currentUserId,
            },
          },
        },
        include: {
          lastMessage: {
            select: { content: true },
          },
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              isOnline: true,
              lastOnlineAt: true,
            },
          },
          admins: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const shaped = {
        ...newConversation,
        admins: newConversation.admins.map((a: any) => ({
          id: a.user.id,
          name: a.user.name,
        })),
      };

      res
        .status(201)
        .json(
          new ApiResponse(201, shaped, "Conversation created successfully")
        );
    }
  }
);

export const deleteConversation = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUserId = req.user.id;
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Conversation ID is required");
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        users: {
          some: {
            id: currentUserId,
          },
        },
      },
      include: {
        users: true,
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found or access denied");
    }

    await prisma.conversation.delete({
      where: {
        id: id,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Conversation deleted successfully"));
  }
);

// Update group details (admins only)
export const updateConversation = asyncHandler(
  async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUserId = req.user.id;
    const { id } = req.params;
    const {
      name,
      description,
      imageUrl,
      addMemberIds = [],
      removeMemberIds = [],
      addAdminIds = [],
      removeAdminIds = [],
    } = req.body;

    if (!id) {
      throw new ApiError(400, "Conversation ID is required");
    }

    // Ensure conversation exists and requester is a member
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        users: true,
        admins: { include: { user: true } },
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const requesterIsMember = conversation.users.some(
      (u) => u.id === currentUserId
    );
    if (!requesterIsMember) {
      throw new ApiError(403, "Not a conversation member");
    }

    const requesterIsAdmin = conversation.admins.some(
      (a) => a.user.id === currentUserId
    );
    if (!requesterIsAdmin) {
      throw new ApiError(403, "Only admins can update group");
    }

    // Prepare nested updates
    const data: any = {};
    if (typeof name === "string") data.name = name;
    if (typeof description === "string") data.description = description;
    if (typeof imageUrl === "string") data.imageUrl = imageUrl;

    if (addMemberIds.length || removeMemberIds.length) {
      data.users = {
        ...(addMemberIds.length
          ? { connect: addMemberIds.map((userId: string) => ({ id: userId })) }
          : {}),
        ...(removeMemberIds.length
          ? {
              disconnect: removeMemberIds.map((userId: string) => ({
                id: userId,
              })),
            }
          : {}),
      };
    }

    // Admins are managed via junction table ConversationAdmin
    // Prevent leaving the conversation with zero admins
    const currentAdminIds = new Set(conversation.admins.map((a) => a.user.id));
    const nextAdminIds = new Set(currentAdminIds);
    for (const addId of addAdminIds) nextAdminIds.add(addId);
    for (const remId of removeAdminIds) nextAdminIds.delete(remId);
    if (nextAdminIds.size === 0) {
      throw new ApiError(400, "At least one admin is required for a group.");
    }

    const adminOps = [];
    for (const addId of addAdminIds) {
      adminOps.push(
        prisma.conversationAdmin.upsert({
          where: {
            userId_conversationId: { userId: addId, conversationId: id },
          },
          update: {},
          create: { userId: addId, conversationId: id },
        })
      );
    }
    for (const remId of removeAdminIds) {
      adminOps.push(
        prisma.conversationAdmin.deleteMany({
          where: { userId: remId, conversationId: id },
        })
      );
    }

    // Apply conversation updates (name/description/image/users)
    const updatedConversation = Object.keys(data).length
      ? await prisma.conversation.update({
          where: { id },
          data,
          include: {
            users: true,
            lastMessage: true,
            admins: { include: { user: true } },
          },
        })
      : await prisma.conversation.findUniqueOrThrow({
          // using findUniqueOrThrow since we know it exists, or just findUnique and ! check
          where: { id },
          include: {
            users: true,
            lastMessage: true,
            admins: { include: { user: true } },
          },
        });

    if (adminOps.length) {
      await prisma.$transaction(adminOps);
    }

    // Return transformed structure consistent with other endpoints
    const transformed = {
      ...updatedConversation,
      lastMessage: updatedConversation.lastMessage
        ? updatedConversation.lastMessage.content
        : null,
      admins: updatedConversation.admins.map((a: any) => ({
        id: a.user.id,
        name: a.user.name,
      })),
    };

    res
      .status(200)
      .json(
        new ApiResponse(200, { data: transformed }, "Conversation updated")
      );
  }
);
