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
      users: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  res.json({ message: "Conversations fetched successfully", conversations });
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
      },
      include: {
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
      },
      include: {
        users: true,
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
