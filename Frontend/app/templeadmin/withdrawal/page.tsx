"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Copy, ExternalLink } from "lucide-react";
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from "@/app/utils/TempleFund";
import AuthWrapper from "@/app/components/AuthWrapper";
import { useMetamask } from "@/app/hooks/useMetamask";
import { ethers } from "ethers";
import { toast } from "react-toastify";

export default function Withdrawal() {
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [purpose, setPurpose] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedGasFee, setEstimatedGasFee] = useState<string | null>(null);
  const [estimatedNetworkFeeFiat, setEstimatedNetworkFeeFiat] = useState<
    string | null
  >(null);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const { account, provider } = useMetamask();
  const [maticBalance, setMaticBalance] = useState<string>("0");
  const [ethToInrRate, setEthToInrRate] = useState<number>(18.4); // You can fetch real-time later if needed

  const purposeOptions = [
    { value: "prasadam", label: "Prasadam Supplies" },
    { value: "maintenance", label: "Temple Maintenance" },
    { value: "festivals", label: "Festival Expenses" },
    { value: "charity", label: "Charity Distribution" },
    { value: "utilities", label: "Utilities & Bills" },
    { value: "staff", label: "Staff Salaries" },
    { value: "construction", label: "Construction Work" },
    { value: "other", label: "Other" },
  ];

  const [cryptoBalances, setCryptoBalances] = useState([
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      balance: "0",
      usdValue: "₹0",
      icon: "₿",
    },
    {
      id: "matic",
      name: "Matic",
      symbol: "POL",
      balance: "0", // start with 0, update from chain
      usdValue: "₹0",
      icon: "Ξ",
    },
    {
      id: "usdt",
      name: "Tether",
      symbol: "USDT",
      balance: "0",
      usdValue: "₹0",
      icon: "₮",
    },
  ]);

  const recentTransactions = [
    {
      type: "Withdrawal",
      amount: "0.5 BTC",
      date: "2023-06-15",
      status: "Completed",
      hash: "0x8f7d...3b2a",
    },
    {
      type: "Withdrawal",
      amount: "2.0 ETH",
      date: "2023-06-10",
      status: "Pending",
      hash: "0x2a1b...9c4d",
    },
    {
      type: "Withdrawal",
      amount: "1000 USDT",
      date: "2023-06-05",
      status: "Completed",
      hash: "0x7e3f...5d2c",
    },
  ];

  useEffect(() => {
    if (selectedCrypto && selectedCrypto !== "matic") {
      toast.info(
        `${selectedCrypto.toUpperCase()} withdrawals are not available yet.`
      );
    }
  }, [selectedCrypto]);

  useEffect(() => {
    if (amount) estimateWithdrawalFee();
  }, [amount]);

  const fetchMaticBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      toast.error("Invalid temple address or wallet not connected.");
      return;
    }
    try {
      const signer = await provider?.getSigner();
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      const formattedBalance = ethers.formatEther(balance);
      setMaticBalance(formattedBalance);

      // Update cryptoBalances for Matic
      setCryptoBalances((prev) =>
        prev.map((crypto) =>
          crypto.id === "matic"
            ? {
                ...crypto,
                balance: parseFloat(formattedBalance).toFixed(4),
                // Optional: update usdValue based on your exchange rate (ethToInrRate)
                usdValue: `₹${(
                  parseFloat(formattedBalance) * ethToInrRate
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              }
            : crypto
        )
      );
    } catch (error) {
      toast.error("Failed to fetch ETH balance.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (!account) return;

    fetchMaticBalance(account); // Initial fetch

    const interval = setInterval(() => {
      fetchMaticBalance(account);
    }, 10000); // every 30 seconds

    return () => clearInterval(interval);
  }, [account, provider]);

  const estimateWithdrawalFee = async () => {
    if (!provider || !account || isNaN(Number(amount)) || Number(amount) <= 0)
      return;

    try {
      const signer = await provider?.getSigner();
      const contract = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );
      const amountInWei = ethers.parseEther(amount);

      const txRequest = await contract.withdrawEth.populateTransaction(
        amountInWei
      );
      const estimatedGas = await provider.estimateGas({
        ...txRequest,
        from: account,
      });

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits("30", "gwei");

      const estimatedFeeWei = estimatedGas * gasPrice;
      const estimatedFeeEth = ethers.formatEther(estimatedFeeWei);
      setEstimatedGasFee(estimatedFeeEth);

      const ethToInrRate = 18.4; // placeholder exchange rate
      const estimatedFiat = (
        parseFloat(estimatedFeeEth) * ethToInrRate
      ).toFixed(2);
      setEstimatedNetworkFeeFiat(`₹${estimatedFiat}`);
    } catch (error) {
      console.error("Fee estimation error:", error);
      setEstimatedGasFee(null);
      setEstimatedNetworkFeeFiat(null);
    }
  };

  const withdrawEth = async () => {
    if (!provider || !account || !amount) {
      toast.error("Please connect your wallet and enter amount.");
      return;
    }

    if (!estimatedGasFee || parseFloat(amount) <= parseFloat(estimatedGasFee)) {
      toast.error("Amount must be greater than estimated gas fee.");
      return;
    }

    if (selectedCrypto !== "matic") {
      toast.info(
        `${selectedCrypto.toUpperCase()} withdrawals are not available yet.`
      );
      return;
    }
    if (txLoading) {
      toast.info("Transaction is already in progress.");
      return;
    }

    try {
      setTxLoading(true);
      const signer = await provider?.getSigner();
      const contract = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );
      const tx = await contract.withdrawEth(ethers.parseEther(amount));
      await tx.wait();
      toast.success("Withdrawal successful!");
      setAmount("");
      setEstimatedGasFee(null);
      setEstimatedNetworkFeeFiat(null);
    } catch (error: any) {
      toast.error(`Transaction failed: ${error?.reason || error?.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <AuthWrapper role="templeAdmin">
      <div className="p-8 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Cryptocurrency Withdrawal
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and withdraw your temple's cryptocurrency funds
            </p>
          </div>
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl px-6 py-4 w-full md:w-96">
            <h3 className="text-sm text-gray-500 mb-2">Total Temple Balance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {parseFloat(maticBalance).toFixed(2)} POL
                </p>
                <p className="text-sm text-gray-600">Polygon (MATIC)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-green-600">
                  ₹
                  {(parseFloat(maticBalance) * ethToInrRate).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
                <p className="text-sm text-gray-500">Estimated INR</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crypto Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cryptoBalances.map((crypto, index) => (
            <motion.div
              key={crypto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {crypto.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{crypto.name}</h3>
                    <p className="text-gray-600 text-sm">{crypto.symbol}</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-800">
                  {crypto.balance} {crypto.symbol}
                </p>
                <p className="text-gray-600">{crypto.usdValue}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Withdraw Cryptocurrency
            </h2>

            <div className="space-y-6">
              {/* Select Cryptocurrency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cryptocurrency
                </label>
                <select
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    Select a cryptocurrency
                  </option>
                  {cryptoBalances.map((crypto) => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {
                      cryptoBalances.find((c) => c.id === selectedCrypto)
                        ?.symbol
                    }
                  </span>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of Withdrawal
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="" disabled>
                    Select a purpose
                  </option>
                  {purposeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Reason (when "other" is selected) */}
              {purpose === "other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please Specify
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    disabled={selectedCrypto !== "matic"}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter a reason"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Network Fee */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Network Fee</span>
                  <span className="font-medium text-gray-800">
                    {estimatedNetworkFeeFiat ?? "Estimating..."}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">You will receive</span>
                  <span className="font-bold text-gray-800">
                    {amount
                      ? (
                          Number.parseFloat(amount) -
                          Number.parseFloat(estimatedNetworkFeeFiat ?? "0")
                        ).toFixed(4)
                      : "0.0000"}{" "}
                    {
                      cryptoBalances.find((c) => c.id === selectedCrypto)
                        ?.symbol
                    }
                  </span>
                </div>
              </div>

              {/* Withdraw Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={withdrawEth}
                disabled={selectedCrypto !== "matic" || txLoading}
                className={`w-full py-4 rounded-xl font-medium shadow-lg flex items-center justify-center space-x-2 ${
                  selectedCrypto !== "matic"
                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                    : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>
                  {selectedCrypto !== "matic"
                    ? "Withdrawal Not Available"
                    : txLoading
                    ? "Processing..."
                    : "Withdraw Cryptocurrency"}
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Recent Transactions
            </h2>

            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {transaction.type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {transaction.amount}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-mono">
                      {transaction.hash}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-orange-500 hover:text-orange-600">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="text-orange-500 hover:text-orange-600">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AuthWrapper>
  );
}
