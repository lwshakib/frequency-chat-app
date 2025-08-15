import {
    clerkMiddleware,
    requireAuth,
    getAuth,
    clerkClient,
  } from '@clerk/express';
  import prisma from '../services/prisma.js';
  
  export const authMiddleware = [
    clerkMiddleware(),
    requireAuth(),
    async (req, res, next) => {
      const { userId, sessionId } = getAuth(req);
      const clerkUser = await clerkClient.users.getUser(userId);
  
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      const name = clerkUser.fullName ?? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();
      const imageUrl = clerkUser.imageUrl;
  
      const user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
          email,
          name,
          imageUrl,
        },
        create: {
          clerkId: userId,
          email,
          name,
          imageUrl,
        },
      });
  
      req.clerk = { userId, sessionId, email, name, imageUrl, user };
      next();
    },
  ];
  