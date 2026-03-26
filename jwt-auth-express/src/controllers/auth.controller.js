import crypto from "crypto";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";

const validEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
};

const updateRefreshToken = async (refreshToken, user, res) => {
    const hashedRefreshToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
        throw new ApiError(400, "All fields are required");

    if (username.length < 3)
        throw new ApiError(422, "Username must have at least 3 characters");

    if (username.length > 20)
        throw new ApiError(422, "Username must have at most 20 characters");

    if (!validEmail(email))
        throw new ApiError(422, "Invalid email address");

    if (password.length < 6)
        throw new ApiError(422, "Password must have at least 6 characters");

    if (password.length > 30)
        throw new ApiError(422, "Password must have at most 30 characters");

    const usernameNormalized = username.toLowerCase();
    const emailNormalized = email.toLowerCase();

    const existingUser = await User.findOne({
        $or: [{ username: usernameNormalized }, { email: emailNormalized }],
    });

    if (existingUser)
        throw new ApiError(409, "An account with this username or email already exists");

    const user = await User.create({
        username: usernameNormalized,
        email: emailNormalized,
        password,
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await updateRefreshToken(refreshToken, user, res);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(201).json(
        new ApiResponse(201, "Account created successfully", {
            user: safeUser,
            accessToken,
        })
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password)
        throw new ApiError(400, "All fields are required");

    const identifierNormalized = identifier.toLowerCase();

    const user = await User.findOne({
        $or: [
            { username: identifierNormalized },
            { email: identifierNormalized },
        ],
    }).select("+password");

    if (!user)
        throw new ApiError(401, "Invalid credentials");

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid)
        throw new ApiError(401, "Invalid credentials");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await updateRefreshToken(refreshToken, user, res);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, "Logged in successfully", {
            user: safeUser,
            accessToken,
        })
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
        throw new ApiError(401, "No refresh token provided");

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Refresh token is invalid or has expired");
    }

    const user = await User.findById(decoded._id).select("+refreshToken");

    if (!user)
        throw new ApiError(401, "User no longer exists");

    const hashedIncomingToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    if (user.refreshToken !== hashedIncomingToken)
        throw new ApiError(401, "Refresh token has already been used or revoked");

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    await updateRefreshToken(newRefreshToken, user, res);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, "Token refreshed successfully", {
            user: safeUser,
            accessToken,
        })
    );
});