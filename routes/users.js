import express from "express";
import prisma from "../services/prisma.js";

const usersRouter = express.Router();


usersRouter.get("/", async (req, res) => {
    const {userId} = req.clerk;
    const users = await prisma.user.findMany({
        where: {
            clerkId: {
                not: userId
            }
        }
    });
    res.json({ message: "Users fetched successfully", users });
})
export default usersRouter;
