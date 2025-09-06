import express from "express";

const router = express.Router();

// Placeholder routes for cloudinary
router.get("/", (req, res) => {
  res.json({ message: "Cloudinary routes" });
});

export default router;
