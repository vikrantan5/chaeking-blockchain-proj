import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const fundraisingCaseSchema = new Schema({
    caseTitle: {
        type: String,
        required: [true, "Case title is required"],
        trim: true,
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },

    caseType: {
        type: String,
        enum: ['medical', 'emergency', 'education', 'disaster-relief', 'other'],
        required: true,
    },

    description: {
        type: String,
        required: [true, "Case description is required"],
        maxlength: 2000,
    },

    beneficiaryDetails: {
        name: { type: String, required: true },
        age: { type: Number },
        location: { type: String, required: true },
        story: { type: String, maxlength: 1000 },
    },

    images: {
        type: [String], // Array of image URLs
        default: [],
    },

    documents: {
        type: [String], // Supporting documents (medical reports, etc.)
        default: [],
    },

    associatedNGO: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NGO",
        required: true,
    },

    targetAmount: {
        type: Number,
        required: [true, "Target amount is required"],
        min: 0,
    },

    currentAmount: {
        type: Number,
        default: 0,
        min: 0,
    },

    cryptoType: {
        type: String,
        default: "matic",
        lowercase: true,
    },

    deadline: {
        type: Date,
        required: [true, "Deadline is required"],
    },

    status: {
        type: String,
        enum: ['active', 'completed', 'closed', 'expired'],
        default: 'active',
    },

    completedDate: {
        type: Date,
        default: null,
    },

    fundsReleasedDate: {
        type: Date,
        default: null,
    },

    fundsReleased: {
        type: Boolean,
        default: false,
    },

    releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    totalDonors: {
        type: Number,
        default: 0,
    },

    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
});

// Generate slug from case title
fundraisingCaseSchema.pre("save", function (next) {
    if (this.isModified("caseTitle")) {
        if (!this.caseTitle) {
            return next(new Error("Case title is required to generate a slug."));
        }
        const timestamp = Date.now();
        this.slug = slugify(`${this.caseTitle}-${timestamp}`, { lower: true });
    }

    // Calculate progress percentage
    if (this.targetAmount > 0) {
        this.progressPercentage = Math.min(
            Math.round((this.currentAmount / this.targetAmount) * 100),
            100
        );
    }

    // Auto-complete if target reached
    if (this.currentAmount >= this.targetAmount && this.status === 'active') {
        this.status = 'completed';
        this.completedDate = new Date();
    }

    // Check if expired
    if (this.deadline < new Date() && this.status === 'active') {
        this.status = 'expired';
    }

    next();
});

export const FundraisingCase = mongoose.model("FundraisingCase", fundraisingCaseSchema);
