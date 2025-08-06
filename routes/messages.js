import express from "express";
import prisma from "../services/prisma.js"; // Adjust the import based on your project structure
const messagesRouter = express.Router();

messagesRouter.post("/:conversationId", async(req, res) => {
    const { content, type } = req.body;
    const {conversationId} = req.params;
    const {userId} = req.clerk;
    if (!content) {
        return res.status(400).json({ error: "Message content is required" });
    }

    // Here you would typically save the message to your database
    const newMessage = await prisma.message.create({
        data:{
            content,
            type,
            conversationId,
            senderId:userId,
        }
    });
   
    // Respond with the received message
    res.status(201).json({ message: "Message received", data: newMessage });
});


messagesRouter.get("/:conversationId", async(req, res) => {
    const {conversationId} = req.params;
    const messages = await prisma.message.findMany({
        where:{
            conversationId,
        },
        include:{
            sender:true,
        },
        orderBy:{
            createdAt:"asc",
        }
    });
    res.json({ message: "Messages fetched successfully", messages });
})

export default messagesRouter;
