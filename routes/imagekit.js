import express from "express";
import { getImagekitAuth } from "../controllers/imagekit.controller.js";

const router = express.Router();

router.get("/", getImagekitAuth);

export default router;
