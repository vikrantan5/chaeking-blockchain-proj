"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, MapPin, Users, CheckCircle } from "lucide-react";
import { apiClient } from "../utils/api";
import { toast } from "react-toastify";

export default function NGOsPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFocusArea, setSelectedFocusArea] = useState("");

  const focusAreas = ["All", "Education", "Healthcare", "Poverty", "Environment", "Women Empowerment", "Child Welfare"];

  useEffect(() => {
    fetchNGOs();
  }, [selectedFocusArea]);

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'approved' };
      if (selectedFocusArea && selectedFocusArea !== "All") {
        params.focusArea = selectedFocusArea;
      }
      const result = await apiClient.ngos.getAll(params);
      if (result.success) {
        setNgos(result.data);
      } else {
        toast.error("Failed to fetch NGOs");
      }
    } catch (err) {
      console.error("Error fetching NGOs:", err);
      toast.error("Error loading NGOs");
    } finally {
      setLoading(false);
    }
  };

  const filteredNGOs = ngos.filter(
    (ngo) =>
      ngo.ngoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngo.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Discover NGOs</h1>
          <p className="text-xl opacity-90">Support verified NGOs making a real difference in communities</p>
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
                placeholder="Search by NGO name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>

          {/* Focus Area Filters */}
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedFocusArea(area === "All" ? "" : area)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  (area === "All" && !selectedFocusArea) || selectedFocusArea === area
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* NGO Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading NGOs...</p>
          </div>
        ) : filteredNGOs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No NGOs found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNGOs.map((ngo) => (
              <div
                key={ngo._id}
                onClick={() => router.push(`/ngos/${ngo.slug}`)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                {/* NGO Cover Image */}
                <div className="h-48 bg-gradient-to-r from-green-400 to-blue-400 relative overflow-hidden">
                  {ngo.coverImage ? (
                    <img src={ngo.coverImage} alt={ngo.ngoName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="w-20 h-20 text-white opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-green-600">Verified</span>
                  </div>
                </div>

                {/* NGO Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                    {ngo.ngoName}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{ngo.address?.city}, {ngo.address?.state}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ngo.description}</p>

                  {/* Focus Areas */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ngo.focusAreas?.slice(0, 2).map((area: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {area}
                      </span>
                    ))}
                    {ngo.focusAreas?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{ngo.focusAreas.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">₹{(ngo.totalDonationsReceived || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Total Raised</p>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
                      Donate Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
