import express from "express";
import { getCloudinaryAuth } from "../controllers/cloudinary.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.use(requireAuth);

router.get("/", getCloudinaryAuth);

export default router;
