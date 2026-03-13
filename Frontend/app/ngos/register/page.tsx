"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Building2, ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { apiClient } from "../../utils/api";

export default function NGORegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ngoName: "",
    registrationNumber: "",
    description: "",
    mission: "",
    walletAddress: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    focusAreas: [] as string[]
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [verificationDocs, setVerificationDocs] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const focusAreaOptions = [
    "Education", "Healthcare", "Poverty Alleviation", "Environment",
    "Women Empowerment", "Child Welfare", "Disaster Relief", "Animal Welfare"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };


   const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Cover image must be less than 5MB");
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerificationDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (verificationDocs.length + files.length > 10) {
      toast.error("Maximum 10 verification documents allowed");
      return;
    }
    setVerificationDocs(prev => [...prev, ...files]);
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("ngoName", formData.ngoName);
      submitData.append("registrationNumber", formData.registrationNumber);
      submitData.append("description", formData.description);
      submitData.append("mission", formData.mission);
      submitData.append("walletAddress", formData.walletAddress);
      submitData.append("address", JSON.stringify({
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: "India",
        pincode: formData.pincode
      }));
      submitData.append("contactDetails", JSON.stringify({
        phone: formData.phone,
        email: formData.email,
        website: formData.website
      }));
      submitData.append("focusAreas", JSON.stringify(formData.focusAreas));

      // Add cover image
      if (coverImage) {
        submitData.append("coverImage", coverImage);
      }
      
      // Add verification documents
      verificationDocs.forEach((doc) => {
        submitData.append("verificationDocuments", doc);
      });

      const result = await apiClient.ngos.register(submitData);

      if (result.success) {
        toast.success("NGO registered successfully! Waiting for admin approval.");
        router.push("/ngoadmin/dashboard");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register Your NGO</h1>
              <p className="text-sm text-gray-600">Fill in the details to get started</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NGO Name *</label>
                <input
                  type="text"
                  name="ngoName"
                  required
                  value={formData.ngoName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter NGO name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                <input
                  type="text"
                  name="registrationNumber"
                  required
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter registration number"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Brief description of your NGO"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement *</label>
              <textarea
                name="mission"
                required
                value={formData.mission}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Your NGO's mission and goals"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address (Crypto) *</label>
              <input
                type="text"
                name="walletAddress"
                required
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0x..."
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="street"
                required
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Street Address"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="State"
                />
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Pincode"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Phone Number"
              />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Email Address"
              />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Website (optional)"
              />
            </div>
          </div>


          
          {/* Cover Image Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Image</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors">
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="coverImage"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {coverImagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCoverImage(null);
                          setCoverImagePreview("");
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Click to upload cover image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Verification Documents Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Documents
              <span className="text-sm font-normal text-gray-500 ml-2">(Registration certificate, 12A, 80G, etc.)</span>
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors">
                <input
                  type="file"
                  id="verificationDocs"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleVerificationDocsChange}
                  className="hidden"
                />
                <label
                  htmlFor="verificationDocs"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload documents</p>
                  <p className="text-xs text-gray-400">PDF, PNG, JPG (Max 10 files)</p>
                </label>
              </div>

              {verificationDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Documents ({verificationDocs.length})</p>
                  <div className="space-y-2">
                    {verificationDocs.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeVerificationDoc(index)}
                          className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {focusAreaOptions.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleFocusArea(area)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.focusAreas.includes(area)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? "Submitting..." : "Register NGO"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
