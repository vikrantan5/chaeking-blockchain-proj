"use client";

import { useState, useEffect } from "react";
import { Zap, Shield, AlertCircle } from "lucide-react";

interface TestModeToggleProps {
  isTestMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function TestModeToggle({ isTestMode, onToggle }: TestModeToggleProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${isTestMode ? 'bg-blue-500' : 'bg-gray-400'}`}>
            {isTestMode ? (
              <Zap className="w-6 h-6 text-white" />
            ) : (
              <Shield className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {isTestMode ? "Test Mode Active" : "Production Mode"}
            </h3>
            <p className="text-sm text-gray-600">
              {isTestMode
                ? "Testing with Polygon Amoy testnet - No real money involved"
                : "Live transactions on mainnet"}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggle(!isTestMode)}
          className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isTestMode
              ? "bg-blue-500 focus:ring-blue-500"
              : "bg-gray-300 focus:ring-gray-400"
          }`}
        >
          <span
            className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              isTestMode ? "translate-x-12" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {isTestMode && (
        <div className="mt-4 flex items-start space-x-2 bg-blue-100 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Test Mode Features:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Use test ETH from Polygon Amoy testnet</li>
              <li>All transactions are simulated</li>
              <li>Get free test tokens from faucet</li>
              <li>No real money required</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
