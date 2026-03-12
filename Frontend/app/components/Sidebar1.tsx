"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../utils/api";

export default function NGOApprovalsPage() {
  const router = useRouter();
  const [pendingNGOs, setPendingNGOs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user || JSON.parse(user).role !== "superAdmin") {
      router.push("/login");
      return;
    }
    fetchPendingNGOs();
  }, [router]);

const fetchPendingNGOs = async () => {
  setIsLoading(true);

  try {
    const result = await apiClient.ngos.getAll({ status: "pending" });

    if (result.success) {
      const ngos = Array.isArray(result.data)
        ? result.data
        : result.data?.ngos || [];

      setPendingNGOs(ngos);
    } else {
      toast.error(result.message || "Failed to fetch pending NGOs");
    }
  } catch {
    toast.error("Unable to load pending NGO approvals");
  } finally {
    setIsLoading(false);
  }
};

  const approveNGO = async (ngoId: string) => {
    const result = await apiClient.ngos.approve(ngoId, "Approved by Super Admin");
    if (result.success) {
      toast.success("NGO approved successfully");
      fetchPendingNGOs();
      return;
    }
    toast.error(result.message || "Unable to approve NGO");
  };

  const rejectNGO = async (ngoId: string) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    const result = await apiClient.ngos.reject(ngoId, reason);
    if (result.success) {
      toast.success("NGO rejected successfully");
      fetchPendingNGOs();
      return;
    }
    toast.error(result.message || "Unable to reject NGO");
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center" data-testid="ngo-approvals-loading">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ngo-approvals-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="ngo-approvals-title">Pending NGO Approvals</h1>
        <p className="text-gray-600 mt-1" data-testid="ngo-approvals-subtitle">Review NGO registration requests and approve or reject them.</p>
      </div>

      {pendingNGOs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center" data-testid="ngo-approvals-empty-state">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No pending NGO requests right now.</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="ngo-approvals-list">
          {pendingNGOs.map((ngo) => (
            <div className="bg-white rounded-xl border border-gray-200 p-6" key={ngo._id} data-testid={`ngo-approval-card-${ngo._id}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900" data-testid={`ngo-approval-name-${ngo._id}`}>{ngo.ngoName}</h2>
                  <p className="text-gray-600" data-testid={`ngo-approval-description-${ngo._id}`}>{ngo.description}</p>
                  <p className="text-sm text-gray-500" data-testid={`ngo-approval-registration-${ngo._id}`}>Registration No: {ngo.registrationNumber}</p>
                  <p className="text-sm text-gray-500" data-testid={`ngo-approval-location-${ngo._id}`}>{ngo.address?.city}, {ngo.address?.state}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => approveNGO(ngo._id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    data-testid={`ngo-approval-approve-button-${ngo._id}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectNGO(ngo._id)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                    data-testid={`ngo-approval-reject-button-${ngo._id}`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}