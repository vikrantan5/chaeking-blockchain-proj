"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Calendar, Target, TrendingUp } from "lucide-react";
import { apiClient } from "../utils/api";
import { toast } from "react-toastify";

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const caseTypes = ["All", "Medical", "Emergency", "Education", "Disaster Relief", "Other"];

  useEffect(() => {
    fetchCases();
  }, [selectedType]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'active' };
      if (selectedType && selectedType !== "All") {
        params.caseType = selectedType.toLowerCase().replace(" ", "-");
      }
      const result = await apiClient.cases.getAll(params);
      if (result.success) {
        setCases(result.data);
      } else {
        toast.error("Failed to fetch cases");
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
      toast.error("Error loading fundraising cases");
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) =>
    c.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.beneficiaryDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Fundraising Cases</h1>
          <p className="text-xl opacity-90">Help those in need by supporting active fundraising campaigns</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by case title or beneficiary name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Case Type Filters */}
          <div className="flex flex-wrap gap-2">
            {caseTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type === "All" ? "" : type)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  (type === "All" && !selectedType) || selectedType === type
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No active cases found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((caseItem) => {
              const progress = (caseItem.currentAmount / caseItem.targetAmount) * 100;
              const daysLeft = Math.ceil(
                (new Date(caseItem.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={caseItem._id}
                      onClick={() => router.push(`/cases/${caseItem.slug || caseItem._id}`)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Case Image */}
                  <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 relative overflow-hidden">
                       {caseItem.images && caseItem.images.length > 0 ? (
                      <img src={caseItem.images[0]} alt={caseItem.caseTitle} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="w-20 h-20 text-white opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-purple-600 capitalize">
                      {caseItem.caseType.replace("-", " ")}
                    </div>
                     {/* Photo count badge */}
                    {caseItem.images && caseItem.images.length > 1 && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                        {caseItem.images.length} {caseItem.images.length === 1 ? 'photo' : 'photos'}
                      </div>
                    )}
                  </div>

                  {/* Case Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                      {caseItem.caseTitle}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{caseItem.description}</p>

                    {/* Beneficiary */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Beneficiary</p>
                      <p className="font-medium text-gray-800">{caseItem.beneficiaryDetails?.name}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-purple-600">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Raised</span>
                        <span className="font-bold text-purple-600">₹{caseItem.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Goal</span>
                        <span className="font-medium text-gray-800">₹{caseItem.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Time Left</span>
                        <span className={`font-medium ${daysLeft < 7 ? 'text-red-600' : 'text-gray-800'}`}>
                          {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
