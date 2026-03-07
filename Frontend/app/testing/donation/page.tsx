"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from "@/app/utils/TempleFund";
import { useMetamask } from "@/app/hooks/useMetamask";

export default function DonatePage() {
  const { account, provider, connectWallet } = useMetamask();
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [templeAddress, setTempleAddress] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null);
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );
  // Your reusable transaction handler
  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null);
    setLastTransactionCost(null);

    try {
      toast.info("Transaction sent. Waiting for confirmation...");
      const tx = await contractCall;
      console.log("Transaction hash:", tx.hash);
      toast.info(`Transaction hash: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      if (receipt) {
        const gasUsed = receipt.gasUsed;
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString());
        if (totalCostWei) {
          setLastTransactionCost(ethers.formatEther(totalCostWei));
        }

        toast.success(
          successMessage + ` Transaction hash: ${receipt.hash}`
        );
      } else {
        toast.success(successMessage + ` (Receipt not available immediately)`);
      }
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

  // Donation handler for ETH
  const donateEth = async () => {
    if (!provider || !account) {
      toast.error("Connect wallet first");
      return;
    }
    if (!ethers.isAddress(templeAddress)) {
      toast.error("Invalid temple address");
      return;
    }
    try {
      const signer = await provider?.getSigner();
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );

      const amountInEth = prompt("Enter donation amount in ETH/MATIC");
      if (
        !amountInEth ||
        isNaN(Number(amountInEth)) ||
        Number(amountInEth) <= 0
      ) {
        toast.error("Invalid donation amount");
        return;
      }

      // Use handleTransaction here, pass the contract call promise
      const success = await handleTransaction(
        templeFund.donateEthToTemple(templeAddress, {
          value: ethers.parseEther(amountInEth),
        }),
        "Donation successful!"
      );

      if (success) {
        fetchEthBalance(templeAddress); // update balance on success
      }
    } catch (error) {
      console.error(error);
      toast.error("Donation failed");
    }
  };

  const fetchEthBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      toast.error("Invalid temple address or wallet not connected.");
      return;
    }
    try {
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        provider
      );
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      setEthBalance(ethers.formatEther(balance));
    } catch (error) {
      toast.error("Failed to fetch ETH balance.");
      console.error(error);
    }
  };

   return (
    <div className="max-w-md mx-auto p-4">
      {/* Connect Wallet Button and Account Display */}
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
          disabled={loading}
        >
          Connect Wallet
        </button>
      ) : (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          Connected Wallet:{" "}
          <span className="font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      )}

      {/* Temple Address input */}
      <label>Temple Address</label>
      <input
        type="text"
        placeholder="Enter temple address"
        value={templeAddress}
        onChange={(e) => setTempleAddress(e.target.value)}
        className="border p-2 mb-2 w-full"
      />

      {/* Donation Button */}
      <button
        onClick={donateEth}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        Donate ETH/MATIC
      </button>

      {/* Check Balance Button */}
      <button
        onClick={() => fetchEthBalance(templeAddress)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        Check Temple ETH Balance
      </button>

      {/* Show balance */}
      {ethBalance !== null && <p>Temple ETH Balance: {ethBalance} ETH</p>}
    </div>
  );
}
