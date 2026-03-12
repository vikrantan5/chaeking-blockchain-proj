"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, TrendingUp, Heart, Target, Package, Users, DollarSign, Activity, CheckCircle, Clock, XCircle } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";

export default function NGOAdminDashboard() {
  const router = useRouter();
  const [ngoData, setNgoData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== 'ngoAdmin') {
      toast.error("Access denied. NGO Admin only.");
      router.push("/");
      return;
    }
    fetchNGODashboard();
  }, []);

  const fetchNGODashboard = async () => {
    try {
      const result = await apiClient.ngos.getAll({ status: 'approved' });
      if (result.success && result.data.length > 0) {
        // For demo, using the first NGO. In production, filter by logged-in user
        setNgoData(result.data[0]);
        // Mock stats - in production, these would come from backend
        setStats({
          totalDonations: result.data[0].totalDonationsReceived || 0,
          activeCases: 3,
          completedCases: 5,
          totalProducts: 8,
          totalDonors: 127,
          monthlyGrowth: 15.3,
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No NGO Found</h2>
          <p className="text-gray-600 mb-4">Please register your NGO first</p>
          <button
            onClick={() => router.push("/ngo-registration")}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90"
          >
            Register NGO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{ngoData.ngoName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Verified NGO</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600">{ngoData.mission}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Raised</span>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">₹{stats?.totalDonations?.toLocaleString() || 0}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{stats?.monthlyGrowth || 0}% this month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Donors</span>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalDonors || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Lifetime supporters</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Active Cases</span>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.activeCases || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Fundraising campaigns</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Completed</span>
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.completedCases || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Successful cases</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Products</span>
              <Package className="w-8 h-8 text-pink-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalProducts || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Available items</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Impact Score</span>
              <Activity className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">8.5</p>
            <p className="text-xs text-gray-500 mt-1">Out of 10</p>
          </div>
        </div>

        {/* NGO Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">NGO Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Contact Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Email:</span> <span className="font-medium">{ngoData.contactDetails?.email}</span></p>
                <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{ngoData.contactDetails?.phone}</span></p>
                <p><span className="text-gray-600">Website:</span> <span className="font-medium">{ngoData.contactDetails?.website || 'N/A'}</span></p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Address</h3>
              <p className="text-sm text-gray-600">
                {ngoData.address?.street}, {ngoData.address?.city}<br />
                {ngoData.address?.state} - {ngoData.address?.pincode}<br />
                {ngoData.address?.country}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {ngoData.focusAreas?.map((area: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Registration</h3>
              <p className="text-sm"><span className="text-gray-600">Reg. No:</span> <span className="font-medium">{ngoData.registrationNumber}</span></p>
              <p className="text-sm"><span className="text-gray-600">Wallet:</span> <span className="font-mono text-xs">{ngoData.walletAddress?.slice(0, 10)}...{ngoData.walletAddress?.slice(-8)}</span></p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => toast.info("Case creation feature coming soon")}
              className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
            >
              <Target className="w-10 h-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">Create Fundraising Case</h3>
              <p className="text-sm text-gray-600">Start a new campaign</p>
            </button>

            <button
              onClick={() => toast.info("Product management coming soon")}
              className="p-6 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
            >
              <Package className="w-10 h-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">Manage Products</h3>
              <p className="text-sm text-gray-600">Update donation items</p>
            </button>

            <button
              onClick={() => router.push(`/ngos/${ngoData.slug}`)}
              className="p-6 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
            >
              <Building2 className="w-10 h-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">View Public Profile</h3>
              <p className="text-sm text-gray-600">See how donors see you</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">New donation received</p>
                  <p className="text-sm text-gray-600">From anonymous donor - ₹1,000</p>
                </div>
                <span className="text-xs text-gray-500">2h ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
