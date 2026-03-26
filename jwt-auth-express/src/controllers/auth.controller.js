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

    // Valid Checks

    if (!username || !email || !password)
        throw new ApiError(400, "All fields are required");

    if (username.length < 3)
        throw new ApiError(400, "Username must have atleast 3 characters");

    if (20 < username.length)
        throw new ApiError(400, "Username must have atmost 20 characters");

    if (!validEmail(email)) throw new ApiError(400, "Invalid Email Address");

    if (password.length < 6)
        throw new ApiError(400, "Password must have atleast 6 characters");

    if (30 < password.length)
        throw new ApiError(400, "Password must have atmost 30 characters");

    const usernameNormalized = username.toLowerCase();
    const emailNormalized = email.toLowerCase();
    // Existing user check

    const existingUser = await User.findOne({
        $or: [{ username: usernameNormalized }, { email: emailNormalized }],
    });

    if (existingUser) throw new ApiError(400, "User already exists");

    // Create User
    const user = await User.create({
        username: usernameNormalized,
        email: emailNormalized,
        password,
    });
    // Generation of Access and Refresh Token and Update

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await updateRefreshToken(refreshToken, user, res);

    // return safeuser and accestoken
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(201).json(
        new ApiResponse(201, "User registered successfully!", {
            safeUser,
            accessToken,
        })
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // validity check
    if (!identifier || !password)
        throw new ApiError(400, "All fields are required");

    const identifierNormalized = identifier.toLowerCase();

    const user = await User.findOne({
        $or: [
            { username: identifierNormalized },
            { email: identifierNormalized },
        ],
    }).select("+password");

    if (!user) throw new ApiError(400, "Invalid credentials!");

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) throw new ApiError(400, "Invalid credentials!");

    // Genrate Access and Refresh Tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await updateRefreshToken(refreshToken, user, res);

    // return safeuser and accestoken
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, "Login successfully!", {
            safeUser,
            accessToken,
        })
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    // Check if token exists
    if (!refreshToken) {
        throw new ApiError(401, "Unauthorized Access!");
    }

    // Verify token safely
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Find user and include refreshToken
    const user = await User.findById(decoded._id).select("+refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token!");
    }

    // Hash incoming refresh token
    const hashedIncomingToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    // Compare with stored hashed token
    if (user.refreshToken !== hashedIncomingToken) {
        throw new ApiError(401, "Refresh token mismatch!");
    }

    // Generate new tokens (rotation)
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    await updateRefreshToken(newRefreshToken, user, res);

    // Prepare safe user object
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(200).json(
        new ApiResponse(200, "Tokens refreshed successfully!", {
            safeUser,
            accessToken,
        })
    );
});
