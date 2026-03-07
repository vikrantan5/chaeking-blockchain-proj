import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

const storeWalletAddressUtility = async (userId, role, walletAddress) => {
    if (!walletAddress) {
        throw new ApiError(400, "Wallet address is required");
    }

    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Validate the role
    if (user.role !== role) {
        throw new ApiError(403, `Access denied. Only ${role} can perform this action.`);
    }

    // Check if the wallet address is already connected
    if (user.walletAddress) {
        if (user.walletAddress !== walletAddress) {
            throw new ApiError(400, "You can only connect to the wallet address already stored in the database");
        }
        return {
            walletAddress: user.walletAddress,
            message: "Wallet address is already connected",
        };
    }

    // Update the wallet address
    user.walletAddress = walletAddress;
    await user.save({ validateBeforeSave: false });


    return {
        walletAddress: user.walletAddress,
        message: "Wallet address connected successfully",
    };
};

export { storeWalletAddressUtility };