import express from "express";

const router = express.Router();

// Placeholder routes for notifications
router.get("/", (req, res) => {
  res.json({ message: "Notifications routes" });
});

export default router;
