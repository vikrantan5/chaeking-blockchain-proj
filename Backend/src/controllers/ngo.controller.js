import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { NGO } from "../models/ngo.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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

    // Create NGO
    const ngo = await NGO.create({
        ngoName,
        registrationNumber,
        address: parsedAddress,
        contactDetails: parsedContactDetails,
        description,
        mission,
        focusAreas: parsedFocusAreas,
        walletAddress,
        coverImage: coverImageUrl,
        verificationDocuments: verificationDocUrls,
        registeredBy: req.user._id,
        approvalStatus: 'pending',
        registeredAt: new Date()
    });

    // Update user role to ngoAdmin
    await User.findByIdAndUpdate(req.user._id, {
        role: 'ngoAdmin',
        ngoId: ngo._id,
        ngoName: ngoName,
        ngoLocation: parsedAddress ? `${parsedAddress.city || ''}, ${parsedAddress.state || ''}`.replace(/^, |, $/g, '') : ''
    });

    return res.status(201).json(
        new ApiResponse(201, ngo, "NGO registered successfully. Waiting for admin approval.")
    );
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
        .populate('registeredBy', 'name email phone')
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

    // Update user role if needed
    await User.findByIdAndUpdate(ngo.registeredBy, {
        role: 'ngoAdmin',
        isVerified: true
    });

    return res.status(200).json(
        new ApiResponse(200, ngo, "NGO approved successfully")
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
        const restrictedFields = ['registrationNumber', 'walletAddress', 'verificationDocuments'];
        const hasRestrictedUpdates = restrictedFields.some(field => updates[field]);
        
        if (hasRestrictedUpdates) {
            throw new ApiError(403, "Cannot modify restricted fields after approval. Contact super admin.");
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
    const ngo = await NGO.findOne({ registeredBy: req.user._id });
    
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
            approvalStatus: ngo.approvalStatus,
            coverImage: ngo.coverImage,
            walletAddress: ngo.walletAddress
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