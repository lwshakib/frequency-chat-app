import express from "express";
import { getUsers } from "../controllers/users.controllers.js";

const usersRouter = express.Router();

usersRouter.get("/", getUsers);

export default usersRouter;