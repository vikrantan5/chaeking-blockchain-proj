"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TempleFundLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [field: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Check if user is already logged in
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      router.push("/user/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5050/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies in the request
      })

      const result = await response.json();

      if (!response.ok) {
      // Display backend error message if available
      toast.error(result.message || "Failed to login. Please try again.");
      return;
    }

      if (result.success) {
        toast.success("Logged in successfully!");

        // Store tokens and user data
        sessionStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("user_data", JSON.stringify(result.data.user));

        // Redirect to the dashboard
        router.push("/user/dashboard");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Forgot password functionality will be implemented here.");
  };

  const handleSignUp = () => {
    toast.info("Redirecting to sign up page...");
    setTimeout(() => {
      router.push("/signup");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-orange-100">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-orange-100">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-30 animate-pulse"></div>
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed border-orange-300 animate-spin"
              style={{ animation: "spin 20s linear infinite" }}
            ></div>
            <div className="absolute inset-2 flex items-center justify-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                <div className="absolute inset-1 bg-gradient-to-t from-transparent to-white opacity-20 rounded-full"></div>
                <span className="relative text-white text-3xl font-bold drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                  ॐ
                </span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-md animate-bounce"></div>
                <div
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full shadow-md animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gradient-to-t from-orange-200 to-transparent rounded-full opacity-40 blur-sm"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Sign in to Temple Fund Management</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{errors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">Don't have an account?</p>
            <button
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 disabled:opacity-50 font-medium transition-all duration-200"
            >
              Create New Account
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
