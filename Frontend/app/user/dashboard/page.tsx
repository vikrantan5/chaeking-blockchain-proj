"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Wallet, TrendingUp, Gift, Heart, LogOut, Menu, X } from "lucide-react";
import { apiClient } from "../../utils/api";

export default function UserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDonated: 0, caseDonations: 0, productDonations: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const userRole = localStorage.getItem("user_role");
    
    if (!accessToken || userRole !== "user") {
      router.push("/login");
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user_data") || "{}");
      setUserData(user);

      // Load transactions
      const txResult = await apiClient.transactions.getAll();
      if (txResult.success) {
        setTransactions(txResult.data || []);
        
        // Calculate stats
        const total = txResult.data.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        const caseDonations = txResult.data.filter((tx: any) => tx.transactionType === 'case-donation').length;
        const productDonations = txResult.data.filter((tx: any) => tx.transactionType === 'product-donation').length;
        
        setStats({ totalDonated: total, caseDonations, productDonations });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4 lg:hidden">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userData?.name || 'User'}! 👋</h2>
          <p className="text-gray-600">Track your donations and support NGOs making a difference</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Donated</p>
            <p className="text-2xl font-bold text-gray-900">${stats.totalDonated.toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Case Donations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.caseDonations}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Product Donations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.productDonations}</p>
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Donations</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No donations yet</p>
              <button
                onClick={() => router.push("/ngos")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Donating
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 10).map((tx: any) => (
                    <tr key={tx._id}>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{tx.transactionType}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">${tx.amount?.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/ngos")}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            Browse NGOs
          </button>
          <button
            onClick={() => router.push("/cases")}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            View Fundraising Cases
          </button>
          <button
            onClick={() => router.push("/products")}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
          >
            Donate Products
          </button>
        </div>
      </main>
    </div>
  );
}