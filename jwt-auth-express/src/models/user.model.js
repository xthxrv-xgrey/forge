import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username already in use"],
        trim: true,
        lowercase: true,
        minlength: [3, "Username must contain at least 3 characters"],
        maxlength: [20, "Username must contain atmost 20 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already in use"],
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must contain at least 6 characters"],
        maxlength: [30, "Password must contain atmost 30 characters"],
        select: false,
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (session) {
    if (!session?._id) {
        throw new Error("Session is required for access token");
    }
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            sessionId: session?._id.toString(),
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
