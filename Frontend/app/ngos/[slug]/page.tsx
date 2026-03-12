"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart, MapPin, Mail, Phone, Globe, Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { apiClient } from "../../utils/api";
import { toast } from "react-toastify";

export default function NGODetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");

  useEffect(() => {
    if (slug) {
      fetchNGODetails();
    }
  }, [slug]);

  const fetchNGODetails = async () => {
    try {
      const result = await apiClient.ngos.getById(slug);
      if (result.success) {
        setNgo(result.data);
      } else {
        toast.error("NGO not found");
        router.push("/ngos");
      }
    } catch (err) {
      console.error("Error fetching NGO:", err);
      toast.error("Error loading NGO details");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }
    toast.info("Donation feature will be integrated with blockchain");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ngo) {
    return <div className="min-h-screen flex items-center justify-center">NGO not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-6">
        <button
          onClick={() => router.push("/ngos")}
          className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to NGOs
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">{ngo.ngoName}</h1>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
          <p className="text-xl opacity-90 mb-2">{ngo.mission}</p>
          <div className="flex items-center text-lg opacity-80">
            <MapPin className="w-5 h-5 mr-2" />
            {ngo.address?.street}, {ngo.address?.city}, {ngo.address?.state} - {ngo.address?.pincode}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">About Us</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{ngo.description}</p>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">{ngo.mission}</p>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Focus Areas</h2>
              <div className="flex flex-wrap gap-3">
                {ngo.focusAreas?.map((area: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Photo Gallery */}
            {ngo.photoGallery && ngo.photoGallery.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ngo.photoGallery.map((photo: string, index: number) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {ngo.upcomingEvents && ngo.upcomingEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Upcoming Events</h2>
                <div className="space-y-4">
                  {ngo.upcomingEvents.map((event: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.eventDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Support This NGO</h3>
              <div className="mb-6">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  ₹{(ngo.totalDonationsReceived || 0).toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm">Total Donations Received</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (MATIC)
                </label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <button
                onClick={handleDonate}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Donate with Crypto
              </button>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Contact Information</h3>
              <div className="space-y-3">
                {ngo.contactDetails?.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3 text-green-500" />
                    <a href={`mailto:${ngo.contactDetails.email}`} className="hover:text-green-600">
                      {ngo.contactDetails.email}
                    </a>
                  </div>
                )}
                {ngo.contactDetails?.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3 text-green-500" />
                    <a href={`tel:${ngo.contactDetails.phone}`} className="hover:text-green-600">
                      {ngo.contactDetails.phone}
                    </a>
                  </div>
                )}
                {ngo.contactDetails?.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-3 text-green-500" />
                    <a
                      href={ngo.contactDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-600"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Verification</h3>
              <div className="space-y-2">
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Verified NGO</span>
                </div>
                <p className="text-sm text-gray-600">
                  Reg. No: <span className="font-medium">{ngo.registrationNumber}</span>
                </p>
                {ngo.approvalDate && (
                  <p className="text-sm text-gray-600">
                    Approved on: {new Date(ngo.approvalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
