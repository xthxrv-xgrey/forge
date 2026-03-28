import { Router } from "express";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllSessions,
} from "../controllers/auth.controller.js";
export const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);
authRouter.post("/logout-all", logoutAllSessions);
authRouter.post("/refresh", refreshAccessToken);
