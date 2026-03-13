import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { FundraisingCase } from "../models/fundraisingCase.model.js";
import { NGO } from "../models/ngo.model.js";
import { Transaction } from "../models/transaction.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
// Create a new fundraising case (Super Admin only)
export const createCase = asyncHandler(async (req, res) => {
    const {
        caseTitle,
        caseType,
        description,
        beneficiaryDetails,
        associatedNGO,
        targetAmount,
        deadline
    } = req.body;

    // Validation
    if (!caseTitle || !caseType || !description || !beneficiaryDetails || !associatedNGO || !targetAmount || !deadline) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Verify NGO exists and is approved
    const ngo = await NGO.findById(associatedNGO);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }
    if (ngo.approvalStatus !== 'approved') {
        throw new ApiError(400, "NGO must be approved before creating cases");
    }

    // Handle file uploads
    let imageUrls = [];
    let documentUrls = [];

    if (req.files) {
        if (req.files.images) {
            for (const file of req.files.images) {
                const upload = await uploadOnCloudinary(file.path);
                if (upload?.url) imageUrls.push(upload.url);
            }
        }

        if (req.files.documents) {
            for (const file of req.files.documents) {
                const upload = await uploadOnCloudinary(file.path);
                if (upload?.url) documentUrls.push(upload.url);
            }
        }
    }

    // Create case
    const fundraisingCase = await FundraisingCase.create({
        caseTitle,
        caseType,
        description,
        beneficiaryDetails: JSON.parse(beneficiaryDetails),
        associatedNGO,
        targetAmount: parseFloat(targetAmount),
        deadline: new Date(deadline),
        images: imageUrls,
        documents: documentUrls,
        createdBy: req.user._id
    });

    await fundraisingCase.populate('associatedNGO', 'ngoName address.city');

    return res.status(201).json(
        new ApiResponse(201, fundraisingCase, "Fundraising case created successfully")
    );
});

// Get all fundraising cases (with filters)
export const getAllCases = asyncHandler(async (req, res) => {
    const { status, caseType, ngoId, search } = req.query;

    let filter = {};
    
    if (status) {
        filter.status = status;
    }

    if (caseType) {
        filter.caseType = caseType;
    }

    if (ngoId) {
        filter.associatedNGO = ngoId;
    }

    if (search) {
        filter.$or = [
            { caseTitle: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ];
    }

    const cases = await FundraisingCase.find(filter)
        .populate('associatedNGO', 'ngoName address.city walletAddress')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, cases, "Fundraising cases fetched successfully")
    );
});

// Get single case by ID or slug
export const getCaseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
      const queryConditions = [{ slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
        queryConditions.push({ _id: id });
    }

    const fundraisingCase = await FundraisingCase.findOne({
         $or: queryConditions
    })
        .populate({
            path: 'associatedNGO',
            select: 'ngoName address contactDetails walletAddress registeredBy',
            populate: {
                path: 'registeredBy',
                select: 'walletAddress name email'
            }
        })
        .populate('createdBy', 'name email')
        .populate('releasedBy', 'name email');

    if (!fundraisingCase) {
        throw new ApiError(404, "Fundraising case not found");
    }

    // Get donation transactions for this case
    const donations = await Transaction.find({
        fundraisingCase: fundraisingCase._id,
        transactionType: 'case-donation'
    })
           .populate('sender', 'name email walletAddress')
        .sort({ createdAt: -1 })
        .limit(10);

     const fundraisingCaseObj = fundraisingCase.toObject();
    if (
        fundraisingCaseObj?.associatedNGO &&
        !fundraisingCaseObj.associatedNGO.walletAddress &&
        fundraisingCaseObj.associatedNGO.registeredBy?.walletAddress
    ) {
        fundraisingCaseObj.associatedNGO.walletAddress = fundraisingCaseObj.associatedNGO.registeredBy.walletAddress;
    }

    return res.status(200).json(
         new ApiResponse(200, { case: fundraisingCaseObj, recentDonations: donations }, "Case fetched successfully")
    );
});

// Update case
export const updateCase = asyncHandler(async (req, res) => {
    const { caseId } = req.params;
    const updates = req.body;

    const fundraisingCase = await FundraisingCase.findById(caseId);
    if (!fundraisingCase) {
        throw new ApiError(404, "Case not found");
    }

    // Only super admin can update
    if (req.user.role !== 'superAdmin') {
        throw new ApiError(403, "Only super admin can update cases");
    }

    // Handle file uploads if any
    if (req.files) {
        if (req.files.images) {
            const newImages = [];
            for (const file of req.files.images) {
                const upload = await uploadOnCloudinary(file.path);
                if (upload?.url) newImages.push(upload.url);
            }
            updates.images = [...fundraisingCase.images, ...newImages];
        }
    }

    const updatedCase = await FundraisingCase.findByIdAndUpdate(
        caseId,
        { $set: updates },
        { new: true, runValidators: true }
    ).populate('associatedNGO', 'ngoName address.city');

    return res.status(200).json(
        new ApiResponse(200, updatedCase, "Case updated successfully")
    );
});

// Record case donation
export const recordCaseDonation = asyncHandler(async (req, res) => {
    const { caseId } = req.params;
    const { amount, txHash, gasPrice, transactionFee } = req.body;

    if (!amount || !txHash) {
        throw new ApiError(400, "Amount and transaction hash are required");
    }

    const fundraisingCase = await FundraisingCase.findById(caseId);
    if (!fundraisingCase) {
        throw new ApiError(404, "Case not found");
    }

    if (fundraisingCase.status !== 'active') {
        throw new ApiError(400, "This case is not accepting donations");
    }

    // Update case amount
    fundraisingCase.currentAmount += parseFloat(amount);
    fundraisingCase.totalDonors += 1;
    await fundraisingCase.save();

    // Create transaction record
    const transaction = await Transaction.create({
        transactionType: 'case-donation',
        sender: req.user._id,
        receiver: fundraisingCase.associatedNGO,
        amount: parseFloat(amount),
        txHash,
        status: 'confirmed',
        gasPrice: gasPrice || 0,
        transactionFee: transactionFee || 0,
        purpose: `Donation to case: ${fundraisingCase.caseTitle}`,
        fundraisingCase: caseId,
        ngo: fundraisingCase.associatedNGO,
        cryptoType: 'matic'
    });

    await transaction.populate('fundraisingCase', 'caseTitle');

    return res.status(201).json(
        new ApiResponse(201, { case: fundraisingCase, transaction }, "Donation recorded successfully")
    );
});

// Release case funds to NGO (Super Admin only)
export const releaseCaseFunds = asyncHandler(async (req, res) => {
    const { caseId } = req.params;

    const fundraisingCase = await FundraisingCase.findById(caseId)
        .populate('associatedNGO', 'ngoName walletAddress');

    if (!fundraisingCase) {
        throw new ApiError(404, "Case not found");
    }

    if (fundraisingCase.status !== 'completed') {
        throw new ApiError(400, "Case must be completed before releasing funds");
    }

    if (fundraisingCase.fundsReleased) {
        throw new ApiError(400, "Funds already released for this case");
    }

    // Mark as released
    fundraisingCase.fundsReleased = true;
    fundraisingCase.fundsReleasedDate = new Date();
    fundraisingCase.releasedBy = req.user._id;
    await fundraisingCase.save();

    // Update NGO stats
    await NGO.findByIdAndUpdate(
        fundraisingCase.associatedNGO._id,
        { $inc: { totalDonationsReceived: fundraisingCase.currentAmount } }
    );

    return res.status(200).json(
        new ApiResponse(200, fundraisingCase, "Case funds released successfully")
    );
});

// Close/Complete case manually (Super Admin only)
export const closeCase = asyncHandler(async (req, res) => {
    const { caseId } = req.params;
    const { status } = req.body; // 'completed' or 'closed'

    if (!status || !['completed', 'closed'].includes(status)) {
        throw new ApiError(400, "Valid status required (completed or closed)");
    }

    const fundraisingCase = await FundraisingCase.findById(caseId);
    if (!fundraisingCase) {
        throw new ApiError(404, "Case not found");
    }

    fundraisingCase.status = status;
    if (status === 'completed') {
        fundraisingCase.completedDate = new Date();
    }
    await fundraisingCase.save();

    return res.status(200).json(
        new ApiResponse(200, fundraisingCase, `Case ${status} successfully`)
    );
});

// Delete case (Super Admin only)
export const deleteCase = asyncHandler(async (req, res) => {
    const { caseId } = req.params;

    const fundraisingCase = await FundraisingCase.findByIdAndDelete(caseId);
    if (!fundraisingCase) {
        throw new ApiError(404, "Case not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Case deleted successfully")
    );
});
