// app/receipt/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { ethers, formatUnits } from "ethers";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Wallet,
  Loader2,
} from "lucide-react"; // Import Wallet and Loader2 icon
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

export default function GlobalDonationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const txHash = searchParams.get("txHash");
  const redirectToDashboard = searchParams.get("redirect") === "dashboard";
  const [donationDetails, setDonationDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState("");
  const [countdown, setCountdown] = useState(redirectToDashboard ? 5 : 0);

  // Fetch donation details using txHash
  useEffect(() => {
    const fetchDonationDetails = async () => {
      if (!txHash) {
        setErrorDetails("Transaction ID not found in URL.");
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);

      try {
        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          toast.error(
            "You must be logged in to view this receipt. Please log in and try again."
          );
          window.location.href = "/login"; // Redirect to login if no token
          return;
        }

        const response = await axios.get(
          `http://localhost:5050/api/v1/transactions/receipt?txHash=${txHash}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log("API response:", response.data);

        if (response.status >= 200 && response.status < 300) {
          const result = response.data;
          console.log("Donation details:", result.data);
          const donationData = result.data;

          const normalizedDonationDetails = {
            ...donationData,
            templeName: donationData.receiver?.templeName,
            templeLocation: donationData.receiver?.templeLocation,
            templeWalletAddress: donationData.receiver?.walletAddress,
            senderWalletAddress: donationData.sender?.walletAddress,
            senderName: (
              donationData.sender?.name || "Anonymous"
            ).toUpperCase(),
          };

          setDonationDetails(normalizedDonationDetails); // Adjust based on your backend response structure
          confetti({
            // Trigger confetti only after details are loaded
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          }); // <--- Add this closing bracket
        } else {
          toast.error("Failed to fetch donation details. Please try again.");
        }
      } catch (error: any) {
        console.error("Error fetching donation details:", error);
        setErrorDetails(error.message || "Failed to load donation details.");
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDonationDetails();
  }, [txHash]); // Re-run when txHash changes

  useEffect(() => {
    const fetchUsdValue = async () => {
      if (
        donationDetails?.createdAt &&
        donationDetails?.donatedCrypto &&
        !donationDetails?.usdValueAtTimeOfDonation // only fetch if not already present
      ) {
        const createdAtDate = new Date(donationDetails.createdAt);

        // Format date to dd-mm-yyyy for CoinGecko
        const formattedDate = `${createdAtDate.getDate()}-${
          createdAtDate.getMonth() + 1
        }-${createdAtDate.getFullYear()}`;

        const getUsdValueAtTime = async (
          coinId: string,
          date: string
        ): Promise<number | null> => {
          try {
            const response = await axios.get(
              `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${date}`
            );

            const usdValue =
              response.data?.market_data?.current_price?.usd || null;
            return usdValue;
          } catch (error) {
            console.error("Error fetching USD value from CoinGecko:", error);
            return null;
          }
        };

        const usdPrice = await getUsdValueAtTime(
          donationDetails.donatedCrypto,
          formattedDate
        );

        if (usdPrice) {
          setDonationDetails((prev: any) => ({
            ...prev,
            usdValueAtTimeOfDonation: usdPrice,
          }));
        }
      }
    };

    fetchUsdValue();
  }, [donationDetails?.createdAt, donationDetails?.donatedCrypto]);

  // Handle dashboard redirect countdown
  useEffect(() => {
    if (redirectToDashboard && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (redirectToDashboard && countdown === 0) {
      router.push("/dashboard");
    }
  }, [countdown, redirectToDashboard, router]); // Added router to dependency array for completeness

  // Use fetched details for display and PDF generation
  const createdAt = donationDetails?.createdAt
    ? new Date(donationDetails.createdAt)
    : null;

  const formattedDate = createdAt
    ? createdAt.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const formattedTime = createdAt
    ? createdAt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  // Function to get cryptocurrency symbol from its Coingecko ID
  const getCryptoSymbol = (coinGeckoId: string) => {
    switch (coinGeckoId) {
      case "bitcoin":
        return "BTC";
      case "ethereum":
        return "ETH";
      case "binancecoin":
        return "BNB";
      case "matic-network":
        return "MATIC";
      case "cardano":
        return "ADA";
      case "solana":
        return "SOL";
      default:
        return (donationDetails?.donatedCrypto || "Crypto").toUpperCase(); // Fallback
    }
  };

  const cryptoSymbol = getCryptoSymbol(donationDetails?.donatedCrypto || "");

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1500);
  };

  const formattedPurpose = donationDetails?.purpose
    ? donationDetails.purpose === "custom"
      ? decodeURIComponent(donationDetails.purpose)
      : donationDetails.purpose.charAt(0).toUpperCase() +
        donationDetails.purpose.slice(1)
    : "N/A";

  const readableTransactionFee =
    donationDetails?.transactionFee !== undefined
      ? formatUnits(donationDetails.transactionFee.toString(), 18)
      : null;

  const downloadReceipt = () => {
    if (!donationDetails) {
      alert("Donation details not loaded yet. Please wait.");
      return;
    }

    const doc = new jsPDF();

    let y = 20;
    const lineHeight = 8;

    // ---------- HEADER ----------
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Donation Receipt", 20, y);
    y += lineHeight;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt Generated: ${new Date().toLocaleString("en-IN")}`, 20, y);
    y += lineHeight + 2;

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += lineHeight;

    // ---------- TEMPLE INFO ----------
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Temple Information", 20, y);
    y += lineHeight;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Temple Name: ${donationDetails.templeName}`, 20, y);
    y += lineHeight;
    doc.text(`Temple Location: ${donationDetails.templeLocation}`, 20, y);
    y += lineHeight;
    doc.text(
      `Temple Wallet Address: ${donationDetails.templeWalletAddress}`,
      20,
      y
    );
    y += lineHeight + 2;

    // ---------- DONATION INFO ----------
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Donation Details", 20, y);
    y += lineHeight;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Amount Donated: ${donationDetails.amount} ${cryptoSymbol}`,
      20,
      y
    );
    y += lineHeight;
    doc.text(
      `USD Value at Time of Donation: $${donationDetails.usdValueAtTimeOfDonation}`,
      20,
      y
    );
    y += lineHeight;
    doc.text(`Purpose: ${formattedPurpose}`, 20, y);
    y += lineHeight;
    doc.text(
      `Sender Name: ${donationDetails.senderName || "Anonymous"}`,
      20,
      y
    );
    y += lineHeight;
    doc.text(
      `Sender Wallet Address: ${donationDetails.senderWalletAddress}`,
      20,
      y
    );
    y += lineHeight;
    doc.text(`Transaction Hash: ${donationDetails.txHash}`, 20, y);
    y += lineHeight;
    doc.text(`Date: ${formattedDate}`, 20, y);
    y += lineHeight;
    doc.text(`Time: ${formattedTime}`, 20, y);
    y += lineHeight;
    doc.text(`Status: Completed`, 20, y);
    y += lineHeight + 2;
    doc.text(
      `Transaction Fee: ${readableTransactionFee} ${cryptoSymbol}`,
      20,
      y
    );
    y += lineHeight;

    // ---------- TAX INFO ----------
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Tax Benefits", 20, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    const tax1 =
      "Your donation is eligible for tax benefits under Section 80G.";
    const tax2 = "A tax receipt will be emailed to you within 24 hours.";
    const splitTax1 = doc.splitTextToSize(tax1, 170);
    const splitTax2 = doc.splitTextToSize(tax2, 170);
    doc.text(splitTax1, 20, y);
    y += splitTax1.length * lineHeight;
    doc.text(splitTax2, 20, y);
    y += splitTax2.length * lineHeight + 5;

    // ---------- FOOTER ----------
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "This is a computer-generated receipt. No signature required.",
      20,
      y
    );
    y += lineHeight;
    doc.text("Payment secured by DevTemple blockchain integration.", 20, y);
    y += lineHeight;

    // ---------- SAVE ----------
    const filename = `donation-receipt-${donationDetails.txHash}.pdf`;
    doc.save(filename);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Donation Receipt",
        text: `I just donated to ${donationDetails.templeName} on DevTemple!`,
        url: window.location.href,
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // Determine the correct blockchain explorer URL based on the cryptocurrency
  const getExplorerUrl = (crypto: string, hash: string) => {
    switch (crypto) {
      case "ethereum":
        return `https://etherscan.io/tx/${hash}`; // Mainnet Ethereum
      case "polygon":
        return `https://polygonscan.com/tx/${hash}`; // Polygon Mainnet
      default:
        return `https://amoy.polygonscan.com/tx/${hash}`; // Default to Etherscan or a generic blockchain explorer
    }
  };

  const blockchainExplorerUrl = donationDetails?.txHash
    ? getExplorerUrl(donationDetails.donatedCrypto, donationDetails.txHash)
    : "";

  if (loadingDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-lg text-gray-700">Loading donation details...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a moment as we verify the transaction on the blockchain.
        </p>
      </div>
    );
  }

  if (errorDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">
          Error Loading Donation Details
        </h1>
        <p>{errorDetails}</p>
        <p className="mt-4 text-gray-600">
          Please try again or contact support if the issue persists.
        </p>
        <Link
          href="/user/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Render only if donationDetails are loaded
  if (!donationDetails) {
    return null; // Should not happen if loading and error states are handled correctly
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/temples/${donationDetails.templeName
            .toLowerCase()
            .replace(/\s+/g, "-")}-${donationDetails.templeLocation
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
          className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Temple
        </Link>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700">
            Donation Successful!
          </h1>
          <p className="text-gray-600 mt-2">
            Thank you,{" "}
            <span className="font-semibold">{donationDetails.senderName}</span>,
            for your generous contribution to {donationDetails.templeName}
          </p>

          {redirectToDashboard && countdown > 0 && (
            <div className="mt-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-md inline-block">
              Redirecting to your dashboard in {countdown} seconds...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Donation Receipt</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadReceipt}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Temple</p>
                    <p className="font-medium">{donationDetails.templeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-lg">
                      {donationDetails.amount} {cryptoSymbol} (≈ $
                      {donationDetails.usdValueAtTimeOfDonation} USD)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p className="font-medium">{formattedPurpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className="font-medium text-green-600 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Transaction Hash (ID)
                    </p>
                    <div className="flex items-center">
                      <p className="font-medium font-mono truncate max-w-[calc(100%-30px)]">
                        {donationDetails.txHash}
                      </p>
                      {donationDetails.txHash && (
                        <button
                          onClick={() =>
                            copyToClipboard(donationDetails.txHash, "txHash")
                          }
                          className="ml-2 p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copiedField === "txHash" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {donationDetails.txHash && blockchainExplorerUrl && (
                      <Link
                        href={blockchainExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 underline flex items-center text-sm mt-1"
                      >
                        View on Explorer{" "}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sender Wallet ID</p>
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-1 text-gray-400" />
                      <p className="font-medium font-mono truncate max-w-[calc(100%-40px)]">
                        {donationDetails.senderWalletAddress}
                      </p>
                      {donationDetails.senderWalletAddress && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              donationDetails.senderWalletAddress,
                              "senderWallet"
                            )
                          }
                          className="ml-2 p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copiedField === "senderWallet" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Temple Wallet ID</p>
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-1 text-gray-400" />
                      <p className="font-medium font-mono truncate max-w-[calc(100%-40px)]">
                        {donationDetails.templeWalletAddress}
                      </p>
                      {donationDetails.templeWalletAddress && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              donationDetails.templeWalletAddress,
                              "templeWallet"
                            )
                          }
                          className="ml-2 p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copiedField === "templeWallet" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="text-sm">{formattedDate}</p>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="text-sm">{formattedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-2">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-600"
                      >
                        <path d="M21 2H3v16h5v4l4-4h5l4-4V2z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">
                        Tax Benefits
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your donation is eligible for tax benefits under Section
                        80G. A tax receipt will be emailed to you within 24
                        hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-b-lg p-6 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 text-orange-600"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Secured by DevTemple blockchain integration
              </div>
              {/* This link now dynamically uses the txHash if available */}
              {donationDetails.txHash && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 mr-1">
                    Verify on blockchain:
                  </span>
                  <Link
                    href={blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline flex items-center"
                  >
                    View <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Temple Information</h2>
              </div>
              <div className="p-6">
                <div className="relative w-full h-[120px] rounded-lg overflow-hidden mb-3">
                  {/* You might want to fetch temple images based on templeId if available */}
                  <Image
                    src="/placeholder.svg?height=120&width=240"
                    alt={donationDetails.templeName}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-medium">{donationDetails.templeName}</h3>
                <p className="text-sm text-gray-500">
                  {donationDetails.templeLocation}
                </p>

                <div className="border-t border-gray-200 my-3"></div>

                <div className="space-y-2">
                  {/* If your templeName in donationDetails can map to a templeId */}
                  {donationDetails.templeName &&
                    donationDetails.templeLocation && (
                      <Link
                        href={`/temples/${donationDetails.templeName
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}-${donationDetails.templeLocation
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Temple
                      </Link>
                    )}

                  {/* You'll need to figure out how to get the templeId to construct this link if it's not the name */}
                  {donationDetails.templeName && (
                    <Link
                      href={`/temples/${donationDetails.templeName
                        .toLowerCase()
                        .replace(/\s/g, "-")}/gratitude`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      View Wall of Gratitude
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold">What's Next?</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">
                        1
                      </span>
                    </div>
                    <p className="text-sm">
                      Check your email for the donation receipt
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">
                        2
                      </span>
                    </div>
                    <p className="text-sm">
                      View your donation history in your dashboard
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">
                        3
                      </span>
                    </div>
                    <p className="text-sm">
                      Explore other temples that need support
                    </p>
                  </div>
                </div>

                <Link
                  href="/temples"
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors mt-4"
                >
                  Explore More Temples
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
