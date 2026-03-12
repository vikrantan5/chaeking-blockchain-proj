import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// In-memory token blacklist (use Redis for production)
const tokenBlacklist = new Set();

const getTokenFromRequest = (req) =>
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
         const token = getTokenFromRequest(req)

        if (!token) {
            throw new ApiError(401, "Unautorized request")
        }

        // Check if the token is blacklisted
        if (tokenBlacklist.has(token)) {
            throw new ApiError(401, "Token is invalid or expired");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})

export const blacklistToken = (token) => {
    tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};

export const optionalJWT = asyncHandler(async (req, _, next) => {
    const token = getTokenFromRequest(req);

    if (!token || tokenBlacklist.has(token)) {
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (user) {
            req.user = user;
        }
    } catch {
        // Ignore invalid/expired token for optional auth routes.
    }

    return next();
});