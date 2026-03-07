import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    temple: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Temple", 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5 
    },
    comment: { 
        type: String,
        required: true,
    },
    approved: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
},{
    timestamps: true
});

export const Review =  mongoose.model("Review", reviewSchema);
