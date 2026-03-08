"use client";

import { useState } from "react";
import { Coins, Copy, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

export default function TestWalletManager() {
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const testFaucets = [
    {
      name: "Polygon Amoy Faucet",
      url: "https://faucet.polygon.technology/",
      description: "Official Polygon faucet - Get test MATIC"
    },
    {
      name: "Alchemy Faucet",
      url: "https://www.alchemy.com/faucets/polygon-amoy",
      description: "Alchemy's Polygon Amoy faucet"
    },
    {
      name: "QuickNode Faucet",
      url: "https://faucet.quicknode.com/polygon/amoy",
      description: "QuickNode's test token faucet"
    }
  ];

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  const requestTestTokens = async (faucetUrl: string) => {
    setRequesting(true);
    toast.info("Opening faucet in new tab...");
    window.open(faucetUrl, "_blank");
    setTimeout(() => setRequesting(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-purple-500 rounded-full">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Test Token Faucets</h3>
          <p className="text-sm text-gray-600">Get free test tokens for Polygon Amoy testnet</p>
        </div>
      </div>

      <div className="space-y-3">
        {testFaucets.map((faucet, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{faucet.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{faucet.description}</p>
              </div>
              <button
                onClick={() => requestTestTokens(faucet.url)}
                disabled={requesting}
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">Open</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-purple-100 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">How to get test tokens:</h4>
        <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
          <li>Click "Open" on any faucet above</li>
          <li>Connect your MetaMask wallet</li>
          <li>Request test MATIC tokens</li>
          <li>Wait for tokens to arrive (usually 30 seconds)</li>
          <li>Return here and start testing donations!</li>
        </ol>
      </div>

      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
        <RefreshCw className="w-4 h-4" />
        <span>Tokens usually arrive within 30-60 seconds</span>
      </div>
    </div>
  );
}
