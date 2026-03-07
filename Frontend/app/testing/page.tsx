"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useMetamask } from "@/app/hooks/useMetamask"; // Adjust path as needed

// Import your ABI and address from the utility file
import {
  TEMPLE_REGISTRY_ABI,
  TEMPLE_REGISTRY_ADDRESS,
} from "@/app/utils/TempleRegistry"; // Adjust path

export default function TempleRegistryInteractions() {
  const { account, provider, connectWallet } = useMetamask();
  const [templeAddressToRegister, setTempleAddressToRegister] =
    useState<string>("");
  const [templeAddressToRemove, setTempleAddressToRemove] =
    useState<string>("");
  const [allTemples, setAllTemples] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingGetTemples, setLoadingGetTemples] = useState<boolean>(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null); // New state for gas used
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  ); // New state for total cost

  // --- Common Error Handling and Gas Info for Transactions ---
  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null); // Clear previous gas info
    setLastTransactionCost(null); // Clear previous cost info

    try {
      toast.info("Transaction sent. Waiting for confirmation...");
      const tx = await contractCall;
      console.log("Transaction hash:", tx.hash);
      toast.info(`Transaction hash: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // --- Extract Gas Used and Calculate Cost ---
      if (receipt) {
        const gasUsed = receipt.gasUsed; // This is a BigInt
        // effectiveGasPrice is generally what's actually paid for EIP-1559 transactions
        // For legacy transactions, gasPrice would be available on the receipt
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString()); // Convert BigInt to string for display
        if (totalCostWei) {
          // Format total cost to ETH from Wei
          setLastTransactionCost(ethers.formatEther(totalCostWei));
        }

        toast.success(successMessage + ` Transaction hash: ${receipt.hash}`);
      } else {
        toast.success(successMessage + ` (Receipt not available immediately)`);
      }
      // --- End Gas Extraction ---

      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = "Transaction failed.";
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user.";
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Register Temple Function ---
  const handleRegisterTemple = async () => {
    if (!provider || !account) {
      toast.error("Please connect your wallet first.");
      await connectWallet();
      return;
    }
    if (!ethers.isAddress(templeAddressToRegister)) {
      toast.error("Invalid temple address to register.");
      return;
    }

    try {
      const signer = await provider?.getSigner();
      const registry = new ethers.Contract(
        TEMPLE_REGISTRY_ADDRESS,
        TEMPLE_REGISTRY_ABI,
        signer
      );

      // Gas Estimation with buffer
      const gasLimit = BigInt("300000"); // Or estimatedGas * BigInt(150) / BigInt(100);

const success = await handleTransaction(
  registry.registerTemple(templeAddressToRegister, { gasLimit: gasLimit }), // Make sure this is present and correct
  `Temple ${templeAddressToRegister} registered successfully!`
); // 50% buffer

      if (success) {
        setTempleAddressToRegister(""); // Clear input on success
        await handleGetAllTemples(); // Refresh list after registration
      }
    } catch (err: any) {
      console.error("Error preparing register transaction:", err);
      toast.error("Failed to prepare register transaction: " + err.message);
      setLoading(false);
    }
  };

  // --- Remove Temple Function ---
  const handleRemoveTemple = async () => {
    if (!provider || !account) {
      toast.error("Please connect your wallet first.");
      await connectWallet();
      return;
    }
    if (!ethers.isAddress(templeAddressToRemove)) {
      toast.error("Invalid temple address to remove.");
      return;
    }

    // ... inside handleRemoveTemple

    try {
      const signer = await provider?.getSigner();
      const registry = new ethers.Contract(
        TEMPLE_REGISTRY_ADDRESS,
        TEMPLE_REGISTRY_ABI,
        signer
      );

      // --- Change this line to a very high fixed value for testing ---
      // const estimatedGas = await registry.removeTemple.estimateGas(templeAddressToRemove);
      // const gasLimit = estimatedGas * BigInt(150) / BigInt(100); // 50% buffer

      const gasLimit = BigInt("300000"); // Try 300,000 or even 500,000 to be absolutely sure

      console.log(`Setting Gas Limit for removeTemple: ${gasLimit}`); // Add this line to confirm in console

      const success = await handleTransaction(
        registry.removeTemple(templeAddressToRemove, { gasLimit }),
        `Temple ${templeAddressToRemove} removed successfully!`
      );
      if (success) {
        setTempleAddressToRemove(""); // Clear input on success
        await handleGetAllTemples(); // Refresh list after removal
      }
    } catch (err: any) {
      console.error("Error preparing remove transaction:", err);
      toast.error("Failed to prepare remove transaction: " + err.message);
      setLoading(false);
    }
  };

  // ... rest of the function

  // --- Get All Temples Function ---
  const handleGetAllTemples = async () => {
    if (!provider) {
      toast.error("Please connect your wallet to read data.");
      return;
    }
    setLoadingGetTemples(true);
    try {
      const registry = new ethers.Contract(
        TEMPLE_REGISTRY_ADDRESS,
        TEMPLE_REGISTRY_ABI,
        provider
      );
      const temples: string[] = await registry.getAllTemples();
      setAllTemples(temples);
      toast.success(`Fetched ${temples.length} temples.`);
    } catch (error: any) {
      console.error("Failed to fetch temples:", error);
      toast.error("Failed to fetch temples: " + error.message);
    } finally {
      setLoadingGetTemples(false);
    }
  };

  // --- Effect to load temples on component mount or provider change ---
  useEffect(() => {
    if (provider) {
      handleGetAllTemples();
      provider.getNetwork().then((network) => {
        if (network.chainId !== BigInt(80002)) {
          toast.warn(
            "You are not on the Polygon Amoy Testnet. Please switch networks in MetaMask."
          );
        }
      });
    }
  }, [provider]);

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">
        Temple Registry Interactions
      </h1>

      {!account ? (
        <div className="text-center">
          <p className="mb-4 text-lg">
            Connect your MetaMask wallet to interact with the Temple Registry.
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-lg text-center">
            Connected Account:{" "}
            <span className="font-semibold text-green-400">{account}</span>
          </p>
          <p className="text-md text-center">
            Contract Address:{" "}
            <span className="font-semibold text-yellow-400">
              {TEMPLE_REGISTRY_ADDRESS}
            </span>
          </p>

          {/* Last Transaction Info */}
          {(lastGasUsed || lastTransactionCost) && (
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-sm text-center">
              <h3 className="text-xl font-semibold mb-2 text-cyan-300">
                Last Transaction Details:
              </h3>
              {lastGasUsed && (
                <p>
                  Gas Used: <span className="font-bold">{lastGasUsed}</span>{" "}
                  units
                </p>
              )}
              {lastTransactionCost && (
                <p>
                  Total Cost:{" "}
                  <span className="font-bold">{lastTransactionCost} ETH</span>
                </p>
              )}
              <p className="text-gray-400 mt-1">
                (Note: This is the actual gas consumed, not the gas limit)
              </p>
            </div>
          )}

          {/* Register Temple Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              Register New Temple
            </h2>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <input
                type="text"
                value={templeAddressToRegister}
                onChange={(e) => setTempleAddressToRegister(e.target.value)}
                placeholder="Enter temple address to register (0x...)"
                className="flex-grow border border-gray-700 bg-gray-900 p-3 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRegisterTemple}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register Temple"}
              </button>
            </div>
          </div>

          {/* Remove Temple Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              Remove Temple
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              (Only the Super Admin can remove temples)
            </p>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <input
                type="text"
                value={templeAddressToRemove}
                onChange={(e) => setTempleAddressToRemove(e.target.value)}
                placeholder="Enter temple address to remove (0x...)"
                className="flex-grow border border-gray-700 bg-gray-900 p-3 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleRemoveTemple}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Removing..." : "Remove Temple"}
              </button>
            </div>
          </div>

          {/* Get All Temples Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              All Registered Temples
            </h2>
            <button
              onClick={handleGetAllTemples}
              disabled={loadingGetTemples}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loadingGetTemples ? "Fetching..." : "Refresh Temples List"}
            </button>

            {allTemples.length === 0 && !loadingGetTemples && (
              <p className="text-gray-400">
                No temples registered yet, or failed to load.
              </p>
            )}

            {allTemples.length > 0 && (
              <ul className="list-disc list-inside space-y-2 max-h-60 overflow-y-auto border border-gray-700 p-4 rounded-md bg-gray-900">
                {allTemples.map((temple, index) => (
                  <li key={index} className="break-all text-gray-300">
                    <a
                      href={`https://amoy.polygonscan.com/address/${temple}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {temple}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
