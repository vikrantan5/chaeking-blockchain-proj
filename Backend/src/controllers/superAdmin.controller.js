import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { blacklistToken } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";

dotenv.config({
    path: './.env'
})

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // storing refresh token into database 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// seed script for superadmin
const seedScriptForSuperAdmin = asyncHandler(async (req, res) => {
    // Validate required environment variables
    const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_PHONE, SUPERADMIN_WALLET } = process.env;

    if (!SUPERADMIN_NAME || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD || !SUPERADMIN_PHONE || !SUPERADMIN_WALLET) {
        throw new ApiError(500, "Missing required environment variables for SuperAdmin creation.");
    }

    // Check if a super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "superAdmin" });

    // If SuperAdmin exists and no token, then block
    if (existingSuperAdmin && !req.user) {
        return res
            .status(403)
            .json({ success: false, message: "Access denied. SuperAdmin already exists." });
    }

    // If SuperAdmin exists but user is not superAdmin
    if (existingSuperAdmin && req.user?.role !== "superAdmin") {
        return res
            .status(403)
            .json({ success: false, message: "Only superAdmin can re-seed the SuperAdmin." });
    }

    // If already seeded
    if (existingSuperAdmin) {
        return res
            .status(409)
            .json(new ApiResponse(409, existingSuperAdmin.email, "SuperAdmin already exists."));
    }

    // Create SuperAdmin
    const superAdmin = await User.create({
        name: SUPERADMIN_NAME || "Super Admin",
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        phone: SUPERADMIN_PHONE,
        walletAddress: SUPERADMIN_WALLET,
        role: "superAdmin",
        loginType: "email",
    });

    if (!superAdmin) {
        throw new ApiError(500, "Failed to create SuperAdmin.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { email: superAdmin.email, role: superAdmin.role, phone: superAdmin.phone, wallet_id: superAdmin.walletAddress },
                "SuperAdmin created successfully."
            )
        );
});

// login 
const loginSuperAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required!");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || user.role !== "superAdmin") {
        throw new ApiError(401, "Unauthorized - not a superAdmin");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                accessToken,
                refreshToken
            }, "SuperAdmin Logged in Successfully")
        );
});

// log out functionality 
const logoutSuperAdmin = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "You must be logged in to log out");
    }

    // Add the access token to the blacklist
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        blacklistToken(token);
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict", // optional, security ke liye
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "SuperAdmin Logged Out Successfully")
        )
})

// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {

    // Take Incoming token from user 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // validate incoming Token 
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unautorized request")
    }

    try {
        // Verify incoming token 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        // decoded token me se userId (token) fetch karne ka 
        const user = await User.findById(decodedToken?._id).select("+refreshToken")

        // validate Fetch Userid (token)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        // check both token are match or not 
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict", // optional for extra security
            path: "/"
        }

        // if both tokens are match - generate new token
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        // return response 
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

// change password 
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id).select("+password")

    if (!user) {
        throw new ApiError(404, "User not Found")
    }

    // compare the provided old password with the stored hash 
    const isPasswordCorrect = await user.comparePassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect")
    }

    // Check if the new password same as the old password 
    const isSameAsOldPass = await user.comparePassword(newPassword)

    if (isSameAsOldPass) {
        throw new ApiError(400, "New Password can not be the same as the old Password!!")
    }

    // update the password 
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))
})

// get current superAdmin
const getCurrentSuperAdmin = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current User Fetched Successfully")
        )
})

const confirmTempleAdminRegistration = asyncHandler(async (req, res) => {
    const { templeAdminId } = req.body;

    if (!templeAdminId) {
        throw new ApiError(400, "Temple Admin ID is required");
    }

    const templeAdmin = await User.findById(templeAdminId);
    if (!templeAdmin || templeAdmin.role !== "templeAdmin") {
        throw new ApiError(404, "Temple Admin not found");
    }

    if (templeAdmin.status !== "pending") {
        throw new ApiError(400, "Temple Admin is already active");
    }

    // Check if wallet address is stored
    if (!templeAdmin.walletAddress) {
        throw new ApiError(400, "Temple Admin has not connected their wallet address");
    }

    // Update status to active
    templeAdmin.status = "active";
    await templeAdmin.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                _id: templeAdmin._id,
                name: templeAdmin.name,
                email: templeAdmin.email,
                phone: templeAdmin.phone,
                walletAddress: templeAdmin.walletAddress,
                templeName: templeAdmin.templeName,
                templeLocation: templeAdmin.templeLocation,
                status: templeAdmin.status
            },
            "Temple Admin registration confirmed and deployed on blockchain"
        )
    );
});

const rejectTempleAdminRegistration = asyncHandler(async (req, res) => {
    const { templeAdminId } = req.body;

    if (!templeAdminId) {
        throw new ApiError(400, "Temple Admin ID is required");
    }

    const templeAdmin = await User.findById(templeAdminId);
    if (!templeAdmin || templeAdmin.role !== "templeAdmin") {
        throw new ApiError(404, "Temple Admin not found");
    }

    // Remove the temple admin from the database
    await User.findByIdAndDelete(templeAdminId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Temple Admin registration request rejected and removed.")
    );
});

const getPendingConfirmations = asyncHandler(async (req, res) => {
    const pendingAdmins = await User.find({ 
        role: "templeAdmin", 
        status: "pending", 
        walletAddress: { $ne: null } 
    }).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, pendingAdmins, "Pending confirmations fetched successfully."));
});

export {
    seedScriptForSuperAdmin,
    loginSuperAdmin,
    logoutSuperAdmin,
    refreshAccessToken,
    changePassword,
    getCurrentSuperAdmin,
    confirmTempleAdminRegistration,
    rejectTempleAdminRegistration,
    getPendingConfirmations
};

