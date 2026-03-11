import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const productSchema = new Schema({
    productName: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },

    category: {
        type: String,
        enum: ['food', 'medicine', 'education', 'clothing', 'shelter', 'emergency-kit', 'other'],
        required: true,
    },

    description: {
        type: String,
        required: [true, "Product description is required"],
        maxlength: 1000,
    },

    images: {
        type: [String], // Array of product image URLs
        default: [],
    },

    priceInCrypto: {
        type: Number,
        required: [true, "Price is required"],
        min: 0,
    },

    cryptoType: {
        type: String,
        default: "matic",
        lowercase: true,
    },

    stockQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },

    associatedNGO: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NGO",
        required: false, // Can be null if for any NGO
    },

    isAvailable: {
        type: Boolean,
        default: true,
    },

    specifications: {
        type: String,
        maxlength: 500,
    },

    totalDonated: {
        type: Number,
        default: 0,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

// Generate slug from product name
productSchema.pre("save", function (next) {
    if (this.isModified("productName")) {
        if (!this.productName) {
            return next(new Error("Product name is required to generate a slug."));
        }
        const timestamp = Date.now();
        this.slug = slugify(`${this.productName}-${timestamp}`, { lower: true });
    }

    // Auto-mark unavailable if out of stock
    if (this.stockQuantity === 0) {
        this.isAvailable = false;
    }

    next();
});

export const Product = mongoose.model("Product", productSchema);
