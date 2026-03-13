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
   photoGallery?: string[];
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

      const result = await apiClient.ngos.getAll({ status: "approved" });

      if (result.success) {
        const ngoList = result.data?.ngos || result.data || [];
        setNgos(Array.isArray(ngoList) ? ngoList : []);
        setFilteredNgos(Array.isArray(ngoList) ? ngoList : []);
      } else {
        toast.error("Failed to fetch NGOs");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching NGOs");
    } finally {
      setIsLoading(false);
    }
  };

  const filterNGOs = () => {
    let filtered = [...ngos];

    if (searchQuery) {
      filtered = filtered.filter(
        (ngo) =>
          ngo.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ngo.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(
        (ngo) =>
          ngo.address.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    setFilteredNgos(filtered);
  };

  const cities = Array.from(
    new Set((Array.isArray(ngos) ? ngos : []).map((ngo) => ngo.address?.city))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">

      {/* HERO */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-5xl font-bold mb-4">
            Support Verified NGOs
          </h1>

          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Donate securely using blockchain technology. Every transaction is transparent and verifiable.
          </p>
        </div>
      </div>


      {/* SEARCH + FILTER */}
      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-10 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-4">

            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search NGOs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-3 text-gray-400 w-5 h-5" />

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>


      {/* NGO GRID */}
      <div className="max-w-6xl mx-auto px-6 py-14">

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNgos.length === 0 ? (

          <div className="text-center py-24">
            <Building2 className="mx-auto w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              No NGOs Found
            </h3>
            <p className="text-gray-500 mt-2">
              Try changing your filters
            </p>
          </div>

        ) : (

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {filteredNgos.map((ngo) => (

              <div
                key={ngo._id}
                onClick={() => router.push(`/ngos/${ngo.slug || ngo._id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              >

                {/* IMAGE */}
                <div className="h-48 relative overflow-hidden">

                  {ngo.coverImage || (ngo.photoGallery && ngo.photoGallery.length > 0) ? (
                    <img
                        src={ngo.coverImage || ngo.photoGallery[0]}
                      alt={ngo.ngoName}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-500 to-indigo-600">
                      <Building2 className="w-20 h-20 text-white opacity-60" />
                    </div>
                  )}
                   {/* Photo count badge */}
                  {ngo.photoGallery && ngo.photoGallery.length > 0 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                      {ngo.photoGallery.length} {ngo.photoGallery.length === 1 ? 'photo' : 'photos'}
                    </div>
                  )}

                </div>


                {/* CARD BODY */}
                <div className="p-6">

                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                    {ngo.ngoName}
                  </h3>

                  <div className="flex items-center text-gray-500 text-sm mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {ngo.address.city}, {ngo.address.state}
                  </div>

                  <p className="text-gray-600 text-sm mt-3 line-clamp-3">
                    {ngo.description}
                  </p>

                  {/* FOCUS AREAS */}
                  {ngo.focusAreas?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {ngo.focusAreas.slice(0, 3).map((area, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t">

                    <div className="flex items-center text-green-600 text-sm font-semibold">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {ngo.totalDonationsReceived || 0} ETH
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/ngos/${ngo.slug || ngo._id}`);
                      }}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium hover:scale-105 transition"
                    >
                      <Heart className="w-4 h-4" />
                      Donate
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}
      </div>


      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-20 text-center">

        <h2 className="text-3xl font-bold mb-4">
          Want to Register Your NGO?
        </h2>

        <p className="text-blue-100 mb-8">
          Join our transparent donation ecosystem
        </p>

        <button
          onClick={() => router.push("/signup")}
          className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg"
        >
          Register NGO
        </button>

      </div>

    </div>
  );
}