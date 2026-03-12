"use client";

import { useState, ClipboardEvent, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  Wallet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  MapPin,
  Globe,
} from "lucide-react";
import { useMetamask } from "../hooks/useMetamask";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

export default function SignupPage() {
  const router = useRouter();
  const { account, connectWallet } = useMetamask();

  const [userType, setUserType] = useState<'user' | 'ngo'>('user');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);

  // NGO fields
  const [ngoName, setNgoName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [ngoPhone, setNgoPhone] = useState("");
  const [ngoEmail, setNgoEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [documents, setDocuments] = useState<FileList | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      router.push("/user/dashboard");
    }
  }, [router]);

  // Validation functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
  const validatePassword = (password: string) =>
    password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  const validateName = (name: string) =>
    name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!validateName(name)) {
      newErrors.name = "Name must be at least 2 characters and contain only letters";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validateMobile(phone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }
    if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (userType === 'user') return true;
    
    const newErrors: Record<string, string> = {};
    if (!ngoName.trim()) newErrors.ngoName = "NGO name is required";
    if (!registrationNumber.trim()) newErrors.registrationNumber = "Registration number is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!mission.trim()) newErrors.mission = "Mission is required";
    if (!street.trim()) newErrors.street = "Street address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";
    if (!pincode.trim()) newErrors.pincode = "Pincode is required";
    if (!ngoPhone.trim() || !validateMobile(ngoPhone)) newErrors.ngoPhone = "Valid phone number is required";
    if (!ngoEmail.trim() || !validateEmail(ngoEmail)) newErrors.ngoEmail = "Valid email is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      const lastInput = document.getElementById(`otp-${newOtp.length - 1}`);
      if (lastInput) (lastInput as HTMLInputElement).focus();
    } else {
      toast.error("Please paste a valid 6-digit OTP.");
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateStep1()) await handleRegister();
    } else if (currentStep === 2 && userType === 'ngo') {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 2 && userType === 'user') {
      await handleVerifyOtp();
    } else if (currentStep === 3 && userType === 'ngo') {
      await handleVerifyOtp();
    } else if (currentStep === 3 && userType === 'user') {
      await handleConnectWallet();
    } else if (currentStep === 4 && userType === 'user') {
      await handleConfirmRegister();
    } else if (currentStep === 4 && userType === 'ngo') {
      await handleConnectWallet();
    } else if (currentStep === 5 && userType === 'ngo') {
      await handleConfirmRegister();
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleRegister = async () => {
    if (!validateStep1()) return;
    setIsLoading(true);

    try {
      if (userType === 'user') {
        // Regular user registration
        const response = await fetch(`${API_BASE_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });

        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message || "Failed to register. Please try again.");
          return;
        }

        if (result.success) {
          toast.success("Registration successful! Please check your email for OTP.");
          setCurrentStep(2);
        }
      } else {
        // For NGO, just move to next step (NGO details)
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred while registering. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
        credentials: "include"
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "OTP verification failed. Please try again.");
        return;
      }

      if (result.success) {
        toast.success("OTP verified successfully!");
        sessionStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("user_data", JSON.stringify(result.data.user));
        setCurrentStep(userType === 'user' ? 3 : 4);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An error occurred while verifying OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const connectedAddress = await connectWallet();
      if (!connectedAddress) {
        toast.error("Failed to connect MetaMask wallet.");
        return;
      }
      toast.success("Wallet connected!");
      setCurrentStep(userType === 'user' ? 4 : 5);
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error while connecting wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    setIsLoading(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      
      if (userType === 'user') {
        // Store wallet address for regular user
        const response = await fetch(`${API_BASE_URL}/users/store-wallet-address`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ walletAddress: account }),
        });

        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message || "Error saving wallet address.");
          return;
        }

        if (result.success) {
          toast.success("Registration completed successfully!");
          router.push("/user/dashboard");
        }
      } else {
        // Register NGO Owner
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('password', password);
        formData.append('ngoName', ngoName);
        formData.append('registrationNumber', registrationNumber);
        formData.append('description', description);
        formData.append('mission', mission);
        formData.append('walletAddress', account || '');
        
        formData.append('address', JSON.stringify({
          street,
          city,
          state,
          country: 'India',
          pincode
        }));
        
        formData.append('contactDetails', JSON.stringify({
          phone: ngoPhone,
          email: ngoEmail,
          website: website || ''
        }));

        if (coverImage) {
          formData.append('coverImage', coverImage);
        }

        if (documents) {
          Array.from(documents).forEach((doc) => {
            formData.append('verificationDocuments', doc);
          });
        }

        const response = await fetch(`${API_BASE_URL}/ngoAdmin/register`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message || "Error registering NGO.");
          return;
        }

        if (result.success) {
          toast.success("NGO registration submitted! Awaiting admin approval.");
          router.push("/ngoadmin/dashboard");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Please provide a valid email address.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Failed to resend OTP. Please try again.");
        return;
      }
      if (result.success) {
        toast.success("OTP resent successfully! Please check your email.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("An error occurred while resending OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = userType === 'user' ? 4 : 5;

  const getCurrentStepContent = () => {
    // Step mapping based on userType
    if (userType === 'user') {
      switch (currentStep) {
        case 1: return 'personal';
        case 2: return 'otp';
        case 3: return 'wallet';
        case 4: return 'confirm';
        default: return 'personal';
      }
    } else {
      switch (currentStep) {
        case 1: return 'personal';
        case 2: return 'ngo';
        case 3: return 'otp';
        case 4: return 'wallet';
        case 5: return 'confirm';
        default: return 'personal';
      }
    }
  };

  const currentContent = getCurrentStepContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-blue-100">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-blue-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            NGO Connect
          </h1>
          <p className="text-gray-600 text-sm">
            Join our transparent donation platform
          </p>
        </div>

        {/* User Type Selection - Only on Step 1 */}
        {currentStep === 1 && (
          <div className="px-8 pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setUserType('user')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  userType === 'user'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className={`w-8 h-8 mx-auto mb-2 ${
                  userType === 'user' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  userType === 'user' ? 'text-blue-700' : 'text-gray-600'
                }`}>Register as User</span>
              </button>
              <button
                onClick={() => setUserType('ngo')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  userType === 'ngo'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                  userType === 'ngo' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  userType === 'ngo' ? 'text-green-700' : 'text-gray-600'
                }`}>Register as NGO Owner</span>
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const step = index + 1;
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`h-1 w-12 mx-2 ${
                        currentStep > step ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 pb-8">
          {/* Personal Information */}
          {currentContent === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Personal Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>
          )}

          {/* NGO Details */}
          {currentContent === 'ngo' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">NGO Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NGO Name</label>
                  <input
                    type="text"
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter NGO name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Registration number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Brief description of your NGO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Your NGO's mission statement"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Pincode"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NGO Phone</label>
                  <input
                    type="tel"
                    value={ngoPhone}
                    onChange={(e) => setNgoPhone(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Contact number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NGO Email</label>
                  <input
                    type="email"
                    value={ngoEmail}
                    onChange={(e) => setNgoEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="NGO email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://www.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Documents</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments(e.target.files)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Upload registration certificate, 12A, 80G, etc.</p>
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {currentContent === 'otp' && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Verify Email</h2>
              <p className="text-gray-600">We've sent a 6-digit OTP to {email}</p>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Didn't receive the code?
                <button
                  onClick={handleResendOtp}
                  className="text-blue-500 hover:text-blue-600 ml-1 font-medium"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {/* Connect Wallet */}
          {currentContent === 'wallet' && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Connect Your Wallet</h2>
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              {!account ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Connect your crypto wallet to manage donations securely
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Wallet Connected Successfully!</p>
                  <p className="text-sm text-gray-600 mt-1 break-all">{account}</p>
                </div>
              )}
            </div>
          )}

          {/* Final Confirmation */}
          {currentContent === 'confirm' && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Final Step</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 font-medium">
                  Click below to complete your registration
                </p>
                <p className="text-sm text-gray-600 mt-1 break-all">{account}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 font-medium ${
                currentStep === 1 ? "ml-auto" : ""
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <>
                  {currentContent === 'confirm'
                    ? "Complete Registration"
                    : currentContent === 'wallet'
                    ? "Connect Wallet"
                    : currentContent === 'otp'
                    ? "Verify OTP"
                    : "Continue"}
                  {currentContent !== 'confirm' && <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-3">Already have an account?</p>
            <button
              onClick={() => router.push("/login")}
              disabled={isLoading}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}