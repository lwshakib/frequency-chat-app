import express from "express";
import { getCloudinaryAuth } from "../controllers/cloudinary.controllers.js";

const router = express.Router();

router.get("/", getCloudinaryAuth);

export default router;