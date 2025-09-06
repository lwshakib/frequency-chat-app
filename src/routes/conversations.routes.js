import express from "express";

const router = express.Router();

// Placeholder routes for conversations
router.get("/", (req, res) => {
  res.json({ message: "Conversations routes" });
});

export default router;
