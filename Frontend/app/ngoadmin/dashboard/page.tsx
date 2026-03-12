"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Building2, TrendingUp, Users, Package, LogOut, Heart } from "lucide-react";
import { apiClient } from "../../utils/api";

export default function NGOAdminDashboard() {
  const router = useRouter();
  const [ngoData, setNgoData] = useState<any>(null);
  const [stats, setStats] = useState({ totalDonations: 0, activeCases: 0, completedCases: 0, totalProducts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const userRole = localStorage.getItem("user_role");
    
    if (!accessToken || userRole !== "ngoAdmin") {
      router.push("/login");
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ngos/dashboard`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });
      const data = await result.json();
      
      if (data.success) {
        setNgoData(data.data.ngo);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No NGO Found</h2>
          <p className="text-gray-600 mb-6">You need to register an NGO first</p>
          <button
            onClick={() => router.push("/ngos/register")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Register NGO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
            <p className="text-sm text-gray-600">{ngoData.ngoName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NGO Status */}
        {ngoData.approvalStatus === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">⏳ Your NGO registration is pending approval from Super Admin</p>
          </div>
        )}
        {ngoData.approvalStatus === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ Your NGO registration was rejected. Reason: {ngoData.rejectionReason}</p>
          </div>
        )}
        {ngoData.approvalStatus === 'approved' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ Your NGO is approved and active!</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Donations</p>
            <p className="text-2xl font-bold text-gray-900">${stats.totalDonations.toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Cases</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeCases}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Completed Cases</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completedCases}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>

        {/* NGO Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">NGO Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Registration Number</p>
              <p className="text-gray-900 font-medium">{ngoData.registrationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Address</p>
              <p className="text-gray-900 font-medium text-sm">{ngoData.walletAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-gray-900 font-medium">{ngoData.address.city}, {ngoData.address.state}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Email</p>
              <p className="text-gray-900 font-medium">{ngoData.contactDetails.email}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Mission</p>
            <p className="text-gray-900">{ngoData.mission}</p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {ngoData.focusAreas.map((area: string, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/cases")}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            View Fundraising Cases
          </button>
          <button
            onClick={() => router.push("/products")}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
          >
            View Products
          </button>
          <button
            onClick={() => router.push(`/ngos/${ngoData.slug}`)}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            View Public Profile
          </button>
        </div>
      </main>
    </div>
  );
}