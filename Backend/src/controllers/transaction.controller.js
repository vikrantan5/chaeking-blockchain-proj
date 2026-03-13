import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// ✅ Create a transaction: supports transfer / withdrawal / registration
const donateToTemple = asyncHandler(async (req, res) => {
    const {
        amount,
        txHash,
        gasPrice,
        transactionFee,
        purpose,
        status,
        templeWalletAddress,
        cryptoType = "matic", // Default to MATIC
    } = req.body;

    if (!amount || !txHash || !gasPrice || !transactionFee || !purpose || !status) {
        throw new ApiError(400, "All fields are required");
    }

    if (!templeWalletAddress) {
        throw new ApiError(400, "Temple wallet address is required.");
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        throw new ApiError(400, "Invalid donation amount");
    }

    // ✅ Validate gasPrice & transactionFee
    if (isNaN(gasPrice) || isNaN(transactionFee)) {
        throw new ApiError(400, "Invalid gasPrice or transactionFee");
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "failed"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    // Validate purpose
    if (typeof purpose !== "string" || purpose.trim() === "") {
        throw new ApiError(400, "Invalid purpose");
    }

    // Check if transaction with the same txHash already exists
    const existingTransaction = await Transaction.findOne({ txHash });
    if (existingTransaction) {
        throw new ApiError(400, "Transaction with this hash already exists");
    }

    // Check if the sender exists and is authenticated
    const sender = req.user;
    if (!sender || !sender._id) {
        throw new ApiError(401, "Unauthorized: Sender not authenticated");
    }

    const templeAdmin = await User.findOne({
        walletAddress: templeWalletAddress.toLowerCase(),
        role: "templeAdmin",
        status: "active",
    });

    if (!templeAdmin) {
        throw new ApiError(404, "Temple admin not found or inactive");
    }

    // ✅ Create transaction
    const transaction = await Transaction.create({
        transactionType: "transfer",
        sender: sender._id,
        receiver: templeAdmin._id,
        amount,
        txHash,
        gasPrice,
        transactionFee,
        status,
        purpose,
        cryptoType: cryptoType.toLowerCase(), // Ensure it's lowercase
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                transaction,
                "Donation recorded successfully"
            )
        );
});

// ✅ Donation History (only for transfers made by user)
const donationHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(400, "User ID not found");
    }

    const donations = await Transaction.find({
        sender: userId,
        transactionType: "transfer",
    })
        .populate({
            path: "receiver",
            select: "templeName templeLocation",
        })
        .populate({
            path: "sender",
            select: "name walletAddress",
        })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, donations, "Donation history fetched successfully")
        );
});

// ✅ Get transaction by txHash (for receipt page)
const getTransactionByTxHash = asyncHandler(async (req, res) => {
    const { txHash } = req.query;

    if (!txHash) {
        throw new ApiError(400, "Transaction hash is required");
    }

    const transaction = await Transaction.findOne({ txHash })
        .populate({
            path: "sender",
            select: "name walletAddress", 
        })
        .populate({
            path: "receiver",
            select: "templeName templeLocation walletAddress", 
        });

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transaction,
                "Transaction details fetched successfully"
            )
        );
});

const generateTempleReport = asyncHandler(async (req, res) => {
    const templeId = req.user._id;
    const { type } = req.query; // type = 'weekly' | 'monthly'

    if (!templeId || !['weekly', 'monthly'].includes(type)) {
        throw new ApiError(400, "Invalid temple ID or type");
    }

    const endDate = new Date();
    let startDate = new Date();

    if (type === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
    } else if (type === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 1);
    }

    const reportData = await Transaction.find({
        receiver: templeId,
        transactionType: "transfer",
        createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 })
        .populate({
            path: "receiver",
            select: "templeName templeLocation _id"
        });

    const totalAmount = reportData.reduce((sum, txn) => sum + txn.amount, 0);
    const templeInfo = reportData[0]?.receiver || null;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            report: reportData,
            templeInfo,
            totalTransactions: reportData.length,
            totalAmountDonated: totalAmount
        }, `${type} report generated`));
});

const templeDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    const donations = await Transaction.find({
        receiver: templeId,
        transactionType: "transfer"
    })
        .populate({
            path: "sender",
            select: "name walletAddress",
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(
        200,
        donations,
        "Donations received by temple fetched successfully"
    ));
});

const recentTempleDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    const donations = await Transaction.find({
        receiver: templeId,
        transactionType: "transfer",
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
            path: "sender",
            select: "name",
        });

    const mapped = donations.map((txn) => ({
        donor: txn.sender?.name || "Anonymous",
        amount: `${txn.amount.toLocaleString()} MATIC`,
        date: new Date(txn.createdAt).toLocaleDateString(),
        time: new Date(txn.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        purpose: txn.purpose,
    }));

    return res.status(200).json(new ApiResponse(200, mapped, "Recent temple donations fetched"));
});

const templeMonthlyDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(templeId)) {
        throw new ApiError(400, "Invalid temple ID format");
    }

    try {
        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(templeId.toString()),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" },
                },
            },
            {
                $sort: { "_id": 1 },
            },
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formatted = monthlyData.map((item) => ({
            month: monthNames[item._id - 1],
            amount: item.total,
        }));

        return res.status(200).json(new ApiResponse(200, formatted, "Monthly donation stats"));
    } catch (err) {
        console.error("🔴 Aggregation Error:", err); // View the full stack trace
        return res.status(500).json(new ApiResponse(500, null, "Internal error during aggregation", err));
    }
});

const getTotalDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    try {
        // Get total confirmed donations for this temple
        const result = await Transaction.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(templeId),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalMATIC: { $sum: "$amount" },
                },
            },
        ]);

        const totalMATIC = result[0]?.totalMATIC || 0;

        return res.status(200).json(
            new ApiResponse(200, {
                totalMATIC,
            }, "Total donations fetched successfully")
        );
    } catch (err) {
        console.error("Error calculating total donations:", err);
        throw new ApiError(500, "Failed to fetch total donations");
    }
});

const recentDonations = asyncHandler(async (req, res) => {
    const donations = await Transaction.find({ transactionType: "transfer" })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate({
            path: "receiver",
            select: "templeName"
        });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            donations,
            "Recent 4 donations fetched successfully"
        ));
});

const getUserTotalDonations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    try {
        const result = await Transaction.aggregate([
            {
                $match: {
                    sender: new mongoose.Types.ObjectId(userId),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalMATIC: { $sum: "$amount" },
                },
            },
        ]);

        const totalMATIC = result[0]?.totalMATIC || 0;

        return res.status(200).json(
            new ApiResponse(
                200,
                { totalMATIC },
                "Total donations by user fetched successfully"
            )
        );
    } catch (err) {
        console.error("Error fetching user's total donations:", err);
        throw new ApiError(500, "Failed to fetch user's total donations");
    }
});

const getUserMonthlyDonation = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Transaction.aggregate([
        {
            $match: {
                sender: new mongoose.Types.ObjectId(userId),
                transactionType: "transfer",
                status: "confirmed",
                createdAt: { $gte: startOfMonth, $lte: now },
            },
        },
        {
            $group: {
                _id: null,
                totalMonthlyMATIC: { $sum: "$amount" },
            },
        },
    ]);

    const totalMonthlyMATIC = result[0]?.totalMonthlyMATIC || 0;

    return res.status(200).json(
        new ApiResponse(200, { totalMonthlyMATIC }, "User's monthly donations fetched successfully")
    );
});

// ✅ Record Blockchain Donation (NGO, Case, Product)
const recordBlockchainDonation = asyncHandler(async (req, res) => {
    const {
        donationType, // "ngo-donation", "case-donation", "product-donation"
        amount,
        txHash,
        gasPrice,
        transactionFee,
        ngoId,
        caseId,
        productId,
        cryptoType = "eth",
    } = req.body;

    // Validation
    if (!donationType || !amount || !txHash || !gasPrice || !transactionFee) {
        throw new ApiError(400, "All fields are required");
    }

    if (!["ngo-donation", "case-donation", "product-donation"].includes(donationType)) {
        throw new ApiError(400, "Invalid donation type");
    }

    if (isNaN(amount) || Number(amount) <= 0) {
        throw new ApiError(400, "Invalid donation amount");
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ txHash });
    if (existingTransaction) {
        throw new ApiError(400, "Transaction already recorded");
    }

    const sender = req.user;
    if (!sender || !sender._id) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    // Build transaction data
    const transactionData = {
        transactionType: donationType,
        sender: sender._id,
        amount,
        txHash,
        gasPrice,
        transactionFee,
        status: "confirmed",
        cryptoType: cryptoType.toLowerCase(),
        purpose: `${donationType} via blockchain`,
    };

    // Add specific references based on donation type
    if (donationType === "ngo-donation" && ngoId) {
        transactionData.ngo = ngoId;
    } else if (donationType === "case-donation" && caseId) {
        transactionData.fundraisingCase = caseId;
        if (ngoId) transactionData.ngo = ngoId;
    } else if (donationType === "product-donation" && productId) {
        transactionData.product = productId;
        if (ngoId) transactionData.ngo = ngoId;
    }

    // Create transaction record
    const transaction = await Transaction.create(transactionData);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                transaction,
                "Blockchain donation recorded successfully"
            )
        );
});


// Get user dashboard statistics (all donation types)
const getUserDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    try {
        // Get all transactions by user
        const transactions = await Transaction.find({
            sender: userId,
            status: "confirmed",
            transactionType: { $in: ["ngo-donation", "case-donation", "product-donation"] }
        });

        // Calculate stats
        const totalDonated = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const caseDonations = transactions.filter(tx => tx.transactionType === "case-donation").length;
        const productDonations = transactions.filter(tx => tx.transactionType === "product-donation").length;
        const ngoDonations = transactions.filter(tx => tx.transactionType === "ngo-donation").length;

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    totalDonated,
                    caseDonations,
                    productDonations,
                    ngoDonations,
                    totalTransactions: transactions.length
                },
                "Dashboard statistics fetched successfully"
            )
        );
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        throw new ApiError(500, "Failed to fetch dashboard statistics");
    }
});

// Get complete payment history for user (all donation types with details)
const getUserPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    try {
        const transactions = await Transaction.find({
            sender: userId,
            transactionType: { $in: ["ngo-donation", "case-donation", "product-donation"] }
        })
            .populate({
                path: "ngo",
                select: "ngoName address walletAddress"
            })
            .populate({
                path: "fundraisingCase",
                select: "title description targetAmount"
            })
            .populate({
                path: "product",
                select: "productName description priceInCrypto"
            })
            .sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(
                200,
                transactions,
                "Payment history fetched successfully"
            )
        );
    } catch (err) {
        console.error("Error fetching payment history:", err);
        throw new ApiError(500, "Failed to fetch payment history");
    }
});


export {
    donateToTemple,
    donationHistory,
    generateTempleReport,
    templeDonations,
    recentTempleDonations,
    recentDonations,
    templeMonthlyDonations,
    getTotalDonations,
    getUserTotalDonations,
    getUserMonthlyDonation,
    getTransactionByTxHash,
    recordBlockchainDonation,
    getUserDashboardStats,
    getUserPaymentHistory
}
