"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Shield, Building2, TrendingUp, Package, CheckCircle, XCircle, LogOut, Clock } from "lucide-react";
import { apiClient } from "../../utils/api";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalNGOs: 0,
    pendingNGOs: 0,
    approvedNGOs: 0,
    totalCases: 0,
    totalProducts: 0,
    totalDonations: 0
  });
  const [pendingNGOs, setPendingNGOs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const userRole = localStorage.getItem("user_role");
    
    if (!accessToken || userRole !== "superAdmin") {
      router.push("/login");
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Load pending NGOs
      const ngoResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ngos?status=pending`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}` },
        credentials: 'include'
      });
      const ngoData = await ngoResult.json();
      if (ngoData.success) {
        setPendingNGOs(ngoData.data || []);
      }

      // Load all NGOs for stats
      const allNGOsResult = await apiClient.ngos.getAll({});
      const casesResult = await apiClient.cases.getAll({});
      const productsResult = await apiClient.products.getAll({});

      if (allNGOsResult.success) {
        const ngos = allNGOsResult.data || [];
        setStats(prev => ({
          ...prev,
          totalNGOs: ngos.length,
          pendingNGOs: ngos.filter((n: any) => n.approvalStatus === 'pending').length,
          approvedNGOs: ngos.filter((n: any) => n.approvalStatus === 'approved').length
        }));
      }

      if (casesResult.success) {
        setStats(prev => ({ ...prev, totalCases: casesResult.data?.length || 0 }));
      }

      if (productsResult.success) {
        setStats(prev => ({ ...prev, totalProducts: productsResult.data?.length || 0 }));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveNGO = async (ngoId: string) => {
    try {
      const result = await apiClient.ngos.approve(ngoId, "Approved by Super Admin");
      if (result.success) {
        toast.success("NGO approved successfully!");
        loadDashboardData();
      } else {
        toast.error(result.message || "Failed to approve NGO");
      }
    } catch (error) {
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
        loadDashboardData();
      } else {
        toast.error(result.message || "Failed to reject NGO");
      }
    } catch (error) {
      toast.error("Error rejecting NGO");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
              <p className="text-purple-100 text-sm">Platform Management Control</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm">Total NGOs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalNGOs}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-gray-600 text-sm">Pending NGOs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingNGOs}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm">Approved NGOs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.approvedNGOs}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm">Total Cases</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCases}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-600 text-sm">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>

        {/* Pending NGO Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pending NGO Approvals</h3>
          {pendingNGOs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pending NGO approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingNGOs.map((ngo: any) => (
                <div key={ngo._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{ngo.ngoName}</h4>
                    <p className="text-sm text-gray-600 mb-2">{ngo.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">📍 {ngo.address.city}, {ngo.address.state}</span>
                      <span className="text-gray-500">📧 {ngo.contactDetails.email}</span>
                      <span className="text-gray-500">🆔 {ngo.registrationNumber}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveNGO(ngo._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectNGO(ngo._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/ngos")}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            View All NGOs
          </button>
          <button
            onClick={() => router.push("/cases")}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            Manage Cases
          </button>
          <button
            onClick={() => router.push("/products")}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
          >
            Manage Products
          </button>
        </div>
      </main>
    </div>
  );
}