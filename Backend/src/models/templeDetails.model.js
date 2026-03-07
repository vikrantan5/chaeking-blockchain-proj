import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    eventDate: { type: Date, required: true },
}, { _id: false });

const specialCeremonySchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateTime: { type: Date, required: true },
}, { _id: false });

const templeDetailsSchema = new Schema({
    templeName: {
        type: String,
        required: [true, "Temple name is required"],
        trim: true,
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },

    coverImage: {
        type: String, // URL to cover image
        default: "",
    },
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, default: "India" },
    },

    activitiesAndServices: {
        type: [String],
        default: [],
    },

    darshanTimings: {
        morning: { type: String },  
        evening: { type: String }, 
    },

    specialCeremonies: {
        type: [specialCeremonySchema],
        default: [],
    },

    upcomingEvents: {
        type: [eventSchema],
        default: [],
    },

    photoGallery: {
        type: [String], // Array of image URLs
        default: [],
    },

    description: {
        type: String,
        maxlength: 200,
        required: [true, "Temple description is required"],
    },

    history: {
        type: String,
        maxlength: 500,
        required: [true, "Temple history is required"],
    },

    contactDetails: {
        phone: { type: String },
        email: { type: String },
        facebook: { type: String },
        instagram: { type: String },
        website: { type: String },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },

    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    verificationRemarks: {
        type: String,
        default: "",
    },

    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },
}, {
    timestamps: true,
});

// Generate slug from temple name
templeDetailsSchema.pre("save", function (next) {
    if (this.isModified("templeName") || this.isModified("location.city")) {
        if (!this.templeName || !this.location.city) {
            return next(new Error("Temple name and city are required to generate a slug."));
        }
        this.slug = slugify(`${this.templeName}-${this.location.city}`, { lower: true});
    }
    next();
});

export const Temple = mongoose.model("Temple", templeDetailsSchema);
