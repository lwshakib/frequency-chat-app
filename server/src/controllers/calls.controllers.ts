import type { Request, Response } from "express";
import { prisma } from "../services/prisma.services";

export const getCallLogs = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const calls = await prisma.call.findMany({
      where: {
        OR: [{ callerId: currentUserId }, { receiverId: currentUserId }],
      },
      include: {
        caller: true,
        receiver: true,
        conversation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(calls);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
