"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Heart,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Shield,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../../utils/api";

interface NGO {
  _id: string;
  ngoName: string;
  slug: string;
  description: string;
  mission: string;
  coverImage: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  contactDetails: {
    phone: string;
    email: string;
    website?: string;
  };
  focusAreas: string[];
  photoGallery: string[];
  walletAddress: string;
  approvalStatus: string;
  approvalDate: string;
  totalDonationsReceived: number;
  registeredBy: {
    name: string;
    email: string;
     walletAddress?: string;
  };
}

export default function NGODetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchNGODetails();
    }
  }, [params.slug]);

  const fetchNGODetails = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.ngos.getById(params.slug as string);
      if (result.success) {
        setNgo(result.data);
      } else {
        toast.error("NGO not found");
        router.push("/ngos");
      }
    } catch (error) {
      console.error("Error fetching NGO details:", error);
      toast.error("An error occurred while fetching NGO details");
      router.push("/ngos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonate = async () => {
      const ngoWalletAddress = ngo?.walletAddress || ngo?.registeredBy?.walletAddress;

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }
      if (!ngoWalletAddress) {
      toast.error("NGO wallet address not found");
      return;
    }

    const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user_data");
    if (!accessToken || !userData || JSON.parse(userData).role !== "user") {
      toast.error("Please login as user to donate");
      router.push("/login");
      return;
    }

    setIsDonating(true);
    try {
        const { ethers } = await import("ethers");

      // Check MetaMask
      if (typeof window === "undefined" || !window.ethereum) {
        toast.error("Please install MetaMask to donate");
        window.open("https://metamask.io/download.html", "_blank");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get contract
      const contractAddress = process.env.NEXT_PUBLIC_NGO_FUND_ADDRESS;
      if (!contractAddress) {
        toast.error("Contract address not configured");
        return;
      }

      const contractABI = [
        "function donateEthToNGO(address ngo) payable"
      ];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      toast.info("Please confirm the transaction in MetaMask...");

      // Send donation
       const tx = await contract.donateEthToNGO(ngoWalletAddress, {
        value: ethers.parseEther(donationAmount)
      });

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      const receiptAny = receipt as any;
      const txAny = tx as any;
      const gasPrice = receiptAny?.gasPrice ?? receiptAny?.effectiveGasPrice ?? txAny?.gasPrice ?? 0n;
      const gasUsed = receiptAny?.gasUsed ?? 0n;
      const transactionFee = gasUsed * gasPrice;

      // Record in backend
             const saveResult = await apiClient.ngo.donate(ngo._id, {
        amount: parseFloat(donationAmount),
            txHash: receipt.hash,
            gasPrice: Number(gasPrice),
        transactionFee: Number(transactionFee)
      });

      if (!saveResult.success) {
        toast.error(saveResult.message || "Donation confirmed on-chain but save failed");
        return;
      }

      toast.success("Donation successful! Thank you for your support! 🎉");
      setDonationAmount("");
    // Refresh NGO details to show updated donation amount
      await fetchNGODetails();
    } catch (error: any) {
      console.error("Donation error:", error);
     if (error.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected");
      } else {
        toast.error(error.message || "Donation failed. Please try again.");
      }
    } finally {
      setIsDonating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ngo) {
    return null;
  }

  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" data-testid="ngo-detail-page">
      {/* Hero Section with Cover Image */}
      <div className="relative h-96 bg-gradient-to-r from-blue-600 to-indigo-700">
        {ngo.coverImage ? (
          <img
            src={ngo.coverImage}
            alt={ngo.ngoName}
            className="w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-32 h-32 text-white opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => router.push("/ngos")}
          className="absolute top-8 left-8 flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
          data-testid="ngo-detail-back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to NGOs
        </button>

        {/* NGO Title */}
        <div className="absolute bottom-8 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              <span className="text-green-400 font-semibold">Verified NGO</span>
            </div>
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="ngo-detail-name">
              {ngo.ngoName}
            </h1>
            <div className="flex items-center text-white/90">
              <MapPin className="w-5 h-5 mr-2" />
              <span>
                {ngo.address.city}, {ngo.address.state}, {ngo.address.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - NGO Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">About Us</h2>
  <p className="text-gray-600 leading-relaxed mb-6" data-testid="ngo-detail-description">{ngo.description}</p>

              <h3 className="text-xl font-bold text-gray-800 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">{ngo.mission}</p>
            </div>

            {/* Focus Areas */}
            {ngo.focusAreas && ngo.focusAreas.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Focus Areas</h2>
                <div className="flex flex-wrap gap-3">
                  {ngo.focusAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3 text-blue-500" />
                  <span>{ngo.contactDetails.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-3 text-blue-500" />
                  <span>{ngo.contactDetails.email}</span>
                </div>
                {ngo.contactDetails.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-3 text-blue-500" />
                    <a
                      href={ngo.contactDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {ngo.contactDetails.website}
                    </a>
                  </div>
                )}
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-1" />
                  <div>
                    <p>{ngo.address.street}</p>
                    <p>
                      {ngo.address.city}, {ngo.address.state} - {ngo.address.pincode}
                    </p>
                    <p>{ngo.address.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            {ngo.photoGallery && ngo.photoGallery.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ngo.photoGallery.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Donation Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              {/* Donation Stats */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total Raised</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {ngo.totalDonationsReceived || 0} ETH
                </p>
              </div>

              {/* Donation Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Make a Donation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (ETH)
                    </label>
                    <input
                    data-testid="ngo-detail-donation-amount-input"
                      type="number"
                      step="0.001"
                      min="0"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleDonate}
                    disabled={isDonating || !donationAmount}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                     data-testid="ngo-detail-donate-button"
                  >
                    {isDonating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Donate Now
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Blockchain Transparency */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Transparent & Secure
                    </h4>
                    <p className="text-sm text-blue-700">
                      All donations are recorded on the blockchain and can be verified
                      anytime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">NGO Wallet Address</p>
                <p className="text-xs font-mono text-gray-800 break-all">
                    {ngo.walletAddress || ngo.registeredBy?.walletAddress || "Not set"}
                </p>
              </div>

              {/* Approval Date */}
              {ngo.approvalDate && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Verified on {new Date(ngo.approvalDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
