import express from "express";

const router = express.Router();

// Simple route that returns the requested message
router.get("/", (req, res) => {
  res.json({ message: "Hello I am from this route" });
});

export default router;
