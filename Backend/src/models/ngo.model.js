import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    eventDate: { type: Date, required: true },
}, { _id: false });

const ngoDetailsSchema = new Schema({
    ngoName: {
        type: String,
        required: [true, "NGO name is required"],
        trim: true,
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },

    registrationNumber: {
        type: String,
        required: [true, "Registration number is required"],
        unique: true,
        trim: true,
    },

    coverImage: {
        type: String, // URL to cover image
        default: "",
    },

    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, default: "India" },
        pincode: { type: String, required: true },
    },

    contactDetails: {
        phone: { type: String, required: true },
        email: { type: String, required: true },
        facebook: { type: String },
        instagram: { type: String },
        website: { type: String },
    },

    description: {
        type: String,
        maxlength: 500,
        required: [true, "NGO description is required"],
    },

    mission: {
        type: String,
        maxlength: 500,
        required: [true, "NGO mission is required"],
    },

    focusAreas: {
        type: [String],
        default: [],
        // e.g., ["Education", "Healthcare", "Poverty", "Environment"]
    },

    photoGallery: {
        type: [String], // Array of image URLs
        default: [],
    },

    verificationDocuments: {
        type: [String], // Array of document URLs (registration certificate, 12A, 80G, etc.)
        default: [],
    },

    upcomingEvents: {
        type: [eventSchema],
        default: [],
    },

    walletAddress: {
        type: String,
        required: [true, "Wallet address is required"],
        lowercase: true,
        trim: true,
    },

    // Approval fields
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    approvalDate: {
        type: Date,
        default: null,
    },

    approvalRemarks: {
        type: String,
        default: "",
    },

    rejectionReason: {
        type: String,
        default: "",
    },

    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },

    // Statistics
    totalDonationsReceived: {
        type: Number,
        default: 0,
    },

    totalWithdrawals: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Generate slug from NGO name
ngoDetailsSchema.pre("save", function (next) {
    if (this.isModified("ngoName") || this.isModified("address.city")) {
        if (!this.ngoName || !this.address.city) {
            return next(new Error("NGO name and city are required to generate a slug."));
        }
        this.slug = slugify(`${this.ngoName}-${this.address.city}`, { lower: true});
    }
    next();
});

export const NGO = mongoose.model("NGO", ngoDetailsSchema);
