"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, TrendingUp, Package, Target, Calendar, DollarSign, Award } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";

export default function UserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (!user) {
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(user));
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const result = await apiClient.transactions.getAll();
      if (result.success) {
        setDonations(result.data);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const ngoDonations = donations.filter(d => d.transactionType === 'transfer').length;
  const caseDonations = donations.filter(d => d.transactionType === 'case-donation').length;
  const productDonations = donations.filter(d => d.transactionType === 'product-donation').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome, {userData?.name}! 👋</h1>
          <p className="text-gray-600">Track your donations and make a difference</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Donated</span>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">₹{totalDonated.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Lifetime contributions</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">NGO Donations</span>
              <Heart className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{ngoDonations}</p>
            <p className="text-xs text-gray-500 mt-1">Direct NGO support</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Case Support</span>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{caseDonations}</p>
            <p className="text-xs text-gray-500 mt-1">Fundraising cases</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Products</span>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{productDonations}</p>
            <p className="text-xs text-gray-500 mt-1">Items donated</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/ngos")}
              className="p-6 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
            >
              <Heart className="w-10 h-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">Donate to NGOs</h3>
              <p className="text-sm text-gray-600">Support verified NGOs</p>
            </button>

            <button
              onClick={() => router.push("/cases")}
              className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
            >
              <Target className="w-10 h-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">Support Cases</h3>
              <p className="text-sm text-gray-600">Help fundraising campaigns</p>
            </button>

            <button
              onClick={() => router.push("/products")}
              className="p-6 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
            >
              <Package className="w-10 h-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-gray-800 mb-1">Donate Products</h3>
              <p className="text-sm text-gray-600">Provide essential items</p>
            </button>
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Donations</h2>
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven't made any donations yet</p>
              <button
                onClick={() => router.push("/ngos")}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Donating
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Recipient</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Amount</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 10).map((donation, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-800">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          donation.transactionType === 'transfer'
                            ? 'bg-green-100 text-green-700'
                            : donation.transactionType === 'case-donation'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {donation.transactionType === 'transfer'
                            ? 'NGO'
                            : donation.transactionType === 'case-donation'
                            ? 'Case'
                            : 'Product'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-800">
                        {donation.ngo?.ngoName || donation.case?.caseTitle || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-800">
                        ₹{donation.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
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

        {/* Impact Badge */}
        {totalDonated > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg p-8 text-white text-center">
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Thank You for Your Generosity!</h3>
            <p className="text-lg opacity-90">
              Your donations are making a real difference in people's lives. Keep up the amazing work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
