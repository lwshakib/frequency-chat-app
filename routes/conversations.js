import express from "express";
import prisma from "../services/prisma.js";

const conversationsRouter = express.Router();

conversationsRouter.get("/", async (req, res) => {
  const { userId } = req.clerk;
  const { search } = req.query;

  let whereClause = {
    users: {
      some: {
        clerkId: userId,
      },
    },
  };

  // Add search functionality
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
});

conversationsRouter.post("/", async (req, res) => {
  const { ids, type, name } = req.body;
  const { userId } = req.clerk;

  if (!ids || !type) {
    return res.json({ message: "Invalid request" });
  }
  if (type !== "single" && type !== "group") {
    return res.json({ message: "Invalid conversation type" });
  }
  if (type === "single" && ids.length > 2) {
    return res.json({ message: "Invalid number of users" });
  }
  ids.push(userId);

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
      return res.json({
        message: "Conversation already exists",
        data: existingConversation,
      });
    }
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
});

conversationsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.clerk;

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Check if conversation exists and user is part of it
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

    // Delete the conversation
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
});

export default conversationsRouter;
