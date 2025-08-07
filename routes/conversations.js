import express from "express";
import prisma from "../services/prisma.js";

const conversationsRouter = express.Router();

conversationsRouter.get("/", async (req, res) => {
    const {userId} = req.clerk;
    const conversations = await prisma.conversation.findMany({
        where:{
            users:{
                some:{
                    clerkId: userId,
                }
            }
        },
        include:{
            users:true,
        },
        orderBy:{
            updatedAt: "desc",
        }
    });


    res.json({ message: "Conversations fetched successfully", conversations });
});



conversationsRouter.post("/", async (req, res) => {
    const {ids, type, name} = req.body;
    const {userId} = req.clerk;
    
    if(!ids || !type){
        return res.json({ message: "Invalid request" });
    }
    if(type !== "single" && type !== "group"){
        return res.json({ message: "Invalid conversation type" });
    }
    if(type === "single" && ids.length > 2){
        return res.json({ message: "Invalid number of users" });
    }
    ids.push(userId)

    if(type === "single"){
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
          
        if(existingConversation){
            return res.json({ message: "Conversation already exists", data:existingConversation });
        }
    }else{

        const newConversation = await prisma.conversation.create({
            data: {
                users: {
                    connect: ids.map(id => ({ clerkId: id })),
                },
                type: type.toUpperCase(),
                name: name,
            },
            include:{
                users:true
            }
        });
    
        res.json({ message: "Conversation created successfully", data:newConversation });
    }

});

export default conversationsRouter;
