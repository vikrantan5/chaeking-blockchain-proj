"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Heart, TrendingUp, Search, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../utils/api";

interface NGO {
  _id: string;
  ngoName: string;
  slug: string;
  description: string;
  coverImage: string;
  address: {
    city: string;
    state: string;
  };
  focusAreas: string[];
  totalDonationsReceived: number;
}

export default function NGOsPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [filteredNgos, setFilteredNgos] = useState<NGO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    fetchNGOs();
  }, []);

  useEffect(() => {
    filterNGOs();
  }, [searchQuery, selectedCity, ngos]);

  const fetchNGOs = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.ngos.getAll({ status: 'approved' });
      if (result.success) {
        setNgos(result.data);
        setFilteredNgos(result.data);
      } else {
        toast.error("Failed to fetch NGOs");
      }
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast.error("An error occurred while fetching NGOs");
    } finally {
      setIsLoading(false);
    }
  };

  const filterNGOs = () => {
    let filtered = [...ngos];

    if (searchQuery) {
      filtered = filtered.filter(ngo =>
        ngo.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(ngo =>
        ngo.address.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    setFilteredNgos(filtered);
  };

  const cities = Array.from(new Set(ngos.map(ngo => ngo.address.city)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Support Verified NGOs
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Donate with transparency using blockchain technology. Every donation is tracked and verifiable.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search NGOs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* NGO Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNgos.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No NGOs Found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNgos.map((ngo) => (
              <div
                key={ngo._id}
                onClick={() => router.push(`/ngos/${ngo.slug}`)}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                {/* NGO Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
                  {ngo.coverImage ? (
                    <img
                      src={ngo.coverImage}
                      alt={ngo.ngoName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-20 h-20 text-white opacity-50" />
                    </div>
                  )}
                </div>

                {/* NGO Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {ngo.ngoName}
                  </h3>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {ngo.address.city}, {ngo.address.state}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {ngo.description}
                  </p>

                  {/* Focus Areas */}
                  {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ngo.focusAreas.slice(0, 3).map((area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Donation Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">
                        {ngo.totalDonationsReceived || 0} ETH Raised
                      </span>
                    </div>
                    <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200">
                      <Heart className="w-4 h-4 mr-1" />
                      Donate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Want to Register Your NGO?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our transparent donation platform and reach more donors
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg"
          >
            Register as NGO Owner
          </button>
        </div>
      </div>
    </div>
  );
}
