import prisma from "../services/prisma.js";

export const getConversations = async (req, res) => {
  const { userId } = req.clerk;
  const { search } = req.query;

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

  if (!ids || !type) {
    console.log("Invalid request - missing ids or type");
    return res.json({ message: "Invalid request" });
  }
  if (type !== "single" && type !== "group") {
    console.log("Invalid conversation type:", type);
    return res.json({ message: "Invalid conversation type" });
  }
  if (type === "single" && ids.length > 2) {
    console.log("Invalid number of users for single conversation:", ids.length);
    return res.json({ message: "Invalid number of users" });
  }

  if (type === "single") {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: type.toUpperCase(),
        users: {
          every: {
            clerkId: {
              in: ids,
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

    console.log("Creating new single conversation...");
    // Create new single conversation if none exists
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: ids.map((id) => ({ clerkId: id })),
        },
        type: type.toUpperCase(),
        name: name,
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
          connect: ids.map((id) => ({ clerkId: id })),
        },
        type: type.toUpperCase(),
        name: name,
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
