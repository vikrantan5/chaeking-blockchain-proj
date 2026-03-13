import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ABI for NGORegistry contract
const NGO_REGISTRY_ABI = [
    "function registerNGO(address _ngoWallet) external",
    "function isRegistered(address _ngoWallet) view returns (bool)",
    "function superAdmin() view returns (address)"
];

/**
 * Get blockchain provider and signer
 */
export const getBlockchainProvider = () => {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
        throw new Error("RPC_URL not configured in environment variables");
    }
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return provider;
};

/**
 * Get wallet signer for transactions
 */
export const getSigner = () => {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY not configured in environment variables");
    }
    
    const provider = getBlockchainProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    return wallet;
};

/**
 * Get NGORegistry contract instance
 */
export const getNGORegistryContract = () => {
    const contractAddress = process.env.NGO_REGISTRY_ADDRESS;
    if (!contractAddress) {
        throw new Error("NGO_REGISTRY_ADDRESS not configured in environment variables");
    }
    
    const signer = getSigner();
    const contract = new ethers.Contract(contractAddress, NGO_REGISTRY_ABI, signer);
    return contract;
};

/**
 * Register an NGO wallet address on the blockchain
 * @param {string} ngoWalletAddress - The wallet address of the NGO to register
 * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
 */
export const registerNGOOnBlockchain = async (ngoWalletAddress) => {
    try {
        // Validate wallet address
        if (!ethers.isAddress(ngoWalletAddress)) {
            return {
                success: false,
                error: "Invalid wallet address format"
            };
        }

        const contract = getNGORegistryContract();
        
        // Check if already registered
        const isRegistered = await contract.isRegistered(ngoWalletAddress);
        if (isRegistered) {
            console.log(`NGO wallet ${ngoWalletAddress} is already registered on blockchain`);
            return {
                success: true,
                alreadyRegistered: true,
                message: "NGO already registered on blockchain"
            };
        }

        // Register the NGO
        console.log(`Registering NGO wallet ${ngoWalletAddress} on blockchain...`);
        const tx = await contract.registerNGO(ngoWalletAddress);
        console.log(`Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error("Error registering NGO on blockchain:", error);
        return {
            success: false,
            error: error.message || "Failed to register NGO on blockchain"
        };
    }
};

/**
 * Check if an NGO is registered on the blockchain
 * @param {string} ngoWalletAddress - The wallet address to check
 * @returns {Promise<boolean>}
 */
export const isNGORegisteredOnBlockchain = async (ngoWalletAddress) => {
    try {
        if (!ethers.isAddress(ngoWalletAddress)) {
            return false;
        }
        
        const contract = getNGORegistryContract();
        const isRegistered = await contract.isRegistered(ngoWalletAddress);
        return isRegistered;
    } catch (error) {
        console.error("Error checking NGO registration on blockchain:", error);
        return false;
    }
};

/**
 * Get the super admin address from the contract
 * @returns {Promise<string>}
 */
export const getSuperAdminAddress = async () => {
    try {
        const contract = getNGORegistryContract();
        const superAdmin = await contract.superAdmin();
        return superAdmin;
    } catch (error) {
        console.error("Error getting super admin address:", error);
        throw error;
    }
};
