import { Carousel } from '../models/carousel.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const addCarouselImage = asyncHandler(async (req, res) => {
    const { caption } = req.body;

    const { user } = req.user;
    if (!user || user.role !== "superAdmin") {
        throw new ApiError(403, "Only SuperAdmin can add carousel images");
    }

    // const files = req.files || {};
    const carouselImageFiles = req.files?.coverImage?.[0]?.path || "";
    if (!carouselImageFiles) {
        throw new ApiError(400, "Please upload a carousel Image !!");
    }

    // Check if a carousel image with the same caption already exists
    const existingCarousel = await Carousel.findOne({ caption });
    if (existingCarousel) {
        throw new ApiError(409, "A carousel image with this caption already exists");
    }

    let uploadedImage;
    try {
        uploadedImage = await uploadOnCloudinary(carouselImageFiles);
        if (!uploadedImage || !uploadedImage.secure_url) {
            throw new ApiError(500, "Failed to upload carousel image to Cloudinary");
        }
    } catch (error) {
        console.error("Error uploading carousel image to Cloudinary:", error);
        throw new ApiError(500, "Failed to upload carousel image");
    }

    // Check if a carousel image with the same URL already exists
    const existingImage = await Carousel.findOne({ imageUrl: uploadedImage.secure_url });
    if (existingImage) {
        throw new ApiError(409, "This carousel image already exists");
    }

    // Create carousel entry in the database
    const newCarousel = await Carousel.create({
        imageUrl: uploadedImage.secure_url,
        caption: caption,
        createdBy: req.user._id
    });

    // Return success response
    return res.status(201).json(
        new ApiResponse(201, newCarousel, "Carousel image added successfully")
    );
});

const getAllCarouselImages = asyncHandler(async (req, res) => { 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = "createdAt", order = "desc", fields } = req.query;

    // Validate sorting order
    const sortOrder = order === "asc" ? 1 : -1;

    // Build the query object
    const query = { active: true }; // Only fetch active carousel images

    try {
        // Count total documents matching the query
        const totalCarouselImages = await Carousel.countDocuments(query);

        // Fetch carousel images with pagination, sorting, and optional field selection
        const carousels = await Carousel.find(query)
            .sort({ [sortBy]: sortOrder }) // Dynamic sorting
            .skip(skip)
            .limit(limit)
            .select(fields ? fields.split(",").join(" ") : "-__v") // Optional field selection
            .lean();

        // Return response with pagination metadata
        return res.status(200).json(
            new ApiResponse(200, {
                carousels,
                pagination: {
                    total: totalCarouselImages,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCarouselImages / limit),
                    hasNextPage: page * limit < totalCarouselImages,
                    hasPrevPage: page > 1,
                },
            }, "Fetched all active carousel images successfully")
        );
    } catch (error) {
        console.error("Error fetching carousel images:", error);
        throw new ApiError(500, "Failed to fetch carousel images");
    }
});

const updateCarouselImage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate carousel image ID
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ApiError(400, "Valid Carousel image ID is required");
    }

    const { user } = req.user;
    if (!user || user.role !== "superAdmin") {
        throw new ApiError(403, "Only SuperAdmin can add carousel images");
    }

    // Find the carousel image by ID
    const carousel = await Carousel.findById(id);
    if (!carousel) {
        throw new ApiError(404, "Carousel image not found");
    }

    // Validate uploaded file
    const carouselImageLocalPath = req.file?.path
    if (!carouselImageLocalPath) {
        throw new ApiError(400, "Please upload a new cover image");
    }

    // Upload new cover image to Cloudinary
    let uploadedImage;
    try {
        uploadedImage = await uploadOnCloudinary(carouselImageLocalPath);
        if (!uploadedImage || !uploadedImage.secure_url || !uploadedImage.public_id) {
            throw new ApiError(500, "Failed to upload cover image to Cloudinary");
        }
    } catch (error) {
        console.error("Error uploading cover image to Cloudinary:", error);
        throw new ApiError(500, "Failed to upload cover image to Cloudinary");
    }

    // Delete old cover image from Cloudinary if it exists
    if (carousel.imageUrl) {
        const publicId = getPublicIdFromUrl(carousel.imageUrl);
        try {
            await deleteFromCloudinary(publicId, "image");
        } catch (err) {
            console.warn("Failed to delete old cover image from Cloudinary:", err.message);
        }
    }

    carousel.imageUrl = uploadedImage.secure_url;
    if (req.body.caption) {
        carousel.caption = req.body.caption;
    }
    await carousel.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                carousel, 
                "Carousel image updated successfully"
            )
    );
});

const deleteCarouselImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const { user } = req.user;
    if (!user || user.role !== "superAdmin") {
        throw new ApiError(403, "Only SuperAdmin can add carousel images");
    }

    // Find the carousel image by ID
    const carousel = await Carousel.findById(id);
    if (!carousel) {
        throw new ApiError(404, "Carousel image not found");
    }

    // Delete the image from Cloudinary
    if (carousel.imageUrl) {
        try {
            const publicId = getPublicIdFromUrl(carousel.imageUrl);
            await deleteFromCloudinary(publicId);
        } catch (error) {
            console.error("Error deleting image from Cloudinary:", error);
            throw new ApiError(500, "Failed to delete image from Cloudinary");
        }
    }

    // Delete the carousel entry from the database
    await carousel.deleteOne();

    // Return success response
    res.status(200).json(
        new ApiResponse(200, null, "Carousel image deleted successfully")
    );
});

export {
    addCarouselImage,
    getAllCarouselImages,
    updateCarouselImage,
    deleteCarouselImage,
}