import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { NGO } from "../models/ngo.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";
import { emailForOtpVerification } from "../utils/emailTemplateForOTP.js";
import { Transaction } from "../models/transaction.model.js";
import mongoose from "mongoose";





// / Donate to NGO (authenticated user)
export const donateToNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const { amount, txHash, gasPrice = 0, transactionFee = 0 } = req.body;

    if (!amount || !txHash) {
        throw new ApiError(400, "Amount and transaction hash are required");
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new ApiError(400, "Donation amount must be a positive number");
    }

    const ngo = await NGO.findById(ngoId).populate('registeredBy');
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    if (ngo.approvalStatus !== "approved") {
        throw new ApiError(400, "This NGO is not approved for donations yet");
    }

    const duplicateTx = await Transaction.findOne({ txHash });
    if (duplicateTx) {
        throw new ApiError(400, "Transaction already recorded");
    }

    const transaction = await Transaction.create({
        transactionType: "ngo-donation",
        sender: req.user._id,
        receiver: ngo.registeredBy,
        amount: parsedAmount,
        txHash,
        status: "confirmed",
        gasPrice: Number(gasPrice) || 0,
        transactionFee: Number(transactionFee) || 0,
        purpose: `Donation to NGO: ${ngo.ngoName}`,
        ngo: ngo._id,
        cryptoType: "matic"
    });

    await NGO.findByIdAndUpdate(ngo._id, {
        $inc: { totalDonationsReceived: parsedAmount }
    });

    return res.status(201).json(
        new ApiResponse(201, transaction, "NGO donation recorded successfully")
    );
});

// Donation transparency list for an NGO
export const getNGODonations = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const { limit = 20 } = req.query;

    const ngo = await NGO.findById(ngoId).select("ngoName");
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    const donationList = await Transaction.find({
        ngo: ngoId,
        transactionType: { $in: ["ngo-donation", "case-donation", "product-donation"] },
        status: "confirmed"
    })
        .sort({ createdAt: -1 })
        .limit(Number(limit) || 20)
        .populate("sender", "name email walletAddress")
        .select("transactionType sender amount txHash createdAt purpose cryptoType fundraisingCase product");

    return res.status(200).json(
        new ApiResponse(200, { ngo, donations: donationList }, "NGO donations fetched successfully")
    );
});
// Helper function to safely parse JSON
const safeJSONParse = (data, fieldName) => {
    if (!data) return null;
    try {
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
        throw new ApiError(400, `Invalid JSON format for ${fieldName}`);
    }
};

// Helper function to upload multiple files
const uploadMultipleFiles = async (files, folder = 'ngos') => {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
        try {
            const result = await uploadOnCloudinary(file.path, folder);
            return result?.url || null;
        } catch (error) {
            console.error(`Error uploading file: ${file.originalname}`, error);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null);
};

// Step 1: Initiate NGO Registration and send OTP
export const initiateNGORegistration = asyncHandler(async (req, res) => {
    const {
        ngoName,
        registrationNumber,
        address,
        contactDetails,
        description,
        mission,
        focusAreas,
        walletAddress
    } = req.body;

    // Validation
    const requiredFields = {
        ngoName, registrationNumber, address, description, mission, walletAddress
    };

    const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if NGO with same registration number already exists
    const existingNGO = await NGO.findOne({ registrationNumber });
    if (existingNGO) {
        throw new ApiError(400, "NGO with this registration number already exists");
    }

    // Parse JSON fields
    const parsedAddress = safeJSONParse(address, 'address');
    const parsedContactDetails = safeJSONParse(contactDetails, 'contactDetails');
    const parsedFocusAreas = safeJSONParse(focusAreas, 'focusAreas') || [];

    // Handle file uploads
    let coverImageUrl = "";
    let verificationDocUrls = [];

    if (req.files) {
        // Upload cover image
        if (req.files.coverImage?.[0]) {
            const coverImageUpload = await uploadOnCloudinary(req.files.coverImage[0].path, 'ngos/cover');
            coverImageUrl = coverImageUpload?.url || "";
        }

        // Upload verification documents
        if (req.files.verificationDocuments?.length > 0) {
            verificationDocUrls = await uploadMultipleFiles(req.files.verificationDocuments, 'ngos/documents');
        }
    }

    // Store NGO data temporarily in user document
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store NGO registration data in user document temporarily
    user.pendingNGOData = {
        ngoName,
        registrationNumber,
        address: parsedAddress,
        contactDetails: parsedContactDetails,
        description,
        mission,
        focusAreas: parsedFocusAreas,
        walletAddress,
        coverImage: coverImageUrl,
        verificationDocuments: verificationDocUrls
    };
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    user.lastOtpSentAt = Date.now();
    
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const otpEmail = emailForOtpVerification(user.email, otp, "ngoRegistration");
    try {
        await sendEmail(user.email, "NGO Registration - OTP Verification", otpEmail);
    } catch (error) {
        throw new ApiError(500, "Failed to send OTP email. Please try again.");
    }

    return res.status(200).json(
        new ApiResponse(200, { email: user.email }, "OTP sent to your email. Please verify to complete NGO registration.")
    );
});

// Step 2: Verify OTP and complete NGO registration
export const verifyNGORegistrationOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    // Find user with OTP
    const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpires +pendingNGOData");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.pendingNGOData) {
        throw new ApiError(400, "No pending NGO registration found. Please initiate registration first.");
    }

    // Verify OTP
    if (user.resetOtp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (user.resetOtpExpires < Date.now()) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    // Create NGO with stored data
    const ngo = await NGO.create({
        ...user.pendingNGOData,
        registeredBy: user._id,
        approvalStatus: 'pending'
    });

    // Update user role to ngoAdmin
    await User.findByIdAndUpdate(user._id, {
        role: 'ngoAdmin',
        ngoId: ngo._id,
        ngoName: user.pendingNGOData.ngoName,
        ngoLocation: user.pendingNGOData.address ? 
            `${user.pendingNGOData.address.city || ''}, ${user.pendingNGOData.address.state || ''}`.replace(/^, |, $/g, '') : '',
        $unset: { 
            pendingNGOData: 1,
            resetOtp: 1,
            resetOtpExpires: 1,
            lastOtpSentAt: 1
        }
    });

    return res.status(201).json(
        new ApiResponse(201, ngo, "NGO registered successfully! Waiting for admin approval.")
    );
});

// Resend OTP for NGO registration
export const resendNGORegistrationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpires +pendingNGOData +lastOtpSentAt");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.pendingNGOData) {
        throw new ApiError(400, "No pending NGO registration found");
    }

    // Check if last OTP was sent less than 1 minute ago
    if (user.lastOtpSentAt && (Date.now() - user.lastOtpSentAt < 60000)) {
        throw new ApiError(429, "Please wait 1 minute before requesting a new OTP");
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.lastOtpSentAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const otpEmail = emailForOtpVerification(user.email, otp, "ngoRegistration");
    try {
        await sendEmail(user.email, "NGO Registration - OTP Verification (Resend)", otpEmail);
    } catch (error) {
        throw new ApiError(500, "Failed to send OTP email");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP resent successfully. Please check your email.")
    );
});

// Legacy function (kept for backward compatibility)
export const registerNGO = asyncHandler(async (req, res) => {
    throw new ApiError(400, "Please use the new registration flow with OTP verification. Call /initiate-registration first.");
});

// Get all NGOs (with filters and pagination)
export const getAllNGOs = asyncHandler(async (req, res) => {
    const { 
        status, 
        focusArea, 
        city, 
        page = 1, 
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    // Status filter - show only approved to non-super-admins
    if (status) {
        filter.approvalStatus = status;
    } else if (!req.user || req.user.role !== 'superAdmin') {
        filter.approvalStatus = 'approved';
    }

    // Focus area filter
    if (focusArea) {
        filter.focusAreas = { $in: [focusArea] };
    }

    // City filter (case-insensitive)
    if (city) {
        filter['address.city'] = { $regex: new RegExp(city, 'i') };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [ngos, totalCount] = await Promise.all([
        NGO.find(filter)
            .populate('registeredBy', 'name email')
            .populate('approvedBy', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(),
        NGO.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            ngos,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum
            }
        }, "NGOs fetched successfully")
    );
});

// Get single NGO by ID or slug with access control
export const getNGOById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Build query to search by either _id or slug
    const queryConditions = [{ slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
        queryConditions.push({ _id: id });
    }

    const ngo = await NGO.findOne({
        $or: queryConditions
    })
        .populate('registeredBy', 'name email phone walletAddress')
        .populate('approvedBy', 'name email')
        .lean();

    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    // Check access permissions
    const isOwner = req.user && ngo.registeredBy && 
        ngo.registeredBy._id.toString() === req.user._id.toString();
    const isSuperAdmin = req.user?.role === 'superAdmin';

    // If NGO is not approved, only owner or super admin can view
    if (ngo.approvalStatus !== 'approved' && !isOwner && !isSuperAdmin) {
        throw new ApiError(403, "This NGO profile is not publicly available yet");
    }
      if (!ngo.walletAddress && ngo.registeredBy?.walletAddress) {
        ngo.walletAddress = ngo.registeredBy.walletAddress;
    }

    return res.status(200).json(
        new ApiResponse(200, ngo, "NGO fetched successfully")
    );
});

// Approve NGO (Super Admin only)
export const approveNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const { remarks } = req.body;

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    if (ngo.approvalStatus === 'approved') {
        throw new ApiError(400, "NGO is already approved");
    }

    ngo.approvalStatus = 'approved';
    ngo.approvedBy = req.user._id;
    ngo.approvalDate = new Date();
    ngo.approvalRemarks = remarks || "";
    ngo.rejectionReason = null; // Clear any previous rejection reason
    
    await ngo.save();

 // Update user role and status to allow dashboard access
    const user = await User.findByIdAndUpdate(
        ngo.registeredBy, 
        {
        role: 'ngoAdmin',
           isVerified: true,
        status: 'active', // Set status to active so NGO admin can login
        ngoId: ngo._id, // Link NGO to user
        ngoName: ngo.ngoName,
        ngoLocation: `${ngo.address.city}, ${ngo.address.state}`
     },
        { new: true } // Return updated document
    );

    
    if (!ngo.walletAddress && user?.walletAddress) {
        ngo.walletAddress = user.walletAddress;
        await ngo.save();
    }

    // Send approval email notification
    
    if (user && user.email) {
        try {
            const approvalEmailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 NGO Approved!</h1>
                    </div>
                    <div class="content">
                        <p>Dear <strong>${user.name}</strong>,</p>
                        <p>Congratulations! Your NGO <strong>${ngo.ngoName}</strong> has been approved by our admin team.</p>
                        
                        <div class="details">
                            <h3>What's Next?</h3>
                            <ul>
                                <li>✅ You can now access your NGO Admin Dashboard</li>
                                <li>✅ Start receiving crypto donations from users</li>
                                <li>✅ Create fundraising cases for specific causes</li>
                                <li>✅ View donation transparency reports</li>
                            </ul>
                        </div>

                        ${remarks ? `<div class="details"><p><strong>Admin Remarks:</strong> ${remarks}</p></div>` : ''}

                        <p>You can now login to your NGO admin dashboard using your registered email and password.</p>
                        
                        <center>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Dashboard</a>
                        </center>

                        <p>Thank you for joining our platform to make a difference!</p>
                        <p>Best regards,<br>Blockchain NGO Platform Team</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            await sendEmail(
                user.email,
                "🎉 Your NGO has been Approved!",
                approvalEmailContent
            );
        } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
            // Don't throw error, approval should still succeed even if email fails
        }
    }
    return res.status(200).json(
       new ApiResponse(200, ngo, "NGO approved successfully and notification sent")
    );
});

// Reject NGO (Super Admin only)
export const rejectNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
        throw new ApiError(400, "Rejection reason is required");
    }

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    if (ngo.approvalStatus === 'rejected') {
        throw new ApiError(400, "NGO is already rejected");
    }

    ngo.approvalStatus = 'rejected';
    ngo.rejectionReason = reason;
    ngo.approvedBy = req.user._id;
    ngo.approvalDate = new Date();
    
    await ngo.save();

    return res.status(200).json(
        new ApiResponse(200, ngo, "NGO rejected successfully")
    );
});

// Update NGO details
export const updateNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const updates = req.body;

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    // Check permissions: only NGO owner or super admin can update
    const isOwner = ngo.registeredBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superAdmin';

    if (!isOwner && !isSuperAdmin) {
        throw new ApiError(403, "You don't have permission to update this NGO");
    }

    // If not super admin and NGO is approved, restrict certain updates
    if (!isSuperAdmin && ngo.approvalStatus === 'approved') {
         const restrictedFields = ['registrationNumber', 'verificationDocuments'];
        const hasRestrictedUpdates = restrictedFields.some(field => updates[field]);
        
        if (hasRestrictedUpdates) {
            throw new ApiError(403, "Cannot modify restricted fields after approval. Contact super admin.");
        }
        
        if (updates.walletAddress) {
            const currentWallet = ngo.walletAddress?.toLowerCase();
            const incomingWallet = String(updates.walletAddress).toLowerCase();

            if (currentWallet && currentWallet !== incomingWallet) {
                throw new ApiError(403, "Wallet address cannot be changed after approval. Contact super admin.");
            }
        }
    }

    // Handle JSON field updates
    if (updates.address) {
        updates.address = safeJSONParse(updates.address, 'address');
    }
    if (updates.contactDetails) {
        updates.contactDetails = safeJSONParse(updates.contactDetails, 'contactDetails');
    }
    if (updates.focusAreas) {
        updates.focusAreas = safeJSONParse(updates.focusAreas, 'focusAreas');
    }

    // Handle file uploads if any
    if (req.files) {
        // Update cover image
        if (req.files.coverImage?.[0]) {
            const coverImageUpload = await uploadOnCloudinary(req.files.coverImage[0].path, 'ngos/cover');
            updates.coverImage = coverImageUpload?.url || ngo.coverImage;
        }

        // Add new verification documents
        if (req.files.verificationDocuments?.length > 0) {
            const newDocs = await uploadMultipleFiles(req.files.verificationDocuments, 'ngos/documents');
            updates.verificationDocuments = [...(ngo.verificationDocuments || []), ...newDocs];
        }

        // Add new photo gallery images
        if (req.files.photoGallery?.length > 0) {
            const newPhotos = await uploadMultipleFiles(req.files.photoGallery, 'ngos/gallery');
            updates.photoGallery = [...(ngo.photoGallery || []), ...newPhotos];
        }
    }

    const updatedNGO = await NGO.findByIdAndUpdate(
        ngoId,
        { $set: updates },
        { new: true, runValidators: true }
    ).populate('registeredBy', 'name email').populate('approvedBy', 'name email');

    return res.status(200).json(
        new ApiResponse(200, updatedNGO, "NGO updated successfully")
    );
});

// Delete NGO (Super Admin only)
export const deleteNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;

    const ngo = await NGO.findByIdAndDelete(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    // Optionally update the registered user's role
    await User.findByIdAndUpdate(ngo.registeredBy, {
        $unset: { ngoId: "", ngoName: "", ngoLocation: "" },
        role: 'user' // Reset role to user
    });

    return res.status(200).json(
        new ApiResponse(200, { deletedNgoId: ngoId }, "NGO deleted successfully")
    );
});

// Get NGO dashboard stats
export const getNGODashboard = asyncHandler(async (req, res) => {
    // Try to find NGO by registeredBy first, then by ngoId from user
    let ngo = await NGO.findOne({ registeredBy: req.user._id });
    
    // If not found by registeredBy, try using user's ngoId
    if (!ngo && req.user.ngoId) {
        ngo = await NGO.findById(req.user.ngoId);
    }
    
    if (!ngo) {
        throw new ApiError(404, "NGO not found for this user");
    }

    // Get related statistics
    const { Transaction } = await import("../models/transaction.model.js");
    const { FundraisingCase } = await import("../models/fundraisingCase.model.js");
    const { Product } = await import("../models/product.model.js");

    // Run all queries in parallel for better performance
    const [
        totalDonationsResult,
        activeCases,
        completedCases,
        totalProducts,
        recentTransactions,
        recentCases
    ] = await Promise.all([
        // Total donations
        Transaction.aggregate([
            { 
                $match: { 
                    ngo: ngo._id, 
                    transactionType: { $in: ['transfer', 'case-donation', 'product-donation'] } 
                } 
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        
        // Active fundraising cases
        FundraisingCase.countDocuments({ 
            associatedNGO: ngo._id, 
            status: 'active' 
        }),
        
        // Completed fundraising cases
        FundraisingCase.countDocuments({ 
            associatedNGO: ngo._id, 
            status: 'completed' 
        }),
        
        // Total products
        Product.countDocuments({ associatedNGO: ngo._id }),
        
        // Recent 5 transactions
        Transaction.find({ ngo: ngo._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('fromUser', 'name email')
            .lean(),
        
        // Recent 5 fundraising cases
        FundraisingCase.find({ associatedNGO: ngo._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
    ]);

    const dashboardData = {
        ngo: {
            _id: ngo._id,
            ngoName: ngo.ngoName,
             slug: ngo.slug,
            registrationNumber: ngo.registrationNumber,
            approvalStatus: ngo.approvalStatus,
            coverImage: ngo.coverImage,
            walletAddress: ngo.walletAddress,
            address: ngo.address,
            contactDetails: ngo.contactDetails,
            description: ngo.description,
            mission: ngo.mission,
            focusAreas: ngo.focusAreas,
            rejectionReason: ngo.rejectionReason,
            approvalRemarks: ngo.approvalRemarks,
            approvalDate: ngo.approvalDate,
            totalDonationsReceived: ngo.totalDonationsReceived
        },
        stats: {
            totalDonations: totalDonationsResult[0]?.total || 0,
            activeCases,
            completedCases,
            totalProducts
        },
        recentActivity: {
            transactions: recentTransactions,
            fundraisingCases: recentCases
        }
    };

    return res.status(200).json(
        new ApiResponse(200, dashboardData, "NGO dashboard data fetched successfully")
    );
});

// Search NGOs
export const searchNGOs = asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
        throw new ApiError(400, "Search query is required");
    }

    const ngos = await NGO.find({
        $and: [
            { approvalStatus: 'approved' }, // Only search approved NGOs
            {
                $or: [
                    { ngoName: { $regex: new RegExp(q, 'i') } },
                    { description: { $regex: new RegExp(q, 'i') } },
                    { mission: { $regex: new RegExp(q, 'i') } },
                    { 'address.city': { $regex: new RegExp(q, 'i') } },
                    { focusAreas: { $regex: new RegExp(q, 'i') } }
                ]
            }
        ]
    })
    .select('ngoName slug coverImage description address.city focusAreas')
    .limit(parseInt(limit))
    .lean();

    return res.status(200).json(
        new ApiResponse(200, ngos, "NGOs searched successfully")
    );
});