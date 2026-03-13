"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "../../utils/api";
import { ArrowLeft } from "lucide-react";

export default function NGOListPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user || JSON.parse(user).role !== "superAdmin") {
      router.push("/login");
      return;
    }
    loadNGOs();
  }, [router]);

const loadNGOs = async () => {
  setIsLoading(true);
  try {
    const result = await apiClient.ngos.getAll({});

    if (result.success) {
      setNgos(result.data?.ngos || []);
    } else {
      toast.error(result.message || "Unable to load NGOs");
    }
  } catch {
    toast.error("Unable to load NGO list");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6" data-testid="ngo-list-page">
        <button
        onClick={() => router.push("/superadmin/dashboard")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        data-testid="back-to-dashboard"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="ngo-list-title">All Registered NGOs</h1>
        <p className="text-gray-600 mt-1" data-testid="ngo-list-subtitle">Monitor approved, pending, and rejected NGO profiles.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto" data-testid="ngo-list-table-wrapper">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center" data-testid="ngo-list-loading">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="min-w-full" data-testid="ngo-list-table">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-5 py-3 text-sm font-semibold text-gray-600">NGO Name</th>
                <th className="px-5 py-3 text-sm font-semibold text-gray-600">Registration</th>
                <th className="px-5 py-3 text-sm font-semibold text-gray-600">Location</th>
                <th className="px-5 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 text-sm font-semibold text-gray-600">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {ngos.map((ngo) => (
                <tr className="border-b border-gray-100" key={ngo._id} data-testid={`ngo-list-row-${ngo._id}`}>
                  <td className="px-5 py-4 text-gray-900 font-medium" data-testid={`ngo-list-name-${ngo._id}`}>{ngo.ngoName}</td>
                  <td className="px-5 py-4 text-gray-700" data-testid={`ngo-list-registration-${ngo._id}`}>{ngo.registrationNumber}</td>
                  <td className="px-5 py-4 text-gray-700" data-testid={`ngo-list-location-${ngo._id}`}>{ngo.address?.city}, {ngo.address?.state}</td>
                  <td className="px-5 py-4" data-testid={`ngo-list-status-${ngo._id}`}>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ngo.approvalStatus === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : ngo.approvalStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {ngo.approvalStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700 text-sm break-all" data-testid={`ngo-list-wallet-${ngo._id}`}>{ngo.walletAddress || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}