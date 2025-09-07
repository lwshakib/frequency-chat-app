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
    include: {
      lastMessage: true,
      users: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Transform conversations to include only the other user for one-to-one conversations
  const transformedConversations = conversations.map((conversation) => {
    const { createdAt, ...conversationWithoutCreatedAt } = conversation;
    const transformedConversation = {
      ...conversationWithoutCreatedAt,
      lastMessage: conversation.lastMessage
        ? conversation.lastMessage.content
        : null,
    };

    if (conversation.type === "ONE_TO_ONE") {
      // For one-to-one conversations, include only the other user with clerkId and name
      const otherUser = conversation.users.find(
        (user) => user.clerkId !== userId
      );
      return {
        ...transformedConversation,
        users: otherUser
          ? [{ clerkId: otherUser.clerkId, name: otherUser.name }]
          : [],
      };
    }
    // For group conversations, include all users with only clerkId
    return {
      ...transformedConversation,
      users: conversation.users.map((user) => ({ clerkId: user.clerkId })),
    };
  });

  res.json({
    message: "Conversations fetched successfully",
    conversations: transformedConversations,
  });
};

export const getConversationById = async (req, res) => {
  const { id, userId } = req.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id, users: { some: { clerkId: userId } } },
    include: {
      users: true,
      lastMessage: true,
    },
  });
  res.json({ conversation });
};

export const createConversation = async (req, res) => {
  const { ids, type, name } = req.body;

  // Validate request body using Zod schema
  const validationResult = CreateConversationSchema.safeParse({
    ids,
    type,
    name,
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
      },
      include: {
        lastMessage: true,
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
      },
      include: {
        lastMessage: true,
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
