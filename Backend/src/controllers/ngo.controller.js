import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { NGO } from "../models/ngo.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Register a new NGO (by NGO admin)
export const registerNGO = asyncHandler(async (req, res) => {
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
    if (!ngoName || !registrationNumber || !address || !description || !mission || !walletAddress) {
        throw new ApiError(400, "All required fields must be provided");
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
        if (req.files.coverImage && req.files.coverImage[0]) {
            const coverImageUpload = await uploadOnCloudinary(req.files.coverImage[0].path);
            coverImageUrl = coverImageUpload?.url || "";
        }

        if (req.files.verificationDocuments) {
            for (const file of req.files.verificationDocuments) {
                const docUpload = await uploadOnCloudinary(file.path);
                if (docUpload?.url) {
                    verificationDocUrls.push(docUpload.url);
                }
            }
        }
    }

    // Create NGO
    const ngo = await NGO.create({
        ngoName,
        registrationNumber,
        address: JSON.parse(address),
        contactDetails: JSON.parse(contactDetails),
        description,
        mission,
        focusAreas: focusAreas ? JSON.parse(focusAreas) : [],
        walletAddress,
        coverImage: coverImageUrl,
        verificationDocuments: verificationDocUrls,
        registeredBy: req.user._id,
        approvalStatus: 'pending'
    });

    // Update user role to ngoAdmin
    await User.findByIdAndUpdate(req.user._id, {
        role: 'ngoAdmin',
        ngoName: ngoName,
        ngoLocation: `${address.city}, ${address.state}`
    });

    return res.status(201).json(
        new ApiResponse(201, ngo, "NGO registered successfully. Waiting for admin approval.")
    );
});

// Get all NGOs (with filters)
export const getAllNGOs = asyncHandler(async (req, res) => {
    const { status, focusArea, city } = req.query;

    let filter = {};
    
    if (status) {
        filter.approvalStatus = status;
    } else {
        // By default, show only approved NGOs to regular users
        if (req.user.role !== 'superAdmin') {
            filter.approvalStatus = 'approved';
        }
    }

    if (focusArea) {
        filter.focusAreas = { $in: [focusArea] };
    }

    if (city) {
        filter['address.city'] = new RegExp(city, 'i');
    }

    const ngos = await NGO.find(filter)
        .populate('registeredBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, ngos, "NGOs fetched successfully")
    );
});

// Get single NGO by ID or slug
export const getNGOById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ngo = await NGO.findOne({
        $or: [{ _id: id }, { slug: id }]
    })
        .populate('registeredBy', 'name email phone')
        .populate('approvedBy', 'name email');

    if (!ngo) {
        throw new ApiError(404, "NGO not found");
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
    
    await ngo.save();

    return res.status(200).json(
        new ApiResponse(200, ngo, "NGO approved successfully")
    );
});

// Reject NGO (Super Admin only)
export const rejectNGO = asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const { reason } = req.body;

    if (!reason) {
        throw new ApiError(400, "Rejection reason is required");
    }

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    ngo.approvalStatus = 'rejected';
    ngo.rejectionReason = reason;
    ngo.approvedBy = req.user._id;
    ngo.approvalDate = new Date();
    
    await ngo.save();

    return res.status(200).json(
        new ApiResponse(200, ngo, "NGO rejected")
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
    if (req.user.role !== 'superAdmin' && ngo.registeredBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this NGO");
    }

    // Handle file uploads if any
    if (req.files) {
        if (req.files.coverImage && req.files.coverImage[0]) {
            const coverImageUpload = await uploadOnCloudinary(req.files.coverImage[0].path);
            updates.coverImage = coverImageUpload?.url || ngo.coverImage;
        }

        if (req.files.photoGallery) {
            const newPhotos = [];
            for (const file of req.files.photoGallery) {
                const photoUpload = await uploadOnCloudinary(file.path);
                if (photoUpload?.url) {
                    newPhotos.push(photoUpload.url);
                }
            }
            updates.photoGallery = [...ngo.photoGallery, ...newPhotos];
        }
    }

    const updatedNGO = await NGO.findByIdAndUpdate(
        ngoId,
        { $set: updates },
        { new: true, runValidators: true }
    );

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

    return res.status(200).json(
        new ApiResponse(200, {}, "NGO deleted successfully")
    );
});

// Get NGO dashboard stats
export const getNGODashboard = asyncHandler(async (req, res) => {
    const ngo = await NGO.findOne({ registeredBy: req.user._id });
    
    if (!ngo) {
        throw new ApiError(404, "NGO not found for this user");
    }

    // Get related statistics
    const { Transaction } = await import("../models/transaction.model.js");
    const { FundraisingCase } = await import("../models/fundraisingCase.model.js");
    const { Product } = await import("../models/product.model.js");

    const totalDonations = await Transaction.aggregate([
        { $match: { ngo: ngo._id, transactionType: { $in: ['transfer', 'case-donation', 'product-donation'] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const activeCases = await FundraisingCase.countDocuments({ associatedNGO: ngo._id, status: 'active' });
    const completedCases = await FundraisingCase.countDocuments({ associatedNGO: ngo._id, status: 'completed' });
    const totalProducts = await Product.countDocuments({ associatedNGO: ngo._id });

    const dashboardData = {
        ngo,
        stats: {
            totalDonations: totalDonations[0]?.total || 0,
            activeCases,
            completedCases,
            totalProducts
        }
    };

    return res.status(200).json(
        new ApiResponse(200, dashboardData, "NGO dashboard data fetched successfully")
    );
});
