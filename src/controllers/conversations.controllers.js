import { CreateConversationSchema } from "../schemas/conversations.schemas.js";
import prisma from "../services/prisma.js";

export const getConversations = async (req, res) => {
  const { search, userId } = req.query;

  let whereClause = {
    users: {
      some: {
        clerkId: userId,
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
                  clerkId: {
                    not: userId,
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
          clerkId: true,
          name: true,
          imageUrl: true,
          isOnline: true,
          lastOnlineAt: true,
        },
      },
      admins: {
        select: {
          user: {
            select: {
              clerkId: true,
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

  // Minimal transform: keep lastMessage as object (content only), and flatten admin.user
  const shaped = conversations.map((c) => ({
    ...c,
    admins: c.admins.map((a) => ({
      clerkId: a.user.clerkId,
      name: a.user.name,
    })),
  }));

  res.json({
    message: "Conversations fetched successfully",
    conversations: shaped,
  });
};

export const getConversationById = async (req, res) => {
  const { id, userId } = req.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id, users: { some: { clerkId: userId } } },
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
    return res.status(404).json({ message: "Conversation not found" });
  }

  // Transform the conversation data to match the expected structure
  const transformedConversation = {
    ...conversation,
    lastMessage: conversation.lastMessage
      ? conversation.lastMessage.content
      : null,
    admins: conversation.admins.map((admin) => ({
      clerkId: admin.user.clerkId,
      name: admin.user.name,
    })),
  };

  res.json({ conversation: transformedConversation });
};

export const createConversation = async (req, res) => {
  const { ids, type, name, description, imageUrl, adminId } = req.body;

  // Validate request body using Zod schema
  const validationResult = CreateConversationSchema.safeParse({
    ids,
    type,
    name,
    description,
    imageUrl,
    adminId,
  });

  if (!validationResult.success) {
    console.log("Validation error:", validationResult.error.errors);
    return res.status(400).json({
      message: "Validation failed",
      errors: validationResult.error.errors,
    });
  }

  const validatedData = validationResult.data;
  const {
    ids: validatedIds,
    type: validatedType,
    name: validatedName,
    description: validatedDescription,
    imageUrl: validatedImageUrl,
  } = validatedData;

  if (validatedType === "one_to_one") {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: validatedType.toUpperCase(),
        users: {
          every: {
            clerkId: {
              in: validatedIds,
            },
          },
        },
      },
      include: {
        lastMessage: true,
        users: true,
      },
    });

    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation.id);
      return res.json({
        message: "Conversation already exists",
        data: existingConversation,
      });
    }

    console.log("Creating new one-to-one conversation...");
    // Create new one-to-one conversation if none exists
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: validatedIds.map((id) => ({ clerkId: id })),
        },
        type: validatedType.toUpperCase(),
        name: validatedName,
        imageUrl: validatedImageUrl ?? null,
      },
      include: {
        lastMessage: true,
        users: true,
      },
    });

    console.log("New conversation created successfully:", newConversation.id);
    res.json({
      message: "Conversation created successfully",
      data: newConversation,
    });
  } else {
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: validatedIds.map((id) => ({ clerkId: id })),
        },
        type: validatedType.toUpperCase(),
        name: validatedName,
        description: validatedDescription,
        imageUrl: validatedImageUrl ?? null,
        admins: {
          create: {
            userId: adminId,
          },
        },
      },
      include: {
        lastMessage: true,
        users: true,
        admins: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({
      message: "Conversation created successfully",
      data: newConversation,
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.clerk;

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        users: {
          some: {
            clerkId: userId,
          },
        },
      },
      include: {
        users: true,
      },
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Conversation not found or access denied" });
    }

    await prisma.conversation.delete({
      where: {
        id: id,
      },
    });

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update group details (admins only)
export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      requesterId,
      name,
      description,
      imageUrl,
      addMemberIds = [],
      removeMemberIds = [],
      addAdminIds = [],
      removeAdminIds = [],
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }
    if (!requesterId) {
      return res.status(400).json({ message: "requesterId is required" });
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
      return res.status(404).json({ message: "Conversation not found" });
    }

    const requesterIsMember = conversation.users.some(
      (u) => u.clerkId === requesterId
    );
    if (!requesterIsMember) {
      return res.status(403).json({ message: "Not a conversation member" });
    }

    const requesterIsAdmin = conversation.admins.some(
      (a) => a.user.clerkId === requesterId
    );
    if (!requesterIsAdmin) {
      return res.status(403).json({ message: "Only admins can update group" });
    }

    // Prepare nested updates
    const data = {};
    if (typeof name === "string") data.name = name;
    if (typeof description === "string") data.description = description;
    if (typeof imageUrl === "string") data.imageUrl = imageUrl;

    if (addMemberIds.length || removeMemberIds.length) {
      data.users = {
        ...(addMemberIds.length
          ? { connect: addMemberIds.map((id) => ({ clerkId: id })) }
          : {}),
        ...(removeMemberIds.length
          ? { disconnect: removeMemberIds.map((id) => ({ clerkId: id })) }
          : {}),
      };
    }

    // Admins are managed via junction table ConversationAdmin
    // Prevent leaving the conversation with zero admins
    const currentAdminIds = new Set(
      conversation.admins.map((a) => a.user.clerkId)
    );
    const nextAdminIds = new Set(currentAdminIds);
    for (const addId of addAdminIds) nextAdminIds.add(addId);
    for (const remId of removeAdminIds) nextAdminIds.delete(remId);
    if (nextAdminIds.size === 0) {
      return res
        .status(400)
        .json({ message: "At least one admin is required for a group." });
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
      : await prisma.conversation.findUnique({
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
      admins: updatedConversation.admins.map((a) => ({
        clerkId: a.user.clerkId,
        name: a.user.name,
      })),
    };

    return res.json({ message: "Conversation updated", data: transformed });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
