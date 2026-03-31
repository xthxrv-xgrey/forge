// auth.middleware.js
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized access. No token provided.");
    }
    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired access token.");
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const session = await Session.findById(decoded.sessionId);
    if (!session) {
      throw new ApiError(401, "Session not found or expired.");
    }

    req.user = user;
    req.session = session;

    next();
  } catch (err) {
    next(err);
  }
};
