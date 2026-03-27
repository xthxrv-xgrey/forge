import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: [true, "User is required"],
        },
        ip: {
            type: String,
            required: [true, "IP address is required"],
        },
        userAgent: {
            type: String,
            required: [true, "User agent is required"],
        },
        refreshToken: {
            type: String,
            required: [true, "Refresh token hash is required"],
        },
        revoked: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
