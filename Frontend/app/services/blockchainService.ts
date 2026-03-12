import { ethers } from "ethers";
import { CONTRACTS, NGO_FUND_ABI, toBytes32 } from "@/lib/contractConfig";
import { toast } from "react-toastify";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private ngoFundContract: ethers.Contract | null = null;

  // Initialize provider and signer
  async initialize(): Promise<boolean> {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask is not installed");
      return false;
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contract
      this.ngoFundContract = new ethers.Contract(
        CONTRACTS.NGO_FUND_ADDRESS,
        NGO_FUND_ABI,
        this.signer
      );

      // Check network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== CONTRACTS.CHAIN_ID) {
        toast.error(`Please switch to Hardhat Localhost (Chain ID: ${CONTRACTS.CHAIN_ID})`);
        await this.switchNetwork();
      }

      return true;
    } catch (error) {
      console.error("Blockchain initialization error:", error);
      toast.error("Failed to initialize blockchain connection");
      return false;
    }
  }

  // Switch to correct network
  async switchNetwork(): Promise<void> {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CONTRACTS.CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${CONTRACTS.CHAIN_ID.toString(16)}`,
              chainName: "Hardhat Localhost",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [CONTRACTS.RPC_URL],
            },
          ],
        });
      }
    }
  }

  // Donate to NGO directly
  async donateToNGO(
    ngoWalletAddress: string,
    amountInEth: string
  ): Promise<{ success: boolean; txHash?: string; receipt?: any; error?: string }> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return { success: false, error: "Contract not initialized" };
      }

      toast.info("Please confirm the transaction in MetaMask...");

      const tx = await this.ngoFundContract.donateEthToNGO(ngoWalletAddress, {
        value: ethers.parseEther(amountInEth),
      });

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        receipt: receipt,
      };
    } catch (error: any) {
      console.error("Donate to NGO error:", error);
      return {
        success: false,
        error: error.message || "Transaction failed",
      };
    }
  }

  // Donate to a specific case
  async donateToCase(
    caseId: string,
    ngoWalletAddress: string,
    amountInEth: string
  ): Promise<{ success: boolean; txHash?: string; receipt?: any; error?: string }> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return { success: false, error: "Contract not initialized" };
      }

      const caseIdBytes32 = toBytes32(caseId);

      toast.info("Please confirm the transaction in MetaMask...");

      const tx = await this.ngoFundContract.donateToCase(
        caseIdBytes32,
        ngoWalletAddress,
        {
          value: ethers.parseEther(amountInEth),
        }
      );

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        receipt: receipt,
      };
    } catch (error: any) {
      console.error("Donate to case error:", error);
      return {
        success: false,
        error: error.message || "Transaction failed",
      };
    }
  }

  // Purchase donation product
  async purchaseDonationProduct(
    productId: string,
    ngoWalletAddress: string,
    priceInEth: string
  ): Promise<{ success: boolean; txHash?: string; receipt?: any; error?: string }> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return { success: false, error: "Contract not initialized" };
      }

      const productIdBytes32 = toBytes32(productId);

      toast.info("Please confirm the transaction in MetaMask...");

      const tx = await this.ngoFundContract.donateProduct(
        productIdBytes32,
        ngoWalletAddress,
        {
          value: ethers.parseEther(priceInEth),
        }
      );

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        receipt: receipt,
      };
    } catch (error: any) {
      console.error("Purchase product error:", error);
      return {
        success: false,
        error: error.message || "Transaction failed",
      };
    }
  }

  // Get NGO balance on blockchain
  async getNGOBalance(ngoWalletAddress: string): Promise<string> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return "0";
      }

      const balance = await this.ngoFundContract.getNGOEthBalance(ngoWalletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Get NGO balance error:", error);
      return "0";
    }
  }

  // Get case balance on blockchain
  async getCaseBalance(caseId: string): Promise<string> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return "0";
      }

      const caseIdBytes32 = toBytes32(caseId);
      const balance = await this.ngoFundContract.getCaseBalance(caseIdBytes32);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Get case balance error:", error);
      return "0";
    }
  }

  // Get product donation count
  async getProductDonationCount(productId: string): Promise<number> {
    try {
      if (!this.ngoFundContract) {
        await this.initialize();
      }

      if (!this.ngoFundContract) {
        return 0;
      }

      const productIdBytes32 = toBytes32(productId);
      const count = await this.ngoFundContract.getProductDonationCount(productIdBytes32);
      return Number(count);
    } catch (error) {
      console.error("Get product donation count error:", error);
      return 0;
    }
  }

  // Extract transaction details from receipt
  extractTransactionDetails(receipt: any): {
    gasPrice: string;
    gasUsed: string;
    transactionFee: string;
  } {
    const gasPrice = receipt?.gasPrice?.toString() || "0";
    const gasUsed = receipt?.gasUsed?.toString() || "0";
    const transactionFee = (
      BigInt(gasPrice) * BigInt(gasUsed)
    ).toString();

    return {
      gasPrice,
      gasUsed,
      transactionFee,
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
