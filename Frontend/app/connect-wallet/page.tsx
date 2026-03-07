"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useMetamask } from '@/app/hooks/useMetamask';

export default function ConfirmWalletPage() {
  const { account, loading, error, connectWallet } = useMetamask();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{ name: string; address: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (account) {
      setConnectedWallet({
        name: 'MetaMask',
        address: account,
      });
      setIsConnecting(false);
    }
  }, [account]);


  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      const walletAddress = await connectWallet();
      if (!walletAddress) {
        throw new Error("Failed to connect wallet.");
      }

      setConnectedWallet({
        name: "MetaMask",
        address: walletAddress,
      });

      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error.message);
      toast.error(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCompleteLogin = async () => {
    if (!connectedWallet || !connectedWallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Access token not found. Please log in again.");
      }

      // Store the wallet address in the backend
      const response = await fetch("http://localhost:5050/api/v1/templeAdmin/store-wallet-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ walletAddress: connectedWallet.address }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to store wallet address.");
      }

      toast.success("Wallet address stored successfully!");

      // Redirect to the dashboard
      router.push("/templeadmin/dashboard");
    } catch (error: any) {
      console.error("Error completing login:", error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Connect Wallet</h1>
          <p className="text-gray-600">Connect your MetaMask wallet to get started</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-4">
            {!connectedWallet ? (
              <button
                onClick={handleWalletConnect}
                disabled={isConnecting}
                className="w-full group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">🦊</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg text-white mb-1">MetaMask</h3>
                    <p className="text-orange-100 text-sm">Connect using browser wallet</p>
                  </div>
                  {isConnecting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" />
                  )}
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🦊</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{connectedWallet.name}</h3>
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1 font-medium">Wallet Address</p>
                    <p className="text-gray-800 font-mono text-sm break-all">{connectedWallet.address}</p>
                  </div>
                </div>
                <button
                  onClick={handleCompleteLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Complete Login"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Secure wallet connection powered by MetaMask</p>
        </div>
      </div>
    </div>
  );
}
