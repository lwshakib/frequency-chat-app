import express from "express";

const router = express.Router();

// Placeholder routes for users
router.get("/", (req, res) => {
  res.json({ message: "Users routes" });
});

export default router;
