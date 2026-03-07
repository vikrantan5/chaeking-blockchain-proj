import { Review } from "../models/reviews.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Temple } from "../models/templeDetails.model.js";

// POST: User submits a review
const createReview = asyncHandler(async (req, res) => {
    const { templeId, rating, comment } = req.body;

    // Validate required fields
    if (!templeId || !rating || !comment) {
        throw new ApiError(400, "Temple ID, rating, and comment are required");
    }

    // Validate rating (should be between 1 and 5)
    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // Validate temple existence
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || user.role !== "user") {
        throw new ApiError(403, "Only users with the role 'user' can submit reviews");
    }

    // Check if the user has already submitted a review for this temple
    const existingReview = await Review.findOne({ user: userId, temple: templeId });
    if (existingReview) {
        throw new ApiError(400, "You have already submitted a review for this temple");
    }

    const newReview = await Review.create({
        user: userId,
        temple: templeId,
        rating,
        comment,
        approved: false // Default to false, needs admin approval
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newReview,
                "Review submitted for approval"
            ))
});

const getReviewsForTemple = async (req, res) => {

    const { templeId } = req.params;
    const { approved } = req.query;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    // Validate temple existence
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    const filter = { temple: templeId };
    if (approved !== undefined) {
        filter.approved = approved === "true";
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || user.role !== "templeAdmin") {
        throw new ApiError(403, "You are not authorized to view all reviews for this temple");
    }

    const reviews = await Review.find(filter)
        .populate("user", "name -refreshToken")
        .sort({ createdAt: -1 });

    if (reviews.length < 1) {
        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                "No reviews available for this temple"
            )
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                reviews,
                "Reviews fetched successfully"
            )
        );
};

const approveReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    // Validate reviewId
    if (!reviewId || !/^[0-9a-fA-F]{24}$/.test(reviewId)) {
        throw new ApiError(400, "Valid Review ID is required");
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || user.role !== "templeAdmin") {
        throw new ApiError(403, "You are not authorized to view all reviews for this temple");
    }

    // Find the review to approve
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Check if the review is already approved
    if (review.approved) {
        throw new ApiError(400, "Review is already approved");
    }

    // Approve the review
    review.approved = true;
    await review.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            review,
            "Review approved successfully"
        )
    );
});

const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    // Validate reviewId
    if (!reviewId || !/^[0-9a-fA-F]{24}$/.test(reviewId)) {
        throw new ApiError(400, "Valid Review ID is required");
    }

    // Find the review to delete
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Check if the user is authorized to delete the review
    const userId = req.user._id; // Assuming `req.user` is populated by the auth middleware
    if (review.user.toString() !== userId.toString() && req.user.role !== "templeAdmin") {
        throw new ApiError(403, "You are not authorized to delete this review");
    }

    // Delete the review
    await review.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Review deleted successfully")
    );
});

const getPublicReviewsForTemple = asyncHandler(async (req, res) => {
    const { templeId } = req.params;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    // Validate temple existence
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Fetch only approved reviews for the temple
    const reviews = await Review.find({ temple: templeId, approved: true })
        .populate("user", "name -refreshToken") // Populate user details (name only)
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            reviews,
            "Approved reviews fetched successfully"
        )
    );
});

export {
    createReview,
    getReviewsForTemple,
    approveReview,
    deleteReview,
    getPublicReviewsForTemple
}
