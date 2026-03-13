"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Building2,
  TrendingUp,
  Users,
  Package,
  LogOut,
  Heart,
  ImagePlus,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define types for better TypeScript support
interface NGOData {
  _id: string;
  ngoName: string;
  slug: string;
  walletAddress?: string;
  registrationNumber: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  address?: {
    city: string;
    state: string;
  };
  contactDetails?: {
    email: string;
  };
   photoGallery?: string[];
  coverImage?: string;
}

interface DashboardStats {
  totalDonations: number;
  activeCases: number;
  completedCases: number;
  totalProducts: number;
}

export default function NGOAdminDashboard() {
  const router = useRouter();
  const [ngoData, setNgoData] = useState<NGOData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    activeCases: 0,
    completedCases: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("user_data");

    if (!accessToken || !userRaw) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userRaw);
      if (userData?.role !== "ngoAdmin") {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    loadDashboardData(accessToken);
  }, [router]);

  const loadDashboardData = async (token?: string) => {
    const accessToken = token || sessionStorage.getItem("accessToken");

    if (!API_URL) {
      toast.error("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      router.push("/login");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/ngos/dashboard`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to load NGO dashboard");
        setIsLoading(false);
        return;
      }

      setNgoData(data.data?.ngo || null);
      setStats(
        data.data?.stats || {
          totalDonations: 0,
          activeCases: 0,
          completedCases: 0,
          totalProducts: 0,
        }
      );
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      toast.error("Please select an image first");
      return;
    }

    if (!ngoData?._id) {
      toast.error("NGO data not loaded");
      return;
    }

    // Validate file type
    if (!photoFile.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (photoFile.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken || !API_URL) {
      toast.error("Session expired. Please login again.");
      router.push("/login");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photoGallery", photoFile);

      const response = await fetch(`${API_URL}/ngos/${ngoData._id}/update`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to upload NGO image");
        return;
      }

      toast.success("NGO image uploaded successfully");
      setPhotoFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await loadDashboardData(accessToken);
    } catch (error) {
      console.error("Error uploading NGO photo:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user_data");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const getStatusMessage = () => {
    switch (ngoData?.approvalStatus) {
      case "approved":
        return "Your NGO is approved and can receive donations.";
      case "rejected":
        return `Your NGO registration was rejected. Reason: ${ngoData.rejectionReason || "Not provided"}`;
      default:
        return "Your NGO registration is pending Super Admin approval.";
    }
  };

  const getStatusStyles = () => {
    switch (ngoData?.approvalStatus) {
      case "approved":
        return "border-green-200 bg-green-50 text-green-800";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="ngoadmin-dashboard-loading">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" data-testid="ngoadmin-dashboard-no-ngo">
        <div className="text-center">
          <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">No NGO profile found</h2>
          <p className="mb-6 text-gray-600">Please complete NGO signup first.</p>
          <button
            onClick={() => router.push("/signup")}
            className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            data-testid="ngoadmin-go-to-signup-button"
          >
            Go to NGO Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="ngoadmin-dashboard-page">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="ngoadmin-dashboard-title">
              NGO Dashboard
            </h1>
            <p className="text-sm text-gray-600" data-testid="ngoadmin-dashboard-ngo-name">
              {ngoData.ngoName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            data-testid="ngoadmin-logout-button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Banner */}
        <div
          className={`rounded-lg border p-4 ${getStatusStyles()}`}
          data-testid="ngoadmin-status-banner"
        >
          {getStatusMessage()}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4" data-testid="ngoadmin-stats-grid">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <Heart className="mb-4 h-6 w-6 text-green-600" />
            <p className="text-sm text-gray-600">Total Donations</p>
            <p className="text-2xl font-bold text-gray-900" data-testid="ngoadmin-total-donations-value">
              {Number(stats.totalDonations || 0).toFixed(2)} MATIC
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <TrendingUp className="mb-4 h-6 w-6 text-blue-600" />
            <p className="text-sm text-gray-600">Active Cases</p>
            <p className="text-2xl font-bold text-gray-900" data-testid="ngoadmin-active-cases-value">
              {stats.activeCases}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <Users className="mb-4 h-6 w-6 text-purple-600" />
            <p className="text-sm text-gray-600">Completed Cases</p>
            <p className="text-2xl font-bold text-gray-900" data-testid="ngoadmin-completed-cases-value">
              {stats.completedCases}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <Package className="mb-4 h-6 w-6 text-orange-600" />
            <p className="text-sm text-gray-600">Products</p>
            <p className="text-2xl font-bold text-gray-900" data-testid="ngoadmin-total-products-value">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        {/* NGO Profile Section */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm" data-testid="ngoadmin-profile-block">
          <h3 className="mb-4 text-xl font-bold text-gray-900">NGO Profile</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <p data-testid="ngoadmin-wallet-address">
              <span className="font-medium">Wallet:</span> {ngoData.walletAddress || "Not linked"}
            </p>
            <p data-testid="ngoadmin-location">
              <span className="font-medium">Location:</span> {ngoData.address?.city || "N/A"}, {ngoData.address?.state || "N/A"}
            </p>
            <p data-testid="ngoadmin-email">
              <span className="font-medium">Email:</span> {ngoData.contactDetails?.email || "N/A"}
            </p>
            <p data-testid="ngoadmin-registration-number">
              <span className="font-medium">Registration:</span> {ngoData.registrationNumber}
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-4" data-testid="ngoadmin-photo-upload-block">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ImagePlus className="h-4 w-4" />
              Add NGO photos (visible on NGO profile)
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="text-sm"
                data-testid="ngoadmin-photo-input"
              />
              <button
                onClick={handlePhotoUpload}
                disabled={!photoFile || isUploading}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="ngoadmin-photo-upload-button"
                type="button"
              >
                {isUploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
            {photoFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected: {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
           {/* Photo Gallery Display */}
          {ngoData.photoGallery && ngoData.photoGallery.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Uploaded Photos</h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {ngoData.photoGallery.map((photoUrl: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={photoUrl}
                      alt={`NGO Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover Image Display */}
          {ngoData.coverImage && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Cover Image</h4>
              <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={ngoData.coverImage}
                  alt="NGO Cover"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => router.push("/cases")}
            className="rounded-lg bg-blue-600 p-4 text-center font-medium text-white hover:bg-blue-700"
            data-testid="ngoadmin-view-cases-button"
          >
            View Cases
          </button>
          <button
            onClick={() => router.push("/products")}
            className="rounded-lg bg-purple-600 p-4 text-center font-medium text-white hover:bg-purple-700"
            data-testid="ngoadmin-view-products-button"
          >
            View Products
          </button>
          <button
            onClick={() => router.push(`/ngos/${ngoData.slug}`)}
            className="rounded-lg bg-green-600 p-4 text-center font-medium text-white hover:bg-green-700"
            data-testid="ngoadmin-view-profile-button"
          >
            View Public NGO Profile
          </button>
        </div>
      </main>
    </div>
  );
}