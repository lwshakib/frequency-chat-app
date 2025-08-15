import express from "express";
import prisma from "../services/prisma.js";

const usersRouter = express.Router();

usersRouter.get("/", async (req, res) => {
  const { userId } = req.clerk;
  const { search } = req.query;

  let whereClause = {
    clerkId: {
      not: userId,
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
          email: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: {
      name: "asc",
    },
  });
  res.json({ message: "Users fetched successfully", users });
});

export default usersRouter;
