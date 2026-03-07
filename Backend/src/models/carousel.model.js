// models/carousel.model.js
import mongoose, { Schema } from "mongoose";

const carouselSchema = new Schema({
    imageUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

export const Carousel = mongoose.model("Carousel", carouselSchema);
