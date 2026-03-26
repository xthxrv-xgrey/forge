import { Router } from "express";
import { registerUser , loginUser, refreshAccessToken } from "../controllers/auth.controller.js";
export const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/refresh", refreshAccessToken);
