"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart, MapPin, Calendar, Target, Users, ArrowLeft, Clock } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { useMetamask } from "../../hooks/useMetamask";
import { getNGOFundContract, toBytes32Id } from "../../utils/ngoFund";


export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [caseData, setCaseData] = useState<any>(null);
   const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
   const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
   const { account, provider, connectWallet } = useMetamask();

  useEffect(() => {
    if (slug) {
      fetchCaseDetails();
    }
  }, [slug]);

  const fetchCaseDetails = async () => {
    try {
      const result = await apiClient.cases.getById(slug);
      if (result.success) {
       setCaseData(result.data?.case || null);
        setRecentDonations(result.data?.recentDonations || []);
      } else {
        toast.error("Case not found");
        router.push("/cases");
      }
    } catch (err) {
      console.error("Error fetching case:", err);
      toast.error("Error loading case details");
    } finally {
      setLoading(false);
    }
  };

 const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }
      const ngoWalletAddress =
      caseData?.associatedNGO?.walletAddress ||
      caseData?.associatedNGO?.registeredBy?.walletAddress;

      if (!ngoWalletAddress) {
      toast.error("Selected case NGO wallet is missing");
      return;
    }

    const accessToken = sessionStorage.getItem("accessToken");
    const userData = localStorage.getItem("user_data");
    if (!accessToken || !userData || JSON.parse(userData).role !== "user") {
      toast.error("Please login as user to donate");
      router.push("/login");
      return;
    }

    if (!account || !provider) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    try {
      setIsDonating(true);
 const activeProvider = provider || new ethers.BrowserProvider((window as any).ethereum);
      const signer = await activeProvider.getSigner();
      const contract = getNGOFundContract(signer);
      const valueWei = ethers.parseEther(donationAmount);

      const tx = await contract.donateToCase(
        toBytes32Id(caseData._id),
         ngoWalletAddress,
        { value: valueWei }
      );

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await tx.wait();
      const gasPrice = receipt?.gasPrice ?? tx.gasPrice ?? 0n;
      const gasUsed = receipt?.gasUsed ?? 0n;
      const feeWei = gasPrice * gasUsed;

      const saveResult = await apiClient.cases.donate(caseData._id, {
        amount: parseFloat(donationAmount),
        txHash: tx.hash,
        gasPrice: Number(gasPrice),
        transactionFee: Number(feeWei),
      });

      if (!saveResult.success) {
        toast.error(saveResult.message || "Donation confirmed on-chain but save failed");
      } else {
        toast.success("Donation successful and recorded");
      }

      setDonationAmount("");
      await fetchCaseDetails();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Donation failed");
    } finally {
      setIsDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return <div className="min-h-screen flex items-center justify-center">Case not found</div>;
  }

  const progress = (caseData.currentAmount / caseData.targetAmount) * 100;
  const daysLeft = Math.ceil(
    (new Date(caseData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-6">
        <button
          onClick={() => router.push("/cases")}
          className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Cases
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
              {caseData.caseType.replace("-", " ")}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              caseData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              {caseData.status}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{caseData.caseTitle}</h1>
          <p className="text-xl opacity-90 mb-3">Help {caseData.beneficiaryDetails?.name}</p>
          <div className="flex items-center text-lg opacity-80">
            <MapPin className="w-5 h-5 mr-2" />
            {caseData.beneficiaryDetails?.location}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Images Gallery */}
            {caseData.images && caseData.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseData.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Case image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">About This Case</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{caseData.description}</p>
              
              {caseData.beneficiaryDetails?.story && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Beneficiary Story</h3>
                  <p className="text-gray-600 leading-relaxed">{caseData.beneficiaryDetails.story}</p>
                </div>
              )}
            </div>

            {/* Beneficiary Details */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Beneficiary Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-800">{caseData.beneficiaryDetails?.name}</span>
                </div>
                {caseData.beneficiaryDetails?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium text-gray-800">{caseData.beneficiaryDetails.age} years</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-800">{caseData.beneficiaryDetails?.location}</span>
                </div>
              </div>
            </div>

            {/* Documents */}
            {caseData.documents && caseData.documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Supporting Documents</h2>
                <div className="space-y-2">
                  {caseData.documents.map((doc: string, index: number) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      📄 Document {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Support This Case</h3>
              
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Raised</span>
                  <span className="font-medium text-purple-600">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                        {Number(caseData.currentAmount || 0).toLocaleString()} MATIC
                    </p>
                       <p className="text-sm text-gray-600">raised of {Number(caseData.targetAmount || 0).toLocaleString()} MATIC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">{caseData.totalDonors || 0}</p>
                    <p className="text-sm text-gray-600">donors</p>
                  </div>
                </div>
              </div>

              {/* Time Left */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Time Left</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    daysLeft < 7 ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                  </span>
                </div>
              </div>

              {/* Donation Input */}
              {caseData.status === 'active' && daysLeft > 0 && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (MATIC)
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleDonate}
                       disabled={isDonating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                     data-testid="case-detail-donate-button"
                  >
                     {isDonating ? "Processing..." : "Donate with Crypto"}
                  </button>
                </>
              )}

              {caseData.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium">🎉 Target Achieved!</p>
                  <p className="text-sm text-green-600 mt-1">Thank you for your support</p>
                </div>
              )}
            </div>



            {/* Associated NGO */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Associated NGO</h3>
              <p className="text-gray-600 text-sm mb-3">This case is managed by:</p>
              <button
                onClick={() => {
                  if (caseData.associatedNGO?._id) {
                    router.push(`/ngos/${caseData.associatedNGO._id}`);
                  }
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors"
              >
                <p className="font-bold text-gray-800">{caseData.associatedNGO?.ngoName || 'NGO Name'}</p>
                <p className="text-sm text-gray-600 mt-1">View NGO Profile →</p>
              </button>
            </div>

             <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recent On-Platform Donations</h3>
              <div className="space-y-3" data-testid="case-recent-donations-list">
                {recentDonations.length === 0 && (
                  <p className="text-sm text-gray-500">No donations yet for this case.</p>
                )}
                {recentDonations.map((donation) => (
                  <div key={donation._id} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800" data-testid={`case-donation-wallet-${donation._id}`}>
                      {donation.sender?.walletAddress || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {donation.amount} MATIC
                    </p>
                    <p className="text-xs text-blue-600 break-all" data-testid={`case-donation-txhash-${donation._id}`}>
                      {donation.txHash}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(donation.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
