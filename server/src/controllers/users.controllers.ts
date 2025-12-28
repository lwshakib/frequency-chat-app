import type { Request, Response } from "express";
import { prisma } from "../services/prisma.services";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, userId } = req.query;

  // Build where clause
  const whereClause: Record<string, unknown> = {};

  // Exclude current user from results if userId is provided
  if (userId && typeof userId === "string") {
    whereClause.id = {
      not: userId,
    };
  }

  // Add search filter if provided
  if (search && typeof search === "string" && search.trim()) {
    const searchTerm = search.trim();
    whereClause.OR = [
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
    ];
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isOnline: true,
      lastOnlineAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 20, // Limit results for performance
  });

  res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users fetched successfully"));
});
