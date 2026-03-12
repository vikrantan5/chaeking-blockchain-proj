"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Building2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "../utils/api";

export default function UnifiedLogin() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<'user' | 'ngoAdmin' | 'superAdmin'>('user');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [field: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'user' as const, label: 'User', icon: User, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'ngoAdmin' as const, label: 'NGO Owner', icon: Building2, color: 'green', gradient: 'from-green-500 to-emerald-500' },
    { id: 'superAdmin' as const, label: 'Super Admin', icon: Shield, color: 'purple', gradient: 'from-purple-500 to-pink-500' },
  ];

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

  const handleLogin = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      let redirectPath = "";

      if (activeRole === 'user') {
        result = await apiClient.user.login({ email, password });
        redirectPath = "/user/dashboard";
      } else if (activeRole === 'ngoAdmin') {
        result = await apiClient.ngoAdmin.login({ email, password });
        redirectPath = "/ngoadmin/dashboard";
      } else if (activeRole === 'superAdmin') {
        result = await apiClient.superAdmin.login({ email, password });
        redirectPath = "/superadmin/dashboard";
      }

      if (result.success) {
        toast.success(`Logged in successfully as ${roles.find(r => r.id === activeRole)?.label}!`);
        sessionStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("user_data", JSON.stringify(result.data.user));
        localStorage.setItem("user_role", activeRole);
        router.push(redirectPath);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeRoleData = roles.find(r => r.id === activeRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-gray-100">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className={`absolute inset-0 bg-gradient-to-r ${activeRoleData.gradient} rounded-full opacity-20 animate-pulse`}></div>
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-16 h-16 bg-gradient-to-br ${activeRoleData.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                <activeRoleData.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">NGO Connect Login</h1>
          <p className="text-gray-600 text-sm">Select your role and sign in</p>
        </div>

        {/* Role Tabs */}
        <div className="px-8 pt-6">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                disabled={isLoading}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  activeRole === role.id
                    ? `border-${role.color}-500 bg-${role.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <role.icon className={`w-5 h-5 mx-auto mb-1 ${
                  activeRole === role.id ? `text-${role.color}-600` : 'text-gray-400'
                }`} />
                <span className={`text-xs font-medium ${
                  activeRole === role.id ? `text-${role.color}-700` : 'text-gray-600'
                }`}>{role.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="px-8 pb-8">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-${activeRoleData.color}-500 focus:border-${activeRoleData.color}-500 outline-none ${
                    errors.email ? "border-red-500" : "border-gray-300"
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
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-${activeRoleData.color}-500 focus:border-${activeRoleData.color}-500 outline-none ${
                    errors.password ? "border-red-500" : "border-gray-300"
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

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r ${activeRoleData.gradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all duration-200`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In as {activeRoleData.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-3">Don't have an account?</p>
            <button
              onClick={() => router.push("/signup")}
              disabled={isLoading}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}