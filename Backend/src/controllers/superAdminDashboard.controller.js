import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { io } from "../websocket.js"; 

const countUsers = asyncHandler(async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: "user" }); // Count only users with the "user" role

        // Emit WebSocket event for dashboard updates
        io.emit("dashboard-updates", {
            userCount: userCount, // Include user count in the WebSocket event
        });
        
        return res.status(200).json(
            new ApiResponse(200, { userCount }, "User count fetched successfully.")
        );
    } catch (error) {
        console.error("Error fetching user count:", error);
        throw new ApiError(500, "Failed to fetch user count.");
    }
});

const countNGOAdmins = asyncHandler(async (req, res) => {
    try {
        const verifiedCount = await User.countDocuments({ role: "ngoAdmin", status: "active" });
        const pendingCount = await User.countDocuments({ role: "ngoAdmin", status: "pending" });

        // Emit WebSocket event for dashboard updates
        io.emit("dashboard-updates", {
            verifiedNGOCount: verifiedCount,
            pendingNGOCount: pendingCount,
        });

        return res.status(200).json(
            new ApiResponse(200, { verifiedCount, pendingCount }, "NGO admin counts fetched successfully.")
        );
    } catch (error) {
        console.error("Error fetching NGO admin counts:", error);
        throw new ApiError(500, "Failed to fetch NGO admin counts.");
    }
});


// Get product sales history for superadmin
const getProductSalesHistory = asyncHandler(async (req, res) => {
    try {
        const productSales = await Transaction.find({
            transactionType: "product-donation",
            status: "confirmed"
        })
            .populate({
                path: "product",
                select: "productName description priceInCrypto category"
            })
            .populate({
                path: "ngo",
                select: "ngoName address"
            })
            .populate({
                path: "sender",
                select: "name email walletAddress"
            })
            .sort({ createdAt: -1 });

        // Calculate summary stats
        const totalSales = productSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
        const totalProducts = productSales.length;

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    sales: productSales,
                    summary: {
                        totalSales,
                        totalProducts,
                        totalTransactions: productSales.length
                    }
                },
                "Product sales history fetched successfully."
            )
        );
    } catch (error) {
        console.error("Error fetching product sales history:", error);
        throw new ApiError(500, "Failed to fetch product sales history.");
    }
});

export { 
    countUsers,
   countNGOAdmins,
    getProductSalesHistory
};