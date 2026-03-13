import { User } from "../models/user.model.js";
import { NGO } from "../models/ngo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emailForOtpVerification } from "../utils/emailTemplateForOTP.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { generateAccessAndRefreshTokens } from "./user.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { storeWalletAddressUtility } from "../utils/storeWalletAddress.js";

// NGO Owner Registration (User + NGO in one step)
// NGO Owner Registration (User + NGO in one step)
export const registerNGOOwner = asyncHandler(async (req, res) => {
    const {
        // User details
        name,
        email,
        password,
        phone,
        // NGO details
        ngoName,
        registrationNumber,
        address,
        contactDetails,
        description,
        mission,
        focusAreas,
        walletAddress
    } = req.body;

    // Validate user fields
    if (!name || !email || !password || !phone) {
        throw new ApiError(400, "All user fields are required");
    }

    // Validate NGO fields
    if (!ngoName || !registrationNumber || !address || !description || !mission) {
        throw new ApiError(400, "All NGO fields are required");
    }

    // Validate email format - FIXED REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Validation - phone number length
    if (!phone || phone.toString().length !== 10) {
        throw new ApiError(400, "Phone number should be of 10 digits");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ phone }, { email }]
    });
    if (existingUser) {
        throw new ApiError(400, "User with email or phone number already exists");
    }

    // Check if NGO with same registration number already exists
    const existingNGO = await NGO.findOne({ registrationNumber });
    if (existingNGO) {
        throw new ApiError(400, "NGO with this registration number already exists");
    }

    // Handle file uploads (cover image and verification documents)
    let coverImageUrl = "";
    let verificationDocUrls = [];

    if (req.files) {
        try {
            // Upload cover image
            if (req.files.coverImage && req.files.coverImage[0]) {
                const coverImageUpload = await uploadOnCloudinary(req.files.coverImage[0].path);
                if (coverImageUpload && coverImageUpload.url) {
                    coverImageUrl = coverImageUpload.url;
                    console.log(`✅ Cover image uploaded: ${coverImageUrl}`);
                }
            }

            // Upload verification documents
            if (req.files.verificationDocuments && req.files.verificationDocuments.length > 0) {
                for (const file of req.files.verificationDocuments) {
                    try {
                        const docUpload = await uploadOnCloudinary(file.path);
                        if (docUpload?.url) {
                            verificationDocUrls.push(docUpload.url);
                            console.log(`✅ Document uploaded: ${docUpload.url}`);
                        }
                    } catch (docError) {
                        console.error(`❌ Failed to upload document: ${file.originalname}`, docError);
                        // Continue with next document
                    }
                }
            }
        } catch (fileUploadError) {
            console.error("❌ File upload error:", fileUploadError);
            // Continue registration even if file upload fails
            // Don't throw error here
        }
    }

    // Parse JSON fields
    let parsedAddress;
    let parsedContactDetails;
    let parsedFocusAreas = [];

    try {
        parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
        parsedContactDetails = typeof contactDetails === 'string' ? JSON.parse(contactDetails) : contactDetails;
        
        if (focusAreas) {
            parsedFocusAreas = typeof focusAreas === 'string' ? JSON.parse(focusAreas) : focusAreas;
        }
        
        // Ensure parsedFocusAreas is an array
        if (!Array.isArray(parsedFocusAreas)) {
            parsedFocusAreas = [];
        }
    } catch (error) {
        console.error("❌ Error parsing NGO data:", error);
        throw new ApiError(400, "Invalid NGO data format. Please check your JSON fields.");
    }

    // Validate address fields
    if (!parsedAddress?.street || !parsedAddress?.city || !parsedAddress?.state || !parsedAddress?.pincode) {
        throw new ApiError(400, "Complete NGO address with street, city, state, and pincode is required");
    }

    // Validate contact details
    if (!parsedContactDetails?.phone || !parsedContactDetails?.email) {
        throw new ApiError(400, "NGO contact details with phone and email are required");
    }

    // Create user with ngoAdmin role and pending status
    const user = await User.create({
        name,
        email,
        password,
        phone,
        role: "ngoAdmin",
        loginType: "email",
        status: "pending",
        ngoName: ngoName,
        ngoLocation: `${parsedAddress.city}, ${parsedAddress.state}`.replace(/^, |, $/g, ''),
        walletAddress: walletAddress || null
    });

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Create NGO
    const ngo = await NGO.create({
        ngoName,
        registrationNumber,
        address: parsedAddress,
        contactDetails: parsedContactDetails,
        description,
        mission,
        focusAreas: parsedFocusAreas,
        walletAddress: walletAddress || null,
        coverImage: coverImageUrl,
        verificationDocuments: verificationDocUrls,
        registeredBy: user._id,
        approvalStatus: 'pending'
    });

    if (!ngo) {
        // If NGO creation fails, delete the user
        await User.findByIdAndDelete(user._id);
        throw new ApiError(500, "Something went wrong while registering the NGO");
    }

    // Link NGO to User
    user.ngoId = ngo._id;
    user.ngoName = ngo.ngoName;
    user.ngoLocation = `${parsedAddress.city}, ${parsedAddress.state}`.replace(/^, |, $/g, '');
    await user.save({ validateBeforeSave: false });

    // Generate 6-digit numeric OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    user.lastOtpSentAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
        const otpEmail = emailForOtpVerification(user.email, otp, "emailVerification");
        
        // Handle if email template returns object or string
        const emailHtml = typeof otpEmail === 'object' ? otpEmail.html : otpEmail;
        const emailSubject = typeof otpEmail === 'object' ? otpEmail.subject : "Email Verification OTP";
        
        await sendEmail(user.email, emailSubject, emailHtml);
        console.log(`✅ OTP email sent to ${user.email}`);
    } catch (error) {
        console.error("❌ Failed to send OTP email:", error);
        // Don't throw error here, registration still succeeded
    }

    // Remove password from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken -resetOtp -resetOtpExpires");

    return res.status(201).json(
        new ApiResponse(
            201,
            { 
                user: createdUser, 
                ngo,
                message: "Please verify your email with the OTP sent to your email address."
            },
            "NGO Owner registered successfully. Your NGO is pending admin approval."
        )
    );
});

// NGO Admin Login
export const loginNGOAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if user has ngoAdmin role
    if (user.role !== 'ngoAdmin') {
        throw new ApiError(400, "Invalid credentials. Please use the correct login.");
    }

    // Check login type
    if (user.loginType !== 'email') {
        throw new ApiError(400, "Invalid login type");
    }

 // Check password first before checking status
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

      // Get NGO details to check approval status
      // Try to find NGO by registeredBy first, then by ngoId from user
    let ngo = await NGO.findOne({ registeredBy: user._id });
    
    // If not found by registeredBy, try using user's ngoId
    if (!ngo && user.ngoId) {
        ngo = await NGO.findById(user.ngoId);
    }
    if (!ngo) {
        throw new ApiError(404, "NGO details not found. Please contact support.");
    }

    // Check if NGO is approved
    if (ngo.approvalStatus === 'pending') {
        throw new ApiError(403, "Your NGO registration is pending admin approval. Please wait for approval.");
    }

    if (ngo.approvalStatus === 'rejected') {
        throw new ApiError(403, `Your NGO registration was rejected. Reason: ${ngo.rejectionReason || 'Not specified'}`);
    }

    // Check if email is verified and account is active
    if (user.status === 'pending') {
        throw new ApiError(400, "Please verify your email first with the OTP sent to your email.");
    }

    if (user.status !== 'active') {
        throw new ApiError(400, "Your account is not active. Please contact support.");
    }


    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");



    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    ngo,
                    accessToken,
                    refreshToken
                },
                "NGO Admin logged in successfully"
            )
        );
});

// Logout NGO Admin
export const logoutNGOAdmin = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "You must be logged in to log out");
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
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "NGO Admin logged out successfully")
        );
});

// Get current NGO Admin with NGO details
export const getCurrentNGOAdmin = asyncHandler(async (req, res) => {
    const user = req.user;
    const ngo = await NGO.findOne({ registeredBy: user._id });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { user, ngo }, "Current NGO Admin fetched successfully")
        );
});

// Store wallet address for NGO Admin
export const storeWalletAddressForNGOAdmin = asyncHandler(async (req, res) => {
    const { walletAddress } = req.body;

    const result = await storeWalletAddressUtility(req.user._id, "ngoAdmin", walletAddress);

    // Also update NGO wallet address
    const ngo = await NGO.findOne({ registeredBy: req.user._id });
    if (ngo && ngo.walletAddress !== walletAddress) {
        ngo.walletAddress = walletAddress;
        await ngo.save();
    }

    return res.status(200).json(
        new ApiResponse(200, { walletAddress: result.walletAddress }, result.message)
    );
});
