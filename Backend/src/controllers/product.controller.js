import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { NGO } from "../models/ngo.model.js";
import { Transaction } from "../models/transaction.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
// Create a new product (Super Admin only)
export const createProduct = asyncHandler(async (req, res) => {
    const {
        productName,
        category,
        description,
        priceInCrypto,
        stockQuantity,
        associatedNGO,
        specifications
    } = req.body;

    // Validation
    if (!productName || !category || !description || !priceInCrypto || stockQuantity === undefined) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // If NGO is specified, verify it exists and is approved
    if (associatedNGO) {
        const ngo = await NGO.findById(associatedNGO);
        if (!ngo) {
            throw new ApiError(404, "NGO not found");
        }
        if (ngo.approvalStatus !== 'approved') {
            throw new ApiError(400, "NGO must be approved");
        }
    }

    // Handle file uploads (product images)
    let imageUrls = [];

    if (req.files && req.files.images) {
        for (const file of req.files.images) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload?.url) imageUrls.push(upload.url);
        }
    }

    // Create product
    const product = await Product.create({
        productName,
        category,
        description,
        priceInCrypto: parseFloat(priceInCrypto),
        stockQuantity: parseInt(stockQuantity),
        associatedNGO: associatedNGO || null,
        specifications,
        images: imageUrls,
        createdBy: req.user._id
    });

    if (associatedNGO) {
        await product.populate('associatedNGO', 'ngoName address.city');
    }

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

// Get all products (with filters)
export const getAllProducts = asyncHandler(async (req, res) => {
     const { category, ngoId, available, isAvailable, search } = req.query;
     const availability = available ?? isAvailable;
    let filter = {};
    
    if (category) {
        filter.category = category;
    }

    if (ngoId) {
        filter.associatedNGO = ngoId;
    }

     if (availability !== undefined) {
        filter.isAvailable = availability === 'true';
    }

    if (search) {
        filter.$or = [
            { productName: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ];
    }

    const products = await Product.find(filter)
        .populate('associatedNGO', 'ngoName address.city walletAddress')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched successfully")
    );
});

// Get single product by ID or slug
export const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const queryConditions = [{ slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
        queryConditions.push({ _id: id });
    }

    const product = await Product.findOne({
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
        .populate('createdBy', 'name email');

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const productObj = product.toObject();
    if (
        productObj?.associatedNGO &&
        !productObj.associatedNGO.walletAddress &&
        productObj.associatedNGO.registeredBy?.walletAddress
    ) {
        productObj.associatedNGO.walletAddress = productObj.associatedNGO.registeredBy.walletAddress;
    }


    return res.status(200).json(
        new ApiResponse(200, productObj, "Product fetched successfully")
    );
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Only super admin can update
    if (req.user.role !== 'superAdmin') {
        throw new ApiError(403, "Only super admin can update products");
    }

    // Handle file uploads if any
    if (req.files && req.files.images) {
        const newImages = [];
        for (const file of req.files.images) {
            const upload = await uploadOnCloudinary(file.path);
            if (upload?.url) newImages.push(upload.url);
        }
        updates.images = [...product.images, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: updates },
        { new: true, runValidators: true }
    ).populate('associatedNGO', 'ngoName address.city');

    return res.status(200).json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
});

// Record product donation
export const recordProductDonation = asyncHandler(async (req, res) => {
    const { productId } = req.params;
     const { ngoId, txHash, gasPrice, transactionFee, quantity = 1 } = req.body;
    const parsedQuantity = Number(quantity);

    if (!ngoId || !txHash) {
        throw new ApiError(400, "NGO ID and transaction hash are required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.isAvailable) {
        throw new ApiError(400, "Product is not available");
    }

      if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
        throw new ApiError(400, "Quantity should be a positive integer");
    }
     if (product.stockQuantity < parsedQuantity) {
        throw new ApiError(400, "Product is out of stock");
    }

    // Verify NGO
    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(404, "NGO not found");
    }

    if (ngo.approvalStatus !== 'approved') {
        throw new ApiError(400, "NGO must be approved");
    }

    // If product is associated with specific NGO, ensure it matches
    if (product.associatedNGO && product.associatedNGO.toString() !== ngoId) {
        throw new ApiError(400, "Product can only be donated to its associated NGO");
    }

    // Update product stats
    product.stockQuantity -= parsedQuantity;
    product.totalDonated += parsedQuantity;
    product.isAvailable = product.stockQuantity > 0;
    await product.save();

    // Create transaction record
    const totalAmount = product.priceInCrypto * parsedQuantity;
    const transaction = await Transaction.create({
        
        transactionType: 'product-donation',
        sender: req.user._id,
        receiver: ngo._id,
       amount: totalAmount,
        txHash,
        status: 'confirmed',
        gasPrice: gasPrice || 0,
        transactionFee: transactionFee || 0,
        purpose: `Product donation: ${product.productName} x${parsedQuantity}`,
        product: productId,
        ngo: ngoId,
        cryptoType: 'matic'
    });

    await transaction.populate('product', 'productName priceInCrypto');
    await transaction.populate('ngo', 'ngoName');

    // Update NGO stats
    await NGO.findByIdAndUpdate(
        ngoId,
        { $inc: { totalDonationsReceived: totalAmount } }
    );

    return res.status(201).json(
        new ApiResponse(201, { product, transaction }, "Product donation recorded successfully")
    );
});

// Update product stock
export const updateProductStock = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
        throw new ApiError(400, "Valid quantity required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    product.stockQuantity = parseInt(quantity);
    product.isAvailable = quantity > 0;
    await product.save();

    return res.status(200).json(
        new ApiResponse(200, product, "Product stock updated successfully")
    );
});

// Delete product (Super Admin only)
export const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Product deleted successfully")
    );
});

// Get product categories
export const getProductCategories = asyncHandler(async (req, res) => {
    const categories = [
        'food',
        'medicine',
        'education',
        'clothing',
        'shelter',
        'emergency-kit',
        'other'
    ];

    return res.status(200).json(
        new ApiResponse(200, categories, "Product categories fetched successfully")
    );
});
