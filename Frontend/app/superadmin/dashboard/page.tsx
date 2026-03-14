"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, TrendingUp, Users, Target, Package, DollarSign, Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [ngos, setNgos] = useState<any[]>([]);
  const [pendingNGOs, setPendingNGOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== 'superAdmin') {
      toast.error("Access denied. Super Admin only.");
      router.push("/");
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all NGOs
      const allNGOs = await apiClient.ngos.getAll({});
    if (allNGOs.success) {
  const ngos = Array.isArray(allNGOs.data)
    ? allNGOs.data
    : allNGOs.data?.ngos || [];

  setNgos(ngos);
  setPendingNGOs(ngos.filter((ngo: any) => ngo.approvalStatus === "pending"));
}
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveNGO = async (ngoId: string) => {
    try {
      const result = await apiClient.ngos.approve(ngoId, "Approved by Super Admin");
      if (result.success) {
        toast.success("NGO approved successfully!");
        fetchDashboardData();
      } else {
        toast.error(result.message || "Failed to approve NGO");
      }
    } catch (err) {
      console.error("Error approving NGO:", err);
      toast.error("Error approving NGO");
    }
  };

  const handleRejectNGO = async (ngoId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const result = await apiClient.ngos.reject(ngoId, reason);
      if (result.success) {
        toast.success("NGO rejected");
        fetchDashboardData();
      } else {
        toast.error(result.message || "Failed to reject NGO");
      }
    } catch (err) {
      console.error("Error rejecting NGO:", err);
      toast.error("Error rejecting NGO");
    }
  };

  const approvedNGOs = ngos.filter(ngo => ngo.approvalStatus === 'approved');
  const rejectedNGOs = ngos.filter(ngo => ngo.approvalStatus === 'rejected');
  const totalDonations = ngos.reduce((sum, ngo) => sum + (ngo.totalDonationsReceived || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6" data-testid="superadmin-dashboard-page">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-blue-600" />
             <h1 className="text-4xl font-bold text-gray-800" data-testid="superadmin-dashboard-title">Super Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Platform management and NGO oversight</p>
           <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push('/superadmin/products')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              data-testid="superadmin-go-products-button"
            >
              Manage Products
            </button>
                <button
              onClick={() => router.push('/superadmin/products/sales')}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              data-testid="superadmin-go-sales-button"
            >
              <Package className="w-4 h-4" />
              Product Sales History
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total NGOs</span>
              <Building2 className="w-8 h-8 text-green-500" />
            </div>
           <p className="text-3xl font-bold text-gray-800" data-testid="superadmin-total-ngos-value">{ngos.length}</p>
            <p className="text-xs text-gray-500 mt-1">{approvedNGOs.length} approved, {pendingNGOs.length} pending</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Pending Approvals</span>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
               <p className="text-3xl font-bold text-gray-800" data-testid="superadmin-pending-ngos-value">{pendingNGOs.length}</p>
            <p className="text-xs text-orange-600 mt-1">Requires attention</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Raised</span>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
              <p className="text-3xl font-bold text-gray-800" data-testid="superadmin-total-donations-value">₹{totalDonations.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Platform-wide</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Platform Health</span>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">98%</p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              All systems operational
            </p>
          </div>
        </div>

        {/* Pending NGO Approvals */}
        {pendingNGOs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-800">Pending NGO Approvals</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {pendingNGOs.length} pending
              </span>
            </div>
            <div className="space-y-4">
              {pendingNGOs.map((ngo) => (
                <div key={ngo._id} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
   <h3 className="text-xl font-bold text-gray-800 mb-2" data-testid={`pending-ngo-name-${ngo._id}`}>{ngo.ngoName}</h3>
                      <p className="text-gray-600 mb-3">{ngo.description}</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600"><span className="font-medium">Registration:</span> {ngo.registrationNumber}</p>
                          <p className="text-gray-600"><span className="font-medium">Location:</span> {ngo.address?.city}, {ngo.address?.state}</p>
                        </div>
                        <div>
                          <p className="text-gray-600"><span className="font-medium">Email:</span> {ngo.contactDetails?.email}</p>
                          <p className="text-gray-600"><span className="font-medium">Phone:</span> {ngo.contactDetails?.phone}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ngo.focusAreas?.map((area: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveNGO(ngo._id)}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                        data-testid={`pending-ngo-approve-${ngo._id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectNGO(ngo._id)}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        data-testid={`pending-ngo-reject-${ngo._id}`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => router.push(`/ngos/${ngo.slug}`)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                          data-testid={`pending-ngo-view-${ngo._id}`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All NGOs List */}
   <div className="bg-white rounded-xl shadow-lg p-6" data-testid="superadmin-all-ngos-section">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All NGOs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">NGO Name</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Focus Areas</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Total Raised</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ngos.map((ngo) => (
                  <tr key={ngo._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-800">{ngo.ngoName}</p>
                      <p className="text-xs text-gray-500">{ngo.registrationNumber}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {ngo.address?.city}, {ngo.address?.state}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ngo.focusAreas?.slice(0, 2).map((area: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {area}
                          </span>
                        ))}
                        {ngo.focusAreas?.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{ngo.focusAreas.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ngo.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : ngo.approvalStatus === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ngo.approvalStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-800">
                      ₹{(ngo.totalDonationsReceived || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => router.push(`/ngos/${ngo.slug}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                         data-testid={`ngo-row-view-${ngo._id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
