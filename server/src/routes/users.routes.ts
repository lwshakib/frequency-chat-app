import express from "express";
import { getUsers } from "../controllers/users.controllers";
import { requireAuth } from "../middlewares/auth.middlewares";

const usersRouter = express.Router();

usersRouter.use(requireAuth);

usersRouter.get("/", getUsers);

export default usersRouter;
