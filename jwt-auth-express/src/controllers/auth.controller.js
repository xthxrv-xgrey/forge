import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { hashToken } from "../utils/hashToken.util.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";

const validEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
};

const updateRefreshToken = async (refreshToken, session, res) => {
    session.refreshToken = hashToken(refreshToken);
    await session.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const setRefreshTokenCookie = (refreshToken, res) => {
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
        throw new ApiError(400, "All fields are required.");

    if (username.length < 3)
        throw new ApiError(400, "Username must be at least 3 characters long.");

    if (username.length > 20)
        throw new ApiError(400, "Username must be at most 20 characters long.");

    if (!validEmail(email)) throw new ApiError(400, "Invalid email address.");

    if (password.length < 6)
        throw new ApiError(400, "Password must be at least 6 characters long.");

    if (password.length > 30)
        throw new ApiError(400, "Password must be at most 30 characters long.");

    const usernameNormalized = username.toLowerCase();
    const emailNormalized = email.toLowerCase();

    const existingUser = await User.findOne({
        $or: [{ username: usernameNormalized }, { email: emailNormalized }],
    });

    if (existingUser) throw new ApiError(400, "User already exists.");

    const user = await User.create({
        username: usernameNormalized,
        email: emailNormalized,
        password,
    });

    const refreshToken = user.generateRefreshToken();

    const session = await Session.create({
        user: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        refreshToken: hashToken(refreshToken),
    });

    setRefreshTokenCookie(refreshToken, res);
    const accessToken = user.generateAccessToken(session);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json(
        new ApiResponse(201, "User registered successfully.", {
            safeUser,
            accessToken,
        })
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password)
        throw new ApiError(400, "All fields are required.");

    const identifierNormalized = identifier.toLowerCase();

    const user = await User.findOne({
        $or: [
            { username: identifierNormalized },
            { email: identifierNormalized },
        ],
    }).select("+password");

    if (!user) throw new ApiError(400, "Invalid credentials.");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new ApiError(400, "Invalid credentials.");

    const refreshToken = user.generateRefreshToken();

    const session = await Session.create({
        user: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        refreshToken: hashToken(refreshToken),
    });

    setRefreshTokenCookie(refreshToken, res);
    const accessToken = user.generateAccessToken(session);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json(
        new ApiResponse(200, "Logged in successfully.", {
            safeUser,
            accessToken,
        })
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new ApiError(401, "Unauthorized access.");

    await Session.findOneAndUpdate(
        { refreshToken: hashToken(refreshToken), revoked: false },
        { revoked: true }
    );

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Logged out successfully."));
});

export const logoutAllSessions = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new ApiError(401, "Unauthorized access.");

    await Session.updateMany(
        { refreshToken: hashToken(refreshToken), revoked: false },
        { revoked: true }
    );

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Logged out successfully."));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new ApiError(401, "Unauthorized access.");

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token.");
    }

    if (!decoded?._id) throw new ApiError(401, "Invalid refresh token.");

    const user = await User.findById(decoded._id);
    if (!user) throw new ApiError(401, "Invalid refresh token.");

    const session = await Session.findOne({
        user: user._id,
        refreshToken: hashToken(refreshToken),
        revoked: false,
    });

    if (!session) {
        await Session.updateMany({ user: user._id }, { revoked: true });
        throw new ApiError(401, "Possible token reuse detected.");
    }

    const newRefreshToken = user.generateRefreshToken();
    await updateRefreshToken(newRefreshToken, session, res);
    const accessToken = user.generateAccessToken(session);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json(
        new ApiResponse(200, "Tokens refreshed successfully.", {
            safeUser,
            accessToken,
        })
    );
});
